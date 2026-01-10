"""
Zhipu AI GLM provider implementation.
"""

from typing import List, Dict
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class GLMProvider(BaseLLMProvider):
    """Zhipu AI GLM provider using OpenAI-compatible API."""

    def get_available_models(self) -> List[Dict[str, str]]:
        """Return available GLM models."""
        return [
            {
                "id": "glm-4-plus",
                "name": "GLM-4 Plus",
                "description": "Enhanced GLM-4 with improved capabilities"
            },
            {
                "id": "glm-4-air",
                "name": "GLM-4 Air",
                "description": "Balanced performance and efficiency"
            },
            {
                "id": "glm-4-airx",
                "name": "GLM-4 AirX",
                "description": "Extended context version of GLM-4 Air"
            },
            {
                "id": "glm-4-flash",
                "name": "GLM-4 Flash",
                "description": "Fast inference for real-time applications"
            }
        ]

    def get_provider_name(self) -> str:
        """Return the provider name."""
        return "Zhipu AI GLM"

    def supports_streaming(self) -> bool:
        """GLM supports streaming."""
        return True

    def initialize(self, model_id: str, api_key: str, temperature: float = 0.7, **kwargs):
        """
        Initialize GLM LLM client.

        Args:
            model_id: GLM model ID (e.g., 'glm-4-plus')
            api_key: Zhipu AI API key
            temperature: Sampling temperature (default: 0.7)
            **kwargs: Additional configuration (e.g., base_url)

        Returns:
            ChatOpenAI instance configured for GLM
        """
        validated_key = self.validate_api_key(api_key)
        validated_model = self.validate_model_id(model_id)

        base_url = kwargs.get("base_url", "https://open.bigmodel.cn/api/paas/v4")

        return ChatOpenAI(
            model=validated_model,
            api_key=validated_key,
            base_url=base_url,
            temperature=temperature,
            streaming=True
        )
