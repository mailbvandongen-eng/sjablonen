/**
 * WL-Workqueue Web Component
 * Toont werkvoorraad/backlog per rol met status badges en acties
 */

import { formatDate, escapeHtml } from '../utils/helpers.js';
import {
    INTAKE_STATUS_LABELS,
    USER_ROLES,
    USER_ROLE_LABELS,
    WORKQUEUE_CONFIG
} from '../config.js';

class WLWorkqueue extends HTMLElement {
    static get observedAttributes() {
        return ['role', 'user-id', 'title'];
    }

    constructor() {
        super();
        this._items = [];
        this._loading = false;
        this._sortField = 'updatedAt';
        this._sortDirection = 'desc';
        this._filter = 'all';
    }

    connectedCallback() {
        this.render();
    }

    get role() {
        return this.getAttribute('role') || USER_ROLES.IM;
    }

    set role(value) {
        this.setAttribute('role', value);
    }

    get userId() {
        return this.getAttribute('user-id') || null;
    }

    get title() {
        return this.getAttribute('title') ||
            WORKQUEUE_CONFIG[this.role]?.label ||
            'Werkvoorraad';
    }

    get items() {
        return this._items;
    }

    set items(value) {
        this._items = value || [];
        this.render();
    }

    get loading() {
        return this._loading;
    }

    set loading(value) {
        this._loading = value;
        this.render();
    }

    getConfig() {
        return WORKQUEUE_CONFIG[this.role] || WORKQUEUE_CONFIG[USER_ROLES.IM];
    }

    getFilteredItems() {
        let items = [...this._items];

        // Filter op status indien niet 'all'
        if (this._filter !== 'all') {
            items = items.filter(item => item.status === this._filter);
        }

        // Sorteer
        items.sort((a, b) => {
            let aVal = a[this._sortField];
            let bVal = b[this._sortField];

            // Date sorting
            if (this._sortField.includes('At') || this._sortField.includes('datum')) {
                aVal = new Date(aVal || 0);
                bVal = new Date(bVal || 0);
            }

            if (this._sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        return items;
    }

    countByStatus() {
        const counts = { all: this._items.length };
        const config = this.getConfig();

        config.statuses.forEach(status => {
            counts[status] = this._items.filter(i => i.status === status).length;
        });

        return counts;
    }

    render() {
        const config = this.getConfig();
        const items = this.getFilteredItems();
        const counts = this.countByStatus();

        this.innerHTML = `
            <div class="workqueue-container">
                <div class="workqueue-header">
                    <h2 class="workqueue-title">
                        ${escapeHtml(this.title)}
                        <span class="workqueue-count">${this._items.length}</span>
                    </h2>
                    <div class="workqueue-actions">
                        <button type="button" class="btn btn-outline btn-sm refresh-btn" title="Vernieuwen">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                </div>

                ${config.statuses.length > 1 ? `
                    <div class="workqueue-filters">
                        <button class="filter-btn ${this._filter === 'all' ? 'active' : ''}" data-filter="all">
                            Alle (${counts.all})
                        </button>
                        ${config.statuses.map(status => {
                            const info = INTAKE_STATUS_LABELS[status] || { label: status };
                            return `
                                <button class="filter-btn ${this._filter === status ? 'active' : ''}" data-filter="${status}">
                                    ${info.label} (${counts[status] || 0})
                                </button>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                <div class="workqueue-content">
                    ${this._loading ? `
                        <div class="workqueue-loading">
                            <div class="spinner"></div>
                            <p>Laden...</p>
                        </div>
                    ` : items.length > 0 ? `
                        <div class="workqueue-list">
                            ${items.map(item => this.renderItem(item)).join('')}
                        </div>
                    ` : `
                        <div class="workqueue-empty">
                            <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                            </svg>
                            <p>Geen items in de werkvoorraad</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        this.setupEvents();
    }

    renderItem(item) {
        const status = item.status || 'draft';
        const statusInfo = INTAKE_STATUS_LABELS[status] || { label: status, class: 'badge-secondary' };
        const title = item.basisinfo?.onderwerp || item.basisinfo?.titel || 'Zonder titel';
        const aanvrager = item.basisinfo?.aanvrager || 'Onbekend';
        const updatedAt = item.updatedAt ? formatDate(item.updatedAt, true) : '-';
        const createdAt = item.createdAt ? formatDate(item.createdAt) : '-';

        // Bepaal prioriteit indicator
        const prioriteit = item.vragen?.prioriteitCategorie || '';
        let prioriteitClass = '';
        if (prioriteit.toLowerCase().includes('hoog') || prioriteit.toLowerCase().includes('urgent')) {
            prioriteitClass = 'priority-high';
        } else if (prioriteit.toLowerCase().includes('laag')) {
            prioriteitClass = 'priority-low';
        }

        // Bepaal of er ongelezen opmerkingen zijn
        const openComments = (item.comments || []).filter(c => c.status === 'open').length;

        return `
            <div class="workqueue-item ${prioriteitClass}" data-form-id="${item.id}">
                <div class="workqueue-item-main">
                    <div class="workqueue-item-title">
                        <a href="#/form/intakeformulier/${item.id}" class="workqueue-item-link">
                            ${escapeHtml(title)}
                        </a>
                        ${openComments > 0 ? `
                            <span class="comment-indicator" title="${openComments} open opmerking${openComments > 1 ? 'en' : ''}">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                                </svg>
                                ${openComments}
                            </span>
                        ` : ''}
                    </div>
                    <div class="workqueue-item-meta">
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                            </svg>
                            ${escapeHtml(aanvrager)}
                        </span>
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                            </svg>
                            ${createdAt}
                        </span>
                    </div>
                </div>
                <div class="workqueue-item-status">
                    <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
                </div>
                <div class="workqueue-item-actions">
                    <button type="button" class="btn btn-sm btn-primary open-btn" data-form-id="${item.id}" title="Openen">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    setupEvents() {
        // Refresh button
        const refreshBtn = this.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
            });
        }

        // Filter buttons
        this.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._filter = e.target.dataset.filter;
                this.render();
            });
        });

        // Open buttons
        this.querySelectorAll('.open-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const formId = e.currentTarget.dataset.formId;
                this.dispatchEvent(new CustomEvent('open-form', {
                    detail: { formId },
                    bubbles: true
                }));
            });
        });

        // Click on item row
        this.querySelectorAll('.workqueue-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on button or link
                if (e.target.closest('button') || e.target.closest('a')) return;

                const formId = item.dataset.formId;
                this.dispatchEvent(new CustomEvent('open-form', {
                    detail: { formId },
                    bubbles: true
                }));
            });
        });

        // Sort headers (if we add them)
        this.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => {
                const field = e.target.dataset.sort;
                if (this._sortField === field) {
                    this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this._sortField = field;
                    this._sortDirection = 'desc';
                }
                this.render();
            });
        });
    }

    refresh() {
        this.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
    }

    setItems(items) {
        this.items = items;
    }
}

customElements.define('wl-workqueue', WLWorkqueue);

export default WLWorkqueue;
