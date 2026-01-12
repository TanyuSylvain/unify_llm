"""
In-memory storage implementation for conversations.
"""

from typing import List, Dict, Optional
from datetime import datetime
from .base import ConversationStorage


class MemoryStorage(ConversationStorage):
    """In-memory storage backend (current implementation)."""

    def __init__(self):
        """Initialize in-memory storage."""
        self._conversations: Dict[str, Dict] = {}
        self._messages: Dict[str, List[Dict]] = {}

    async def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation metadata."""
        return self._conversations.get(conversation_id)

    async def get_messages(self, conversation_id: str) -> List[Dict]:
        """Get all messages in a conversation."""
        return self._messages.get(conversation_id, [])

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        model: Optional[str] = None
    ) -> None:
        """Add a message to a conversation."""
        # Create conversation if it doesn't exist
        if conversation_id not in self._conversations:
            await self.create_conversation(conversation_id, model or "unknown")

        # Add message
        if conversation_id not in self._messages:
            self._messages[conversation_id] = []

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        if model and role == "assistant":
            message["model"] = model

        self._messages[conversation_id].append(message)

        # Update conversation metadata
        self._conversations[conversation_id]["updated_at"] = datetime.now().isoformat()
        self._conversations[conversation_id]["message_count"] = len(self._messages[conversation_id])

    async def create_conversation(
        self,
        conversation_id: str,
        model: str,
        metadata: Optional[Dict] = None,
        title: Optional[str] = None
    ) -> None:
        """Create a new conversation."""
        if conversation_id in self._conversations:
            return  # Already exists

        self._conversations[conversation_id] = {
            "id": conversation_id,
            "model": model,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "message_count": 0,
            "metadata": metadata or {},
            "title": title or "New Conversation"
        }
        self._messages[conversation_id] = []

    async def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages."""
        if conversation_id not in self._conversations:
            return False

        del self._conversations[conversation_id]
        if conversation_id in self._messages:
            del self._messages[conversation_id]

        return True

    async def list_conversations(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """List all conversations."""
        conversations = list(self._conversations.values())
        # Sort by updated_at descending (most recent first)
        conversations.sort(key=lambda x: x["updated_at"], reverse=True)
        return conversations[offset:offset + limit]

    async def conversation_exists(self, conversation_id: str) -> bool:
        """Check if a conversation exists."""
        return conversation_id in self._conversations

    async def update_conversation_title(
        self,
        conversation_id: str,
        title: str
    ) -> bool:
        """Update the title of a conversation."""
        if conversation_id not in self._conversations:
            return False

        self._conversations[conversation_id]["title"] = title
        self._conversations[conversation_id]["updated_at"] = datetime.now().isoformat()
        return True

    async def delete_all_conversations(self) -> int:
        """Delete all conversations and their messages."""
        count = len(self._conversations)
        self._conversations.clear()
        self._messages.clear()
        return count

    def clear_all(self) -> None:
        """Clear all conversations (useful for testing)."""
        self._conversations.clear()
        self._messages.clear()
