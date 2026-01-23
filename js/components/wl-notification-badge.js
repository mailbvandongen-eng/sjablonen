/**
 * WL-Notification-Badge Web Component
 * Notificatie icoon met dropdown voor in-app notificaties
 */

import { formatRelativeTime, escapeHtml } from '../utils/helpers.js';
import notificationService from '../services/NotificationService.js';

class WLNotificationBadge extends HTMLElement {
    static get observedAttributes() {
        return ['user-id'];
    }

    constructor() {
        super();
        this._notifications = [];
        this._isOpen = false;
        this._unsubscribe = null;
    }

    connectedCallback() {
        // Abonneer op notificatie wijzigingen
        this._unsubscribe = notificationService.subscribe(() => {
            this.loadNotifications();
        });

        // Initieel laden
        this.loadNotifications();

        // Luister naar nieuwe notificaties
        window.addEventListener('wl-notification-created', this._handleNewNotification.bind(this));

        // Sluit dropdown bij klik buiten
        document.addEventListener('click', this._handleOutsideClick.bind(this));
    }

    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        window.removeEventListener('wl-notification-created', this._handleNewNotification.bind(this));
        document.removeEventListener('click', this._handleOutsideClick.bind(this));
    }

    get userId() {
        return this.getAttribute('user-id') || null;
    }

    _handleNewNotification(e) {
        // Toon toast bij nieuwe notificatie
        this.showToast(e.detail);
        this.loadNotifications();
    }

    _handleOutsideClick(e) {
        if (this._isOpen && !this.contains(e.target)) {
            this._isOpen = false;
            this.render();
        }
    }

    loadNotifications() {
        this._notifications = notificationService.getAll(this.userId);
        this.render();
    }

    getUnreadCount() {
        return this._notifications.filter(n => !n.isRead).length;
    }

    showToast(notification) {
        // Maak toast element
        let container = document.querySelector('.notification-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `notification-toast notification-toast-${notification.color || 'info'}`;
        toast.innerHTML = `
            <div class="notification-toast-icon">
                ${this.getIcon(notification.icon)}
            </div>
            <div class="notification-toast-content">
                <div class="notification-toast-title">${escapeHtml(notification.title)}</div>
                <div class="notification-toast-message">${escapeHtml(notification.message)}</div>
            </div>
            <button type="button" class="notification-toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Close button
        toast.querySelector('.notification-toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        });

        // Click to navigate
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-toast-close')) {
                if (notification.relatedFormId) {
                    window.location.hash = `#/form/${notification.relatedFormType}/${notification.relatedFormId}`;
                }
                notificationService.markAsRead(notification.id);
                toast.remove();
            }
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    getIcon(iconName) {
        const icons = {
            'bell': '<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>',
            'share': '<path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>',
            'inbox': '<path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clip-rule="evenodd"/>',
            'thumbs-up': '<path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>',
            'check': '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>',
            'users': '<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>',
            'message-circle': '<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>',
            'check-circle': '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
            'arrow-right': '<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>',
            'list': '<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>',
            'archive': '<path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"/>',
            'clock': '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>'
        };

        const path = icons[iconName] || icons['bell'];
        return `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">${path}</svg>`;
    }

    render() {
        const unreadCount = this.getUnreadCount();
        const recentNotifications = this._notifications.slice(0, 10);

        this.innerHTML = `
            <div class="notification-badge-container">
                <button type="button" class="notification-badge-btn ${unreadCount > 0 ? 'has-unread' : ''}" aria-label="Notificaties">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                    </svg>
                    ${unreadCount > 0 ? `<span class="notification-count">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                </button>

                <div class="notification-dropdown ${this._isOpen ? 'open' : ''}">
                    <div class="notification-dropdown-header">
                        <h3>Notificaties</h3>
                        ${unreadCount > 0 ? `
                            <button type="button" class="mark-all-read-btn">Alles gelezen</button>
                        ` : ''}
                    </div>

                    <div class="notification-dropdown-content">
                        ${recentNotifications.length > 0 ? `
                            <div class="notification-list">
                                ${recentNotifications.map(n => this.renderNotification(n)).join('')}
                            </div>
                        ` : `
                            <div class="notification-empty">
                                <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                                </svg>
                                <p>Geen notificaties</p>
                            </div>
                        `}
                    </div>

                    ${this._notifications.length > 10 ? `
                        <div class="notification-dropdown-footer">
                            <a href="#/notifications" class="view-all-link">Alle notificaties bekijken</a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.setupEvents();
    }

    renderNotification(notification) {
        const isUnread = !notification.isRead;

        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" data-notification-id="${notification.id}">
                <div class="notification-item-icon notification-icon-${notification.color || 'info'}">
                    ${this.getIcon(notification.icon)}
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${escapeHtml(notification.title)}</div>
                    <div class="notification-item-message">${escapeHtml(notification.message)}</div>
                    <div class="notification-item-time">${formatRelativeTime(notification.createdAt)}</div>
                </div>
                ${isUnread ? '<div class="notification-unread-dot"></div>' : ''}
            </div>
        `;
    }

    setupEvents() {
        // Toggle dropdown
        const btn = this.querySelector('.notification-badge-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._isOpen = !this._isOpen;
                this.render();
            });
        }

        // Mark all as read
        const markAllBtn = this.querySelector('.mark-all-read-btn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationService.markAllAsRead(this.userId);
            });
        }

        // Click on notification
        this.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const notificationId = item.dataset.notificationId;
                const notification = this._notifications.find(n => n.id === notificationId);

                if (notification) {
                    // Mark as read
                    notificationService.markAsRead(notificationId);

                    // Navigate if related form
                    if (notification.relatedFormId && notification.relatedFormType) {
                        window.location.hash = `#/form/${notification.relatedFormType}/${notification.relatedFormId}`;
                    }

                    this._isOpen = false;
                    this.render();
                }
            });
        });

        // Prevent dropdown clicks from closing
        const dropdown = this.querySelector('.notification-dropdown');
        if (dropdown) {
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    open() {
        this._isOpen = true;
        this.render();
    }

    close() {
        this._isOpen = false;
        this.render();
    }

    toggle() {
        this._isOpen = !this._isOpen;
        this.render();
    }
}

customElements.define('wl-notification-badge', WLNotificationBadge);

export default WLNotificationBadge;
