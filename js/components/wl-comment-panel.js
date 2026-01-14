/**
 * WL-Comment-Panel Web Component
 * Commentaar/notities panel voor formuliersecties
 */

import { formatRelativeTime, escapeHtml } from '../utils/helpers.js';

class WLCommentPanel extends HTMLElement {
    static get observedAttributes() {
        return ['section-id', 'form-id'];
    }

    constructor() {
        super();
        this._comments = [];
        this._expanded = false;
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

    render() {
        const commentCount = this._comments.length;

        this.innerHTML = `
            <div class="comment-header">
                <button type="button" class="comment-toggle ${this._expanded ? 'expanded' : ''}" aria-expanded="${this._expanded}">
                    <span class="comment-title">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                        </svg>
                        Notities
                        ${commentCount > 0 ? `<span class="comment-count">${commentCount}</span>` : ''}
                    </span>
                    <svg class="toggle-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="comment-content" style="display: ${this._expanded ? 'block' : 'none'}">
                ${commentCount > 0 ? `
                    <div class="comments-list">
                        ${this._comments.map(comment => this.renderComment(comment)).join('')}
                    </div>
                ` : `
                    <p class="text-muted" style="font-size: var(--wl-font-size-sm);">Nog geen notities</p>
                `}
                <div class="comment-form">
                    <textarea placeholder="Voeg een notitie toe..." rows="2"></textarea>
                    <button type="button" class="btn btn-primary btn-sm add-comment-btn">Toevoegen</button>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    renderComment(comment) {
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(comment.author || 'Anoniem')}</span>
                    <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <button type="button" class="btn btn-sm delete-comment" style="margin-top: var(--wl-spacing-xs); padding: 2px 8px; font-size: 0.75rem;">Verwijderen</button>
            </div>
        `;
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

            // Enter to submit (Shift+Enter for new line)
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addBtn.click();
                }
            });
        }

        // Delete comment
        this.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.comment-item');
                const commentId = item.dataset.commentId;
                this.deleteComment(commentId);
            });
        });
    }

    addComment(text, author = 'Gebruiker') {
        const comment = {
            id: Date.now().toString(),
            sectionId: this.sectionId,
            text,
            author,
            createdAt: new Date().toISOString(),
            resolved: false
        };

        this._comments.push(comment);
        this.render();

        this.dispatchEvent(new CustomEvent('comment-added', {
            detail: { comment, sectionId: this.sectionId },
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

    getComments() {
        return this._comments;
    }

    setComments(comments) {
        this.comments = comments;
    }
}

customElements.define('wl-comment-panel', WLCommentPanel);

export default WLCommentPanel;
