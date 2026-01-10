"""
Core LangGraph agent implementation with provider and storage abstractions.
"""

from typing import TypedDict, Annotated, Optional
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from backend.providers import ProviderFactory
from backend.storage import ConversationStorage, MemoryStorage


class AgentState(TypedDict):
    """State of the agent."""
    messages: Annotated[list, add_messages]


class LangGraphAgent:
    """LangGraph agent with multi-provider support and pluggable storage."""

    def __init__(
        self,
        model_id: str,
        provider_name: Optional[str] = None,
        storage: Optional[ConversationStorage] = None,
        temperature: float = None
    ):
        """
        Initialize the agent with specified model and storage.

        Args:
            model_id: Model ID to use (e.g., 'mistral-large-latest', 'qwen-max')
            provider_name: Optional provider name (auto-detected if not provided)
            storage: Storage backend (defaults to MemoryStorage)
            temperature: Sampling temperature (defaults to config setting)
        """
        self.model_id = model_id
        self.provider_name = provider_name

        # Initialize LLM using factory
        self.llm = ProviderFactory.create_llm(
            model_id=model_id,
            provider_name=provider_name,
            temperature=temperature
        )

        # Initialize storage
        self.storage = storage or MemoryStorage()

        # Build the LangGraph workflow
        self.graph = self._build_graph()

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

    async def stream(self, question: str, conversation_id: str = None):
        """
        Stream the response to a user question.

        Args:
            question: The user's question
            conversation_id: Optional conversation ID for multi-turn conversations

        Yields:
            str: Chunks of the response text
        """
        # Get conversation history
        history = []
        if conversation_id:
            messages = await self.storage.get_messages(conversation_id)
            history = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

        # Add current question to storage
        if conversation_id:
            await self.storage.add_message(
                conversation_id=conversation_id,
                role="user",
                content=question,
                model=self.model_id
            )

        # Build messages with history
        messages = history.copy()
        messages.append({"role": "user", "content": question})

        # Stream the response
        full_response = ""
        for chunk in self.llm.stream(messages):
            if hasattr(chunk, 'content'):
                full_response += chunk.content
                yield chunk.content

        # Add assistant response to storage
        if conversation_id:
            await self.storage.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_response,
                model=self.model_id
            )

    async def invoke(self, question: str, conversation_id: str = None) -> str:
        """
        Get the complete response to a user question.

        Args:
            question: The user's question
            conversation_id: Optional conversation ID for multi-turn conversations

        Returns:
            str: The complete response
        """
        # Get conversation history
        history = []
        if conversation_id:
            messages = await self.storage.get_messages(conversation_id)
            history = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

        # Add current question to storage
        if conversation_id:
            await self.storage.add_message(
                conversation_id=conversation_id,
                role="user",
                content=question,
                model=self.model_id
            )

        # Build initial state with history
        messages = history.copy()
        messages.append({"role": "user", "content": question})

        initial_state = {"messages": messages}

        result = self.graph.invoke(initial_state)
        response = result["messages"][-1].content

        # Add assistant response to storage
        if conversation_id:
            await self.storage.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=response,
                model=self.model_id
            )

        return response

    async def get_conversation_history(self, conversation_id: str):
        """
        Get the conversation history.

        Args:
            conversation_id: Conversation ID

        Returns:
            List of messages
        """
        return await self.storage.get_messages(conversation_id)

    async def clear_conversation(self, conversation_id: str) -> bool:
        """
        Clear a conversation.

        Args:
            conversation_id: Conversation ID

        Returns:
            True if deleted, False if not found
        """
        return await self.storage.delete_conversation(conversation_id)
