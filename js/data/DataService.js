/**
 * DataService - Abstractielaag voor data opslag
 * Maakt het eenvoudig om later van LocalStorage naar een API te migreren
 */

export class DataService {
    constructor(adapter) {
        this.adapter = adapter;
    }

    /**
     * Maak een nieuw formulier aan
     */
    async createForm(formData) {
        formData.createdAt = new Date().toISOString();
        formData.updatedAt = formData.createdAt;
        return this.adapter.create(formData);
    }

    /**
     * Haal een formulier op via ID
     */
    async getForm(id) {
        return this.adapter.read(id);
    }

    /**
     * Update een bestaand formulier
     */
    async updateForm(id, formData) {
        formData.updatedAt = new Date().toISOString();
        return this.adapter.update(id, formData);
    }

    /**
     * Verwijder een formulier
     */
    async deleteForm(id) {
        return this.adapter.delete(id);
    }

    /**
     * Lijst alle formulieren op, optioneel gefilterd op type
     */
    async listForms(formType = null) {
        return this.adapter.list(formType);
    }

    /**
     * Voeg commentaar toe aan een formuliersectie
     */
    async addComment(formId, sectionId, text, author = 'Anoniem') {
        const form = await this.getForm(formId);
        if (!form) throw new Error('Formulier niet gevonden');

        if (!form.comments) form.comments = [];

        const comment = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            sectionId,
            text,
            author,
            createdAt: new Date().toISOString(),
            resolved: false
        };

