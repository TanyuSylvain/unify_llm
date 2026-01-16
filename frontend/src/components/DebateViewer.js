/**
 * Debate Viewer Component
 * Displays the multi-agent debate timeline with expert answers and critic reviews
 */

export class DebateViewer {
    constructor(containerElement) {
        this.container = containerElement;
        this.iterations = [];
        this.expandedCard = null; // Track which card is currently expanded
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
        this.expandedCard = null;
        this.render();
    }

    /**
     * Render the debate viewer (just round cards, accordion style)
     */
    render() {
        if (this.iterations.length === 0) {
            this.container.innerHTML = '';
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.height = '100%';

        this.container.innerHTML = this.renderIterations();

        this.setupEventListeners();
    }

    /**
     * Render all iterations as accordion cards
     */
    renderIterations() {
        return this.iterations.map((iteration, index) => {
            const isExpanded = this.expandedCard === index;
            const nextRound = index + 1 < this.iterations.length ? `Round ${index + 2}` : null;
            return `
            <div class="round-card ${isExpanded ? 'expanded' : ''}" data-iteration="${index + 1}">
                <div class="round-card-header" data-iteration="${index + 1}">
                    <span class="round-number">Round ${index + 1}</span>
                    ${iteration.review ? this.renderScoreBadge(iteration.review.overall_score) : ''}
                    <span class="round-toggle">${isExpanded ? '▲' : '▼'}</span>
                </div>
                ${isExpanded ? `
                <div class="round-card-content">
                    <div class="round-card-body">
                        ${iteration.answer ? this.renderExpertAnswer(iteration.answer) : ''}
                        ${iteration.review ? this.renderCriticReview(iteration.review) : ''}
                    </div>
                    ${nextRound ? `<div class="next-round-indicator" data-next="${index + 2}">Next: ${nextRound} ▾</div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
        }).join('');
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
     * Set up event listeners
     */
    setupEventListeners() {
        // Accordion behavior - click header to toggle, auto-collapse others
        const cardHeaders = this.container.querySelectorAll('.round-card-header');
        cardHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const iteration = parseInt(header.dataset.iteration) - 1;
                this.toggleCard(iteration);
            });
        });

        // Next round indicator - click to navigate to next round
        const nextIndicators = this.container.querySelectorAll('.next-round-indicator');
        nextIndicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextRound = parseInt(indicator.dataset.next) - 1;
                this.toggleCard(nextRound);
            });
        });

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
     * Toggle a card (accordion behavior)
     */
    toggleCard(iteration) {
        if (this.expandedCard === iteration) {
            // Collapse if already expanded
            this.expandedCard = null;
        } else {
            // Expand this card, collapse others
            this.expandedCard = iteration;
        }
        this.render();
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

        // Auto-expand the new card
        this.expandedCard = iteration - 1;
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
     * Set the final answer (not rendered in debate panel)
     * @param {string} answer - Final answer text
     * @param {string} reason - Termination reason
     */
    setFinalAnswer(answer, reason) {
        // Final answer is shown in main conversation, not here
        // Just collapse all cards
        this.expandedCard = null;
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
        this.container.style.display = 'flex';
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
