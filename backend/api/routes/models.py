"""
Model and provider information endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from backend.api.schemas import ModelsResponse, ModelInfo, ProviderInfo
from backend.providers import ProviderFactory, ProviderRegistry

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=ModelsResponse)
async def list_models():
    """
    List all available models across all providers.

    Returns a list of all models with their provider information.
    """
    models = ProviderFactory.list_all_models()
    return ModelsResponse(
        models=[ModelInfo(**model) for model in models],
        count=len(models)
    )


@router.get("/providers", response_model=List[str])
async def list_providers():
    """
    List all available provider names.

    Returns a simple list of provider IDs.
    """
    return ProviderRegistry.list_providers()


@router.get("/providers/{provider_name}", response_model=ProviderInfo)
async def get_provider_info(provider_name: str):
    """
    Get detailed information about a specific provider.

    Args:
        provider_name: Provider ID (e.g., 'mistral', 'qwen')

    Returns:
        Provider information including available models
    """
    try:
        info = ProviderFactory.get_provider_info(provider_name)
        return ProviderInfo(**info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{model_id}/provider")
async def get_model_provider(model_id: str):
    """
    Find which provider supports a given model ID.

    Args:
        model_id: Model ID to search for

    Returns:
        Provider name and information
    """
    try:
        provider_name, provider = ProviderRegistry.find_provider_for_model(model_id)
        return {
            "model_id": model_id,
            "provider": provider_name,
            "provider_name": provider.get_provider_name()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
