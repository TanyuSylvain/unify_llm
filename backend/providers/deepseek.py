"""
DeepSeek provider implementation.
"""

from typing import List, Dict
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class DeepSeekProvider(BaseLLMProvider):
    """DeepSeek provider using OpenAI-compatible API."""

    # Models that support thinking (always on, cannot be disabled)
    THINKING_MODELS = ["deepseek-reasoner"]

    def get_available_models(self) -> List[Dict[str, str]]:
        """Return available DeepSeek models."""
        return [
            {
                "id": "deepseek-chat",
                "name": "DeepSeek Chat",
                "description": "DeepSeek's conversational model",
                "supports_thinking": False
            },
            {
                "id": "deepseek-coder",
                "name": "DeepSeek Coder",
                "description": "Specialized model for code generation and understanding",
                "supports_thinking": False
            },
            {
                "id": "deepseek-reasoner",
                "name": "DeepSeek Reasoner",
                "description": "Advanced reasoning model with chain-of-thought",
                "supports_thinking": True,
                "thinking_locked": True  # Cannot disable thinking
            },
        ]

    def get_provider_name(self) -> str:
        """Return the provider name."""
        return "DeepSeek"

    def supports_streaming(self) -> bool:
        """DeepSeek supports streaming."""
        return True

    def supports_thinking(self, model_id: str = None) -> bool:
        """Check if model supports thinking mode."""
        return model_id in self.THINKING_MODELS

    def is_thinking_locked(self, model_id: str = None) -> bool:
        """DeepSeek Reasoner always thinks, cannot be disabled."""
        return model_id in self.THINKING_MODELS

    def initialize(self, model_id: str, api_key: str, temperature: float = 0.7, thinking: bool = False, **kwargs):
        """
        Initialize DeepSeek LLM client.

        Args:
            model_id: DeepSeek model ID (e.g., 'deepseek-chat')
            api_key: DeepSeek API key
            temperature: Sampling temperature (default: 0.7)
            thinking: Ignored for deepseek-reasoner (always thinks)
            **kwargs: Additional configuration (e.g., base_url)

        Returns:
            ChatOpenAI instance configured for DeepSeek
        """
        validated_key = self.validate_api_key(api_key)
        validated_model = self.validate_model_id(model_id)

        base_url = kwargs.get("base_url", "https://api.deepseek.com")

        # DeepSeek Reasoner doesn't support temperature parameter
        if validated_model == "deepseek-reasoner":
            return ChatOpenAI(
                model=validated_model,
                api_key=validated_key,
                base_url=base_url,
                streaming=True
            )
        else:
            return ChatOpenAI(
                model=validated_model,
                api_key=validated_key,
                base_url=base_url,
                temperature=temperature,
                streaming=True
            )
