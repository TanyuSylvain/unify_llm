"""
Base storage interface for conversation persistence.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime


class ConversationStorage(ABC):
    """Abstract base class for conversation storage backends."""

    @abstractmethod
    async def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """
        Get conversation metadata.

        Args:
            conversation_id: Unique conversation identifier

        Returns:
            Dict with conversation metadata or None if not found
            Example: {
                "id": "conv-123",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:30:00",
                "model": "mistral-large-latest",
                "message_count": 10
            }
        """
        pass

    @abstractmethod
    async def get_messages(self, conversation_id: str) -> List[Dict]:
        """
        Get all messages in a conversation.

        Args:
            conversation_id: Unique conversation identifier

        Returns:
            List of message dicts in chronological order
            Example: [
                {"role": "user", "content": "Hello", "timestamp": "..."},
                {"role": "assistant", "content": "Hi!", "timestamp": "..."}
            ]
        """
        pass

    @abstractmethod
    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        model: Optional[str] = None
    ) -> None:
        """
        Add a message to a conversation.

        Args:
            conversation_id: Unique conversation identifier
            role: Message role ('user' or 'assistant')
            content: Message content
            model: Model used for assistant responses (optional)
        """
        pass

    @abstractmethod
    async def create_conversation(
        self,
        conversation_id: str,
        model: str,
        metadata: Optional[Dict] = None
    ) -> None:
        """
        Create a new conversation.

        Args:
            conversation_id: Unique conversation identifier
            model: Model ID used for this conversation
            metadata: Additional metadata (optional)
        """
        pass

    @abstractmethod
    async def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation and all its messages.

        Args:
            conversation_id: Unique conversation identifier

        Returns:
            True if deleted, False if not found
        """
        pass

    @abstractmethod
    async def list_conversations(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """
        List all conversations.

        Args:
            limit: Maximum number of conversations to return
            offset: Number of conversations to skip

        Returns:
            List of conversation metadata dicts
        """
        pass

    @abstractmethod
    async def conversation_exists(self, conversation_id: str) -> bool:
        """
        Check if a conversation exists.

        Args:
            conversation_id: Unique conversation identifier

        Returns:
            True if exists, False otherwise
        """
        pass

    @abstractmethod
    async def update_conversation_title(
        self,
        conversation_id: str,
        title: str
    ) -> bool:
        """
        Update the title of a conversation.

        Args:
            conversation_id: Unique conversation identifier
            title: New title for the conversation

        Returns:
            True if updated, False if not found
        """
        pass

    @abstractmethod
    async def delete_all_conversations(self) -> int:
        """
        Delete all conversations and their messages.

        Returns:
            Number of conversations deleted
        """
        pass
