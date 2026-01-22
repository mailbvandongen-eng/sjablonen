/**
 * WL-Track-Changes Web Component
 * Inline weergave van wijzigingen (track changes zoals in Word)
 * Toont doorgestreepte tekst voor verwijderingen en onderstreepte groene tekst voor toevoegingen
 */

import { escapeHtml, formatRelativeTime } from '../utils/helpers.js';
import { FEEDBACK_PERMISSIONS, TRACK_CHANGE_STATUS } from '../config.js';

class WLTrackChanges extends HTMLElement {
    static get observedAttributes() {
        return ['field-path', 'show-changes', 'user-role'];
    }

    constructor() {
        super();
        this._changes = [];
        this._originalValue = '';
        this._currentValue = '';
        this._showChanges = true;
        this._currentUser = { name: 'Gebruiker', role: 'stakeholder' };
    }

    connectedCallback() {
        this.render();
    }

    get changes() {
        return this._changes;
    }

    set changes(value) {
        this._changes = value || [];
        this.render();
    }

    get fieldPath() {
        return this.getAttribute('field-path') || '';
    }

    get showChanges() {
        return this.getAttribute('show-changes') !== 'false';
    }

    set showChanges(value) {
        this._showChanges = value;
        this.setAttribute('show-changes', value ? 'true' : 'false');
        this.render();
    }

    get userRole() {
        return this.getAttribute('user-role') || 'stakeholder';
    }

    set originalValue(value) {
        this._originalValue = value || '';
        this.render();
    }

    set currentValue(value) {
        this._currentValue = value || '';
        this.render();
    }

    set currentUser(user) {
        this._currentUser = user;
        this.render();
    }

    getPermissions() {
        return FEEDBACK_PERMISSIONS[this.userRole] || FEEDBACK_PERMISSIONS.stakeholder;
    }

    getPendingChanges() {
        return this._changes.filter(c => c.status === 'pending');
    }

