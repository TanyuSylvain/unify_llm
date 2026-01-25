"""
Factory for creating and initializing LLM provider instances.
"""

from typing import Optional
from .base import BaseLLMProvider
from .registry import ProviderRegistry
from backend.config import settings


class ProviderFactory:
    """Factory for creating initialized LLM instances."""

    @staticmethod
    def create_llm(
        model_id: str,
        provider_name: Optional[str] = None,
        temperature: float = None,
        **kwargs
    ):
        """
        Create and initialize an LLM instance for a given model.

        Args:
            model_id: Model ID to use (e.g., 'mistral-large-latest', 'qwen-max')
            provider_name: Optional provider name. If not provided, will auto-detect from model_id
            temperature: Sampling temperature (default: from config)
            **kwargs: Additional provider-specific configuration

        Returns:
            Initialized LLM client instance

        Raises:
            ValueError: If provider or model not found, or API key missing

        Example:
            >>> llm = ProviderFactory.create_llm("mistral-large-latest")
            >>> llm = ProviderFactory.create_llm("qwen-max", provider_name="qwen")
        """
        # Use configured temperature if not specified
        if temperature is None:
            temperature = settings.model_temperature

        # Auto-detect provider if not specified
        if provider_name is None:
            provider_name, provider = ProviderRegistry.find_provider_for_model(model_id)
        else:
            provider = ProviderRegistry.get_provider(provider_name)

        # Get API key for the provider
        api_key = settings.get_api_key(provider_name)
        if not api_key:
            raise ValueError(
                f"API key for {provider.get_provider_name()} not found. "
                f"Please set the appropriate environment variable in .env"
            )

        # Get base URL if applicable (for OpenAI-compatible providers)
        base_url = settings.get_base_url(provider_name)
        if base_url:
            kwargs["base_url"] = base_url

        # Initialize and return the LLM
        return provider.initialize(
            model_id=model_id,
            api_key=api_key,
            temperature=temperature,
            **kwargs
        )

    @staticmethod
    def get_provider_info(provider_name: str) -> dict:
        """
        Get information about a provider.

        Args:
            provider_name: Name of the provider

        Returns:
            Dict with provider info including name, models, and streaming support
        """
        provider = ProviderRegistry.get_provider(provider_name)
        return {
            "name": provider.get_provider_name(),
            "provider_id": provider_name,
            "models": provider.get_available_models(),
            "supports_streaming": provider.supports_streaming()
        }

    @staticmethod
    def list_all_models() -> list:
        """
        Get a flat list of all available models across all providers.

        Returns:
            List of dicts with model info including provider information
            Example: [
                {
                    "provider": "mistral",
                    "provider_name": "Mistral AI",
                    "model_id": "mistral-large-latest",
                    "model_name": "Mistral Large",
                    "description": "...",
                    "supports_thinking": false
                },
                ...
            ]
        """
        result = []
        all_models = ProviderRegistry.get_all_models()

        for provider_id, models in all_models.items():
            provider = ProviderRegistry.get_provider(provider_id)
            for model in models:
                model_id = model["id"]
                result.append({
                    "provider": provider_id,
                    "provider_name": provider.get_provider_name(),
                    "model_id": model_id,
                    "model_name": model["name"],
                    "description": model["description"],
                    "supports_thinking": provider.supports_thinking(model_id),
                    "thinking_locked": provider.is_thinking_locked(model_id)
                })

        return result
