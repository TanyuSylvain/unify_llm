"""
Chat endpoints for interacting with LLM agents.
"""

import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from backend.api.schemas import ChatRequest, ChatResponse
from backend.core.agent import LangGraphAgent
from backend.storage import MemoryStorage
from backend.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

# Shared storage instance for all agents
_storage = MemoryStorage()

# Agent pool (keyed by model_id + thinking mode)
_agents: dict[str, LangGraphAgent] = {}


def get_agent(model_id: str, thinking: bool = False) -> LangGraphAgent:
    """
    Get or create an agent instance for the specified model and thinking mode.

    Args:
        model_id: Model ID to use
        thinking: Whether thinking mode is enabled

    Returns:
        LangGraphAgent instance
    """
    global _agents, _storage

    # Key includes thinking mode since it affects the agent behavior
    agent_key = f"{model_id}:{thinking}"

    if agent_key not in _agents:
        _agents[agent_key] = LangGraphAgent(
            model_id=model_id,
            storage=_storage,
            thinking=thinking
        )

    return _agents[agent_key]


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message and get a complete response.

    Args:
        request: ChatRequest with message, optional conversation_id, and optional model

    Returns:
        ChatResponse with the agent's response
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        model_id = request.model or settings.default_model
        thinking = request.thinking if request.thinking is not None else False
        agent = get_agent(model_id, thinking)
        conversation_id = request.conversation_id or str(uuid.uuid4())

        response = await agent.invoke(request.message, conversation_id)

        return ChatResponse(
            response=response,
            conversation_id=conversation_id,
            model=model_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Send a message and get a streaming response.

    Args:
        request: ChatRequest with message, optional conversation_id, and optional model

    Returns:
        StreamingResponse with chunks of the agent's response
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conversation_id = request.conversation_id or str(uuid.uuid4())
    model_id = request.model or settings.default_model
    thinking = request.thinking if request.thinking is not None else False

    async def generate():
        """Generate streaming response chunks."""
        try:
            agent = get_agent(model_id, thinking)
            async for chunk in agent.stream(request.message, conversation_id):
                yield chunk
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Conversation-ID": conversation_id,
            "X-Model-ID": model_id
        }
    )
