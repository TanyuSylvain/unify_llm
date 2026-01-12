/**
 * Sidebar Component
 * Manages the conversation list and session actions
 */

export class Sidebar {
    constructor(containerElement, apiClient, onConversationSelect, onNewConversation) {
        if (!containerElement) {
            console.error('Sidebar: container element is null or undefined');
            throw new Error('Sidebar requires a valid container element');
        }

        this.container = containerElement;
        this.apiClient = apiClient;
        this.onConversationSelect = onConversationSelect;
        this.onNewConversation = onNewConversation;
        this.conversations = [];
        this.currentConversationId = null;

        console.log('Sidebar: Initializing sidebar component');
        this.render();
        this.setupEventListeners();
        console.log('Sidebar: Initialization complete');
    }

    /**
     * Render the sidebar structure
     */
    render() {
        console.log('Sidebar: Rendering sidebar HTML');
        this.container.innerHTML = `
            <div class="sidebar-header">
                <h2>Conversations</h2>
                <button id="newConversationBtn" class="btn-new" title="New conversation">+</button>
            </div>
            <div id="conversationsList" class="conversations-list"></div>
            <div class="sidebar-footer">
                <button id="deleteAllBtn" class="btn-delete-all">Delete All</button>
            </div>
        `;

        this.conversationsListEl = this.container.querySelector('#conversationsList');
        this.newConversationBtn = this.container.querySelector('#newConversationBtn');
        this.deleteAllBtn = this.container.querySelector('#deleteAllBtn');

        if (!this.conversationsListEl || !this.newConversationBtn || !this.deleteAllBtn) {
            console.error('Sidebar: Failed to find sidebar elements', {
                conversationsList: !!this.conversationsListEl,
                newButton: !!this.newConversationBtn,
                deleteAllButton: !!this.deleteAllBtn
            });
        } else {
            console.log('Sidebar: All sidebar elements found successfully');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (!this.newConversationBtn || !this.deleteAllBtn) {
            console.error('Sidebar: Cannot set up event listeners - buttons not found');
            return;
        }

        console.log('Sidebar: Setting up event listeners');
        this.newConversationBtn.addEventListener('click', () => {
            console.log('Sidebar: New conversation button clicked');
            if (this.onNewConversation) {
                this.onNewConversation();
            }
        });

        this.deleteAllBtn.addEventListener('click', () => {
            console.log('Sidebar: Delete all button clicked');
            this.handleDeleteAll();
        });
        console.log('Sidebar: Event listeners set up successfully');
    }

    /**
     * Load conversations from the API
     */
    async loadConversations() {
        try {
            const response = await this.apiClient.listConversations(100);
            this.conversations = response.conversations || [];
            console.log('Loaded conversations:', this.conversations.length, this.conversations);
            this.renderConversations();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    /**
     * Render the conversations list
     */
    renderConversations() {
        if (!this.conversationsListEl) {
            console.error('conversationsListEl not found!');
            return;
        }

        this.conversationsListEl.innerHTML = '';

        if (this.conversations.length === 0) {
            this.conversationsListEl.innerHTML = `
                <div class="no-conversations">No conversations yet</div>
            `;
            console.log('No conversations to display');
            return;
        }

        console.log('Rendering', this.conversations.length, 'conversations');

        this.conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = `conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}`;
            item.dataset.id = conv.id;
            item.innerHTML = `
                <div class="conversation-title">${this.escapeHtml(conv.title)}</div>
                <div class="conversation-meta">
                    <span class="conversation-date">${this.formatDate(conv.updated_at)}</span>
                    <button class="btn-delete-item" data-id="${conv.id}" title="Delete conversation">×</button>
                </div>
            `;

            // Click to select conversation
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete-item')) {
                    if (this.onConversationSelect) {
                        this.onConversationSelect(conv.id);
                    }
                }
            });

            // Delete button
            const deleteBtn = item.querySelector('.btn-delete-item');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteConversation(conv.id);
            });

            this.conversationsListEl.appendChild(item);
        });
    }

    /**
     * Set the current conversation ID
     */
    setCurrentConversation(conversationId) {
        this.currentConversationId = conversationId;
        this.renderConversations();
    }

    /**
     * Handle deleting a single conversation
     */
    async handleDeleteConversation(conversationId) {
        if (!confirm('Delete this conversation?')) return;

        try {
            await this.apiClient.deleteConversation(conversationId);
            await this.loadConversations();

            // If the deleted conversation was the current one, start a new one
            if (conversationId === this.currentConversationId && this.onNewConversation) {
                this.onNewConversation();
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Failed to delete conversation');
        }
    }

    /**
     * Handle deleting all conversations
     */
    async handleDeleteAll() {
        const count = this.conversations.length;
        if (count === 0) {
            alert('No conversations to delete');
            return;
        }

        if (!confirm(`Delete all ${count} conversation(s)?`)) return;

        try {
            await this.apiClient.deleteAllConversations();
            await this.loadConversations();

            // Start a new conversation after clearing all
            if (this.onNewConversation) {
                this.onNewConversation();
            }
        } catch (error) {
            console.error('Error deleting all conversations:', error);
            alert('Failed to delete all conversations');
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        // Check if date is today
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        }

        // Show date and time for non-today dates
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
