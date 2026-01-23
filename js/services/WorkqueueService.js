/**
 * WorkqueueService - Werkvoorraad beheer per rol
 * Beheert status transities en werkvoorraad per gebruikersrol
 */

import {
    INTAKE_STATUS,
    INTAKE_STATUS_LABELS,
    INTAKE_STATUS_TRANSITIONS,
    USER_ROLES,
    WORKQUEUE_CONFIG,
    ROUTE_TYPES
} from '../config.js';
import notificationService from './NotificationService.js';

class WorkqueueService {
    constructor(dataService) {
        this.dataService = dataService;
    }

    /**
     * Haal werkvoorraad op voor een specifieke rol
     * @param {string} role - Gebruikersrol (zie USER_ROLES)
     * @param {string} userId - Optioneel: filter op specifieke gebruiker
     * @returns {Promise<Array>} Lijst van formulieren in de werkvoorraad
     */
    async getWorkqueue(role, userId = null) {
        const config = WORKQUEUE_CONFIG[role];
        if (!config) {
            console.warn(`Geen werkvoorraad configuratie voor rol: ${role}`);
            return [];
        }

        const allForms = await this.dataService.listForms('intakeformulier');

        return allForms.filter(form => {
            // Filter op status
            const statusMatch = config.statuses.includes(form.status);

            // Filter op eigenaar/toegewezen gebruiker indien nodig
            if (userId && !config.canSeeAll) {
                // Klant ziet alleen eigen intakes
                if (role === USER_ROLES.KLANT) {
                    return statusMatch && form.klantId === userId;
                }
                // BA/FB ziet alleen toegewezen intakes
                if (role === USER_ROLES.BA || role === USER_ROLES.FB) {
                    return statusMatch && form.assignedTo === userId;
                }
            }

            return statusMatch;
        });
    }

    /**
     * Haal alle intakes op gegroepeerd per status
     * @returns {Promise<Object>} Intakes gegroepeerd per status
     */
    async getGroupedByStatus() {
        const allForms = await this.dataService.listForms('intakeformulier');
        const grouped = {};

        Object.values(INTAKE_STATUS).forEach(status => {
            grouped[status] = [];
        });

        allForms.forEach(form => {
            const status = form.status || INTAKE_STATUS.DRAFT;
            if (grouped[status]) {
                grouped[status].push(form);
            }
        });

        return grouped;
    }

    /**
     * Tel intakes per status
     * @returns {Promise<Object>} Tellers per status
     */
    async countByStatus() {
        const grouped = await this.getGroupedByStatus();
        const counts = {};

        Object.entries(grouped).forEach(([status, forms]) => {
            counts[status] = forms.length;
        });

        return counts;
    }

    /**
     * Controleer of een status transitie toegestaan is
     * @param {string} currentStatus - Huidige status
     * @param {string} newStatus - Gewenste nieuwe status
     * @param {string} userRole - Rol van de gebruiker
     * @returns {boolean} Of de transitie toegestaan is
     */
    canTransition(currentStatus, newStatus, userRole) {
        const transitions = INTAKE_STATUS_TRANSITIONS[currentStatus];
        if (!transitions) return false;

        // Check of de nieuwe status een geldige volgende status is
        if (!transitions.next.includes(newStatus)) return false;

        // Check of de gebruiker de juiste rol heeft voor deze actie
        const action = transitions.actions.find(a => a.to === newStatus);
        if (!action) return false;

        return action.role === userRole;
    }

    /**
     * Get form status (handles both status and intakeStatus fields)
     */
    _getFormStatus(form) {
        return form.intakeStatus || form.status || INTAKE_STATUS.DRAFT;
    }

    /**
     * Haal beschikbare acties op voor een formulier en gebruikersrol
     * @param {Object} form - Het formulier
     * @param {string} userRole - Rol van de gebruiker
     * @returns {Array} Beschikbare acties
     */
    getAvailableActions(form, userRole) {
        const currentStatus = this._getFormStatus(form);
        const transitions = INTAKE_STATUS_TRANSITIONS[currentStatus];

        if (!transitions) return [];

        return transitions.actions.filter(action => action.role === userRole);
    }

