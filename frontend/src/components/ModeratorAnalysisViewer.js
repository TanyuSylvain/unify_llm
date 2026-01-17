/**
 * Moderator Analysis Viewer Component
 *
 * Displays moderator's analysis including:
 * - Initial analysis (intent, constraints, complexity, decision)
 * - Synthesis analysis (feedback validation, decision, guidance, summary)
 *
 * Cards are initially expanded during debate and auto-collapse after termination.
 */

class ModeratorAnalysisViewer {
    constructor(containerElement) {
        this.container = containerElement;
        this.analysisCards = [];
        this.cardIdCounter = 0;
    }

    /**
     * Show initial analysis from moderator
     * @param {Object} analysis - Initial analysis data
     */
    showInitAnalysis(analysis) {
        const card = this.createAnalysisCard('init', analysis, true);
        this.container.appendChild(card);
        this.analysisCards.push(card);
    }

    /**
     * Show synthesis analysis from moderator
     * @param {number} iteration - Iteration number
     * @param {Object} analysis - Synthesis analysis data
     */
    showSynthesisAnalysis(iteration, analysis) {
        const card = this.createAnalysisCard('synthesis', analysis, true, iteration);
        this.container.appendChild(card);
        this.analysisCards.push(card);
    }

    /**
     * Collapse all analysis cards
     */
    collapseAll() {
        this.analysisCards.forEach(card => {
            const content = card.querySelector('.moderator-analysis-content');
            const header = card.querySelector('.moderator-analysis-header');
            if (content && header) {
                content.style.display = 'none';
                card.classList.remove('expanded');
                card.classList.add('collapsed');
                header.querySelector('.toggle-icon').textContent = '▶';
            }
        });
    }

    /**
     * Expand all analysis cards
     */
    expandAll() {
        this.analysisCards.forEach(card => {
            const content = card.querySelector('.moderator-analysis-content');
            const header = card.querySelector('.moderator-analysis-header');
            if (content && header) {
                content.style.display = 'block';
                card.classList.remove('collapsed');
                card.classList.add('expanded');
                header.querySelector('.toggle-icon').textContent = '▼';
            }
        });
    }

    /**
     * Create an analysis card
     * @param {string} type - 'init' or 'synthesis'
     * @param {Object} analysis - Analysis data
     * @param {boolean} expanded - Whether card should be expanded
     * @param {number} iteration - Iteration number (for synthesis)
     * @returns {HTMLElement} - Card element
     */
    createAnalysisCard(type, analysis, expanded = true, iteration = null) {
        const cardId = `moderator-analysis-${this.cardIdCounter++}`;
        const card = document.createElement('div');
        card.className = `moderator-analysis-card ${expanded ? 'expanded' : 'collapsed'}`;
        card.id = cardId;

        // Create header
        const header = document.createElement('div');
        header.className = 'moderator-analysis-header';

        const title = document.createElement('span');
        title.className = 'moderator-analysis-title';

        if (type === 'init') {
            title.innerHTML = '🤔 <strong>Moderator Initial Analysis</strong>';
        } else {
            title.innerHTML = `⚖️ <strong>Moderator Synthesis - Round ${iteration}</strong>`;
        }

        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.textContent = expanded ? '▼' : '▶';

        header.appendChild(title);
        header.appendChild(toggleIcon);

        // Create content
        const content = document.createElement('div');
        content.className = 'moderator-analysis-content';
        content.style.display = expanded ? 'block' : 'none';

        if (type === 'init') {
            content.innerHTML = this.formatInitAnalysis(analysis);
        } else {
            content.innerHTML = this.formatSynthesisAnalysis(analysis);
        }

        // Toggle functionality
        header.addEventListener('click', () => {
            const isExpanded = card.classList.contains('expanded');
            if (isExpanded) {
                content.style.display = 'none';
                card.classList.remove('expanded');
                card.classList.add('collapsed');
                toggleIcon.textContent = '▶';
            } else {
                content.style.display = 'block';
                card.classList.remove('collapsed');
                card.classList.add('expanded');
                toggleIcon.textContent = '▼';
            }
        });

        card.appendChild(header);
        card.appendChild(content);

        return card;
    }

