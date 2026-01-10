"""
Pydantic schemas for API request and response models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ChatRequest(BaseModel):
    """Request model for chat endpoints."""
    message: str = Field(..., description="User's message", min_length=1)
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID for multi-turn chat")
    model: Optional[str] = Field(None, description="Model ID to use (e.g., 'mistral-large-latest')")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What is machine learning?",
                "conversation_id": "conv-123",
                "model": "mistral-large-latest"
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str = Field(..., description="Assistant's response")
    conversation_id: str = Field(..., description="Conversation ID")
    model: str = Field(..., description="Model used for the response")

    class Config:
        json_schema_extra = {
            "example": {
                "response": "Machine learning is...",
                "conversation_id": "conv-123",
                "model": "mistral-large-latest"
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str = Field(..., description="Service status")
    message: str = Field(..., description="Status message")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "ok",
                "message": "Service is running"
            }
        }


class ModelInfo(BaseModel):
    """Information about a specific model."""
    provider: str = Field(..., description="Provider ID")
    provider_name: str = Field(..., description="Human-readable provider name")
    model_id: str = Field(..., description="Model ID")
    model_name: str = Field(..., description="Model display name")
    description: str = Field(..., description="Model description")


class ModelsResponse(BaseModel):
    """Response model for listing models."""
    models: List[ModelInfo] = Field(..., description="List of available models")
    count: int = Field(..., description="Total number of models")


class ProviderInfo(BaseModel):
    """Information about a provider."""
    name: str = Field(..., description="Human-readable provider name")
    provider_id: str = Field(..., description="Provider ID")
    models: List[Dict[str, str]] = Field(..., description="Available models")
    supports_streaming: bool = Field(..., description="Whether streaming is supported")


class ConversationInfo(BaseModel):
    """Information about a conversation."""
    id: str = Field(..., description="Conversation ID")
    model: str = Field(..., description="Model used")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    message_count: int = Field(..., description="Number of messages")


class ConversationsResponse(BaseModel):
    """Response model for listing conversations."""
    conversations: List[ConversationInfo] = Field(..., description="List of conversations")
    count: int = Field(..., description="Total number of conversations")


class MessageInfo(BaseModel):
    """Information about a message."""
    role: str = Field(..., description="Message role (user or assistant)")
    content: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="Message timestamp")
    model: Optional[str] = Field(None, description="Model used (for assistant messages)")


class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""
    conversation_id: str = Field(..., description="Conversation ID")
    messages: List[MessageInfo] = Field(..., description="List of messages")
