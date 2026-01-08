#!/usr/bin/env python3
"""
Example usage script for the LangGraph agent.
"""

from agent import LangGraphAgent


def main():
    """Run example queries with streaming output."""

    # Initialize the agent
    print("Initializing LangGraph Agent...")
    agent = LangGraphAgent()
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
        for chunk in agent.stream(question):
            print(chunk, end="", flush=True)

        print("\n")

    print("\n" + "=" * 60)
    print("Example completed!")
    print("=" * 60)


def interactive_mode():
    """Run the agent in interactive mode."""

    print("=" * 60)
    print("LangGraph Agent - Interactive Mode")
    print("=" * 60)
    print("Type 'exit' or 'quit' to stop\n")

    # Initialize the agent
    agent = LangGraphAgent()

    while True:
        # Get user input
        question = input("\nYour question: ").strip()

        # Check for exit command
        if question.lower() in ['exit', 'quit']:
            print("Goodbye!")
            break

        if not question:
            print("Please enter a question.")
            continue

        # Stream the response
        print("\nAgent: ", end="", flush=True)
        for chunk in agent.stream(question):
            print(chunk, end="", flush=True)
        print()


if __name__ == "__main__":
    import sys

    # Check if interactive mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        interactive_mode()
    else:
        main()
