/**
 * WL-Field-Comment Web Component
 * Veld-niveau opmerkingen in de marge (zoals Word comments)
 */

import { formatRelativeTime, escapeHtml } from '../utils/helpers.js';
import { COMMENT_STATUS_LABELS, FEEDBACK_PERMISSIONS } from '../config.js';

class WLFieldComment extends HTMLElement {
    static get observedAttributes() {
        return ['field-path', 'field-label', 'form-id', 'user-role'];
    }

    constructor() {
        super();
        this._comments = [];
        this._isExpanded = false;
        this._currentUser = { name: 'Gebruiker', role: 'stakeholder' };
    }

    connectedCallback() {
        this.render();
        this.setupOutsideClickHandler();
    }

    disconnectedCallback() {
        this.removeOutsideClickHandler();
    }

    get comments() {
        return this._comments;
    }

    set comments(value) {
        this._comments = value || [];
        this.render();
    }

    get fieldPath() {
        return this.getAttribute('field-path') || '';
    }

    get fieldLabel() {
        return this.getAttribute('field-label') || '';
    }

    get formId() {
        return this.getAttribute('form-id') || '';
    }

    get userRole() {
        return this.getAttribute('user-role') || 'stakeholder';
    }

    set currentUser(user) {
        this._currentUser = user;
        this.render();
    }

    getPermissions() {
        return FEEDBACK_PERMISSIONS[this.userRole] || FEEDBACK_PERMISSIONS.stakeholder;
    }

    getOpenComments() {
        return this._comments.filter(c => c.status === 'open');
    }

    setupOutsideClickHandler() {
        this._outsideClickHandler = (e) => {
            if (this._isExpanded && !this.contains(e.target)) {
                this._isExpanded = false;
                this.render();
            }
        };
        document.addEventListener('click', this._outsideClickHandler);
    }

