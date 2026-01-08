import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# Load environment variables
load_dotenv()


class AgentState(TypedDict):
    """State of the agent."""
    messages: Annotated[list, add_messages]


class LangGraphAgent:
    """LangGraph agent that supports multiple LLM models."""

    SUPPORTED_MODELS = {
        "mistral": "mistral-large-latest",
        "qwen3-max": "qwen3-max",
        "glm-4.7": "glm-4.7",
        "minimax-m2.1": "MiniMax-M2.1"
    }

    def __init__(self, model_name: str = "mistral"):
        """Initialize the agent with specified model.

        Args:
            model_name: Name of the model to use (mistral, qwen3-max, glm-4.7, minimax-m2.1)
        """
        if model_name not in self.SUPPORTED_MODELS:
            raise ValueError(f"Unsupported model: {model_name}. Supported models: {list(self.SUPPORTED_MODELS.keys())}")

        self.model_name = model_name
        self.llm = self._initialize_llm(model_name)

        # Build the graph
        self.graph = self._build_graph()

        # Store conversation history per conversation_id
        self.conversations = {}

    def _initialize_llm(self, model_name: str):
        """Initialize the appropriate LLM based on model name."""
        if model_name == "mistral":
            api_key = os.getenv("MISTRAL_API_KEY")
            if not api_key:
                raise ValueError("MISTRAL_API_KEY not found in environment variables")
            return ChatMistralAI(
                model=self.SUPPORTED_MODELS[model_name],
                api_key=api_key,
                temperature=0.7,
                streaming=True
            )

        elif model_name == "qwen3-max":
            api_key = os.getenv("QWEN_API_KEY") or os.getenv("DASHSCOPE_API_KEY")
            base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
            if not api_key:
                raise ValueError("QWEN_API_KEY or DASHSCOPE_API_KEY not found in environment variables")
            return ChatOpenAI(
                model=self.SUPPORTED_MODELS[model_name],
                api_key=api_key,
                base_url=base_url,
                temperature=0.7,
                streaming=True
            )

        elif model_name == "glm-4.7":
            api_key = os.getenv("GLM_API_KEY") or os.getenv("ZHIPUAI_API_KEY")
            base_url = os.getenv("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
            if not api_key:
                raise ValueError("GLM_API_KEY or ZHIPUAI_API_KEY not found in environment variables")
            return ChatOpenAI(
                model=self.SUPPORTED_MODELS[model_name],
                api_key=api_key,
                base_url=base_url,
                temperature=0.7,
                streaming=True
            )

        elif model_name == "minimax-m2.1":
            api_key = os.getenv("MINIMAX_API_KEY")
            base_url = os.getenv("MINIMAX_BASE_URL", "https://api.minimax.chat/v1")
            if not api_key:
                raise ValueError("MINIMAX_API_KEY not found in environment variables")
            return ChatOpenAI(
                model=self.SUPPORTED_MODELS[model_name],
                api_key=api_key,
                base_url=base_url,
                temperature=0.7,
                streaming=True
            )

        else:
            raise ValueError(f"Unsupported model: {model_name}")

    def _build_graph(self):
        """Build the LangGraph workflow."""
        workflow = StateGraph(AgentState)

        # Add the agent node
        workflow.add_node("agent", self._agent_node)

        # Set entry point
        workflow.set_entry_point("agent")

        # Add edge from agent to END
        workflow.add_edge("agent", END)

        return workflow.compile()

    def _agent_node(self, state: AgentState):
        """Process the user question and generate response."""
        messages = state["messages"]
        response = self.llm.invoke(messages)
        return {"messages": [response]}

    def _get_conversation_history(self, conversation_id: str = None):
        """Get conversation history for a given conversation_id.

        Args:
            conversation_id: Optional conversation ID

        Returns:
            list: List of messages in the conversation
        """
        if conversation_id is None:
            return []

        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []

        return self.conversations[conversation_id]

    def _add_to_history(self, conversation_id: str, role: str, content: str):
        """Add a message to conversation history.

        Args:
            conversation_id: Conversation ID
            role: Message role (user or assistant)
            content: Message content
        """
        if conversation_id:
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = []
            self.conversations[conversation_id].append({"role": role, "content": content})

    def stream(self, question: str, conversation_id: str = None):
        """Stream the response to a user question.

        Args:
            question: The user's question
            conversation_id: Optional conversation ID for multi-turn conversations

        Yields:
            str: Chunks of the response text
        """
        # Get conversation history
        history = self._get_conversation_history(conversation_id)

        # Add current question to history
        self._add_to_history(conversation_id, "user", question)

        # Build messages with history
        messages = history.copy()

        # Stream the response
        full_response = ""
        for chunk in self.llm.stream(messages):
            if hasattr(chunk, 'content'):
                full_response += chunk.content
                yield chunk.content

        # Add assistant response to history
        self._add_to_history(conversation_id, "assistant", full_response)

    def invoke(self, question: str, conversation_id: str = None) -> str:
        """Get the complete response to a user question.

        Args:
            question: The user's question
            conversation_id: Optional conversation ID for multi-turn conversations

        Returns:
            str: The complete response
        """
        # Get conversation history
        history = self._get_conversation_history(conversation_id)

        # Add current question to history
        self._add_to_history(conversation_id, "user", question)

        # Build initial state with history
        initial_state = {
            "messages": history.copy()
        }

        result = self.graph.invoke(initial_state)
        response = result["messages"][-1].content

        # Add assistant response to history
        self._add_to_history(conversation_id, "assistant", response)

        return response


if __name__ == "__main__":
    # Example usage
    agent = LangGraphAgent()

    question = "What is LangGraph and how does it work?"

    print(f"Question: {question}\n")
    print("Streaming response:")
    print("-" * 50)

    for chunk in agent.stream(question):
        print(chunk, end="", flush=True)

    print("\n" + "-" * 50)
