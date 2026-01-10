# LLM GUI - Multi-Provider Chat Application

A flexible, multi-provider LLM chat application built with LangGraph, FastAPI, and a clean web interface. Switch between different LLM providers and models seamlessly with streaming responses.

## ✨ Features

- **Multiple LLM Providers**: Mistral, Qwen, GLM (Zhipu), MiniMax
- **16+ Models**: Multiple model options for each provider
- **Streaming Responses**: Real-time output for better UX
- **Clean Architecture**: Modular, extensible codebase
- **Web Interface**: Simple, responsive chat UI with markdown support
- **REST API**: Full-featured API with OpenAPI documentation
- **Conversation Management**: Save and retrieve conversation history
- **CLI Tools**: Interactive and batch processing modes

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Keys

Edit the `.env` file with your API keys

### 3. Start the Server

```bash
python -m backend.main
```

The API will be available at `http://localhost:8000`

### 4. Open the Web Interface

Open `index.html` in your browser and start chatting!

## 📚 Usage

### Web Interface

1. Open `index.html` in a browser
2. Select your preferred model from the dropdown
3. Type your message and press Send or Enter

### CLI Examples

```bash
python example.py                  # Batch mode
python example.py --interactive    # Interactive mode
```

## 🎯 Available Models

- **Mistral AI**: 4 models (mistral-large-latest, mistral-medium-latest, etc.)
- **Alibaba Qwen**: 4 models (qwen-max, qwen-plus, qwen-turbo, qwen-long)
- **Zhipu GLM**: 4 models (glm-4-plus, glm-4-air, glm-4-airx, glm-4-flash)
- **MiniMax**: 4 models (abab6.5s-chat, abab6.5-chat, etc.)

## 🔌 API Endpoints

Full API documentation at `http://localhost:8000/docs`

- `GET /health` - Health check
- `GET /models/` - List all models
- `POST /chat/stream` - Streaming chat
- `GET /conversations` - List conversations

See [MIGRATION.md](MIGRATION.md) for detailed documentation.