    removeOutsideClickHandler() {
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
        }
    }

    render() {
        const openCount = this.getOpenComments().length;
        const totalCount = this._comments.length;
        const hasComments = totalCount > 0;

        this.innerHTML = `
            <div class="field-comment-container">
                <button type="button"
                        class="field-comment-marker ${hasComments ? 'has-comments' : ''} ${openCount > 0 ? 'has-open' : ''}"
                        title="${openCount > 0 ? `${openCount} open opmerking${openCount > 1 ? 'en' : ''}` : (hasComments ? `${totalCount} opmerking${totalCount > 1 ? 'en' : ''}` : 'Voeg opmerking toe')}"
                        aria-label="Opmerkingen bij ${this.fieldLabel}">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                    </svg>
                    ${openCount > 0 ? `<span class="marker-count">${openCount}</span>` : ''}
                </button>

                <div class="field-comment-popover ${this._isExpanded ? 'visible' : ''}">
                    <div class="popover-header">
                        <span class="popover-title">Opmerkingen bij "${escapeHtml(this.fieldLabel)}"</span>
                        <button type="button" class="popover-close" aria-label="Sluiten">&times;</button>
                    </div>

                    <div class="popover-content">
                        ${this._comments.length > 0 ? `
                            <div class="field-comments-list">
                                ${this._comments.map(comment => this.renderComment(comment)).join('')}
                            </div>
                        ` : `
                            <p class="no-comments">Nog geen opmerkingen</p>
                        `}
                    </div>

                    <div class="popover-footer">
                        <textarea class="new-comment-input" placeholder="Nieuwe opmerking..." rows="2"></textarea>
                        <button type="button" class="btn btn-primary btn-sm add-field-comment-btn">Toevoegen</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    renderComment(comment) {
        const status = comment.status || 'open';
        const statusInfo = COMMENT_STATUS_LABELS[status] || COMMENT_STATUS_LABELS.open;
        const permissions = this.getPermissions();
        const isOwnComment = comment.author === this._currentUser.name;

        return `
            <div class="field-comment-item field-comment-${status}" data-comment-id="${comment.id}">
                <div class="field-comment-meta">
                    <span class="field-comment-author">${escapeHtml(comment.author || 'Anoniem')}</span>
                    <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
                </div>
                <div class="field-comment-time">${formatRelativeTime(comment.createdAt)}</div>
                <div class="field-comment-text">${escapeHtml(comment.text)}</div>

                ${status !== 'open' && comment.statusReason ? `
                    <div class="field-comment-reason">
                        <small>${escapeHtml(comment.statusReason)}</small>
                    </div>
                ` : ''}

                <div class="field-comment-actions">
                    ${status === 'open' && permissions.canResolve ? `
                        <button type="button" class="btn btn-success btn-xs status-btn" data-action="verwerkt" data-comment-id="${comment.id}">
                            Verwerk
                        </button>
                    ` : ''}
                    ${status === 'open' && permissions.canReject ? `
                        <button type="button" class="btn btn-secondary btn-xs status-btn" data-action="afgewezen" data-comment-id="${comment.id}">
                            Wijs af
                        </button>
                    ` : ''}
                    ${status !== 'open' && permissions.canReopen ? `
                        <button type="button" class="btn btn-outline btn-xs status-btn" data-action="open" data-comment-id="${comment.id}">
                            Heropen
                        </button>
                    ` : ''}
                    ${(isOwnComment && permissions.canDeleteOwnComments) || permissions.canDeleteAllComments ? `
                        <button type="button" class="btn btn-link btn-xs delete-field-comment" data-comment-id="${comment.id}">
                            Verwijderen
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupEvents() {
        // Toggle popover
        const marker = this.querySelector('.field-comment-marker');
        if (marker) {
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                this._isExpanded = !this._isExpanded;
                this.render();

                // Focus textarea when opening
                if (this._isExpanded) {
                    setTimeout(() => {
                        const textarea = this.querySelector('.new-comment-input');
                        if (textarea) textarea.focus();
                    }, 100);
                }
            });
        }

        // Close button
        const closeBtn = this.querySelector('.popover-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._isExpanded = false;
                this.render();
            });
        }

        // Prevent popover clicks from closing
        const popover = this.querySelector('.field-comment-popover');
        if (popover) {
            popover.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Add comment
        const addBtn = this.querySelector('.add-field-comment-btn');
        const textarea = this.querySelector('.new-comment-input');
        if (addBtn && textarea) {
            addBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                if (text) {
                    this.addComment(text);
                    textarea.value = '';
                }
            });

            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addBtn.click();
                }
            });
        }

        // Status buttons
        this.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.dataset.action;
                const commentId = e.target.dataset.commentId;

                if (action === 'verwerkt' || action === 'afgewezen') {
                    const reason = prompt(`Reden voor ${action === 'verwerkt' ? 'verwerking' : 'afwijzing'} (optioneel):`);
                    this.updateCommentStatus(commentId, action, reason);
                } else {
                    this.updateCommentStatus(commentId, action);
                }
            });
        });

        // Delete comment
        this.querySelectorAll('.delete-field-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Weet je zeker dat je deze opmerking wilt verwijderen?')) {
                    const commentId = e.target.dataset.commentId;
                    this.deleteComment(commentId);
                }
            });
        });
    }

    addComment(text) {
        const comment = {
            id: Date.now().toString(),
            type: 'field',
            sectionId: this.fieldPath.split('.')[0],
            fieldPath: this.fieldPath,
            text,
            status: 'open',
            statusChangedAt: null,
            statusChangedBy: null,
            statusReason: null,
            author: this._currentUser.name,
            authorRole: this._currentUser.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentCommentId: null,
            replies: []
        };

        this._comments.push(comment);
        this.render();

        this.dispatchEvent(new CustomEvent('field-comment-added', {
            detail: { comment, fieldPath: this.fieldPath },
            bubbles: true
        }));
    }

    updateCommentStatus(commentId, newStatus, reason = null) {
        const comment = this._comments.find(c => c.id === commentId);
        if (!comment) return;

        comment.status = newStatus;
        comment.statusChangedAt = new Date().toISOString();
        comment.statusChangedBy = this._currentUser.name;
        comment.statusReason = reason;
        comment.updatedAt = new Date().toISOString();

        this.render();

        this.dispatchEvent(new CustomEvent('field-comment-status-changed', {
            detail: {
                commentId,
                newStatus,
                reason,
                changedBy: this._currentUser.name,
                fieldPath: this.fieldPath
            },
            bubbles: true
        }));
    }

    deleteComment(commentId) {
        const index = this._comments.findIndex(c => c.id === commentId);
        if (index > -1) {
            const deleted = this._comments.splice(index, 1)[0];
            this.render();

            this.dispatchEvent(new CustomEvent('field-comment-deleted', {
                detail: { comment: deleted, fieldPath: this.fieldPath },
                bubbles: true
            }));
        }
    }

    getComments() {
        return this._comments;
    }

    setComments(comments) {
        this.comments = comments;
    }
}

customElements.define('wl-field-comment', WLFieldComment);

export default WLFieldComment;
