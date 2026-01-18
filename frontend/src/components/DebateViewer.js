/**
 * Debate Viewer Component
 * Displays the multi-agent debate timeline with expert answers, critic reviews,
 * and moderator analysis
 */

import { getStorage, setStorage } from '../utils/helpers.js';

export class DebateViewer {
    constructor(containerElement, moderatorInitElement = null) {
        this.container = containerElement;
        this.moderatorInitElement = moderatorInitElement; // Keep for backwards compatibility
        this.moderatorInitAnalysis = null;
        this.iterations = [];
        this.expandedCard = null; // Track which card is expanded: 'init' or iteration index (0-based)
        this.conversationId = null;
        this.currentDebateId = null; // Track current debate session
    }

    /**
     * Set conversation ID for data persistence
     * @param {string} conversationId - The conversation ID
     */
    setConversationId(conversationId) {
        this.conversationId = conversationId;
    }

    /**
     * Set current debate ID
     * @param {string} debateId - The debate ID
     */
    setDebateId(debateId) {
        this.currentDebateId = debateId;
    }

    /**
     * Get storage key for all debates in this conversation
     * @returns {string} Storage key
     */
    getStorageKey() {
        return `debateData_${this.conversationId}`;
    }

    /**
     * Save current debate data to localStorage (keyed by debateId)
     */
    saveData() {
        if (!this.conversationId || !this.currentDebateId) return;

        const allDebates = getStorage(this.getStorageKey(), {});
        allDebates[this.currentDebateId] = {
            moderatorInitAnalysis: this.moderatorInitAnalysis,
            iterations: this.iterations,
            expandedCard: this.expandedCard
        };
        setStorage(this.getStorageKey(), allDebates);
    }

    /**
     * Load debate data for a specific debateId from localStorage
     * @param {string} debateId - Optional debateId to load (defaults to currentDebateId)
     * @returns {boolean} Whether data was loaded
     */
    loadData(debateId = null) {
        if (!this.conversationId) return false;

        const targetDebateId = debateId || this.currentDebateId;
        if (!targetDebateId) return false;

        const allDebates = getStorage(this.getStorageKey(), {});
        const data = allDebates[targetDebateId];

        if (data) {
            this.currentDebateId = targetDebateId;
            this.moderatorInitAnalysis = data.moderatorInitAnalysis || null;
            this.iterations = data.iterations || [];
            this.expandedCard = data.expandedCard !== undefined ? data.expandedCard : null;
            this.render();
            return true;
        }
        return false;
    }

    /**
     * Load the most recent debate data (for initial load)
     * @returns {boolean} Whether data was loaded
     */
    loadMostRecentData() {
        if (!this.conversationId) return false;

        const allDebates = getStorage(this.getStorageKey(), {});
        const debateIds = Object.keys(allDebates);

        if (debateIds.length > 0) {
            // Load the most recent (last) debate
            const lastDebateId = debateIds[debateIds.length - 1];
            return this.loadData(lastDebateId);
        }
        return false;
    }

    /**
     * Check if there's any debate data for this conversation
     * @returns {boolean} Whether any debate data exists
     */
    hasAnyData() {
        if (!this.conversationId) return false;
        const allDebates = getStorage(this.getStorageKey(), {});
        return Object.keys(allDebates).length > 0;
    }

    /**
     * Clear stored data for current conversation
     */
    clearStoredData() {
        if (!this.conversationId) return;
        localStorage.removeItem(this.getStorageKey());
    }

    /**
     * Clear stored data for a specific debateId
     * @param {string} debateId - The debate ID to clear
     */
    clearDebateData(debateId) {
        if (!this.conversationId || !debateId) return;
        const allDebates = getStorage(this.getStorageKey(), {});
        delete allDebates[debateId];
        setStorage(this.getStorageKey(), allDebates);
    }

    /**
     * Initialize the debate viewer
     */
    initialize() {
        this.render();
    }

    /**
     * Clear all data
     * @param {boolean} clearStorage - Whether to also clear stored data (default: true)
     */
    clear(clearStorage = true) {
        this.iterations = [];
        this.expandedCard = null;
        this.moderatorInitAnalysis = null;
        // Hide the old moderator init container if it exists
        if (this.moderatorInitElement) {
            this.moderatorInitElement.style.display = 'none';
            this.moderatorInitElement.innerHTML = '';
        }
        if (clearStorage) {
            this.clearStoredData();
        }
        this.render();
    }

