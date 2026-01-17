/**
 * Moderator Status Indicator Component
 *
 * Displays real-time status updates during multi-agent debate process.
 * Shows phases like "Analyzing question...", "Hosting Debate - Round 1...", etc.
 */

class ModeratorStatusIndicator {
    constructor(containerElement) {
        this.container = containerElement;
        this.statusElement = null;
        this.isVisible = false;
    }

    /**
     * Show status indicator with message
     * @param {string} status - Status message to display
     */
    show(status) {
        if (!this.statusElement) {
            this.statusElement = document.createElement('div');
            this.statusElement.className = 'moderator-status-indicator';
            this.container.appendChild(this.statusElement);
        }

        this.statusElement.textContent = status;
        this.statusElement.style.display = 'flex';
        this.isVisible = true;
    }

    /**
     * Update status based on debate phase and iteration
     * @param {string} phase - Current phase ('moderator_init', 'expert_generate', etc.)
     * @param {number} iteration - Current iteration number
     */
    update(phase, iteration) {
        const statusMessages = {
            'moderator_init': '🤔 Analyzing question...',
            'expert_generate': `👥 Hosting Debate - Round ${iteration}...`,
            'critic_review': `🔎 Reviewing answer - Round ${iteration}...`,
            'moderator_synthesize': `⚖️ Synthesizing feedback - Round ${iteration}...`,
            'done': '✓ Debate complete'
        };

        const message = statusMessages[phase] || 'Processing...';
        this.show(message);
    }

    /**
     * Hide status indicator
     */
    hide() {
        if (this.statusElement) {
            this.statusElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Remove status indicator from DOM
     */
    destroy() {
        if (this.statusElement) {
            this.statusElement.remove();
            this.statusElement = null;
        }
        this.isVisible = false;
    }
}

export default ModeratorStatusIndicator;
