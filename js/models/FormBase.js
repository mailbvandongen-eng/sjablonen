/**
 * FormBase - Basisklasse voor alle formuliermodellen
 *
 * Comment structuur:
 * {
 *   id: string,
 *   type: 'section' | 'field' | 'inline',
 *   sectionId: string,
 *   fieldPath: string | null,
 *   text: string,
 *   status: 'open' | 'verwerkt' | 'afgewezen',
 *   statusChangedAt: string | null,
 *   statusChangedBy: string | null,
 *   statusReason: string | null,
 *   author: string,
 *   authorRole: 'IM' | 'BA' | 'stakeholder' | 'klant',
 *   createdAt: string,
 *   updatedAt: string,
 *   parentCommentId: string | null,
 *   replies: Comment[]
 * }
 *
 * TrackChange structuur:
 * {
 *   id: string,
 *   fieldPath: string,
 *   changeType: 'insert' | 'delete' | 'replace',
 *   originalValue: string,
 *   newValue: string,
 *   status: 'pending' | 'accepted' | 'rejected',
 *   author: string,
 *   authorRole: string,
 *   createdAt: string,
 *   reviewedAt: string | null,
 *   reviewedBy: string | null
 * }
 */

import { generateUUID } from '../utils/helpers.js';

export class FormBase {
    constructor(formType) {
        this.id = generateUUID();
        this.formType = formType;
        this.version = '1.0';
        this.status = 'draft'; // draft | in_review | approved
        this.archived = false;
        this.archivedAt = null;
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
        this.createdBy = '';
        this.comments = [];
        this.trackChanges = [];
    }

    /**
     * Valideer formulier (overschrijven in subklassen)
     */
    validate() {
        const errors = [];
        // Basis validatie
        if (!this.formType) {
            errors.push({ field: 'formType', message: 'Formuliertype is verplicht' });
        }
        return errors;
    }

    /**
     * Controleer of formulier geldig is
     */
    isValid() {
        return this.validate().length === 0;
    }

    /**
     * Exporteer naar JSON
     */
    toJSON() {
        return { ...this };
    }

    /**
     * Laad data in formulier
     */
    fromJSON(data) {
        Object.assign(this, data);
        return this;
    }

    /**
     * Update status
     */
    setStatus(status) {
        const validStatuses = ['draft', 'in_review', 'approved'];
        if (validStatuses.includes(status)) {
            this.status = status;
            this.updatedAt = new Date().toISOString();
        }
        return this;
    }
}

export default FormBase;
