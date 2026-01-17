/**
 * Main Application Module
 * Orchestrates all components and handles chat logic
 * Supports both simple (single-agent) and multi-agent debate modes
 */

import { APIClient } from './utils/api.js';
import { generateUUID, getStorage, setStorage } from './utils/helpers.js';
import { MessageComponent } from './components/MessageComponent.js';
import { ModelSelector } from './components/ModelSelector.js';
import { Sidebar } from './components/Sidebar.js';
import { ModeSelector } from './components/ModeSelector.js';
import { MultiAgentConfig } from './components/MultiAgentConfig.js';
import { ProgressIndicator } from './components/ProgressIndicator.js';
import { DebateViewer } from './components/DebateViewer.js';
import ModeratorStatusIndicator from './components/ModeratorStatusIndicator.js';
import ModeratorAnalysisViewer from './components/ModeratorAnalysisViewer.js';

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
        this.markdownToggle = document.getElementById('markdownToggle');
        this.sidebarElement = document.getElementById('sidebar');

        // Multi-agent elements
        this.modeSelectorElement = document.getElementById('modeSelector');
        this.multiAgentConfigElement = document.getElementById('multiAgentConfig');
        this.progressIndicatorElement = document.getElementById('progressIndicator');
        this.debateViewerElement = document.getElementById('debateViewer');

        // Verify all required elements exist
        if (!this.messagesContainer || !this.messageInput || !this.sendBtn ||
            !this.modelSelectElement || !this.thinkingToggle || !this.markdownToggle || !this.sidebarElement) {
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

        // Initialize multi-agent components (if elements exist)
        this.modeSelector = null;
        this.multiAgentConfig = null;
        this.progressIndicator = null;
        this.debateViewer = null;

        if (this.modeSelectorElement) {
            this.modeSelector = new ModeSelector(this.modeSelectorElement);
        }
        if (this.multiAgentConfigElement) {
            this.multiAgentConfig = new MultiAgentConfig(this.multiAgentConfigElement, this.apiClient);
        }

        // Progress indicator in the debate panel
        this.progressIndicatorElement = document.getElementById('progressIndicator');
        if (this.progressIndicatorElement) {
            this.progressIndicator = new ProgressIndicator(this.progressIndicatorElement);
        }

        if (this.debateViewerElement) {
            this.debateViewer = new DebateViewer(this.debateViewerElement);
        }

        // Initialize moderator components
        const moderatorStatusElement = document.getElementById('moderatorStatus');
        const moderatorAnalysisElement = document.getElementById('moderatorAnalysis');
        this.moderatorStatusIndicator = moderatorStatusElement ?
            new ModeratorStatusIndicator(moderatorStatusElement) : null;
        this.moderatorAnalysisViewer = moderatorAnalysisElement ?
            new ModeratorAnalysisViewer(moderatorAnalysisElement) : null;

        // Conversation state
        this.conversationId = this.loadOrCreateConversationId();
        this.isProcessing = false;
        this.isThinkingEnabled = false;
        this.isMarkdownEnabled = true;
        this.isMultiAgentMode = false;

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

            // Initialize multi-agent components
            if (this.modeSelector) {
                this.modeSelector.initialize();
                this.isMultiAgentMode = this.modeSelector.isMultiAgentMode();
            }
            if (this.multiAgentConfig) {
                await this.multiAgentConfig.initialize();
                this.updateMultiAgentUIVisibility();
            }
            if (this.progressIndicator) {
                this.progressIndicator.initialize();
            }
            if (this.debateViewer) {
                this.debateViewer.initialize();
            }

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

        // Mode selector change
        if (this.modeSelector) {
            this.modeSelector.onChange(async (mode) => {
                await this.handleModeChange(mode);
            });
        }

        // Thinking toggle change
        this.thinkingToggle.addEventListener('change', (e) => {
            this.isThinkingEnabled = e.target.checked;
            setStorage('thinkingEnabled', this.isThinkingEnabled);
        });

        // Markdown toggle change
        this.markdownToggle.addEventListener('change', (e) => {
            this.isMarkdownEnabled = e.target.checked;
            setStorage('markdownEnabled', this.isMarkdownEnabled);
            // Re-render all assistant messages with new markdown setting
            this.messageComponent.reRenderAssistantMessages(this.isMarkdownEnabled);
        });

        // Load saved sidebar state
        const sidebarCollapsed = getStorage('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            this.collapseSidebar();
        }

        // Header sidebar toggle button
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

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

        // Load saved markdown preference
        const savedMarkdown = getStorage('markdownEnabled');
        if (savedMarkdown !== null) {
            this.isMarkdownEnabled = savedMarkdown === 'true' || savedMarkdown === true;
            this.markdownToggle.checked = this.isMarkdownEnabled;
        }

        // Initial update of thinking toggle state
        this.updateThinkingToggleState();

        // Initialize agent status
        this.agentStatusElement = document.getElementById('agentStatus');
    }

    /**
     * Update agent status display
     */
    updateAgentStatus(activeAgent, iteration, phase) {
        if (!this.agentStatusElement) return;

        const agents = [
            { id: 'moderator', label: 'Moderator' },
            { id: 'expert', label: 'Expert' },
            { id: 'critic', label: 'Critic' }
        ];

        let html = '';
        agents.forEach(agent => {
            const isActive = agent.id === activeAgent;
            html += `
                <div class="agent-status-item ${isActive ? 'active' : ''}">
                    <span class="agent-status-dot"></span>
                    <span>${agent.label}</span>
                </div>
            `;
        });

        if (iteration > 0 && phase) {
            html += `<span style="margin-left: auto; font-size: 0.8rem; color: #999;">Round ${iteration}</span>`;
        }

        this.agentStatusElement.innerHTML = html;
        this.agentStatusElement.style.display = 'flex';
    }

    /**
     * Hide agent status
     */
    hideAgentStatus() {
        if (this.agentStatusElement) {
            this.agentStatusElement.style.display = 'none';
        }
    }

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            if (sidebar.classList.contains('collapsed')) {
                this.expandSidebar();
            } else {
                this.collapseSidebar();
            }
        }
    }

    /**
     * Collapse sidebar
     */
    collapseSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('sidebarToggleIcon');
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
        if (toggleIcon) {
            toggleIcon.innerHTML = '&#x25B6;';  // Right arrow when collapsed
        }
        setStorage('sidebarCollapsed', 'true');
    }

    /**
     * Expand sidebar
     */
    expandSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('sidebarToggleIcon');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
        }
        if (toggleIcon) {
            toggleIcon.innerHTML = '&#x25C0;';  // Left arrow when expanded
        }
        setStorage('sidebarCollapsed', 'false');
    }

    /**
     * Update visibility of multi-agent UI components
     */
    updateMultiAgentUIVisibility() {
        // Show/hide multi-agent config based on mode
        if (this.multiAgentConfig) {
            if (this.isMultiAgentMode) {
                this.multiAgentConfig.show();
            } else {
                this.multiAgentConfig.hide();
            }
        }

        // Show/hide simple mode controls
        const simpleControls = document.querySelector('.model-selector-container');
        const thinkingContainer = document.querySelector('.thinking-toggle');
        if (simpleControls) {
            simpleControls.style.display = this.isMultiAgentMode ? 'none' : 'flex';
        }
        if (thinkingContainer) {
            thinkingContainer.style.display = this.isMultiAgentMode ? 'none' : 'flex';
        }
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

        // Route to appropriate handler based on mode
        if (this.isMultiAgentMode) {
            await this.sendMultiAgentMessage(message);
        } else {
            await this.sendSimpleMessage(message);
        }
    }

    /**
     * Send a message in simple (single-agent) mode
     */
    async sendSimpleMessage(message) {
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
                        this.isMarkdownEnabled
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
     * Send a message in multi-agent debate mode
     */
    async sendMultiAgentMessage(message) {
        // Get multi-agent config
        const config = this.multiAgentConfig ? this.multiAgentConfig.getConfig() : {
            models: {
                moderator: this.modelSelector.getSelectedModel(),
                expert: this.modelSelector.getSelectedModel(),
                critic: this.modelSelector.getSelectedModel()
            },
            maxIterations: 3,
            scoreThreshold: 80
        };

        // Update UI
        this.messageComponent.addUserMessage(message);
        this.messageInput.value = '';
        this.setProcessing(true);

        // Show debate panel
        const debatePanel = document.getElementById('debatePanel');
        if (debatePanel) {
            debatePanel.style.display = 'flex';
        }

        // Clear previous debate data
        if (this.debateViewer) {
            this.debateViewer.clear();
        }

        // Start progress indicator
        if (this.progressIndicator) {
            this.progressIndicator.start(config.maxIterations);
        }

        // Show typing indicator for final answer
        const typingIndicator = this.messageComponent.showTypingIndicator();

        try {
            await this.apiClient.streamMultiAgentDebate(
                message,
                this.conversationId,
                config,
                {
                    onPhaseChange: (phase, iteration) => {
                        // Update moderator status indicator
                        if (this.moderatorStatusIndicator) {
                            this.moderatorStatusIndicator.update(phase, iteration);
                        }
                    },
                    onModeratorInit: (analysis) => {
                        console.log('Moderator init analysis:', analysis);
                        if (this.moderatorAnalysisViewer) {
                            this.moderatorAnalysisViewer.showInitAnalysis(analysis);
                        }
                    },
                    onModeratorSynthesize: (iteration, analysis) => {
                        console.log(`Moderator synthesize (iteration ${iteration}):`, analysis);
                        if (this.moderatorAnalysisViewer) {
                            this.moderatorAnalysisViewer.showSynthesisAnalysis(iteration, analysis);
                        }
                    },
                    onPhaseStart: (phase, iteration, msg) => {
                        console.log(`Phase: ${phase}, Iteration: ${iteration}`);
                        if (this.progressIndicator) {
                            this.progressIndicator.setPhase(phase, iteration);
                        }
                        // Update agent status based on phase
                        let activeAgent = 'moderator';
                        if (phase === 'expert_generate' || phase === 'expert_answer') {
                            activeAgent = 'expert';
                        } else if (phase === 'critic_review') {
                            activeAgent = 'critic';
                        }
                        this.updateAgentStatus(activeAgent, iteration, phase);
                    },
                    onExpertAnswer: (iteration, answer) => {
                        console.log(`Expert answer (iteration ${iteration}):`, answer);
                        if (this.debateViewer) {
                            this.debateViewer.addExpertAnswer(iteration, answer);
                        }
                    },
                    onCriticReview: (iteration, review) => {
                        console.log(`Critic review (iteration ${iteration}):`, review);
                        if (this.debateViewer) {
                            this.debateViewer.addCriticReview(iteration, review);
                        }
                    },
                    onIterationComplete: (iteration, status, score, summary) => {
                        console.log(`Iteration ${iteration} complete: ${status}, score: ${score}`);
                    },
                    onDone: (finalAnswer, wasDirectAnswer, terminationReason, totalIterations) => {
                        console.log('Debate complete:', { finalAnswer, wasDirectAnswer, terminationReason, totalIterations });

                        // Update final answer in message
                        this.messageComponent.updateMessage(
                            typingIndicator,
                            finalAnswer,
                            this.isMarkdownEnabled
                        );

                        // Update debate viewer with final answer
                        if (this.debateViewer && !wasDirectAnswer) {
                            this.debateViewer.setFinalAnswer(finalAnswer, terminationReason);
                        }

                        // Complete progress indicator
                        if (this.progressIndicator) {
                            if (wasDirectAnswer) {
                                this.progressIndicator.setDirectAnswer();
                            }
                            this.progressIndicator.complete(terminationReason);
                        }

                        // Collapse moderator analysis and hide status
                        if (this.moderatorAnalysisViewer) {
                            this.moderatorAnalysisViewer.collapseAll();
                        }
                        if (this.moderatorStatusIndicator) {
                            this.moderatorStatusIndicator.hide();
                        }

                        // Hide agent status
                        this.hideAgentStatus();
                    },
                    onError: (error) => {
                        console.error('Multi-agent error:', error);
                        this.messageComponent.removeTypingIndicator(typingIndicator);
                        this.messageComponent.addErrorMessage(`Error: ${error}`);

                        if (this.progressIndicator) {
                            this.progressIndicator.showError(error);
                        }

                        // Hide agent status on error
                        this.hideAgentStatus();
                    }
                }
            );

            // Refresh the sidebar
            await this.sidebar.loadConversations();
            this.sidebar.setCurrentConversation(this.conversationId);

        } catch (error) {
            console.error('Error in multi-agent debate:', error);
            this.messageComponent.removeTypingIndicator(typingIndicator);
            this.messageComponent.addErrorMessage(`Error: ${error.message}`);

            if (this.progressIndicator) {
                this.progressIndicator.showError(error.message);
            }

            // Hide agent status on error
            this.hideAgentStatus();
        } finally {
            this.setProcessing(false);
            this.messageInput.focus();
        }
    }

    /**
     * Handle mode change and transfer context if needed
     */
    async handleModeChange(mode) {
        const targetMode = mode === 'multi-agent' ? 'debate' : 'simple';
        const wasMultiAgent = this.isMultiAgentMode;
        console.log(`[ModeSwitch] Attempting to switch from ${wasMultiAgent ? 'debate' : 'simple'} to ${targetMode}`);

        // Update UI state first
        this.isMultiAgentMode = mode === 'multi-agent';
        this.updateMultiAgentUIVisibility();

        // Check if mode actually changed
        if (wasMultiAgent === this.isMultiAgentMode) {
            console.log(`[ModeSwitch] Mode unchanged, no action needed`);
            return;
        }

        try {
            // Get config if switching to debate mode
            const debateConfig = this.isMultiAgentMode && this.multiAgentConfig ?
                this.multiAgentConfig.getConfig() : null;

            console.log(`[ModeSwitch] Calling API to switch to ${targetMode} mode...`);

            const response = await this.apiClient.switchMode(
                this.conversationId,
                targetMode,
                debateConfig
            );

            console.log(`[ModeSwitch] API response:`, response);

            if (response.success) {
                console.log(`✓ Mode switched successfully`);
                // Try to show system message, fallback to console if method not available
                if (this.messageComponent.addSystemMessage) {
                    this.messageComponent.addSystemMessage(
                        `Switched to ${targetMode} mode. ${response.message || ''}`
                    );
                } else {
                    console.log(`[ModeSwitch] Success: ${response.message || ''}`);
                }
            } else {
                console.error('Mode switch failed:', response);
                if (this.messageComponent.addErrorMessage) {
                    this.messageComponent.addErrorMessage(`Failed to switch mode: ${response.message || 'Unknown error'}`);
                } else {
                    console.error(`[ModeSwitch] Failed: ${response.message || 'Unknown error'}`);
                }
                // Revert UI on failure
                this.isMultiAgentMode = wasMultiAgent;
                this.updateMultiAgentUIVisibility();
            }
        } catch (error) {
            console.error('[ModeSwitch] Error switching mode:', error);
            if (this.messageComponent.addErrorMessage) {
                this.messageComponent.addErrorMessage(`Error switching mode: ${error.message}`);
            } else {
                console.error(`[ModeSwitch] Error: ${error.message}`);
            }
            // Revert UI state on error
            this.isMultiAgentMode = wasMultiAgent;
            this.updateMultiAgentUIVisibility();
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
