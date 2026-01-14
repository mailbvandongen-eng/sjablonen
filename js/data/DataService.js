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
     * Markeer commentaar als opgelost
     */
    async resolveComment(formId, commentId) {
        const form = await this.getForm(formId);
        if (!form || !form.comments) return;

        const comment = form.comments.find(c => c.id === commentId);
        if (comment) {
            comment.resolved = true;
            await this.updateForm(formId, form);
        }
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
