"""
Storage module for conversation persistence.

Provides different storage backends for conversation history.
"""

from .base import ConversationStorage
from .memory import MemoryStorage
from .sqlite import SQLiteStorage


def get_storage(backend: str = "sqlite", **kwargs) -> ConversationStorage:
    """
    Get storage backend instance.

    Args:
        backend: Storage backend type ('memory', 'sqlite', 'redis')
        **kwargs: Backend-specific configuration

    Returns:
        ConversationStorage instance
    """
    if backend == "sqlite":
        database_path = kwargs.get("database_url", "conversations.db")
        return SQLiteStorage(database_path)
    elif backend == "memory":
        return MemoryStorage()
    else:
        raise ValueError(f"Unknown storage backend: {backend}")


__all__ = [
    "ConversationStorage",
    "MemoryStorage",
    "SQLiteStorage",
    "get_storage",
]
