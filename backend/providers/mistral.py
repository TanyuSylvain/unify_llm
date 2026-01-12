"""
Mistral AI provider implementation.
"""

from typing import List, Dict
from langchain_mistralai import ChatMistralAI
from .base import BaseLLMProvider


class MistralProvider(BaseLLMProvider):
    """Mistral AI provider using native ChatMistralAI."""

    def get_available_models(self) -> List[Dict[str, str]]:
        """Return available Mistral models."""
        return [
            {
                "id": "mistral-large-latest",
                "name": "Mistral Large",
                "description": "Most capable Mistral model for complex tasks"
            },
            {
                "id": "mistral-medium-latest",
                "name": "Mistral Medium",
                "description": "Balanced performance and cost"
            },
            {
                "id": "mistral-small-latest",
                "name": "Mistral Small",
                "description": "Fast and efficient for simpler tasks"
            },
        ]

    def get_provider_name(self) -> str:
        """Return the provider name."""
        return "Mistral AI"

    def supports_streaming(self) -> bool:
        """Mistral supports streaming."""
        return True

    def initialize(self, model_id: str, api_key: str, temperature: float = 0.7, thinking: bool = False, **kwargs):
        """
        Initialize Mistral LLM client.

        Args:
            model_id: Mistral model ID (e.g., 'mistral-large-latest')
            api_key: Mistral API key
            temperature: Sampling temperature (default: 0.7)
            thinking: Enable thinking mode (not supported, ignored)
            **kwargs: Additional configuration (unused)

        Returns:
            ChatMistralAI instance
        """
        validated_key = self.validate_api_key(api_key)
        validated_model = self.validate_model_id(model_id)

        return ChatMistralAI(
            model=validated_model,
            api_key=validated_key,
            temperature=temperature,
            streaming=True
        )