        form.comments.push(comment);
        await this.updateForm(formId, form);
        return comment;
    }

    /**
     * Haal commentaren op voor een specifieke sectie
     */
    async getComments(formId, sectionId = null) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) return [];

        if (sectionId) {
            return form.comments.filter(c => c.sectionId === sectionId);
        }
        return form.comments;
    }

    /**
     * Markeer commentaar als opgelost (legacy)
     */
    async resolveComment(formId, commentId) {
        return this.updateCommentStatus(formId, commentId, 'verwerkt', 'Systeem');
    }

    /**
     * Voeg veld-niveau comment toe
     */
    async addFieldComment(formId, fieldPath, text, author, authorRole = 'stakeholder') {
        const form = await this.getForm(formId);
        if (!form) throw new Error('Formulier niet gevonden');

        if (!form.comments) form.comments = [];

        const comment = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            type: 'field',
            sectionId: fieldPath.split('.')[0],
            fieldPath,
            text,
            status: 'open',
            statusChangedAt: null,
            statusChangedBy: null,
            statusReason: null,
            author,
            authorRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentCommentId: null,
            replies: []
        };

        form.comments.push(comment);
        await this.updateForm(formId, form);
        return comment;
    }

    /**
     * Voeg sectie-niveau comment toe
     */
    async addSectionComment(formId, sectionId, text, author, authorRole = 'stakeholder') {
        const form = await this.getForm(formId);
        if (!form) throw new Error('Formulier niet gevonden');

        if (!form.comments) form.comments = [];

        const comment = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            type: 'section',
            sectionId,
            fieldPath: null,
            text,
            status: 'open',
            statusChangedAt: null,
            statusChangedBy: null,
            statusReason: null,
            author,
            authorRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentCommentId: null,
            replies: []
        };

        form.comments.push(comment);
        await this.updateForm(formId, form);
        return comment;
    }

    /**
     * Voeg reactie toe aan comment
     */
    async addCommentReply(formId, parentCommentId, text, author, authorRole = 'stakeholder') {
        const form = await this.getForm(formId);
        if (!form || !form.comments) throw new Error('Formulier niet gevonden');

        const parentComment = form.comments.find(c => c.id === parentCommentId);
        if (!parentComment) throw new Error('Comment niet gevonden');

        const reply = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            text,
            author,
            authorRole,
            createdAt: new Date().toISOString(),
            parentCommentId
        };

        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(reply);
        parentComment.updatedAt = new Date().toISOString();

        await this.updateForm(formId, form);
        return reply;
    }

    /**
     * Update comment status
     */
    async updateCommentStatus(formId, commentId, newStatus, changedBy, reason = null) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) throw new Error('Formulier niet gevonden');

        const comment = form.comments.find(c => c.id === commentId);
        if (!comment) throw new Error('Comment niet gevonden');

        comment.status = newStatus;
        comment.statusChangedAt = new Date().toISOString();
        comment.statusChangedBy = changedBy;
        comment.statusReason = reason;
        comment.updatedAt = new Date().toISOString();

        await this.updateForm(formId, form);
        return comment;
    }

    /**
     * Verwijder comment
     */
    async deleteComment(formId, commentId) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) throw new Error('Formulier niet gevonden');

        const index = form.comments.findIndex(c => c.id === commentId);
        if (index === -1) throw new Error('Comment niet gevonden');

        const deleted = form.comments.splice(index, 1)[0];
        await this.updateForm(formId, form);
        return deleted;
    }

    /**
     * Verwijder reply van comment
     */
    async deleteCommentReply(formId, parentCommentId, replyId) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) throw new Error('Formulier niet gevonden');

        const parentComment = form.comments.find(c => c.id === parentCommentId);
        if (!parentComment || !parentComment.replies) throw new Error('Comment niet gevonden');

        const index = parentComment.replies.findIndex(r => r.id === replyId);
        if (index === -1) throw new Error('Reply niet gevonden');

        const deleted = parentComment.replies.splice(index, 1)[0];
        parentComment.updatedAt = new Date().toISOString();
        await this.updateForm(formId, form);
        return deleted;
    }

    /**
     * Haal comments op per veld
     */
    async getFieldComments(formId, fieldPath) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) return [];

        return form.comments.filter(c => c.type === 'field' && c.fieldPath === fieldPath);
    }

    /**
     * Haal alle comments gegroepeerd per sectie
     */
    async getCommentsGrouped(formId) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) return {};

        const grouped = {};
        for (const comment of form.comments) {
            const key = comment.sectionId || 'algemeen';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(comment);
        }

        return grouped;
    }

    /**
     * Voeg track change toe
     */
    async addTrackChange(formId, fieldPath, originalValue, newValue, author, authorRole = 'stakeholder') {
        const form = await this.getForm(formId);
        if (!form) throw new Error('Formulier niet gevonden');

        if (!form.trackChanges) form.trackChanges = [];

        let changeType = 'replace';
        if (!originalValue && newValue) changeType = 'insert';
        else if (originalValue && !newValue) changeType = 'delete';

        const change = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            fieldPath,
            changeType,
            originalValue: originalValue || '',
            newValue: newValue || '',
            status: 'pending',
            author,
            authorRole,
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null
        };

        form.trackChanges.push(change);
        await this.updateForm(formId, form);
        return change;
    }

    /**
     * Beoordeel track change (accepteer of wijs af)
     */
    async reviewTrackChange(formId, changeId, accept, reviewedBy) {
        const form = await this.getForm(formId);
        if (!form || !form.trackChanges) throw new Error('Formulier niet gevonden');

        const change = form.trackChanges.find(c => c.id === changeId);
        if (!change) throw new Error('Wijziging niet gevonden');

        change.status = accept ? 'accepted' : 'rejected';
        change.reviewedAt = new Date().toISOString();
        change.reviewedBy = reviewedBy;

        // Als geaccepteerd, pas de waarde toe op het formulier
        if (accept && change.fieldPath) {
            const pathParts = change.fieldPath.split('.');
            let obj = form;
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!obj[pathParts[i]]) obj[pathParts[i]] = {};
                obj = obj[pathParts[i]];
            }
            obj[pathParts[pathParts.length - 1]] = change.newValue;
        }

        await this.updateForm(formId, form);
        return change;
    }

    /**
     * Haal track changes op voor een veld
     */
    async getFieldTrackChanges(formId, fieldPath) {
        const form = await this.getForm(formId);
        if (!form || !form.trackChanges) return [];

        return form.trackChanges.filter(c => c.fieldPath === fieldPath);
    }

    /**
     * Haal alle pending track changes op
     */
    async getPendingTrackChanges(formId) {
        const form = await this.getForm(formId);
        if (!form || !form.trackChanges) return [];

        return form.trackChanges.filter(c => c.status === 'pending');
    }

    /**
     * Exporteer formulier als JSON string
     */
    exportToJSON(formData) {
        return JSON.stringify(formData, null, 2);
    }

    /**
     * Importeer formulier van JSON string
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // Genereer nieuw ID om duplicaten te voorkomen
            data.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            data.importedAt = new Date().toISOString();
            return data;
        } catch (e) {
            throw new Error('Ongeldig JSON formaat');
        }
    }
}

export default DataService;
