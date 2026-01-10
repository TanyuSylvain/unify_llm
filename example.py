#!/usr/bin/env python3
"""
Example usage script for the LangGraph agent.

This script demonstrates the refactored backend with multiple provider support.
"""

import asyncio
from backend.core.agent import LangGraphAgent
from backend.config import settings


async def main():
    """Run example queries with streaming output."""

    # Initialize the agent with default model
    print("Initializing LangGraph Agent...")
    print(f"Using model: {settings.default_model}")
    agent = LangGraphAgent(model_id=settings.default_model)
    print("Agent initialized successfully!\n")

    # Example questions
    questions = [
        "What is LangGraph and how does it work?",
        "Explain the benefits of using streaming responses in AI applications.",
        "What are some best practices for building conversational AI agents?"
    ]

    # Process each question with streaming
    for i, question in enumerate(questions, 1):
        print(f"\n{'=' * 60}")
        print(f"Question {i}: {question}")
        print('=' * 60)
        print("\nStreaming response:\n")

        # Stream the response
        async for chunk in agent.stream(question):
            print(chunk, end="", flush=True)

        print("\n")

    print("\n" + "=" * 60)
    print("Example completed!")
    print("=" * 60)


async def interactive_mode():
    """Run the agent in interactive mode."""

    print("=" * 60)
    print("LangGraph Agent - Interactive Mode")
    print("=" * 60)
    print(f"Using model: {settings.default_model}")
    print("Type 'exit' or 'quit' to stop")
    print("Type 'models' to list available models\n")

    # Initialize the agent
    agent = LangGraphAgent(model_id=settings.default_model)

    while True:
        # Get user input
        question = input("\nYour question: ").strip()

        # Check for exit command
        if question.lower() in ['exit', 'quit']:
            print("Goodbye!")
            break

        # Check for models command
        if question.lower() == 'models':
            from backend.providers import ProviderFactory
            models = ProviderFactory.list_all_models()
            print("\nAvailable models:")
            for model in models:
                print(f"  - {model['model_id']} ({model['provider_name']})")
            continue

        if not question:
            print("Please enter a question.")
            continue

        # Stream the response
        print("\nAgent: ", end="", flush=True)
        async for chunk in agent.stream(question):
            print(chunk, end="", flush=True)
        print()


if __name__ == "__main__":
    import sys

    # Check if interactive mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        asyncio.run(interactive_mode())
    else:
        asyncio.run(main())
