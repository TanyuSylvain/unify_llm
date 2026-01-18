"""
Google Gemini provider implementation.
"""

from typing import List, Dict
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    """Google Gemini provider using OpenAI-compatible API."""

    # Models that support thinking with thinkingLevel parameter
    THINKING_MODELS = ["gemini-3-pro-preview", "gemini-3-flash-preview"]
    # Models where thinking cannot be disabled
    THINKING_LOCKED_MODELS = ["gemini-3-pro-preview"]

    def get_available_models(self) -> List[Dict[str, str]]:
        """Return available Gemini models."""
        return [
            {
                "id": "gemini-3-pro-preview",
                "name": "Gemini-3-pro-preview",
                "description": "Most powerful Gemini with thinking",
                "supports_thinking": True,
                "thinking_locked": True  # Cannot disable thinking
            },
            {
                "id": "gemini-3-flash-preview",
                "name": "gemini-3-flash-preview",
                "description": "Advanced Gemini model with thinking",
                "supports_thinking": True,
                "thinking_locked": False  # Can toggle thinking
            },
        ]

    def get_provider_name(self) -> str:
        """Return the provider name."""
        return "Google Gemini"

    def supports_streaming(self) -> bool:
        """Gemini supports streaming."""
        return True

    def supports_thinking(self, model_id: str = None) -> bool:
        """Check if model supports thinking mode."""
        return model_id in self.THINKING_MODELS

    def is_thinking_locked(self, model_id: str = None) -> bool:
        """Gemini 3 Pro cannot disable thinking."""
        return model_id in self.THINKING_LOCKED_MODELS

    def initialize(self, model_id: str, api_key: str, temperature: float = 0.7, thinking: bool = False, **kwargs):
        """
        Initialize Gemini LLM client.

        Args:
            model_id: Gemini model ID (e.g., 'gemini-3-pro-preview')
            api_key: Gemini API key
            temperature: Sampling temperature (default: 0.7)
            thinking: Enable thinking mode (uses thinkingLevel parameter)
            **kwargs: Additional configuration (e.g., base_url)

        Returns:
            ChatOpenAI instance configured for Gemini
        """
        validated_key = self.validate_api_key(api_key)
        validated_model = self.validate_model_id(model_id)

        base_url = kwargs.get("base_url", "https://generativelanguage.googleapis.com/v1beta/openai")

        # Build extra_body for thinking mode (Gemini 3 uses thinkingLevel)
        extra_body = {}
        if validated_model in self.THINKING_MODELS:
            if validated_model in self.THINKING_LOCKED_MODELS:
                # Gemini 3 Pro: thinking always on, use high level
                extra_body["thinkingLevel"] = "high"
            else:
                # Gemini 3 Flash: can toggle thinking
                extra_body["thinkingLevel"] = "high" if thinking else "minimal"

        return ChatOpenAI(
            model=validated_model,
            api_key=validated_key,
            base_url=base_url,
            temperature=temperature,
            streaming=True,
            extra_body=extra_body if extra_body else None
        )
