/**
 * WL-Comment-Panel Web Component
 * Commentaar/notities panel voor formuliersecties
 * Met status workflow (Open/Verwerkt/Afgewezen) en threading
 */

import { formatRelativeTime, escapeHtml } from '../utils/helpers.js';
import { COMMENT_STATUS, COMMENT_STATUS_LABELS, FEEDBACK_PERMISSIONS } from '../config.js';

class WLCommentPanel extends HTMLElement {
    static get observedAttributes() {
        return ['section-id', 'form-id', 'user-role'];
    }

    constructor() {
        super();
        this._comments = [];
        this._expanded = false;
        this._filter = 'all'; // all, open, verwerkt, afgewezen
        this._replyingTo = null;
        this._currentUser = { name: 'Gebruiker', role: 'stakeholder' };
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

    get sectionId() {
        return this.getAttribute('section-id') || '';
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

    getFilteredComments() {
        if (this._filter === 'all') {
            return this._comments;
        }
        return this._comments.filter(c => c.status === this._filter);
    }

    countByStatus(status) {
        return this._comments.filter(c => c.status === status).length;
    }

    render() {
        const filteredComments = this.getFilteredComments();
        const totalCount = this._comments.length;
        const openCount = this.countByStatus('open');

        this.innerHTML = `
            <div class="comment-panel">
                <div class="comment-header">
                    <button type="button" class="comment-toggle ${this._expanded ? 'expanded' : ''}" aria-expanded="${this._expanded}">
                        <span class="comment-title">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                            </svg>
                            Opmerkingen
                            ${totalCount > 0 ? `<span class="comment-count">${totalCount}</span>` : ''}
                            ${openCount > 0 ? `<span class="comment-count-open" title="${openCount} open">${openCount}</span>` : ''}
                        </span>
                        <svg class="toggle-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
                <div class="comment-content" style="display: ${this._expanded ? 'block' : 'none'}">
                    ${totalCount > 0 ? this.renderFilters() : ''}
                    ${filteredComments.length > 0 ? `
                        <div class="comments-list">
                            ${filteredComments.map(comment => this.renderComment(comment)).join('')}
                        </div>
                    ` : `
                        <p class="text-muted" style="font-size: var(--wl-font-size-sm); padding: 8px 0;">
                            ${totalCount > 0 ? 'Geen opmerkingen met deze filter' : 'Nog geen opmerkingen'}
                        </p>
                    `}
                    <div class="comment-form">
                        <textarea placeholder="Voeg een opmerking toe..." rows="2"></textarea>
                        <button type="button" class="btn btn-primary btn-sm add-comment-btn">Toevoegen</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    renderFilters() {
        const openCount = this.countByStatus('open');
        const verwerktCount = this.countByStatus('verwerkt');
        const afgewezenCount = this.countByStatus('afgewezen');

        return `
            <div class="comment-filters">
                <button class="filter-btn ${this._filter === 'all' ? 'active' : ''}" data-filter="all">
                    Alle (${this._comments.length})
                </button>
                <button class="filter-btn ${this._filter === 'open' ? 'active' : ''}" data-filter="open">
                    Open (${openCount})
                </button>
                <button class="filter-btn ${this._filter === 'verwerkt' ? 'active' : ''}" data-filter="verwerkt">
                    Verwerkt (${verwerktCount})
                </button>
                <button class="filter-btn ${this._filter === 'afgewezen' ? 'active' : ''}" data-filter="afgewezen">
                    Afgewezen (${afgewezenCount})
                </button>
            </div>
        `;
    }

    renderComment(comment) {
        const status = comment.status || 'open';
        const statusInfo = COMMENT_STATUS_LABELS[status] || COMMENT_STATUS_LABELS['open'];
        const permissions = this.getPermissions();
        const isOwnComment = comment.author === this._currentUser.name;
        const replies = comment.replies || [];

        return `
            <div class="comment-item comment-${status}" data-comment-id="${comment.id}">
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(comment.author || 'Anoniem')}</span>
                    ${comment.authorRole ? `<span class="comment-role">${this.getRoleLabel(comment.authorRole)}</span>` : ''}
                    <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
                    <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>

                ${status !== 'open' && comment.statusReason ? `
                    <div class="comment-status-reason">
                        <small><strong>${status === 'verwerkt' ? 'Verwerkt' : 'Afgewezen'} door ${escapeHtml(comment.statusChangedBy || '')}:</strong> ${escapeHtml(comment.statusReason)}</small>
                    </div>
                ` : ''}

                <div class="comment-actions">
                    ${this.renderStatusActions(comment, permissions)}
                    <button type="button" class="btn btn-link btn-sm reply-btn" data-comment-id="${comment.id}">
                        Reageer
                    </button>
                    ${(isOwnComment && permissions.canDeleteOwnComments) || permissions.canDeleteAllComments ? `
                        <button type="button" class="btn btn-link btn-sm delete-comment" data-comment-id="${comment.id}">
                            Verwijderen
                        </button>
                    ` : ''}
                </div>

                ${this._replyingTo === comment.id ? this.renderReplyForm(comment.id) : ''}

                ${replies.length > 0 ? `
                    <div class="comment-replies">
                        ${replies.map(reply => this.renderReply(reply, comment.id)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderReply(reply, parentId) {
        const permissions = this.getPermissions();
        const isOwnReply = reply.author === this._currentUser.name;

        return `
            <div class="comment-reply" data-reply-id="${reply.id}" data-parent-id="${parentId}">
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(reply.author || 'Anoniem')}</span>
                    ${reply.authorRole ? `<span class="comment-role">${this.getRoleLabel(reply.authorRole)}</span>` : ''}
                    <span class="comment-time">${formatRelativeTime(reply.createdAt)}</span>
                </div>
                <div class="comment-text">${escapeHtml(reply.text)}</div>
                ${(isOwnReply && permissions.canDeleteOwnComments) || permissions.canDeleteAllComments ? `
                    <button type="button" class="btn btn-link btn-sm delete-reply" data-reply-id="${reply.id}" data-parent-id="${parentId}">
                        Verwijderen
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderReplyForm(commentId) {
        return `
            <div class="reply-form" data-parent-id="${commentId}">
                <textarea placeholder="Schrijf een reactie..." rows="2"></textarea>
                <div class="reply-form-actions">
                    <button type="button" class="btn btn-primary btn-sm submit-reply-btn">Reageer</button>
                    <button type="button" class="btn btn-secondary btn-sm cancel-reply-btn">Annuleren</button>
                </div>
            </div>
        `;
    }

    renderStatusActions(comment, permissions) {
        const status = comment.status || 'open';
        let actions = '';

        if (status === 'open') {
            if (permissions.canResolve) {
                actions += `<button type="button" class="btn btn-success btn-sm status-btn" data-action="verwerkt" data-comment-id="${comment.id}">Verwerk</button>`;
            }
            if (permissions.canReject) {
                actions += `<button type="button" class="btn btn-secondary btn-sm status-btn" data-action="afgewezen" data-comment-id="${comment.id}">Wijs af</button>`;
            }
        } else if (permissions.canReopen) {
            actions += `<button type="button" class="btn btn-outline btn-sm status-btn" data-action="open" data-comment-id="${comment.id}">Heropen</button>`;
        }

        return actions;
    }

    getRoleLabel(role) {
        const labels = {
            'IM': 'Informatiemanager',
            'informatiemanager': 'Informatiemanager',
            'BA': 'Business Analist',
            'business_analist': 'Business Analist',
            'stakeholder': 'Stakeholder',
            'klant': 'Klant'
        };
        return labels[role] || role;
    }

    setupEvents() {
        // Toggle expanded state
        const toggleBtn = this.querySelector('.comment-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this._expanded = !this._expanded;
                this.render();
            });
        }

        // Filter buttons
        this.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._filter = e.target.dataset.filter;
                this.render();
            });
        });

        // Add comment
        const addBtn = this.querySelector('.add-comment-btn');
        const textarea = this.querySelector('.comment-form textarea');
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

        // Reply buttons
        this.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._replyingTo = e.target.dataset.commentId;
                this.render();
            });
        });

        // Cancel reply
        this.querySelectorAll('.cancel-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._replyingTo = null;
                this.render();
            });
        });

        // Submit reply
        this.querySelectorAll('.submit-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const form = e.target.closest('.reply-form');
                const parentId = form.dataset.parentId;
                const textarea = form.querySelector('textarea');
                const text = textarea.value.trim();

                if (text) {
                    this.addReply(parentId, text);
                    this._replyingTo = null;
                    this.render();
                }
            });
        });

        // Delete comment
        this.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Weet je zeker dat je deze opmerking wilt verwijderen?')) {
                    const commentId = e.target.dataset.commentId;
                    this.deleteComment(commentId);
                }
            });
        });

        // Delete reply
        this.querySelectorAll('.delete-reply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) {
                    const replyId = e.target.dataset.replyId;
                    const parentId = e.target.dataset.parentId;
                    this.deleteReply(parentId, replyId);
                }
            });
        });
    }

    addComment(text, author = null, authorRole = null) {
        const comment = {
            id: Date.now().toString(),
            type: 'section',
            sectionId: this.sectionId,
            fieldPath: null,
            text,
            status: 'open',
            statusChangedAt: null,
            statusChangedBy: null,
            statusReason: null,
            author: author || this._currentUser.name,
            authorRole: authorRole || this._currentUser.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentCommentId: null,
            replies: []
        };

        this._comments.push(comment);
        this.render();

        this.dispatchEvent(new CustomEvent('comment-added', {
            detail: { comment, sectionId: this.sectionId },
            bubbles: true
        }));
    }

    addReply(parentCommentId, text) {
        const parentComment = this._comments.find(c => c.id === parentCommentId);
        if (!parentComment) return;

        const reply = {
            id: Date.now().toString(),
            text,
            author: this._currentUser.name,
            authorRole: this._currentUser.role,
            createdAt: new Date().toISOString(),
            parentCommentId
        };

        if (!parentComment.replies) {
            parentComment.replies = [];
        }
        parentComment.replies.push(reply);
        parentComment.updatedAt = new Date().toISOString();

        this.dispatchEvent(new CustomEvent('reply-added', {
            detail: { reply, parentCommentId, sectionId: this.sectionId },
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

        this.dispatchEvent(new CustomEvent('comment-status-changed', {
            detail: {
                commentId,
                newStatus,
                reason,
                changedBy: this._currentUser.name,
                sectionId: this.sectionId
            },
            bubbles: true
        }));
    }

    deleteComment(commentId) {
        const index = this._comments.findIndex(c => c.id === commentId);
        if (index > -1) {
            const deleted = this._comments.splice(index, 1)[0];
            this.render();

            this.dispatchEvent(new CustomEvent('comment-deleted', {
                detail: { comment: deleted, sectionId: this.sectionId },
                bubbles: true
            }));
        }
    }

    deleteReply(parentCommentId, replyId) {
        const parentComment = this._comments.find(c => c.id === parentCommentId);
        if (!parentComment || !parentComment.replies) return;

        const index = parentComment.replies.findIndex(r => r.id === replyId);
        if (index > -1) {
            const deleted = parentComment.replies.splice(index, 1)[0];
            parentComment.updatedAt = new Date().toISOString();
            this.render();

            this.dispatchEvent(new CustomEvent('reply-deleted', {
                detail: { reply: deleted, parentCommentId, sectionId: this.sectionId },
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

customElements.define('wl-comment-panel', WLCommentPanel);

export default WLCommentPanel;
