/**
 * Main Application Module
 * Orchestrates all components and handles chat logic
 */

import { APIClient } from './utils/api.js';
import { generateUUID, getStorage, setStorage } from './utils/helpers.js';
import { MessageComponent } from './components/MessageComponent.js';
import { ModelSelector } from './components/ModelSelector.js';

export class ChatApp {
    constructor() {
        // Initialize API client
        this.apiClient = new APIClient();

        // Get DOM elements
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.modelSelectElement = document.getElementById('modelSelect');

        // Initialize components
        this.messageComponent = new MessageComponent(this.messagesContainer);
        this.modelSelector = new ModelSelector(this.modelSelectElement, this.apiClient);

        // Conversation state
        this.conversationId = this.loadOrCreateConversationId();
        this.isProcessing = false;

        // Initialize the app
        this.initialize();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Initialize model selector (fetches models from API)
            await this.modelSelector.initialize();

            // Set up event listeners
            this.setupEventListeners();

            // Load conversation history if exists
            await this.loadConversationHistory();

            // Focus input
            this.messageInput.focus();

            console.log('Chat app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.messageComponent.addErrorMessage(
                'Failed to initialize chat. Please refresh the page.'
            );
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key in input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Model change
        this.modelSelector.onChange((modelId) => {
            console.log('Model changed to:', modelId);
            setStorage('selectedModel', modelId);
        });

        // Load saved model selection
        const savedModel = getStorage('selectedModel');
        if (savedModel) {
            this.modelSelector.setSelectedModel(savedModel);
        }
    }

    /**
     * Load or create conversation ID
     * @returns {string} Conversation ID
     */
    loadOrCreateConversationId() {
        let convId = getStorage('conversationId');
        if (!convId) {
            convId = generateUUID();
            setStorage('conversationId', convId);
        }
        return convId;
    }

    /**
     * Load conversation history from API
     */
    async loadConversationHistory() {
        try {
            const history = await this.apiClient.getConversationHistory(this.conversationId);
            if (history && history.messages && history.messages.length > 0) {
                this.messageComponent.loadMessages(history.messages);
            }
        } catch (error) {
            // Conversation doesn't exist yet, that's okay
            console.log('No existing conversation history');
        }
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        // Get selected model
        const modelId = this.modelSelector.getSelectedModel();
        if (!modelId) {
            this.messageComponent.addErrorMessage('Please select a model');
            return;
        }

        // Update UI
        this.messageComponent.addUserMessage(message);
        this.messageInput.value = '';
        this.setProcessing(true);

        // Show typing indicator
        const typingIndicator = this.messageComponent.showTypingIndicator();

        try {
            // Stream response
            let fullResponse = '';

            await this.apiClient.streamMessage(
                message,
                this.conversationId,
                modelId,
                (chunk) => {
                    fullResponse += chunk;
                    this.messageComponent.updateMessage(
                        typingIndicator,
                        fullResponse,
                        true // render as markdown
                    );
                }
            );

        } catch (error) {
            console.error('Error sending message:', error);
            this.messageComponent.removeTypingIndicator(typingIndicator);
            this.messageComponent.addErrorMessage(
                `Error: ${error.message}`
            );
        } finally {
            this.setProcessing(false);
            this.messageInput.focus();
        }
    }

    /**
     * Set processing state
     * @param {boolean} processing - Whether processing
     */
    setProcessing(processing) {
        this.isProcessing = processing;
        this.sendBtn.disabled = processing;
        this.messageInput.disabled = processing;
    }

    /**
     * Clear conversation
     */
    async clearConversation() {
        if (!confirm('Clear this conversation?')) return;

        try {
            await this.apiClient.deleteConversation(this.conversationId);
            this.messageComponent.clearMessages();

            // Create new conversation
            this.conversationId = generateUUID();
            setStorage('conversationId', this.conversationId);

            console.log('Conversation cleared');
        } catch (error) {
            console.error('Error clearing conversation:', error);
            this.messageComponent.addErrorMessage('Failed to clear conversation');
        }
    }

    /**
     * Start new conversation
     */
    newConversation() {
        this.messageComponent.clearMessages();
        this.conversationId = generateUUID();
        setStorage('conversationId', this.conversationId);
        console.log('Started new conversation:', this.conversationId);
    }

    /**
     * Get current conversation ID
     * @returns {string} Conversation ID
     */
    getConversationId() {
        return this.conversationId;
    }

    /**
     * Get selected model info
     * @returns {Object} Model info
     */
    getSelectedModelInfo() {
        return this.modelSelector.getSelectedModelInfo();
    }
}
