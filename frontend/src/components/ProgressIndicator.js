/**
 * Progress Indicator Component
 * Shows the current phase and iteration progress of multi-agent debate
 */

export class ProgressIndicator {
    constructor(containerElement) {
        this.container = containerElement;
        this.currentPhase = null;
        this.currentIteration = 0;
        this.maxIterations = 3;
        this.isActive = false;
        this.isDirectAnswer = false;

        // Phase definitions with icons and descriptions
        this.phases = {
            'moderator_init': {
                icon: '&#x1F50D;',
                label: 'Analyzing',
                description: 'Moderator analyzing question complexity'
            },
            'expert_generate': {
                icon: '&#x1F4DD;',
                label: 'Expert',
                description: 'Expert generating answer'
            },
            'critic_review': {
                icon: '&#x1F50E;',
                label: 'Critic',
                description: 'Critic reviewing answer'
            },
            'moderator_synthesize': {
                icon: '&#x2696;',
                label: 'Synthesizing',
                description: 'Moderator synthesizing results'
            }
        };
    }

    /**
     * Initialize the progress indicator
     */
    initialize() {
        this.render();
    }

    /**
     * Render the progress indicator
     */
    render() {
        if (!this.isActive) {
            this.container.innerHTML = '';
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        if (this.isDirectAnswer) {
            this.container.innerHTML = `
                <div class="progress-indicator direct-answer">
                    <span class="progress-icon">&#x26A1;</span>
                    <span class="progress-text">Direct Answer (Simple Question)</span>
                </div>
            `;
            return;
        }

        const phase = this.phases[this.currentPhase] || {
            icon: '&#x23F3;',
            label: 'Processing',
            description: 'Processing...'
        };

        this.container.innerHTML = `
            <div class="progress-indicator active">
                <div class="progress-phase">
                    <span class="progress-icon spinning">${phase.icon}</span>
                    <span class="progress-label">${phase.label}</span>
                </div>
                <div class="progress-iteration">
                    <span class="iteration-text">Round ${this.currentIteration} of ${this.maxIterations}</span>
                    <div class="iteration-dots">
                        ${this.renderIterationDots()}
                    </div>
                </div>
                <div class="progress-description">${phase.description}</div>
            </div>
        `;
    }

    /**
     * Render iteration progress dots
     */
    renderIterationDots() {
        let dots = '';
        for (let i = 1; i <= this.maxIterations; i++) {
            let dotClass = 'iteration-dot';
            if (i < this.currentIteration) {
                dotClass += ' completed';
            } else if (i === this.currentIteration) {
                dotClass += ' current';
            }
            dots += `<span class="${dotClass}"></span>`;
        }
        return dots;
    }

    /**
     * Start the progress indicator
     * @param {number} maxIterations - Maximum iterations
     */
    start(maxIterations = 3) {
        this.isActive = true;
        this.isDirectAnswer = false;
        this.currentPhase = 'moderator_init';
        this.currentIteration = 0;
        this.maxIterations = maxIterations;
        this.render();
    }

    /**
     * Update the current phase
     * @param {string} phase - Phase name
     * @param {number} iteration - Current iteration
     */
    setPhase(phase, iteration = null) {
        this.currentPhase = phase;
        if (iteration !== null) {
            this.currentIteration = iteration;
        }
        this.render();
    }

    /**
     * Set iteration
     * @param {number} iteration - Current iteration
     */
    setIteration(iteration) {
        this.currentIteration = iteration;
        this.render();
    }

    /**
     * Mark as direct answer (simple question)
     */
    setDirectAnswer() {
        this.isDirectAnswer = true;
        this.render();
    }

    /**
     * Complete the progress indicator
     * @param {string} reason - Termination reason (optional)
     */
    complete(reason = null) {
        this.isActive = false;
        this.currentPhase = null;

        // Show completion message briefly
        const reasonText = this.getReasonText(reason);
        this.container.innerHTML = `
            <div class="progress-indicator completed">
                <span class="progress-icon">&#x2705;</span>
                <span class="progress-text">Debate complete${reasonText ? ': ' + reasonText : ''}</span>
            </div>
        `;
        this.container.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            this.hide();
        }, 3000);
    }

    /**
     * Get human-readable termination reason
     */
    getReasonText(reason) {
        const reasonMap = {
            'score_threshold': 'Score threshold reached',
            'explicit_pass': 'Critic approved',
            'max_iterations': 'Max iterations reached',
            'convergence': 'Answer converged',
            'simple_question': 'Direct answer provided'
        };
        return reasonMap[reason] || reason;
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showError(message) {
        this.isActive = false;
        this.container.innerHTML = `
            <div class="progress-indicator error">
                <span class="progress-icon">&#x274C;</span>
                <span class="progress-text">Error: ${message}</span>
            </div>
        `;
        this.container.style.display = 'block';
    }

    /**
     * Hide the progress indicator
     */
    hide() {
        this.isActive = false;
        this.container.style.display = 'none';
        this.container.innerHTML = '';
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.isActive = false;
        this.isDirectAnswer = false;
        this.currentPhase = null;
        this.currentIteration = 0;
        this.container.innerHTML = '';
        this.container.style.display = 'none';
    }
}
