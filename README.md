# LangGraph Agent with Streaming Support

A LangGraph-based agent that uses the Mistral devstral-2 model to answer questions with streaming responses.

## Features

- Streaming responses for real-time output
- Built with LangGraph for flexible workflow management
- Uses Mistral's devstral-2 (mistral-large-2) model
- Interactive and batch processing modes

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your Mistral API key:
```bash
cp .env.example .env
# Edit .env and add your MISTRAL_API_KEY
```

3. Get your API key from [Mistral AI](https://console.mistral.ai/)

## Usage

### Basic Example
Run the example script with predefined questions:
```bash
python example.py
```

### Interactive Mode
Chat with the agent interactively:
```bash
python example.py --interactive
```

### Use in Your Code
```python
from agent import LangGraphAgent

# Initialize the agent
agent = LangGraphAgent()

# Stream responses
for chunk in agent.stream("What is LangGraph?"):
    print(chunk, end="", flush=True)

# Or get complete response
response = agent.invoke("Explain AI agents")
print(response)
```

## Project Structure

- `agent.py` - Main LangGraph agent implementation
- `example.py` - Example usage scripts (batch and interactive modes)
- `requirements.txt` - Python dependencies
- `.env.example` - Environment variable template

## How It Works

1. The agent is built using LangGraph's StateGraph
2. Messages are managed with LangGraph's message handling
3. The Mistral LLM streams responses chunk by chunk
4. Each chunk is yielded in real-time for immediate display

## Requirements

- Python 3.8+
- Mistral API key
- Internet connection for API calls
