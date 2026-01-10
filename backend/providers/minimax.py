"""
MiniMax provider implementation.
"""

from typing import List, Dict
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class MiniMaxProvider(BaseLLMProvider):
    """MiniMax provider using OpenAI-compatible API."""

    def get_available_models(self) -> List[Dict[str, str]]:
        """Return available MiniMax models."""
        return [
            {
                "id": "abab6.5s-chat",
                "name": "MiniMax 6.5S",
                "description": "Latest generation model with superior performance"
            },
            {
                "id": "abab6.5-chat",
                "name": "MiniMax 6.5",
                "description": "Balanced model for general tasks"
            },
            {
                "id": "abab5.5s-chat",
                "name": "MiniMax 5.5S",
                "description": "Stable and reliable model"
            },
            {
                "id": "abab5.5-chat",
                "name": "MiniMax 5.5",
                "description": "Cost-effective for routine tasks"
            }
        ]

    def get_provider_name(self) -> str:
        """Return the provider name."""
        return "MiniMax"

    def supports_streaming(self) -> bool:
        """MiniMax supports streaming."""
        return True

    def initialize(self, model_id: str, api_key: str, temperature: float = 0.7, **kwargs):
        """
        Initialize MiniMax LLM client.

        Args:
            model_id: MiniMax model ID (e.g., 'abab6.5s-chat')
            api_key: MiniMax API key
            temperature: Sampling temperature (default: 0.7)
            **kwargs: Additional configuration (e.g., base_url)

        Returns:
            ChatOpenAI instance configured for MiniMax
        """
        validated_key = self.validate_api_key(api_key)
        validated_model = self.validate_model_id(model_id)

        base_url = kwargs.get("base_url", "https://api.minimax.chat/v1")

        return ChatOpenAI(
            model=validated_model,
            api_key=validated_key,
            base_url=base_url,
            temperature=temperature,
            streaming=True
        )
