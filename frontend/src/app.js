/**
 * Main Application Module
 * Orchestrates all components and handles chat logic
 */

import { APIClient } from './utils/api.js';
import { generateUUID, getStorage, setStorage } from './utils/helpers.js';
import { MessageComponent } from './components/MessageComponent.js';
import { ModelSelector } from './components/ModelSelector.js';
import { Sidebar } from './components/Sidebar.js';

export class ChatApp {
    constructor() {
        // Initialize API client
        this.apiClient = new APIClient();

        // Get DOM elements
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.modelSelectElement = document.getElementById('modelSelect');
        this.thinkingToggle = document.getElementById('thinkingToggle');
        this.sidebarElement = document.getElementById('sidebar');

        // Verify all required elements exist
        if (!this.messagesContainer || !this.messageInput || !this.sendBtn ||
            !this.modelSelectElement || !this.thinkingToggle || !this.sidebarElement) {
            console.error('Missing required DOM elements:', {
                messages: !!this.messagesContainer,
                input: !!this.messageInput,
                sendBtn: !!this.sendBtn,
                modelSelect: !!this.modelSelectElement,
                thinkingToggle: !!this.thinkingToggle,
                sidebar: !!this.sidebarElement
            });
            throw new Error('Failed to find required DOM elements');
        }

        // Initialize components
        this.messageComponent = new MessageComponent(this.messagesContainer);
        this.modelSelector = new ModelSelector(this.modelSelectElement, this.apiClient);
        this.sidebar = new Sidebar(
            this.sidebarElement,
            this.apiClient,
            (conversationId) => this.selectConversation(conversationId),
            () => this.createNewConversation()
        );

        // Conversation state
        this.conversationId = this.loadOrCreateConversationId();
        this.isProcessing = false;
        this.isThinkingEnabled = false;

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

            // Load conversations list
            await this.sidebar.loadConversations();

            // Set current conversation in sidebar
            this.sidebar.setCurrentConversation(this.conversationId);

            // Set up event listeners
            this.setupEventListeners();

            // Load conversation history if exists
            await this.loadConversationHistory();

            // Focus input
            this.messageInput.focus();
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

        // Model change - update thinking toggle state
        this.modelSelector.onChange((modelId) => {
            setStorage('selectedModel', modelId);
            this.updateThinkingToggleState();
        });

        // Thinking toggle change
        this.thinkingToggle.addEventListener('change', (e) => {
            this.isThinkingEnabled = e.target.checked;
            setStorage('thinkingEnabled', this.isThinkingEnabled);
        });

        // Load saved model selection
        const savedModel = getStorage('selectedModel');
        if (savedModel) {
            this.modelSelector.setSelectedModel(savedModel);
        }

        // Load saved thinking preference
        const savedThinking = getStorage('thinkingEnabled');
        if (savedThinking !== null) {
            this.isThinkingEnabled = savedThinking === 'true' || savedThinking === true;
            this.thinkingToggle.checked = this.isThinkingEnabled;
        }

        // Initial update of thinking toggle state
        this.updateThinkingToggleState();
    }

    /**
     * Update thinking toggle enabled/disabled state based on selected model
     */
    updateThinkingToggleState() {
        const modelInfo = this.modelSelector.getSelectedModelInfo();
        console.log('Model info:', modelInfo);
        const supportsThinking = modelInfo && modelInfo.supports_thinking;
        console.log('Supports thinking:', supportsThinking);

        this.thinkingToggle.disabled = !supportsThinking;
        const toggleContainer = this.thinkingToggle.closest('.thinking-toggle');

        if (supportsThinking) {
            toggleContainer.classList.remove('disabled');
        } else {
            toggleContainer.classList.add('disabled');
            // Reset thinking state when switching to unsupported model
            this.isThinkingEnabled = false;
            this.thinkingToggle.checked = false;
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
            // First check if conversation exists (avoids 404 errors after backend restart)
            const conversationInfo = await this.apiClient.getConversationInfo(this.conversationId);
            if (!conversationInfo) {
                console.log('No existing conversation history (new conversation)');
                return;
            }

            // Load the full history if conversation exists
            const history = await this.apiClient.getConversationHistory(this.conversationId);
            if (history && history.messages && history.messages.length > 0) {
                this.messageComponent.loadMessages(history.messages);
            }
        } catch (error) {
            // Something went wrong, but we can still continue
            console.log('Could not load conversation history:', error.message);
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
                    // Accumulate response
                    fullResponse += chunk;
                    this.messageComponent.updateMessage(
                        typingIndicator,
                        fullResponse,
                        true // render as markdown
                    );
                },
                this.isThinkingEnabled
            );

            // Refresh the sidebar to update the conversation title and timestamp
            await this.sidebar.loadConversations();
            this.sidebar.setCurrentConversation(this.conversationId);

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
     * Select an existing conversation
     */
    async selectConversation(conversationId) {
        if (conversationId === this.conversationId) return;

        this.conversationId = conversationId;
        setStorage('conversationId', conversationId);
        this.sidebar.setCurrentConversation(conversationId);

        // Clear and load the selected conversation
        this.messageComponent.clearMessages();
        await this.loadConversationHistory();

        console.log('Switched to conversation:', conversationId);
    }

    /**
     * Create a new conversation
     */
    createNewConversation() {
        this.conversationId = generateUUID();
        setStorage('conversationId', this.conversationId);
        this.sidebar.setCurrentConversation(this.conversationId);
        this.messageComponent.clearMessages();

        console.log('Created new conversation:', this.conversationId);
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
            this.createNewConversation();

            // Refresh the sidebar
            await this.sidebar.loadConversations();

            console.log('Conversation cleared');
        } catch (error) {
            console.error('Error clearing conversation:', error);
            this.messageComponent.addErrorMessage('Failed to clear conversation');
        }
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
