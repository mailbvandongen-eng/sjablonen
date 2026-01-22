/**
 * WL-Comment-Sidebar Web Component
 * Zijpaneel met overzicht van alle opmerkingen in het formulier
 */

import { formatRelativeTime, escapeHtml } from '../utils/helpers.js';
import { COMMENT_STATUS_LABELS } from '../config.js';

class WLCommentSidebar extends HTMLElement {
    static get observedAttributes() {
        return ['visible'];
    }

    constructor() {
        super();
        this._comments = [];
        this._trackChanges = [];
        this._isVisible = false;
        this._filter = 'all'; // all, open, verwerkt, afgewezen
        this._sectionLabels = {};
    }

    connectedCallback() {
        this.render();
    }

    get comments() {
        return this._comments;
    }

    set comments(value) {
        this._comments = value || [];
        this.render();
    }

    get trackChanges() {
        return this._trackChanges;
    }

    set trackChanges(value) {
        this._trackChanges = value || [];
        this.render();
    }

    get isVisible() {
        return this._isVisible;
    }

    set isVisible(value) {
        this._isVisible = value;
        this.setAttribute('visible', value ? 'true' : 'false');
        this.render();
    }

    set sectionLabels(labels) {
        this._sectionLabels = labels || {};
    }

    toggle() {
        this.isVisible = !this._isVisible;
    }

    show() {
        this.isVisible = true;
    }

    hide() {
        this.isVisible = false;
    }

    getFilteredComments() {
        if (this._filter === 'all') {
            return this._comments;
        }
        return this._comments.filter(c => c.status === this._filter);
    }

    countByStatus(status) {
        return this._comments.filter(c => c.status === status).length;
    }

    countPendingChanges() {
        return this._trackChanges.filter(c => c.status === 'pending').length;
    }

    groupBySection(comments) {
        const grouped = {};
        comments.forEach(comment => {
            const section = comment.sectionId || 'algemeen';
            if (!grouped[section]) {
                grouped[section] = [];
            }
            grouped[section].push(comment);
        });
        return grouped;
    }

    getSectionLabel(sectionId) {
        return this._sectionLabels[sectionId] || sectionId;
    }

