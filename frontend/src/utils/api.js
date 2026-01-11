/**
 * API Client for LLM GUI Backend
 * Handles all communication with the FastAPI backend
 */

export class APIClient {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
    }

    /**
     * Fetch all available models from the backend
     * @returns {Promise<Array>} Array of model objects
     */
    async getModels() {
        try {
            const response = await fetch(`${this.baseURL}/models/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    /**
     * Get information about a specific provider
     * @param {string} providerName - Provider ID (e.g., 'mistral', 'qwen')
     * @returns {Promise<Object>} Provider information
     */
    async getProviderInfo(providerName) {
        try {
            const response = await fetch(`${this.baseURL}/models/providers/${providerName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch provider info: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching provider info:', error);
            throw error;
        }
    }

    /**
     * Send a chat message and get complete response
     * @param {string} message - User message
     * @param {string} conversationId - Conversation ID
     * @param {string} modelId - Model ID to use
     * @returns {Promise<Object>} Response object
     */
    async sendMessage(message, conversationId, modelId) {
        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversation_id: conversationId,
                    model: modelId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Send a chat message and stream the response
     * @param {string} message - User message
     * @param {string} conversationId - Conversation ID
     * @param {string} modelId - Model ID to use
     * @param {Function} onChunk - Callback for each chunk
     * @returns {Promise<void>}
     */
    async streamMessage(message, conversationId, modelId, onChunk) {
        try {
            const response = await fetch(`${this.baseURL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversation_id: conversationId,
                    model: modelId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                onChunk(chunk);
            }
        } catch (error) {
            console.error('Error streaming message:', error);
            throw error;
        }
    }

    /**
     * Get conversation history
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Conversation history
     */
    async getConversationHistory(conversationId) {
        try {
            const response = await fetch(`${this.baseURL}/conversations/${conversationId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch conversation: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversation:', error);
            throw error;
        }
    }

    /**
     * List all conversations
     * @param {number} limit - Maximum number of conversations
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Object>} Conversations list
     */
    async listConversations(limit = 50, offset = 0) {
        try {
            const response = await fetch(
                `${this.baseURL}/conversations?limit=${limit}&offset=${offset}`
            );
            if (!response.ok) {
                throw new Error(`Failed to list conversations: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error listing conversations:', error);
            throw error;
        }
    }

    /**
     * Delete a conversation
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteConversation(conversationId) {
        try {
            const response = await fetch(`${this.baseURL}/conversations/${conversationId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`Failed to delete conversation: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error checking health:', error);
            throw error;
        }
    }
}