    render() {
        const pendingCount = this.getPendingChanges().length;
        const permissions = this.getPermissions();
        const canReview = permissions.canAcceptChanges || permissions.canRejectChanges;

        this.innerHTML = `
            <div class="track-changes-container">
                ${pendingCount > 0 ? `
                    <div class="track-changes-toolbar">
                        <label class="toggle-changes-label">
                            <input type="checkbox" class="toggle-changes-checkbox" ${this._showChanges ? 'checked' : ''}>
                            Toon wijzigingen
                        </label>
                        <span class="pending-count">${pendingCount} wijziging${pendingCount > 1 ? 'en' : ''} te beoordelen</span>
                        ${canReview ? `
                            <div class="track-actions">
                                <button type="button" class="btn btn-success btn-sm accept-all-btn">
                                    Accepteer alle
                                </button>
                                <button type="button" class="btn btn-secondary btn-sm reject-all-btn">
                                    Wijs alle af
                                </button>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="track-changes-content">
                    ${this._showChanges && pendingCount > 0 ? this.renderWithChanges() : this.renderCurrentValue()}
                </div>

                ${pendingCount > 0 ? `
                    <div class="track-changes-list">
                        ${this._changes.filter(c => c.status === 'pending').map(change => this.renderChange(change)).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.setupEvents();
    }

    renderCurrentValue() {
        return `<div class="current-value">${escapeHtml(this._currentValue || '')}</div>`;
    }

    renderWithChanges() {
        const pendingChanges = this.getPendingChanges();
        if (pendingChanges.length === 0) {
            return this.renderCurrentValue();
        }

        // Simple diff rendering for full field replacement
        const latestChange = pendingChanges[pendingChanges.length - 1];

        if (latestChange.changeType === 'replace') {
            return `
                <div class="track-changes-diff">
                    ${latestChange.originalValue ? `
                        <del class="track-delete" title="Verwijderd door ${escapeHtml(latestChange.author)}">${escapeHtml(latestChange.originalValue)}</del>
                    ` : ''}
                    ${latestChange.newValue ? `
                        <ins class="track-insert" title="Toegevoegd door ${escapeHtml(latestChange.author)}">${escapeHtml(latestChange.newValue)}</ins>
                    ` : ''}
                </div>
            `;
        } else if (latestChange.changeType === 'insert') {
            return `
                <div class="track-changes-diff">
                    <ins class="track-insert" title="Toegevoegd door ${escapeHtml(latestChange.author)}">${escapeHtml(latestChange.newValue)}</ins>
                </div>
            `;
        } else if (latestChange.changeType === 'delete') {
            return `
                <div class="track-changes-diff">
                    <del class="track-delete" title="Verwijderd door ${escapeHtml(latestChange.author)}">${escapeHtml(latestChange.originalValue)}</del>
                </div>
            `;
        }

        return this.renderCurrentValue();
    }

    renderChange(change) {
        const permissions = this.getPermissions();
        const canReview = permissions.canAcceptChanges || permissions.canRejectChanges;

        return `
            <div class="track-change-item" data-change-id="${change.id}">
                <div class="track-change-meta">
                    <span class="track-change-author">${escapeHtml(change.author || 'Anoniem')}</span>
                    <span class="track-change-time">${formatRelativeTime(change.createdAt)}</span>
                    <span class="track-change-type">${this.getChangeTypeLabel(change.changeType)}</span>
                </div>
                <div class="track-change-preview">
                    ${change.originalValue ? `
                        <span class="change-from">${escapeHtml(this.truncate(change.originalValue, 50))}</span>
                    ` : ''}
                    ${change.originalValue && change.newValue ? '<span class="change-arrow">→</span>' : ''}
                    ${change.newValue ? `
                        <span class="change-to">${escapeHtml(this.truncate(change.newValue, 50))}</span>
                    ` : ''}
                </div>
                ${canReview ? `
                    <div class="track-change-actions">
                        <button type="button" class="btn btn-success btn-xs accept-change-btn" data-change-id="${change.id}">
                            Accepteer
                        </button>
                        <button type="button" class="btn btn-secondary btn-xs reject-change-btn" data-change-id="${change.id}">
                            Wijs af
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getChangeTypeLabel(type) {
        const labels = {
            'insert': 'Toegevoegd',
            'delete': 'Verwijderd',
            'replace': 'Gewijzigd'
        };
        return labels[type] || type;
    }

    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    setupEvents() {
        // Toggle show changes
        const toggleCheckbox = this.querySelector('.toggle-changes-checkbox');
        if (toggleCheckbox) {
            toggleCheckbox.addEventListener('change', (e) => {
                this._showChanges = e.target.checked;
                this.render();
            });
        }

        // Accept all
        const acceptAllBtn = this.querySelector('.accept-all-btn');
        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', () => {
                if (confirm('Weet je zeker dat je alle wijzigingen wilt accepteren?')) {
                    this.acceptAllChanges();
                }
            });
        }

        // Reject all
        const rejectAllBtn = this.querySelector('.reject-all-btn');
        if (rejectAllBtn) {
            rejectAllBtn.addEventListener('click', () => {
                if (confirm('Weet je zeker dat je alle wijzigingen wilt afwijzen?')) {
                    this.rejectAllChanges();
                }
            });
        }

        // Accept single change
        this.querySelectorAll('.accept-change-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const changeId = e.target.dataset.changeId;
                this.acceptChange(changeId);
            });
        });

        // Reject single change
        this.querySelectorAll('.reject-change-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const changeId = e.target.dataset.changeId;
                this.rejectChange(changeId);
            });
        });
    }

    addChange(originalValue, newValue, author = null, authorRole = null) {
        let changeType = 'replace';
        if (!originalValue && newValue) changeType = 'insert';
        else if (originalValue && !newValue) changeType = 'delete';

        const change = {
            id: Date.now().toString(),
            fieldPath: this.fieldPath,
            changeType,
            originalValue: originalValue || '',
            newValue: newValue || '',
            status: 'pending',
            author: author || this._currentUser.name,
            authorRole: authorRole || this._currentUser.role,
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null
        };

        this._changes.push(change);
        this.render();

        this.dispatchEvent(new CustomEvent('track-change-added', {
            detail: { change, fieldPath: this.fieldPath },
            bubbles: true
        }));

        return change;
    }

    acceptChange(changeId) {
        const change = this._changes.find(c => c.id === changeId);
        if (!change || change.status !== 'pending') return;

        change.status = 'accepted';
        change.reviewedAt = new Date().toISOString();
        change.reviewedBy = this._currentUser.name;

        // Apply the change
        this._currentValue = change.newValue;

        this.render();

        this.dispatchEvent(new CustomEvent('track-change-accepted', {
            detail: {
                change,
                fieldPath: this.fieldPath,
                newValue: change.newValue
            },
            bubbles: true
        }));
    }

    rejectChange(changeId) {
        const change = this._changes.find(c => c.id === changeId);
        if (!change || change.status !== 'pending') return;

        change.status = 'rejected';
        change.reviewedAt = new Date().toISOString();
        change.reviewedBy = this._currentUser.name;

        // Restore original value
        this._currentValue = change.originalValue;

        this.render();

        this.dispatchEvent(new CustomEvent('track-change-rejected', {
            detail: {
                change,
                fieldPath: this.fieldPath,
                restoredValue: change.originalValue
            },
            bubbles: true
        }));
    }

    acceptAllChanges() {
        const pendingChanges = this.getPendingChanges();
        pendingChanges.forEach(change => {
            change.status = 'accepted';
            change.reviewedAt = new Date().toISOString();
            change.reviewedBy = this._currentUser.name;
        });

        // Apply the last change's new value
        if (pendingChanges.length > 0) {
            this._currentValue = pendingChanges[pendingChanges.length - 1].newValue;
        }

        this.render();

        this.dispatchEvent(new CustomEvent('track-changes-all-accepted', {
            detail: {
                changes: pendingChanges,
                fieldPath: this.fieldPath,
                finalValue: this._currentValue
            },
            bubbles: true
        }));
    }

    rejectAllChanges() {
        const pendingChanges = this.getPendingChanges();
        pendingChanges.forEach(change => {
            change.status = 'rejected';
            change.reviewedAt = new Date().toISOString();
            change.reviewedBy = this._currentUser.name;
        });

        // Restore the original value from the first change
        if (pendingChanges.length > 0) {
            this._currentValue = pendingChanges[0].originalValue;
        }

        this.render();

        this.dispatchEvent(new CustomEvent('track-changes-all-rejected', {
            detail: {
                changes: pendingChanges,
                fieldPath: this.fieldPath,
                restoredValue: this._currentValue
            },
            bubbles: true
        }));
    }

    getChanges() {
        return this._changes;
    }

    setChanges(changes) {
        this.changes = changes;
    }
}

customElements.define('wl-track-changes', WLTrackChanges);

export default WLTrackChanges;
