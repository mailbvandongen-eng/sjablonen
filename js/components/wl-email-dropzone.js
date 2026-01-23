/**
 * WL-Email-Dropzone Web Component
 * Drop zone voor email bestanden om automatisch intakes aan te maken
 */

import { parseEml, emailToIntakeData } from '../utils/emailParser.js';
import { escapeHtml } from '../utils/helpers.js';

class WLEmailDropzone extends HTMLElement {
    constructor() {
        super();
        this._isDragging = false;
        this._isProcessing = false;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    render() {
        this.innerHTML = `
            <div class="email-dropzone ${this._isDragging ? 'dragging' : ''} ${this._isProcessing ? 'processing' : ''}">
                <div class="dropzone-content">
                    ${this._isProcessing ? `
                        <div class="dropzone-processing">
                            <div class="spinner"></div>
                            <p>Email verwerken...</p>
                        </div>
                    ` : `
                        <div class="dropzone-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <p class="dropzone-text">
                            <strong>Sleep .eml hierheen</strong> of klik om te selecteren
                        </p>
                        <input type="file" class="dropzone-input" accept=".eml,.msg" hidden>
                    `}
                </div>
            </div>
        `;
    }

    setupEvents() {
        const dropzone = this.querySelector('.email-dropzone');
        const input = this.querySelector('.dropzone-input');

        if (!dropzone) return;

        // Click to select file
        dropzone.addEventListener('click', () => {
            if (!this._isProcessing && input) {
                input.click();
            }
        });

        // File input change
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files?.length > 0) {
                    this.handleFile(e.target.files[0]);
                }
            });
        }

        // Drag events
        dropzone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._isDragging = true;
            this.render();
            this.setupEvents();
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only set to false if we're leaving the dropzone entirely
            if (!dropzone.contains(e.relatedTarget)) {
                this._isDragging = false;
                this.render();
                this.setupEvents();
            }
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._isDragging = false;

            const files = e.dataTransfer?.files;
            if (files?.length > 0) {
                this.handleFile(files[0]);
            } else {
                this.render();
                this.setupEvents();
            }
        });
    }

    async handleFile(file) {
        // Check file type
        const validTypes = ['.eml', '.msg'];
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(extension)) {
            this.dispatchEvent(new CustomEvent('email-error', {
                detail: { error: 'Alleen .eml bestanden worden ondersteund' },
                bubbles: true
            }));
            return;
        }

        if (extension === '.msg') {
            this.dispatchEvent(new CustomEvent('email-error', {
                detail: { error: '.msg bestanden worden nog niet ondersteund. Sla de email op als .eml' },
                bubbles: true
            }));
            return;
        }

        this._isProcessing = true;
        this.render();

        try {
            // Read file content
            const content = await this.readFileAsText(file);

            // Parse email
            const parsed = parseEml(content);

            // Convert to intake data
            const intakeData = emailToIntakeData(parsed);

            // Dispatch success event
            this.dispatchEvent(new CustomEvent('email-parsed', {
                detail: {
                    filename: file.name,
                    parsed,
                    intakeData
                },
                bubbles: true
            }));

        } catch (error) {
            console.error('Email parse error:', error);
            this.dispatchEvent(new CustomEvent('email-error', {
                detail: { error: 'Kon email niet verwerken: ' + error.message },
                bubbles: true
            }));
        } finally {
            this._isProcessing = false;
            this.render();
            this.setupEvents();
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Kon bestand niet lezen'));
            reader.readAsText(file);
        });
    }
}

customElements.define('wl-email-dropzone', WLEmailDropzone);

export default WLEmailDropzone;