    /**
     * Render the debate viewer (init card + round cards, accordion style)
     */
    render() {
        // Hide old moderator init container (we now render it in main container)
        if (this.moderatorInitElement) {
            this.moderatorInitElement.style.display = 'none';
            this.moderatorInitElement.innerHTML = '';
        }

        // Show container if we have init analysis or iterations
        if (!this.moderatorInitAnalysis && this.iterations.length === 0) {
            this.container.innerHTML = '';
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.height = '100%';

        // Render init card (if exists) + iteration cards
        let html = '';
        if (this.moderatorInitAnalysis) {
            html += this.renderInitCard();
        }
        html += this.renderIterations();

        this.container.innerHTML = html;
        this.setupEventListeners();
    }

    /**
     * Render moderator init card (same style as round cards, integrated in accordion)
     */
    renderInitCard() {
        const analysis = this.moderatorInitAnalysis;
        if (!analysis) return '';

        const isExpanded = this.expandedCard === 'init';
        const intent = analysis.intent || 'N/A';
        const keyConstraints = analysis.key_constraints || analysis.keyConstraints || [];
        const complexity = analysis.complexity || 'unknown';
        const complexityReason = analysis.complexity_reason || analysis.complexityReason || 'N/A';
        const decision = analysis.decision || 'unknown';

        // Get badges
        const complexityBadge = this.getComplexityBadge(complexity);
        const decisionBadge = this.getDecisionBadge(decision);

        // Format key constraints as list items
        const constraintsHtml = keyConstraints.length > 0
            ? keyConstraints.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')
            : '';

        return `
            <div class="round-card ${isExpanded ? 'expanded' : ''}" data-iteration="init">
                <div class="round-card-header" data-iteration="init">
                    <span class="round-number">🤔 Initial Analysis</span>
                    ${decisionBadge}
                    <span class="round-toggle">${isExpanded ? '▲' : '▼'}</span>
                </div>
                ${isExpanded ? `
                <div class="round-card-content">
                    <div class="round-card-body">
                        <div class="moderator-card">
                            <div class="card-header">
                                <span class="card-icon">🎯</span>
                                <span class="card-title">Query Analysis</span>
                                ${complexityBadge}
                            </div>
                            <div class="card-body">
                                <div class="answer-section">
                                    <strong>Intent:</strong>
                                    <p>${this.escapeHtml(intent)}</p>
                                </div>
                                ${constraintsHtml ? `
                                <div class="answer-section">
                                    <strong>Key Constraints:</strong>
                                    <ul class="constraints-list">${constraintsHtml}</ul>
                                </div>
                                ` : ''}
                                <div class="answer-section">
                                    <strong>Complexity:</strong>
                                    <p>${this.escapeHtml(complexityReason)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
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
                        ${synthesis ? this.renderModeratorSynthesis(synthesis, index + 1) : ''}
                    </div>
                    ${nextRound ? `<div class="next-round-indicator" data-next="${index + 2}">Next: ${nextRound} ▾</div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
        }).join('');
    }

    /**
     * Render moderator synthesis feedback for a round (same style as expert/critic cards)
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

        let validIssuesHtml = '';
        if (validIssues.length > 0) {
            validIssuesHtml = `
                <div class="answer-section">
                    <strong>Valid Issues:</strong>
                    <ul class="valid-issues-list">${validIssues.map(issue => `<li>${this.escapeHtml(issue)}</li>`).join('')}</ul>
                </div>
            `;
        }

        let invalidIssuesHtml = '';
        if (invalidIssues.length > 0) {
            invalidIssuesHtml = `
                <div class="answer-section">
                    <strong>Invalid Criticisms:</strong>
                    <ul class="invalid-issues-list">${invalidIssues.map(issue => `<li>${this.escapeHtml(issue)}</li>`).join('')}</ul>
                </div>
            `;
        }

        return `
            <div class="moderator-card">
                <div class="card-header">
                    <span class="card-icon">⚖️</span>
                    <span class="card-title">Moderator Synthesis</span>
                    ${decisionBadge}
                </div>
                <div class="card-body">
                    ${validIssuesHtml}
                    ${invalidIssuesHtml}
                    ${guidance && decision === 'continue' ? `
                    <div class="answer-section">
                        <strong>Improvement Guidance:</strong>
                        <p>${this.escapeHtml(guidance)}</p>
                    </div>
                    ` : ''}
                    ${summary ? `
                    <div class="answer-section">
                        <strong>Summary:</strong>
                        <p>${this.escapeHtml(summary)}</p>
                    </div>
                    ` : ''}
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
                const iterationStr = header.dataset.iteration;
                // Handle 'init' card separately from numbered iterations
                const cardId = iterationStr === 'init' ? 'init' : parseInt(iterationStr) - 1;
                this.toggleCard(cardId);
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
        this.saveData();
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
        this.saveData();
        this.render();
    }

    /**
     * Set moderator initial analysis
     * @param {Object} analysis - Moderator init analysis object
     */
    setModeratorInit(analysis) {
        this.moderatorInitAnalysis = analysis;
        // Auto-expand the init card when it's set
        this.expandedCard = 'init';
        this.saveData();
        this.render();
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
        this.saveData();
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
