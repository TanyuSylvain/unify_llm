"""
FastAPI back-end service for the LangGraph agent.
Provides REST API endpoints for chat interactions with streaming support.
"""

import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from agent import LangGraphAgent

# Initialize FastAPI app
app = FastAPI(
    title="LangGraph Agent API",
    description="Back-end service for LangGraph agent with streaming support",
    version="1.0.0"
)

# Add CORS middleware for web UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent (singleton)
agent: Optional[LangGraphAgent] = None


def get_agent() -> LangGraphAgent:
    """Get or initialize the agent singleton."""
    global agent
    if agent is None:
        agent = LangGraphAgent()
    return agent


# Request/Response models
class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    conversation_id: str


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    message: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok", message="Service is running")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message and get a complete response.

    Args:
        request: ChatRequest with message and optional conversation_id

    Returns:
        ChatResponse with the agent's response
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        agent_instance = get_agent()
        conversation_id = request.conversation_id or str(uuid.uuid4())
        response = agent_instance.invoke(request.message, conversation_id)

        return ChatResponse(
            response=response,
            conversation_id=conversation_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Send a message and get a streaming response.

    Args:
        request: ChatRequest with message and optional conversation_id

    Returns:
        StreamingResponse with chunks of the agent's response
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conversation_id = request.conversation_id or str(uuid.uuid4())

    async def generate():
        """Generate streaming response chunks."""
        try:
            agent_instance = get_agent()
            for chunk in agent_instance.stream(request.message, conversation_id):
                yield chunk
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "LangGraph Agent API",
        "version": "1.0.0",
        "endpoints": {
            "GET /": "API information",
            "GET /health": "Health check",
            "POST /chat": "Send message, get complete response",
            "POST /chat/stream": "Send message, get streaming response",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
