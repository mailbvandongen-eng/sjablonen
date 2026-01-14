/**
 * LocalStorageAdapter - Implementatie van data opslag met browser LocalStorage
 */

export class LocalStorageAdapter {
    constructor(prefix = 'westland_forms_') {
        this.prefix = prefix;
    }

    /**
     * Genereer storage key
     */
    _getKey(id) {
        return this.prefix + id;
    }

    /**
     * Maak nieuw record aan
     */
    create(data) {
        if (!data.id) {
            data.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        }
        const key = this._getKey(data.id);
        localStorage.setItem(key, JSON.stringify(data));
        return data;
    }

    /**
     * Lees record via ID
     */
    read(id) {
        const key = this._getKey(id);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Update bestaand record
     */
    update(id, data) {
        data.id = id;
        return this.create(data);
    }

    /**
     * Verwijder record
     */
    delete(id) {
        const key = this._getKey(id);
        localStorage.removeItem(key);
        return true;
    }

    /**
     * Lijst alle records op, optioneel gefilterd op formType
     */
    list(formType = null) {
        const forms = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                try {
                    const form = JSON.parse(localStorage.getItem(key));
                    if (!formType || form.formType === formType) {
                        forms.push(form);
                    }
                } catch (e) {
                    console.error('Error parsing form:', key, e);
                }
            }
        }

        // Sorteer op laatst bijgewerkt
        return forms.sort((a, b) =>
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
    }

    /**
     * Verwijder alle records
     */
    clear() {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        return keysToRemove.length;
    }

    /**
     * Tel aantal opgeslagen formulieren
     */
    count(formType = null) {
        return this.list(formType).length;
    }

    /**
     * Controleer beschikbare opslagruimte (schatting)
     */
    getStorageInfo() {
        let totalSize = 0;
        let formCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                totalSize += localStorage.getItem(key).length;
                formCount++;
            }
        }

        return {
            formCount,
            usedBytes: totalSize * 2, // UTF-16 encoding
            usedKB: Math.round(totalSize * 2 / 1024),
            estimatedMaxKB: 5120 // Typische LocalStorage limiet is 5MB
        };
    }
}

export default LocalStorageAdapter;