    render() {
        const filteredComments = this.getFilteredComments();
        const groupedComments = this.groupBySection(filteredComments);
        const openCount = this.countByStatus('open');
        const pendingChangesCount = this.countPendingChanges();

        this.innerHTML = `
            <aside class="comment-sidebar ${this._isVisible ? 'visible' : ''}">
                <div class="sidebar-header">
                    <h3>
                        Opmerkingen
                        ${openCount > 0 ? `<span class="sidebar-badge">${openCount}</span>` : ''}
                    </h3>
                    <button type="button" class="sidebar-close" aria-label="Sluiten">&times;</button>
                </div>

                <div class="sidebar-filters">
                    <button class="filter-btn ${this._filter === 'all' ? 'active' : ''}" data-filter="all">
                        Alle (${this._comments.length})
                    </button>
                    <button class="filter-btn ${this._filter === 'open' ? 'active' : ''}" data-filter="open">
                        Open (${this.countByStatus('open')})
                    </button>
                    <button class="filter-btn ${this._filter === 'verwerkt' ? 'active' : ''}" data-filter="verwerkt">
                        Verwerkt (${this.countByStatus('verwerkt')})
                    </button>
                </div>

                ${pendingChangesCount > 0 ? `
                    <div class="sidebar-changes-summary">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                        </svg>
                        ${pendingChangesCount} wijziging${pendingChangesCount > 1 ? 'en' : ''} te beoordelen
                    </div>
                ` : ''}

                <div class="sidebar-content">
                    ${Object.keys(groupedComments).length > 0 ? `
                        ${Object.entries(groupedComments).map(([sectionId, sectionComments]) => `
                            <div class="sidebar-section">
                                <h4 class="sidebar-section-title">${escapeHtml(this.getSectionLabel(sectionId))}</h4>
                                <div class="sidebar-comments">
                                    ${sectionComments.map(comment => this.renderSidebarComment(comment)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    ` : `
                        <div class="sidebar-empty">
                            <p>Geen opmerkingen ${this._filter !== 'all' ? 'met deze filter' : ''}</p>
                        </div>
                    `}
                </div>
            </aside>

            <div class="sidebar-overlay ${this._isVisible ? 'visible' : ''}"></div>
        `;

        this.setupEvents();
    }

    renderSidebarComment(comment) {
        const status = comment.status || 'open';
        const statusInfo = COMMENT_STATUS_LABELS[status] || COMMENT_STATUS_LABELS.open;
        const isFieldComment = comment.type === 'field';
        const repliesCount = (comment.replies || []).length;

        return `
            <div class="sidebar-comment sidebar-comment-${status}" data-comment-id="${comment.id}" data-field-path="${comment.fieldPath || ''}">
                <div class="sidebar-comment-header">
                    <span class="sidebar-comment-author">${escapeHtml(comment.author || 'Anoniem')}</span>
                    <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
                </div>
                ${isFieldComment && comment.fieldPath ? `
                    <div class="sidebar-comment-field">
                        <small>Bij: ${escapeHtml(this.getFieldLabel(comment.fieldPath))}</small>
                    </div>
                ` : ''}
                <div class="sidebar-comment-text">${escapeHtml(this.truncate(comment.text, 100))}</div>
                <div class="sidebar-comment-footer">
                    <span class="sidebar-comment-time">${formatRelativeTime(comment.createdAt)}</span>
                    ${repliesCount > 0 ? `<span class="sidebar-comment-replies">${repliesCount} reactie${repliesCount > 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
        `;
    }

    getFieldLabel(fieldPath) {
        // Try to get a human-readable label from the field path
        // This can be extended with a field labels map
        if (!fieldPath) return '';
        const parts = fieldPath.split('.');
        return parts[parts.length - 1];
    }

    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    setupEvents() {
        // Close sidebar
        const closeBtn = this.querySelector('.sidebar-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close on overlay click
        const overlay = this.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hide();
            });
        }

        // Filter buttons
        this.querySelectorAll('.sidebar-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._filter = e.target.dataset.filter;
                this.render();
            });
        });

        // Click on comment to navigate
        this.querySelectorAll('.sidebar-comment').forEach(commentEl => {
            commentEl.addEventListener('click', () => {
                const commentId = commentEl.dataset.commentId;
                const fieldPath = commentEl.dataset.fieldPath;
                this.navigateToComment(commentId, fieldPath);
            });
        });

        // Keyboard navigation
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    navigateToComment(commentId, fieldPath) {
        // Try to find and highlight the relevant element
        let targetElement = null;

        if (fieldPath) {
            // Find element by field path
            targetElement = document.querySelector(`[data-field-path="${fieldPath}"]`);
        }

        if (!targetElement) {
            // Try to find by comment id
            targetElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        }

        if (targetElement) {
            // Scroll into view
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Highlight temporarily
            targetElement.classList.add('highlight-field');
            setTimeout(() => {
                targetElement.classList.remove('highlight-field');
            }, 2000);

            // Dispatch event for external handling
            this.dispatchEvent(new CustomEvent('navigate-to-comment', {
                detail: { commentId, fieldPath, element: targetElement },
                bubbles: true
            }));
        }
    }

    setComments(comments) {
        this.comments = comments;
    }

    setTrackChanges(changes) {
        this.trackChanges = changes;
    }

    updateComment(commentId, updates) {
        const comment = this._comments.find(c => c.id === commentId);
        if (comment) {
            Object.assign(comment, updates);
            this.render();
        }
    }

    removeComment(commentId) {
        const index = this._comments.findIndex(c => c.id === commentId);
        if (index > -1) {
            this._comments.splice(index, 1);
            this.render();
        }
    }
}

customElements.define('wl-comment-sidebar', WLCommentSidebar);

export default WLCommentSidebar;
