/**
 * Message Component
 * Handles rendering and managing chat messages
 */

import { MarkdownRenderer } from '../utils/markdown.js';

export class MessageComponent {
    constructor(messagesContainer) {
        this.container = messagesContainer;
        this.renderer = new MarkdownRenderer();
        // Store raw content for assistant messages to support re-rendering
        this.messageContents = new Map();
    }

    /**
     * Add a user message
     * @param {string} content - Message content
     * @returns {HTMLElement} Message element
     */
    addUserMessage(content) {
        return this.addMessage(content, 'user');
    }

    /**
     * Add an assistant message
     * @param {string} content - Message content (markdown)
     * @returns {HTMLElement} Message element
     */
    addAssistantMessage(content = '') {
        const messageEl = this.addMessage(content, 'assistant');
        // Store raw content for re-rendering
        if (messageEl) {
            const msgId = messageEl.dataset.messageId || Date.now().toString() + Math.random().toString();
            messageEl.dataset.messageId = msgId;
            this.messageContents.set(msgId, content);
        }
        return messageEl;
    }

    /**
     * Add an error message
     * @param {string} content - Error message
     * @returns {HTMLElement} Message element
     */
    addErrorMessage(content) {
        return this.addMessage(content, 'error');
    }

    /**
     * Add a message to the chat
     * @param {string} content - Message content
     * @param {string} type - Message type (user, assistant, error)
     * @returns {HTMLElement} Message element
     */
    addMessage(content, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;

        if (type === 'assistant' && content) {
            messageEl.innerHTML = this.renderer.render(content);
        } else {
            messageEl.textContent = content;
        }

        this.container.appendChild(messageEl);
        this.scrollToBottom();

        return messageEl;
    }

    /**
     * Update message content
     * @param {HTMLElement} messageEl - Message element
     * @param {string} content - New content
     * @param {boolean} isMarkdown - Whether to render as markdown
     */
    updateMessage(messageEl, content, isMarkdown = false) {
        // Store raw content for this message
        const msgId = messageEl.dataset.messageId;
        if (msgId) {
            this.messageContents.set(msgId, content);
        }

        if (isMarkdown) {
            messageEl.innerHTML = this.renderer.render(content);
        } else {
            // Preserve line breaks in raw mode
            messageEl.style.whiteSpace = 'pre-wrap';
            messageEl.textContent = content;
        }
        this.scrollToBottom();
    }

    /**
     * Show typing indicator
     * @returns {HTMLElement} Typing indicator element
     */
    showTypingIndicator() {
        const messageEl = this.addAssistantMessage('');
        messageEl.innerHTML = '<span class="typing">Thinking</span>';
        return messageEl;
    }

    /**
     * Remove typing indicator
     * @param {HTMLElement} typingEl - Typing indicator element
     */
    removeTypingIndicator(typingEl) {
        if (typingEl && typingEl.parentNode) {
            typingEl.parentNode.removeChild(typingEl);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.container.innerHTML = '';
        this.messageContents.clear();
    }

    /**
     * Re-render all assistant messages with new markdown setting
     * @param {boolean} isMarkdown - Whether to render as markdown
     */
    reRenderAssistantMessages(isMarkdown) {
        const assistantMessages = this.container.querySelectorAll('.message.assistant');
        assistantMessages.forEach(messageEl => {
            const msgId = messageEl.dataset.messageId;
            if (msgId && this.messageContents.has(msgId)) {
                const content = this.messageContents.get(msgId);
                if (isMarkdown) {
                    messageEl.style.whiteSpace = '';
                    messageEl.innerHTML = this.renderer.render(content);
                } else {
                    messageEl.style.whiteSpace = 'pre-wrap';
                    messageEl.textContent = content;
                }
            }
        });
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    /**
     * Get all messages
     * @returns {Array} Array of message objects
     */
    getMessages() {
        const messages = [];
        const messageElements = this.container.querySelectorAll('.message');

        messageElements.forEach(el => {
            const type = el.classList.contains('user') ? 'user' :
                        el.classList.contains('assistant') ? 'assistant' : 'error';
            messages.push({
                type,
                content: el.textContent
            });
        });

        return messages;
    }

    /**
     * Load messages from history
     * @param {Array} messages - Array of message objects
     */
    loadMessages(messages) {
        this.clearMessages();
        messages.forEach(msg => {
            if (msg.role === 'user') {
                this.addUserMessage(msg.content);
            } else if (msg.role === 'assistant') {
                this.addAssistantMessage(msg.content);
            }
        });
    }
}
