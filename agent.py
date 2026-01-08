import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# Load environment variables
load_dotenv()


class AgentState(TypedDict):
    """State of the agent."""
    messages: Annotated[list, add_messages]


class LangGraphAgent:
    """LangGraph agent that uses devstral-2 model for streaming responses."""

    def __init__(self):
        """Initialize the agent with devstral-2 model."""
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY not found in environment variables")

        # Initialize the LLM with devstral-2 model
        self.llm = ChatMistralAI(
            model="mistral-large-latest",  # Using mistral-large-latest
            api_key=api_key,
            temperature=0.7,
            streaming=True
        )

        # Build the graph
        self.graph = self._build_graph()

        # Store conversation history per conversation_id
        self.conversations = {}

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
