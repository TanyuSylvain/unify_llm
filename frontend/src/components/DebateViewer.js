/**
 * Debate Viewer Component
 * Displays the multi-agent debate timeline with expert answers, critic reviews,
 * and moderator analysis
 */

export class DebateViewer {
    constructor(containerElement, moderatorInitElement = null) {
        this.container = containerElement;
        this.moderatorInitElement = moderatorInitElement;
        this.moderatorInitExpanded = true; // Moderator init starts expanded
        this.moderatorInitAnalysis = null;
        this.iterations = [];
        this.expandedCard = null; // Track which round card is currently expanded
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
        this.moderatorInitAnalysis = null;
        this.moderatorInitExpanded = true;
        this.renderModeratorInit();
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
     * Render moderator init analysis card
     */
    renderModeratorInit() {
        if (!this.moderatorInitElement) return;

        if (!this.moderatorInitAnalysis) {
            this.moderatorInitElement.innerHTML = '';
            this.moderatorInitElement.style.display = 'none';
            return;
        }

        this.moderatorInitElement.style.display = 'block';
        const analysis = this.moderatorInitAnalysis;
        const intent = analysis.intent || 'N/A';
        const keyConstraints = analysis.key_constraints || analysis.keyConstraints || [];
        const complexity = analysis.complexity || 'unknown';
        const complexityReason = analysis.complexity_reason || analysis.complexityReason || 'N/A';
        const decision = analysis.decision || 'unknown';

        // Get badges
        const complexityBadge = this.getComplexityBadge(complexity);
        const decisionBadge = this.getDecisionBadge(decision);

        // Format key constraints
        const constraintsHtml = keyConstraints.length > 0
            ? `<ul>${keyConstraints.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}</ul>`
            : '<p>None identified</p>';

        this.moderatorInitElement.innerHTML = `
            <div class="moderator-init-card ${this.moderatorInitExpanded ? 'expanded' : ''}" id="moderatorInitCard">
                <div class="moderator-init-header" id="moderatorInitHeader">
                    <span class="moderator-init-title">🤔 Moderator Initial Analysis</span>
                    <span class="moderator-init-toggle">${this.moderatorInitExpanded ? '▲' : '▼'}</span>
                </div>
                ${this.moderatorInitExpanded ? `
                <div class="moderator-init-content">
                    <div class="moderator-field"><strong>Intent:</strong> ${this.escapeHtml(intent)}</div>
                    <div class="moderator-field"><strong>Key Constraints:</strong> ${constraintsHtml}</div>
                    <div class="moderator-field"><strong>Complexity:</strong> ${complexityBadge} ${this.escapeHtml(complexityReason)}</div>
                    <div class="moderator-field"><strong>Decision:</strong> ${decisionBadge}</div>
                </div>
                ` : ''}
            </div>
        `;

        // Set up toggle event
        const header = this.moderatorInitElement.querySelector('#moderatorInitHeader');
        if (header) {
            header.addEventListener('click', () => {
                this.moderatorInitExpanded = !this.moderatorInitExpanded;
                this.renderModeratorInit();
            });
        }
    }

    /**
     * Get complexity badge HTML
     */
    getComplexityBadge(complexity) {
        const badges = {
            'simple': '<span class="badge badge-success">Simple</span>',
            'moderate': '<span class="badge badge-warning">Moderate</span>',
            'complex': '<span class="badge badge-danger">Complex</span>'
        };
        return badges[complexity] || `<span class="badge badge-secondary">${complexity}</span>`;
    }

    /**
     * Get decision badge HTML
     */
    getDecisionBadge(decision) {
        const badges = {
            'direct_answer': '<span class="badge badge-success">Direct Answer</span>',
            'delegate_expert': '<span class="badge badge-info">Delegate to Expert</span>'
        };
        return badges[decision] || `<span class="badge badge-secondary">${decision}</span>`;
    }

    /**
     * Get synthesis decision badge
     */
    getSynthesisDecisionBadge(decision) {
        if (decision === 'end') {
            return '<span class="badge badge-success">End Debate</span>';
        }
        return '<span class="badge badge-info">Continue</span>';
    }

    /**
     * Render all iterations as accordion cards
     */
    renderIterations() {
        return this.iterations.map((iteration, index) => {
            const isExpanded = this.expandedCard === index;
            const nextRound = index + 1 < this.iterations.length ? `Round ${index + 2}` : null;
            const synthesis = iteration.synthesis;

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
                    ${synthesis ? this.renderModeratorSynthesis(synthesis, index + 1) : ''}
                    ${nextRound ? `<div class="next-round-indicator" data-next="${index + 2}">Next: ${nextRound} ▾</div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
        }).join('');
    }

    /**
     * Render moderator synthesis feedback for a round
     */
    renderModeratorSynthesis(synthesis, roundNumber) {
        const decision = synthesis.decision || 'unknown';
        const feedback = synthesis.feedback_validation || {};
        const guidance = synthesis.improvement_guidance;
        const summary = synthesis.iteration_summary;

        const decisionBadge = this.getSynthesisDecisionBadge(decision);

        // Format valid issues
        const validIssues = feedback.valid_issues || [];
        const invalidIssues = feedback.invalid_issues || [];

        let issuesHtml = '';
        if (validIssues.length > 0 || invalidIssues.length > 0) {
            issuesHtml = '<div class="synthesis-issues">';
            if (validIssues.length > 0) {
                issuesHtml += '<div class="valid-issues"><em>Valid Issues:</em><ul>';
                validIssues.forEach(issue => {
                    issuesHtml += `<li>${this.escapeHtml(issue)}</li>`;
                });
                issuesHtml += '</ul></div>';
            }
            if (invalidIssues.length > 0) {
                issuesHtml += '<div class="invalid-issues"><em>Invalid Criticisms:</em><ul>';
                invalidIssues.forEach(issue => {
                    issuesHtml += `<li>${this.escapeHtml(issue)}</li>`;
                });
                issuesHtml += '</ul></div>';
            }
            issuesHtml += '</div>';
        }

        return `
            <div class="moderator-synthesis-card">
                <div class="moderator-synthesis-header">⚖️ Moderator Feedback</div>
                <div class="moderator-synthesis-content">
                    <div class="synthesis-field"><strong>Decision:</strong> ${decisionBadge}</div>
                    ${issuesHtml}
                    ${guidance && decision === 'continue' ? `<div class="synthesis-field"><strong>Improvement:</strong> ${this.escapeHtml(guidance)}</div>` : ''}
                    ${summary ? `<div class="synthesis-field"><strong>Summary:</strong> ${this.escapeHtml(summary)}</div>` : ''}
                </div>
            </div>
        `;
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
     * Set moderator initial analysis
     * @param {Object} analysis - Moderator init analysis object
     */
    setModeratorInit(analysis) {
        this.moderatorInitAnalysis = analysis;
        this.moderatorInitExpanded = true;
        this.renderModeratorInit();
    }

    /**
     * Add moderator synthesis for an iteration
     * @param {number} iteration - Iteration number
     * @param {Object} synthesis - Moderator synthesis analysis object
     */
    addModeratorSynthesis(iteration, synthesis) {
        while (this.iterations.length < iteration) {
            this.iterations.push({});
        }
        this.iterations[iteration - 1].synthesis = synthesis;
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
