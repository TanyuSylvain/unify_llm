/**
 * Markdown Renderer
 * Handles rendering markdown content with syntax highlighting
 */

export class MarkdownRenderer {
    constructor() {
        // Check if marked.js is available
        if (typeof marked === 'undefined') {
            console.warn('marked.js not loaded, markdown rendering will be limited');
            this.markedAvailable = false;
        } else {
            this.markedAvailable = true;
            this.configureMarked();
        }
    }

    /**
     * Configure marked.js options
     */
    configureMarked() {
        if (!this.markedAvailable) return;

        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
    }

    /**
     * Render markdown to HTML
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string
     */
    render(markdown) {
        if (!markdown) return '';

        if (this.markedAvailable) {
            try {
                return marked.parse(markdown);
            } catch (error) {
                console.error('Error parsing markdown:', error);
                return this.escapeHtml(markdown);
            }
        }

        // Fallback: basic markdown rendering
        return this.basicMarkdownRender(markdown);
    }

    /**
     * Basic markdown rendering (fallback)
     * @param {string} text - Text to render
     * @returns {string} HTML string
     */
    basicMarkdownRender(text) {
        let html = this.escapeHtml(text);

        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render code block with language
     * @param {string} code - Code content
     * @param {string} language - Programming language
     * @returns {string} HTML string
     */
    renderCodeBlock(code, language = '') {
        const escapedCode = this.escapeHtml(code);
        const langClass = language ? ` class="language-${language}"` : '';
        return `<pre><code${langClass}>${escapedCode}</code></pre>`;
    }

    /**
     * Render table from markdown
     * @param {string} markdown - Table markdown
     * @returns {string} HTML table
     */
    renderTable(markdown) {
        if (this.markedAvailable) {
            return marked.parse(markdown);
        }

        // Basic table parsing
        const lines = markdown.trim().split('\n');
        if (lines.length < 2) return markdown;

        let html = '<table>';

        // Header
        const headers = lines[0].split('|').filter(h => h.trim());
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${this.escapeHtml(header.trim())}</th>`;
        });
        html += '</tr></thead>';

        // Body
        html += '<tbody>';
        for (let i = 2; i < lines.length; i++) {
            const cells = lines[i].split('|').filter(c => c.trim());
            html += '<tr>';
            cells.forEach(cell => {
                html += `<td>${this.escapeHtml(cell.trim())}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table>';

        return html;
    }

    /**
     * Strip markdown formatting
     * @param {string} markdown - Markdown text
     * @returns {string} Plain text
     */
    stripMarkdown(markdown) {
        if (!markdown) return '';

        let text = markdown;

        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/g, '');

        // Remove inline code
        text = text.replace(/`[^`]+`/g, '');

        // Remove bold/italic
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
        text = text.replace(/\*([^*]+)\*/g, '$1');

        // Remove links
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        // Remove headers
        text = text.replace(/^#+\s+/gm, '');

        return text.trim();
    }
}
