"""
Test script to check GLM thinking mode output structure and separate reasoning from answer.
"""

import asyncio
from langchain_openai import ChatOpenAI
import dotenv
import os


async def test_glm_thinking_detailed():
    """Test GLM thinking mode and show all chunk attributes."""
    dotenv.load_dotenv()

    llm = ChatOpenAI(
        model="glm-4.7",
        api_key=os.getenv("GLM_API_KEY"),
        base_url="https://open.bigmodel.cn/api/paas/v4",
        temperature=0.7,
        streaming=True,
        extra_body={"thinking_type": "enable"},
        # reasoning={'effort': 'medium'},
        # output_version='responses/v1'
    )

    messages = [{"role": "user", "content": "What is 2+2? Explain your reasoning step by step."}]

    print("=" * 80)
    print("DETAILED CHUNK ANALYSIS")
    print("=" * 80)

    chunk_count = 0
    async for chunk in llm.astream(messages):
        chunk_count += 1
        print(f"\n--- Chunk {chunk_count} ---")
        print(f"Type: {type(chunk).__name__}")
        print(f"Content: {repr(chunk.content)}")

        # Check response_metadata
        if hasattr(chunk, 'response_metadata'):
            print(f"Response Metadata: {chunk.response_metadata}")

        # Check additional_kwargs
        if hasattr(chunk, 'additional_kwargs'):
            print(f"Additional Kwargs: {chunk.additional_kwargs}")

        # Check usage_metadata
        if hasattr(chunk, 'usage_metadata'):
            print(f"Usage Metadata: {chunk.usage_metadata}")

    print("\n" + "=" * 80)
    print(f"Total chunks: {chunk_count}\n")


async def test_glm_separation():
    """Test separating reasoning from answer in GLM responses."""
    dotenv.load_dotenv()

    llm = ChatOpenAI(
        model="glm-4.7",
        api_key=os.getenv("GLM_API_KEY"),
        base_url="https://open.bigmodel.cn/api/paas/v4",
        temperature=0.7,
        streaming=True,
        extra_body={"thinking_type": "enable"}
    )

    messages = [{"role": "user", "content": "Calculate 15 * 23. Show your work."}]

    print("=" * 80)
    print("SEPARATING REASONING FROM ANSWER")
    print("=" * 80)

    reasoning_parts = []
    answer_parts = []
    current_phase = "unknown"

    async for chunk in llm.astream(messages):
        content = chunk.content or ""

        # Strategy 1: Check response_metadata for finish_reason or type indicators
        if hasattr(chunk, 'response_metadata'):
            metadata = chunk.response_metadata

            # Check for reasoning indicator in finish_reason
            if metadata.get('finish_reason') == 'reasoning':
                current_phase = "reasoning"
                reasoning_parts.append(content)
                continue
            elif metadata.get('finish_reason') == 'stop':
                current_phase = "answer"

            # Check for reasoning_content field
            if 'reasoning_content' in metadata:
                reasoning_parts.append(metadata['reasoning_content'])
                continue

        # Strategy 2: Check additional_kwargs for role/type
        if hasattr(chunk, 'additional_kwargs'):
            kwargs = chunk.additional_kwargs
            chunk_type = kwargs.get('type') or kwargs.get('role')

            if chunk_type == 'reasoning':
                current_phase = "reasoning"
                reasoning_parts.append(content)
                continue
            elif chunk_type == 'answer' or chunk_type == 'assistant':
                current_phase = "answer"

        # Strategy 3: GLM may send role changes in the chunk
        if hasattr(chunk, 'role'):
            if chunk.role == 'reasoning':
                current_phase = "reasoning"
                reasoning_parts.append(content)
                continue

        # Default: if we have content, add to answer
        if content:
            # If we haven't identified the phase yet, treat as answer
            if current_phase == "unknown":
                current_phase = "answer"

            if current_phase == "reasoning":
                reasoning_parts.append(content)
            else:
                answer_parts.append(content)

    # Display results
    reasoning_text = ''.join(reasoning_parts).strip()
    answer_text = ''.join(answer_parts).strip()

    print("\n" + "=" * 80)
    print("REASONING PART:")
    print("-" * 80)
    print(reasoning_text if reasoning_text else "(No reasoning detected)")

    print("\n" + "=" * 80)
    print("ANSWER PART:")
    print("-" * 80)
    print(answer_text if answer_text else "(No answer detected)")
    print("=" * 80 + "\n")


async def test_both():
    """Run both tests."""
    await test_glm_thinking_detailed()
    print("\n\n")
    await test_glm_separation()


if __name__ == "__main__":
    asyncio.run(test_both())
