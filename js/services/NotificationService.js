/**
 * NotificationService - In-app notificaties
 * Beheert notificaties per gebruiker, opgeslagen in LocalStorage
 */

import { NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '../config.js';

const STORAGE_KEY = 'wl_notifications';

class NotificationService {
    constructor() {
        this._listeners = [];
        this._notifications = this._loadFromStorage();
    }

    /**
     * Laad notificaties uit LocalStorage
     */
    _loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Fout bij laden notificaties:', e);
            return [];
        }
    }

    /**
     * Sla notificaties op in LocalStorage
     */
    _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._notifications));
        } catch (e) {
            console.error('Fout bij opslaan notificaties:', e);
        }
    }

    /**
     * Genereer uniek ID
     */
    _generateId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Notificeer listeners van wijzigingen
     */
    _notifyListeners() {
        this._listeners.forEach(callback => {
            try {
                callback(this.getAll());
            } catch (e) {
                console.error('Fout in notification listener:', e);
            }
        });
    }

    /**
     * Maak nieuwe notificatie
     * @param {string} type - Type notificatie (zie NOTIFICATION_TYPES)
     * @param {Object} data - Extra data voor de notificatie
     * @param {string} targetUserId - ID van de ontvanger
     * @returns {Object} De aangemaakte notificatie
     */
    create(type, data = {}, targetUserId = null) {
        const typeInfo = NOTIFICATION_LABELS[type] || {
            title: 'Notificatie',
            message: '',
            icon: 'bell',
            color: 'info'
        };

        const notification = {
            id: this._generateId(),
            type,
            title: data.title || typeInfo.title,
            message: data.message || typeInfo.message,
            icon: typeInfo.icon,
            color: typeInfo.color,
            targetUserId,
            relatedFormId: data.formId || null,
            relatedFormType: data.formType || null,
            relatedFormTitle: data.formTitle || null,
            senderName: data.senderName || null,
            senderId: data.senderId || null,
            isRead: false,
            createdAt: new Date().toISOString(),
            readAt: null,
            metadata: data.metadata || {}
        };

        this._notifications.unshift(notification);
        this._saveToStorage();
        this._notifyListeners();

        // Dispatch custom event voor real-time updates
        window.dispatchEvent(new CustomEvent('wl-notification-created', {
            detail: notification
        }));

        return notification;
    }

    /**
     * Haal alle notificaties op
     * @param {string} userId - Filter op gebruiker (optioneel)
     * @returns {Array} Lijst van notificaties
     */
    getAll(userId = null) {
        if (userId) {
            return this._notifications.filter(n =>
                n.targetUserId === userId || n.targetUserId === null
            );
        }
        return [...this._notifications];
    }

    /**
     * Haal ongelezen notificaties op
     * @param {string} userId - Filter op gebruiker (optioneel)
     * @returns {Array} Lijst van ongelezen notificaties
     */
    getUnread(userId = null) {
        return this.getAll(userId).filter(n => !n.isRead);
    }

    /**
     * Tel ongelezen notificaties
     * @param {string} userId - Filter op gebruiker (optioneel)
     * @returns {number} Aantal ongelezen notificaties
     */
    countUnread(userId = null) {
        return this.getUnread(userId).length;
    }

    /**
     * Markeer notificatie als gelezen
     * @param {string} notificationId - ID van de notificatie
     */
    markAsRead(notificationId) {
        const notification = this._notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            this._saveToStorage();
            this._notifyListeners();
        }
    }

    /**
     * Markeer alle notificaties als gelezen
     * @param {string} userId - Filter op gebruiker (optioneel)
     */
    markAllAsRead(userId = null) {
        const notifications = this.getAll(userId);
        let changed = false;

        notifications.forEach(n => {
            if (!n.isRead) {
                const original = this._notifications.find(on => on.id === n.id);
                if (original) {
                    original.isRead = true;
                    original.readAt = new Date().toISOString();
                    changed = true;
                }
            }
        });

        if (changed) {
            this._saveToStorage();
            this._notifyListeners();
        }
    }

    /**
     * Verwijder notificatie
     * @param {string} notificationId - ID van de notificatie
     */
    delete(notificationId) {
        const index = this._notifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
            this._notifications.splice(index, 1);
            this._saveToStorage();
            this._notifyListeners();
        }
    }

    /**
     * Verwijder alle notificaties
     * @param {string} userId - Filter op gebruiker (optioneel)
     */
    deleteAll(userId = null) {
        if (userId) {
            this._notifications = this._notifications.filter(n =>
                n.targetUserId !== userId && n.targetUserId !== null
            );
        } else {
            this._notifications = [];
        }
        this._saveToStorage();
        this._notifyListeners();
    }

    /**
     * Verwijder oude notificaties (ouder dan X dagen)
     * @param {number} days - Aantal dagen
     */
    cleanupOld(days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const before = this._notifications.length;
        this._notifications = this._notifications.filter(n =>
            new Date(n.createdAt) > cutoff
        );

        if (this._notifications.length !== before) {
            this._saveToStorage();
            this._notifyListeners();
        }
    }

    /**
     * Abonneer op wijzigingen
     * @param {Function} callback - Callback functie
     * @returns {Function} Unsubscribe functie
     */
    subscribe(callback) {
        this._listeners.push(callback);
        return () => {
            const index = this._listeners.indexOf(callback);
            if (index > -1) {
                this._listeners.splice(index, 1);
            }
        };
    }

    // === Convenience methods voor specifieke notificatie types ===

    /**
     * Notificatie: Intake gedeeld met klant
     */
    notifyIntakeShared(formId, formTitle, targetUserId, senderName) {
        return this.create(NOTIFICATION_TYPES.INTAKE_SHARED, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName,
            message: `${senderName} heeft de intake "${formTitle}" met je gedeeld`
        }, targetUserId);
    }

    /**
     * Notificatie: Klant heeft intake ingediend
     */
    notifyIntakeSubmitted(formId, formTitle, targetUserId, clientName) {
        return this.create(NOTIFICATION_TYPES.INTAKE_SUBMITTED, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName: clientName,
            message: `${clientName} heeft de intake "${formTitle}" ingediend`
        }, targetUserId);
    }

    /**
     * Notificatie: Akkoord gevraagd
     */
    notifyAkkoordRequested(formId, formTitle, targetUserId, senderName) {
        return this.create(NOTIFICATION_TYPES.AKKOORD_REQUESTED, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName,
            message: `${senderName} vraagt je akkoord op de intake "${formTitle}"`
        }, targetUserId);
    }

    /**
     * Notificatie: Akkoord gegeven
     */
    notifyAkkoordGiven(formId, formTitle, targetUserId, clientName) {
        return this.create(NOTIFICATION_TYPES.AKKOORD_GIVEN, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName: clientName,
            message: `${clientName} heeft akkoord gegeven op de intake "${formTitle}"`
        }, targetUserId);
    }

    /**
     * Notificatie: Stakeholder review gestart
     */
    notifyStakeholderReviewStart(formId, formTitle, targetUserId, senderName) {
        return this.create(NOTIFICATION_TYPES.STAKEHOLDER_REVIEW_START, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName,
            message: `${senderName} vraagt je review op de intake "${formTitle}"`
        }, targetUserId);
    }

    /**
     * Notificatie: Nieuwe opmerking
     */
    notifyCommentAdded(formId, formTitle, targetUserId, commenterName, commentText) {
        return this.create(NOTIFICATION_TYPES.COMMENT_ADDED, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName: commenterName,
            message: `${commenterName} heeft een opmerking geplaatst: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`
        }, targetUserId);
    }

    /**
     * Notificatie: Opmerking verwerkt
     */
    notifyCommentResolved(formId, formTitle, targetUserId, resolverName) {
        return this.create(NOTIFICATION_TYPES.COMMENT_RESOLVED, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName: resolverName,
            message: `${resolverName} heeft je opmerking verwerkt`
        }, targetUserId);
    }

    /**
     * Notificatie: Intake doorgezet naar BA
     */
    notifyRoutedToBA(formId, formTitle, targetUserId, senderName) {
        return this.create(NOTIFICATION_TYPES.ROUTED_TO_BA, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName,
            message: `${senderName} heeft de intake "${formTitle}" naar je werkvoorraad gezet`
        }, targetUserId);
    }

    /**
     * Notificatie: Intake doorgezet naar FB
     */
    notifyRoutedToFB(formId, formTitle, targetUserId, senderName) {
        return this.create(NOTIFICATION_TYPES.ROUTED_TO_FB, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName,
            message: `${senderName} heeft de change "${formTitle}" op de backlog gezet`
        }, targetUserId);
    }

    /**
     * Notificatie: Intake gearchiveerd
     */
    notifyIntakeArchived(formId, formTitle, targetUserId, archiverName) {
        return this.create(NOTIFICATION_TYPES.INTAKE_ARCHIVED, {
            formId,
            formType: 'intakeformulier',
            formTitle,
            senderName: archiverName,
            message: `De intake "${formTitle}" is gearchiveerd`
        }, targetUserId);
    }
}

// Singleton instance
const notificationService = new NotificationService();

export default notificationService;
export { NotificationService };
