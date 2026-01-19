"""
Alibaba Qwen provider implementation.
"""

from typing import List, Dict
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class QwenProvider(BaseLLMProvider):
    """Alibaba Qwen provider using OpenAI-compatible API."""

    def get_available_models(self) -> List[Dict[str, str]]:
        """Return available Qwen models."""
        return [
            {
                "id": "qwen3-max",
                "name": "Qwen3 Max",
                "description": "Most capable Qwen model for complex reasoning",
                "supports_thinking": False
            },
            {
                "id": "qwen3-235b-a22b-thinking-2507",
                "name": "Qwen3 235b thinking",
                "description": "Enhanced performance with good balance",
                "supports_thinking": True
            },
            {
                "id": "qwen3-235b-a22b-instruct-2507",
                "name": "Qwen3 235b instruct",
                "description": "Enhanced performance with good balance",
                "supports_thinking": False
            },
            {
                "id": "qwen3-coder-plus",
                "name": "Qwen3 coder plus",
                "description": "Qwen3 coder model",
                "supports_thinking": False
            },
            {
                "id": "deepseek-v3.2",
                "name": "DeepSeek V3.2",
                "description": "DeepSeek V3.2",
                "supports_thinking": True
            },
            {
                "id": "glm-4.7",
                "name": "GLM 4.7",
                "description": "GLM 4.7",
                "supports_thinking": True
            },
        ]

    def get_provider_name(self) -> str:
        """Return the provider name."""
        return "Alibaba Qwen"

    def supports_streaming(self) -> bool:
        """Qwen supports streaming."""
        return True

    def initialize(self, model_id: str, api_key: str, temperature: float = 0.7, thinking: bool = False, **kwargs):
        """
        Initialize Qwen LLM client.

        Args:
            model_id: Qwen model ID (e.g., 'qwen-max')
            api_key: Qwen/DashScope API key
            temperature: Sampling temperature (default: 0.7)
            thinking: Not supported for Qwen models
            **kwargs: Additional configuration (e.g., base_url)

        Returns:
            ChatOpenAI instance configured for Qwen
        """
        validated_key = self.validate_api_key(api_key)
        validated_model = self.validate_model_id(model_id)

        base_url = kwargs.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1")

        # thinking parameter ignored - not supported
        _ = thinking

        return ChatOpenAI(
            model=validated_model,
            api_key=validated_key,
            base_url=base_url,
            temperature=temperature,
            streaming=True
        )