    /**
     * Voer status transitie uit
     * @param {string} formId - ID van het formulier
     * @param {string} newStatus - Nieuwe status
     * @param {Object} user - Uitvoerende gebruiker { id, name, role }
     * @param {Object} options - Extra opties (routeType, reason, etc.)
     * @returns {Promise<Object>} Bijgewerkt formulier
     */
    async transition(formId, newStatus, user, options = {}) {
        const form = await this.dataService.getForm(formId);
        if (!form) throw new Error('Formulier niet gevonden');

        const currentStatus = this._getFormStatus(form);

        // Valideer transitie
        if (!this.canTransition(currentStatus, newStatus, user.role)) {
            throw new Error(`Ongeldige transitie van ${currentStatus} naar ${newStatus} voor rol ${user.role}`);
        }

        // Update status (both fields for compatibility)
        form.status = newStatus;
        form.intakeStatus = newStatus;
        form.statusHistory = form.statusHistory || [];
        form.statusHistory.push({
            from: currentStatus,
            to: newStatus,
            by: user.name,
            byId: user.id,
            role: user.role,
            at: new Date().toISOString(),
            reason: options.reason || null,
            routeType: options.routeType || null
        });

        // Route-specifieke updates
        if (options.routeType === ROUTE_TYPES.PROJECT && newStatus === INTAKE_STATUS.BIJ_BA) {
            form.routeType = ROUTE_TYPES.PROJECT;
            form.assignedTo = options.assignedTo || null;
        } else if (options.routeType === ROUTE_TYPES.CHANGE && newStatus === INTAKE_STATUS.FB_BACKLOG) {
            form.routeType = ROUTE_TYPES.CHANGE;
            form.assignedTo = options.assignedTo || null;
        }

        // Sla op
        await this.dataService.updateForm(formId, form);

        // Stuur notificaties
        await this._sendTransitionNotifications(form, currentStatus, newStatus, user, options);

        return form;
    }

    /**
     * Stuur notificaties bij status transitie
     */
    async _sendTransitionNotifications(form, fromStatus, toStatus, user, options) {
        const formTitle = form.basisinfo?.onderwerp || form.basisinfo?.titel || 'Intake';

        switch (toStatus) {
            case INTAKE_STATUS.KLANT_INVOER:
                // Notificeer klant
                if (form.klantId) {
                    notificationService.notifyIntakeShared(
                        form.id,
                        formTitle,
                        form.klantId,
                        user.name
                    );
                }
                break;

            case INTAKE_STATUS.IM_AANVULLEN:
                // Notificeer IM dat klant heeft ingediend
                if (form.eigenaar) {
                    notificationService.notifyIntakeSubmitted(
                        form.id,
                        formTitle,
                        form.eigenaar,
                        form.klantNaam || 'Klant'
                    );
                }
                break;

            case INTAKE_STATUS.KLANT_AKKOORD:
                // Notificeer klant voor akkoord
                if (form.klantId) {
                    notificationService.notifyAkkoordRequested(
                        form.id,
                        formTitle,
                        form.klantId,
                        user.name
                    );
                }
                break;

            case INTAKE_STATUS.STAKEHOLDER_REVIEW:
                // Notificeer stakeholders
                const stakeholders = form.stakeholders || [];
                stakeholders.forEach(sh => {
                    if (sh.persoonId) {
                        notificationService.notifyStakeholderReviewStart(
                            form.id,
                            formTitle,
                            sh.persoonId,
                            user.name
                        );
                    }
                });
                break;

            case INTAKE_STATUS.BIJ_BA:
                // Notificeer BA
                if (options.assignedTo) {
                    notificationService.notifyRoutedToBA(
                        form.id,
                        formTitle,
                        options.assignedTo,
                        user.name
                    );
                }
                break;

            case INTAKE_STATUS.FB_BACKLOG:
                // Notificeer FB
                if (options.assignedTo) {
                    notificationService.notifyRoutedToFB(
                        form.id,
                        formTitle,
                        options.assignedTo,
                        user.name
                    );
                }
                break;

            case INTAKE_STATUS.GEARCHIVEERD:
                // Notificeer PMO (of alle geinteresseerden)
                notificationService.notifyIntakeArchived(
                    form.id,
                    formTitle,
                    null, // Broadcast
                    user.name
                );
                break;
        }
    }

    /**
     * Haal status info op
     * @param {string} status - Status code
     * @returns {Object} Status label info
     */
    getStatusInfo(status) {
        return INTAKE_STATUS_LABELS[status] || {
            label: status,
            class: 'badge-secondary',
            icon: 'circle',
            description: ''
        };
    }

    /**
     * Haal volledige status geschiedenis op voor een formulier
     * @param {string} formId - ID van het formulier
     * @returns {Promise<Array>} Status geschiedenis
     */
    async getStatusHistory(formId) {
        const form = await this.dataService.getForm(formId);
        if (!form) return [];

        return form.statusHistory || [];
    }

    /**
     * Bereken doorlooptijd per status
     * @param {string} formId - ID van het formulier
     * @returns {Promise<Object>} Doorlooptijd per status in uren
     */
    async calculateDurations(formId) {
        const history = await this.getStatusHistory(formId);
        if (history.length < 2) return {};

        const durations = {};

        for (let i = 0; i < history.length - 1; i++) {
            const current = history[i];
            const next = history[i + 1];

            const start = new Date(current.at);
            const end = new Date(next.at);
            const hours = (end - start) / (1000 * 60 * 60);

            durations[current.to] = {
                hours: Math.round(hours * 10) / 10,
                from: current.at,
                to: next.at
            };
        }

        return durations;
    }
}

export default WorkqueueService;
export { WorkqueueService };
