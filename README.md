# UnifyLLM - Multi-Provider LLM Chat Application

A flexible, multi-provider LLM chat application built with LangGraph, FastAPI, and a clean web interface. Switch between different LLM providers and models seamlessly with streaming responses.

## Features

### Two Operating Modes

**Simple Mode**
- Single-agent chat with standard streaming responses
- Quick conversations with any supported model

**Multi-Agent Debate Mode**
- LangGraph-powered workflow with 3 specialized agents:
  - **Moderator**: Analyzes question complexity, guides the debate, and synthesizes the final answer
  - **Expert**: Generates professional, in-depth responses
  - **Critic**: Reviews answers critically, provides feedback and suggestions
- Configurable iterations and score thresholds
- Real-time debate progress visualization

### Core Features

- **Multiple LLM Providers**: Mistral, Qwen, GLM (Zhipu), MiniMax
- **10 Models**: Multiple model options for each provider
- **Streaming Responses**: Real-time output with "thinking" display (GLM, MiniMax)
- **Conversation Management**: Save and retrieve history (SQLite)
- **Clean Web Interface**: Responsive UI with markdown rendering
- **REST API**: Full API with OpenAPI documentation

## Prerequisites

- Python 3.10+
- API keys for at least one supported provider

## Setup

### 1. Create Environment File

Create a `.env` file in the project root with your API keys:

```bash
# Required: At least one provider API key
MISTRAL_API_KEY=your_mistral_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key      # For Qwen
ZHIPU_API_KEY=your_zhipu_api_key              # For GLM
MINIMAX_API_KEY=your_minimax_api_key
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Application

### Start Both Servers

```bash
./start.sh
```

This starts:
- Backend API server on `http://localhost:8000`
- Frontend server on `http://localhost:8080`

### Open the Web Interface

Navigate to: **http://localhost:8080/index.html**

Press `Ctrl+C` to stop both servers.

## Available Models

| Provider | Models |
|----------|--------|
| Mistral AI | Mistral Large, Mistral Medium, Mistral Small |
| Alibaba Qwen | Qwen3 Max, Qwen3 Plus |
| Zhipu GLM | GLM 4.7, GLM 4.6 |
| MiniMax | MiniMax-M2.1 |

## API Endpoints

Full API documentation at `http://localhost:8000/docs`

- `GET /health` - Health check
- `GET /models/` - List all models
- `POST /chat/stream` - Streaming chat
- `POST /chat/multi-agent` - Multi-agent debate chat
- `GET /conversations` - List conversations
- `POST /conversations` - Create conversation
- `DELETE /conversations/{id}` - Delete conversation

## Project Structure

```
unify_llm/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── config.py                  # Configuration settings
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py            # Streaming chat endpoint
│   │   │   ├── multi_agent_chat.py # Multi-agent debate endpoint
│   │   │   ├── conversations.py   # Conversation CRUD
│   │   │   ├── models.py          # Model listing
│   │   │   └── health.py          # Health checks
│   │   ├── schemas.py             # Pydantic schemas
│   │   └── __init__.py
│   ├── core/
│   │   ├── multi_agent.py         # LangGraph debate workflow
│   │   ├── multi_agent_state.py   # State management
│   │   ├── conversation_mode_manager.py
│   │   └── prompts.py             # LLM prompts
│   ├── providers/
│   │   ├── factory.py             # LLM factory
│   │   ├── base.py                # Base provider class
│   │   ├── registry.py            # Provider registry
│   │   ├── mistral.py             # Mistral provider
│   │   ├── qwen.py                # Qwen provider
│   │   ├── glm.py                 # Zhipu GLM provider
│   │   └── minimax.py             # MiniMax provider
│   ├── storage/
│   │   ├── base.py                # Storage interface
│   │   ├── sqlite.py              # SQLite implementation
│   │   └── memory.py              # Memory storage
│   └── utils/
├── frontend/
│   └── src/
│       ├── app.js                 # Main chat application
│       ├── components/
│       │   ├── ModelSelector.js
│       │   ├── Sidebar.js
│       │   ├── MessageComponent.js
│       │   ├── ModeSelector.js
│       │   ├── MultiAgentConfig.js
│       │   ├── DebateViewer.js
│       │   ├── ModeratorAnalysisViewer.js
│       │   └── ...
│       └── utils/
│           ├── api.js             # API client
│           ├── helpers.js
│           └── markdown.js
├── start.sh                       # Server startup script
├── index.html                     # Main web interface
├── requirements.txt               # Python dependencies
└── .env                           # API keys (create this file)
```
