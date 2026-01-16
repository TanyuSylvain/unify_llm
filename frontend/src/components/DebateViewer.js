/**
 * Debate Viewer Component
 * Displays the multi-agent debate timeline with expert answers and critic reviews
 */

export class DebateViewer {
    constructor(containerElement) {
        this.container = containerElement;
        this.iterations = [];
        this.finalAnswer = null;
        this.terminationReason = null;
        this.isExpanded = true;
    }

    /**
     * Initialize the debate viewer
     */
    initialize() {
        this.render();
    }

    /**
     * Clear all data
     */
    clear() {
        this.iterations = [];
        this.finalAnswer = null;
        this.terminationReason = null;
        this.render();
    }

    /**
     * Render the debate viewer
     */
    render() {
        if (this.iterations.length === 0 && !this.finalAnswer) {
            this.container.innerHTML = '';
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        this.container.innerHTML = `
            <div class="debate-viewer ${this.isExpanded ? 'expanded' : 'collapsed'}">
                <div class="debate-header" title="Click to ${this.isExpanded ? 'collapse' : 'expand'}">
                    <span class="debate-title">Debate Process</span>
                    <span class="debate-toggle">${this.isExpanded ? '&#x25BC;' : '&#x25B6;'}</span>
                </div>
                <div class="debate-content">
                    <div class="debate-timeline">
                        ${this.renderIterations()}
                    </div>
                    ${this.finalAnswer ? this.renderFinalAnswer() : ''}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Render all iterations
     */
    renderIterations() {
        return this.iterations.map((iteration, index) => `
            <div class="iteration-card" data-iteration="${index + 1}">
                <div class="iteration-header">
                    <span class="iteration-number">Round ${index + 1}</span>
                    ${iteration.review ? this.renderScoreBadge(iteration.review.overall_score) : ''}
                </div>
                <div class="iteration-body">
                    ${iteration.answer ? this.renderExpertAnswer(iteration.answer) : ''}
                    ${iteration.review ? this.renderCriticReview(iteration.review) : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render score badge with color coding
     */
    renderScoreBadge(score) {
        let badgeClass = 'score-badge';
        if (score >= 80) {
            badgeClass += ' excellent';
        } else if (score >= 70) {
            badgeClass += ' good';
        } else if (score >= 60) {
            badgeClass += ' fair';
        } else {
            badgeClass += ' poor';
        }
        return `<span class="${badgeClass}">${score.toFixed(0)}</span>`;
    }

    /**
     * Render expert answer card
     */
    renderExpertAnswer(answer) {
        const corePoints = answer.core_points ? answer.core_points.map(p => `<li>${this.escapeHtml(p)}</li>`).join('') : '';

        return `
            <div class="expert-card">
                <div class="card-header">
                    <span class="card-icon">&#x1F4DD;</span>
                    <span class="card-title">Expert Answer</span>
                    <span class="confidence-badge" title="Confidence">
                        ${(answer.confidence * 100).toFixed(0)}%
                    </span>
                </div>
                <div class="card-body">
                    <div class="answer-section">
                        <strong>Understanding:</strong>
                        <p>${this.escapeHtml(answer.understanding || '')}</p>
                    </div>
                    ${corePoints ? `
                    <div class="answer-section">
                        <strong>Core Points:</strong>
                        <ul class="core-points">${corePoints}</ul>
                    </div>
                    ` : ''}
                    <div class="answer-section collapsible">
                        <strong>Details:</strong>
                        <div class="details-content collapsed">
                            ${this.escapeHtml(answer.details || '')}
                        </div>
                        <button class="toggle-details">Show more</button>
                    </div>
                    <div class="answer-section">
                        <strong>Conclusion:</strong>
                        <p>${this.escapeHtml(answer.conclusion || '')}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render critic review card
     */
    renderCriticReview(review) {
        const issues = review.issues ? review.issues.map(issue => `
            <div class="issue-item ${issue.severity}">
                <span class="issue-category">${issue.category}</span>
                <span class="issue-severity">${issue.severity}</span>
                <p class="issue-description">${this.escapeHtml(issue.description)}</p>
                ${issue.quote ? `<blockquote class="issue-quote">${this.escapeHtml(issue.quote)}</blockquote>` : ''}
            </div>
        `).join('') : '';

        const strengths = review.strengths ? review.strengths.map(s => `<li>${this.escapeHtml(s)}</li>`).join('') : '';
        const suggestions = review.suggestions ? review.suggestions.map(s => `<li>${this.escapeHtml(s)}</li>`).join('') : '';

        return `
            <div class="critic-card">
                <div class="card-header">
                    <span class="card-icon">&#x1F50E;</span>
                    <span class="card-title">Critic Review</span>
                    ${this.renderPassedBadge(review.passed)}
                </div>
                <div class="card-body">
                    ${issues ? `
                    <div class="review-section">
                        <strong>Issues:</strong>
                        <div class="issues-list">${issues}</div>
                    </div>
                    ` : ''}
                    ${strengths ? `
                    <div class="review-section">
                        <strong>Strengths:</strong>
                        <ul class="strengths-list">${strengths}</ul>
                    </div>
                    ` : ''}
                    ${suggestions ? `
                    <div class="review-section">
                        <strong>Suggestions:</strong>
                        <ul class="suggestions-list">${suggestions}</ul>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render passed/failed badge
     */
    renderPassedBadge(passed) {
        return passed
            ? '<span class="passed-badge passed">Passed</span>'
            : '<span class="passed-badge failed">Needs Work</span>';
    }

    /**
     * Render final answer section
     */
    renderFinalAnswer() {
        const reasonText = this.getReasonText(this.terminationReason);

        return `
            <div class="final-answer-card">
                <div class="card-header">
                    <span class="card-icon">&#x2705;</span>
                    <span class="card-title">Final Answer</span>
                    ${reasonText ? `<span class="termination-reason">${reasonText}</span>` : ''}
                </div>
                <div class="card-body">
                    <div class="final-answer-content">
                        ${this.escapeHtml(this.finalAnswer)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get human-readable termination reason
     */
    getReasonText(reason) {
        const reasonMap = {
            'score_threshold': 'Score threshold reached',
            'explicit_pass': 'Critic approved',
            'max_iterations': 'Max iterations',
            'convergence': 'Converged',
            'simple_question': 'Direct answer'
        };
        return reasonMap[reason] || reason;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Toggle expand/collapse
        const header = this.container.querySelector('.debate-header');
        if (header) {
            header.addEventListener('click', () => {
                this.isExpanded = !this.isExpanded;
                this.render();
            });
        }

        // Toggle details buttons
        const toggleButtons = this.container.querySelectorAll('.toggle-details');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const content = e.target.previousElementSibling;
                const isCollapsed = content.classList.contains('collapsed');
                content.classList.toggle('collapsed', !isCollapsed);
                e.target.textContent = isCollapsed ? 'Show less' : 'Show more';
            });
        });
    }

    /**
     * Add an expert answer for an iteration
     * @param {number} iteration - Iteration number
     * @param {Object} answer - Expert answer object
     */
    addExpertAnswer(iteration, answer) {
        while (this.iterations.length < iteration) {
            this.iterations.push({});
        }
        this.iterations[iteration - 1].answer = answer;
        this.render();
    }

    /**
     * Add a critic review for an iteration
     * @param {number} iteration - Iteration number
     * @param {Object} review - Critic review object
     */
    addCriticReview(iteration, review) {
        while (this.iterations.length < iteration) {
            this.iterations.push({});
        }
        this.iterations[iteration - 1].review = review;
        this.render();
    }

    /**
     * Set the final answer
     * @param {string} answer - Final answer text
     * @param {string} reason - Termination reason
     */
    setFinalAnswer(answer, reason) {
        this.finalAnswer = answer;
        this.terminationReason = reason;
        this.render();
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show the debate viewer
     */
    show() {
        this.container.style.display = 'block';
    }

    /**
     * Hide the debate viewer
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.clear();
    }
}
