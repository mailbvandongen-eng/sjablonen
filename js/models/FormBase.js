/**
 * FormBase - Basisklasse voor alle formuliermodellen
 */

import { generateUUID } from '../utils/helpers.js';

export class FormBase {
    constructor(formType) {
        this.id = generateUUID();
        this.formType = formType;
        this.version = '1.0';
        this.status = 'draft'; // draft | in_review | approved
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
        this.createdBy = '';
        this.comments = [];
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