    /**
     * Format initial analysis for display
     * @param {Object} analysis - Analysis data
     * @returns {string} - HTML string
     */
    formatInitAnalysis(analysis) {
        const intent = analysis.intent || 'N/A';
        const keyConstraints = analysis.key_constraints || [];
        const complexity = analysis.complexity || 'unknown';
        const complexityReason = analysis.complexity_reason || 'N/A';
        const decision = analysis.decision || 'unknown';

        const complexityBadge = this.getComplexityBadge(complexity);
        const decisionBadge = this.getDecisionBadge(decision);

        let html = '<div class="analysis-section">';
        html += `<div class="analysis-field"><strong>Intent:</strong> ${intent}</div>`;

        if (keyConstraints.length > 0) {
            html += '<div class="analysis-field"><strong>Key Constraints:</strong><ul>';
            keyConstraints.forEach(constraint => {
                html += `<li>${constraint}</li>`;
            });
            html += '</ul></div>';
        }

        html += `<div class="analysis-field"><strong>Complexity:</strong> ${complexityBadge} ${complexityReason}</div>`;
        html += `<div class="analysis-field"><strong>Decision:</strong> ${decisionBadge}</div>`;
        html += '</div>';

        return html;
    }

    /**
     * Format synthesis analysis for display
     * @param {Object} analysis - Analysis data
     * @returns {string} - HTML string
     */
    formatSynthesisAnalysis(analysis) {
        const feedbackValidation = analysis.feedback_validation || {};
        const decision = analysis.decision || 'unknown';
        const improvementGuidance = analysis.improvement_guidance;
        const iterationSummary = analysis.iteration_summary;
        const terminationReason = analysis.termination_reason;

        let html = '<div class="analysis-section">';

        // Feedback validation
        if (feedbackValidation.valid_issues || feedbackValidation.invalid_issues) {
            html += '<div class="analysis-field"><strong>Feedback Validation:</strong>';

            if (feedbackValidation.valid_issues && feedbackValidation.valid_issues.length > 0) {
                html += '<div class="valid-issues"><em>Valid Issues:</em><ul>';
                feedbackValidation.valid_issues.forEach(issue => {
                    html += `<li>${issue}</li>`;
                });
                html += '</ul></div>';
            }

            if (feedbackValidation.invalid_issues && feedbackValidation.invalid_issues.length > 0) {
                html += '<div class="invalid-issues"><em>Invalid Criticisms:</em><ul>';
                feedbackValidation.invalid_issues.forEach(issue => {
                    html += `<li>${issue}</li>`;
                });
                html += '</ul></div>';
            }

            html += '</div>';
        }

        // Decision
        const decisionBadge = decision === 'end' ?
            '<span class="badge badge-success">End</span>' :
            '<span class="badge badge-info">Continue</span>';
        html += `<div class="analysis-field"><strong>Decision:</strong> ${decisionBadge}`;

        if (terminationReason) {
            html += ` <span class="termination-reason">(${this.getTerminationReasonText(terminationReason)})</span>`;
        }
        html += '</div>';

        // Improvement guidance (if continuing)
        if (improvementGuidance && decision === 'continue') {
            html += `<div class="analysis-field"><strong>Improvement Guidance:</strong> ${improvementGuidance}</div>`;
        }

        // Iteration summary
        if (iterationSummary) {
            html += `<div class="analysis-field"><strong>Round Summary:</strong> ${iterationSummary}</div>`;
        }

        html += '</div>';

        return html;
    }

    /**
     * Get complexity badge HTML
     * @param {string} complexity - Complexity level
     * @returns {string} - Badge HTML
     */
    getComplexityBadge(complexity) {
        const badges = {
            'simple': '<span class="badge badge-success">简单</span>',
            'moderate': '<span class="badge badge-warning">中等</span>',
            'complex': '<span class="badge badge-danger">复杂</span>'
        };
        return badges[complexity] || `<span class="badge badge-secondary">${complexity}</span>`;
    }

    /**
     * Get decision badge HTML
     * @param {string} decision - Decision type
     * @returns {string} - Badge HTML
     */
    getDecisionBadge(decision) {
        const badges = {
            'direct_answer': '<span class="badge badge-success">直接回答</span>',
            'delegate_expert': '<span class="badge badge-info">委派专家</span>'
        };
        return badges[decision] || `<span class="badge badge-secondary">${decision}</span>`;
    }

    /**
     * Get human-readable termination reason
     * @param {string} reason - Termination reason code
     * @returns {string} - Human-readable text
     */
    getTerminationReasonText(reason) {
        const reasons = {
            'score_threshold': '达到分数阈值',
            'explicit_pass': '明确通过',
            'max_iterations': '达到最大迭代次数',
            'convergence': '答案收敛',
            'simple_question': '简单问题'
        };
        return reasons[reason] || reason;
    }

    /**
     * Clear all analysis cards
     */
    clear() {
        this.analysisCards.forEach(card => card.remove());
        this.analysisCards = [];
        this.cardIdCounter = 0;
    }
}

export default ModeratorAnalysisViewer;
