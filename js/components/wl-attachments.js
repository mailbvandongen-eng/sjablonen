/**
 * WL-Attachments Web Component
 * Links en documenten bijvoegen aan formulieren
 */

class WLAttachments extends HTMLElement {
    constructor() {
        super();
        this._links = [];
        this._documents = [];
    }

    connectedCallback() {
        this.render();
    }

    get links() {
        return this._links;
    }

    set links(value) {
        this._links = value || [];
        this.render();
    }

    get documents() {
        return this._documents;
    }

    set documents(value) {
        this._documents = value || [];
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="attachments-container">
                <!-- Links sectie -->
                <div class="attachments-section">
                    <h4>Links naar relevante documenten</h4>
                    <div class="links-list">
                        ${this._links.map((link, index) => `
                            <div class="link-item" data-index="${index}">
                                <div class="link-inputs">
                                    <input type="text" class="form-input link-title" value="${this.escapeHtml(link.title || '')}" placeholder="Titel" data-field="title">
                                    <input type="url" class="form-input link-url" value="${this.escapeHtml(link.url || '')}" placeholder="https://..." data-field="url">
                                </div>
                                <button type="button" class="btn-icon delete" title="Verwijderen" data-action="delete-link">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" data-action="add-link">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                        Link toevoegen
                    </button>
                </div>

                <!-- Documenten sectie -->
                <div class="attachments-section mt-3">
                    <h4>Bijgevoegde documenten</h4>
                    <p class="text-muted" style="font-size: var(--wl-font-size-sm);">Max 2MB per bestand. Bestanden worden lokaal opgeslagen.</p>
                    <div class="documents-list">
                        ${this._documents.map((doc, index) => `
                            <div class="document-item" data-index="${index}">
                                <div class="document-info">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="document-icon">
                                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                                    </svg>
                                    <span class="document-name">${this.escapeHtml(doc.name)}</span>
                                    <span class="document-size">(${this.formatFileSize(doc.size)})</span>
                                </div>
                                <div class="document-actions">
                                    <button type="button" class="btn-icon" title="Downloaden" data-action="download-doc">
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                        </svg>
                                    </button>
                                    <button type="button" class="btn-icon delete" title="Verwijderen" data-action="delete-doc">
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <input type="file" id="doc-upload-${this.id || 'default'}" style="display: none;" multiple>
                    <button type="button" class="btn btn-secondary btn-sm" data-action="upload-doc">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                        Document uploaden
                    </button>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    setupEvents() {
        // Link events
        this.querySelectorAll('.link-item input').forEach(input => {
            input.addEventListener('change', (e) => {
                const item = e.target.closest('.link-item');
                const index = parseInt(item.dataset.index);
                const field = e.target.dataset.field;
                this._links[index][field] = e.target.value;
                this.dispatchChange();
            });
        });

        this.querySelector('[data-action="add-link"]')?.addEventListener('click', () => {
            this._links.push({ title: '', url: '' });
            this.render();
            this.dispatchChange();
        });

        this.querySelectorAll('[data-action="delete-link"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.link-item');
                const index = parseInt(item.dataset.index);
                this._links.splice(index, 1);
                this.render();
                this.dispatchChange();
            });
        });

        // Document events
        const fileInput = this.querySelector('input[type="file"]');
        this.querySelector('[data-action="upload-doc"]')?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                if (file.size > 2 * 1024 * 1024) {
                    alert(`Bestand "${file.name}" is te groot (max 2MB)`);
                    continue;
                }
                try {
                    const base64 = await this.fileToBase64(file);
                    this._documents.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data: base64,
                        uploadedAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.error('Error uploading file:', err);
                }
            }
            this.render();
            this.dispatchChange();
            e.target.value = '';
        });

        this.querySelectorAll('[data-action="download-doc"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.document-item');
                const index = parseInt(item.dataset.index);
                const doc = this._documents[index];
                this.downloadDocument(doc);
            });
        });

        this.querySelectorAll('[data-action="delete-doc"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.document-item');
                const index = parseInt(item.dataset.index);
                this._documents.splice(index, 1);
                this.render();
                this.dispatchChange();
            });
        });
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    downloadDocument(doc) {
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    dispatchChange() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: { links: this._links, documents: this._documents },
            bubbles: true
        }));
    }

    getData() {
        return { links: this._links, documents: this._documents };
    }

    setData(data) {
        this._links = data?.links || [];
        this._documents = data?.documents || [];
        this.render();
    }
}

customElements.define('wl-attachments', WLAttachments);

export default WLAttachments;
