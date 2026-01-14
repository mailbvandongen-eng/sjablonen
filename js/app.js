/**
 * Main Application Entry Point
 * Gemeente Westland Projectformulieren
 */

// Import components
import './components/wl-header.js';
import './components/wl-form-section.js';
import './components/wl-stakeholder-table.js';
import './components/wl-comment-panel.js';
import './components/wl-checklist.js';

// Import services
import { Router, UrlHelpers } from './router.js';
import { DataService } from './data/DataService.js';
import { LocalStorageAdapter } from './data/LocalStorageAdapter.js';

// Import utils
import { FORM_TYPES, STATUS_LABELS, formatDate, showToast, downloadFile, readFileAsText, escapeHtml } from './utils/helpers.js';

// Import models
import { Intakeformulier, INTAKE_VRAGEN, PRIORITEIT_OPTIES } from './models/Intakeformulier.js';
import { KleinProjectMandaat, KKV_SECTIES } from './models/KleinProjectMandaat.js';
import { ICTProjectMandaat, ICT_PROJECT_SECTIES } from './models/ICTProjectMandaat.js';
import { Impactanalyse, IMPACT_SECTIES, RISICO_KANS_OPTIES, RISICO_IMPACT_OPTIES } from './models/Impactanalyse.js';

// Initialize services
const dataService = new DataService(new LocalStorageAdapter());
const router = new Router();

// App state
let currentForm = null;
let autoSaveTimer = null;

/**
 * Render home page
 */
function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="page-header">
            <div class="container">
                <h1>Projectformulieren</h1>
                <p>Kies een formuliertype om te beginnen</p>
            </div>
        </div>
        <div class="container">
            <div class="card-grid">
                ${Object.entries(FORM_TYPES).map(([key, type]) => `
                    <div class="card">
                        <div class="card-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="${type.icon}"/>
                            </svg>
                            ${type.label}
                        </div>
                        <p class="card-description">${type.description}</p>
                        <a href="#/new/${key}" class="btn btn-primary">Nieuw formulier</a>
                    </div>
                `).join('')}
            </div>

            <div class="mt-4">
                <h2>Of importeer een bestaand formulier</h2>
                <div class="card">
                    <p>Heb je een JSON-bestand ontvangen? Importeer het hier om verder te werken.</p>
                    <input type="file" id="import-file" accept=".json" style="display: none;">
                    <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                        Importeer JSON
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup import handler
    document.getElementById('import-file').addEventListener('change', handleImport);
}

/**
 * Render forms list
 */
async function renderFormsList() {
    const forms = await dataService.listForms();
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="page-header">
            <div class="container">
                <h1>Mijn Formulieren</h1>
                <p>${forms.length} formulier${forms.length !== 1 ? 'en' : ''} opgeslagen</p>
            </div>
        </div>
        <div class="container">
            ${forms.length === 0 ? `
                <div class="card empty-state">
                    <div class="empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Geen formulieren</h3>
                    <p>Je hebt nog geen formulieren aangemaakt.</p>
                    <a href="#/" class="btn btn-primary mt-2">Nieuw formulier maken</a>
                </div>
            ` : `
                <div class="table-container card">
                    <table>
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Laatst gewijzigd</th>
                                <th>Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${forms.map(form => {
                                const typeInfo = FORM_TYPES[form.formType] || { label: form.formType };
                                const statusInfo = STATUS_LABELS[form.status] || STATUS_LABELS.draft;
                                const name = getFormName(form);
                                return `
                                    <tr>
                                        <td><a href="#/form/${form.formType}/${form.id}">${escapeHtml(name)}</a></td>
                                        <td>${typeInfo.label}</td>
                                        <td><span class="badge ${statusInfo.class}">${statusInfo.label}</span></td>
                                        <td>${formatDate(form.updatedAt, true)}</td>
                                        <td>
                                            <div class="d-flex gap-1">
                                                <a href="#/form/${form.formType}/${form.id}" class="btn btn-sm btn-secondary">Openen</a>
                                                <button class="btn btn-sm btn-secondary" onclick="exportForm('${form.id}')">Export</button>
                                                <button class="btn btn-sm btn-secondary" onclick="deleteForm('${form.id}')" style="color: var(--wl-error)">Verwijder</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/**
 * Get display name for a form
 */
function getFormName(form) {
    switch(form.formType) {
        case 'intakeformulier':
            return form.basisinfo?.onderwerp || 'Naamloos intakeformulier';
        case 'klein-project-mandaat':
            return form.documentgegevens?.kkvNaam || 'Naamloos KKV';
        case 'ict-projectmandaat':
            return form.documentgegevens?.projectnaam || 'Naamloos project';
        case 'impactanalyse':
            return form.header?.omschrijving || 'Naamloze impactanalyse';
        default:
            return 'Naamloos formulier';
    }
}

/**
 * Create new form
 */
function createNewForm(formType) {
    let form;
    switch(formType) {
        case 'intakeformulier':
            form = new Intakeformulier();
            break;
        case 'klein-project-mandaat':
            form = new KleinProjectMandaat();
            break;
        case 'ict-projectmandaat':
            form = new ICTProjectMandaat();
            break;
        case 'impactanalyse':
            form = new Impactanalyse();
            break;
        default:
            showToast('Onbekend formuliertype', 'error');
            router.navigate('/');
            return;
    }

    dataService.createForm(form.toJSON()).then(savedForm => {
        router.navigate(`/form/${formType}/${savedForm.id}`);
    });
}

/**
 * Load and render form
 */
async function loadForm(formType, formId) {
    const form = await dataService.getForm(formId);
    if (!form) {
        showToast('Formulier niet gevonden', 'error');
        router.navigate('/formulieren');
        return;
    }

    currentForm = form;
    renderForm(form);
    setupAutoSave();
}

/**
 * Render form based on type
 */
function renderForm(form) {
    const typeInfo = FORM_TYPES[form.formType] || { label: form.formType };
    const statusInfo = STATUS_LABELS[form.status] || STATUS_LABELS.draft;

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <div class="form-header">
                <div class="d-flex justify-between align-center flex-wrap gap-2">
                    <div>
                        <h1>${escapeHtml(getFormName(form))}</h1>
                        <div class="form-meta">
                            <span>${typeInfo.label}</span>
                            <span>|</span>
                            <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
                            <span>|</span>
                            <span>Laatst opgeslagen: <span id="last-saved">${formatDate(form.updatedAt, true)}</span></span>
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-secondary" onclick="shareForm()">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                            </svg>
                            Delen
                        </button>
                        <button class="btn btn-secondary" onclick="exportCurrentForm()">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div id="form-content">
                ${renderFormContent(form)}
            </div>

            <div class="form-actions-bar no-print">
                <div class="actions-left">
                    <a href="#/formulieren" class="btn btn-secondary">Terug naar overzicht</a>
                </div>
                <div class="actions-right">
                    <span class="save-status" id="save-status">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        Automatisch opgeslagen
                    </span>
                    <button class="btn btn-primary" onclick="saveForm()">Opslaan</button>
                </div>
            </div>
        </div>
    `;

    setupFormEvents();
}

/**
 * Render form content based on type
 */
function renderFormContent(form) {
    switch(form.formType) {
        case 'intakeformulier':
            return renderIntakeForm(form);
        case 'klein-project-mandaat':
            return renderKleinProjectMandaat(form);
        case 'ict-projectmandaat':
            return renderICTProjectMandaat(form);
        case 'impactanalyse':
            return renderImpactanalyse(form);
        default:
            return '<p>Onbekend formuliertype</p>';
    }
}

/**
 * Render Intakeformulier
 */
function renderIntakeForm(form) {
    return `
        <wl-form-section title="Basisinformatie" section-id="basisinfo">
            <div class="form-row">
                <div class="form-field">
                    <label class="required">Onderwerp</label>
                    <input type="text" class="form-input" data-path="basisinfo.onderwerp" value="${escapeHtml(form.basisinfo?.onderwerp || '')}">
                </div>
                <div class="form-field">
                    <label>Thinking Portfolio nummer</label>
                    <input type="text" class="form-input" data-path="basisinfo.thinkingPortfolioNummer" value="${escapeHtml(form.basisinfo?.thinkingPortfolioNummer || '')}">
                </div>
            </div>
            <div class="form-field">
                <label>Korte omschrijving aanvraag</label>
                <textarea class="form-textarea" data-path="basisinfo.korteOmschrijving">${escapeHtml(form.basisinfo?.korteOmschrijving || '')}</textarea>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label class="required">Aanvrager (voor- achternaam)</label>
                    <input type="text" class="form-input" data-path="basisinfo.aanvrager" value="${escapeHtml(form.basisinfo?.aanvrager || '')}">
                </div>
                <div class="form-field">
                    <label>Opdrachtgever (Teammanager)</label>
                    <input type="text" class="form-input" data-path="basisinfo.opdrachtgever" value="${escapeHtml(form.basisinfo?.opdrachtgever || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Domein / Team</label>
                    <input type="text" class="form-input" data-path="basisinfo.domeinTeam" value="${escapeHtml(form.basisinfo?.domeinTeam || '')}">
                </div>
                <div class="form-field">
                    <label>Datum van intake</label>
                    <input type="date" class="form-input" data-path="basisinfo.datumIntake" value="${form.basisinfo?.datumIntake || ''}">
                </div>
            </div>
            <wl-comment-panel section-id="basisinfo"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Vragenlijst" section-id="vragen">
            ${INTAKE_VRAGEN.map(vraag => renderVraag(vraag, form.vragen)).join('')}
            <wl-comment-panel section-id="vragen"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Stakeholders I-domein" section-id="stakeholders">
            <wl-stakeholder-table id="stakeholders-table" type="geinformeerd" editable></wl-stakeholder-table>
            <wl-comment-panel section-id="stakeholders"></wl-comment-panel>
        </wl-form-section>
    `;
}

/**
 * Render a single question
 */
function renderVraag(vraag, vragen) {
    const value = vragen?.[vraag.id] ?? '';

    let inputHtml = '';
    switch(vraag.type) {
        case 'textarea':
            inputHtml = `<textarea class="form-textarea rich-textarea" data-path="vragen.${vraag.id}">${escapeHtml(value)}</textarea>`;
            break;
        case 'text':
            inputHtml = `<input type="text" class="form-input" data-path="vragen.${vraag.id}" value="${escapeHtml(value)}">`;
            break;
        case 'date':
            inputHtml = `<input type="date" class="form-input" data-path="vragen.${vraag.id}" value="${value}">`;
            break;
        case 'select':
            inputHtml = `
                <select class="form-select" data-path="vragen.${vraag.id}">
                    <option value="">-- Selecteer --</option>
                    ${vraag.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            `;
            break;
        case 'boolean':
            inputHtml = `
                <div class="boolean-toggle">
                    <button type="button" class="boolean-btn ${value === true ? 'selected yes' : ''}" data-path="vragen.${vraag.id}" data-value="true">Ja</button>
                    <button type="button" class="boolean-btn ${value === false ? 'selected no' : ''}" data-path="vragen.${vraag.id}" data-value="false">Nee</button>
                </div>
            `;
            break;
        default:
            inputHtml = `<input type="text" class="form-input" data-path="vragen.${vraag.id}" value="${escapeHtml(value)}">`;
    }

    return `
        <div class="form-field">
            <label ${vraag.required ? 'class="required"' : ''}>${vraag.label}</label>
            <p class="help-text">${vraag.vraag}</p>
            ${inputHtml}
        </div>
    `;
}

/**
 * Render Klein Project Mandaat
 */
function renderKleinProjectMandaat(form) {
    return `
        <wl-form-section title="Documentgegevens" section-id="documentgegevens">
            <div class="form-row">
                <div class="form-field">
                    <label class="required">KKV Naam</label>
                    <input type="text" class="form-input" data-path="documentgegevens.kkvNaam" value="${escapeHtml(form.documentgegevens?.kkvNaam || '')}">
                </div>
                <div class="form-field">
                    <label>KKV Nummer</label>
                    <input type="text" class="form-input" data-path="documentgegevens.kkvNummer" value="${escapeHtml(form.documentgegevens?.kkvNummer || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Documentlocatie</label>
                    <input type="text" class="form-input" data-path="documentgegevens.documentlocatie" value="${escapeHtml(form.documentgegevens?.documentlocatie || '')}" placeholder="MS Teams link">
                </div>
                <div class="form-field">
                    <label>Datum</label>
                    <input type="date" class="form-input" data-path="documentgegevens.datum" value="${form.documentgegevens?.datum || ''}">
                </div>
            </div>
            <wl-comment-panel section-id="documentgegevens"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Het kleine klantverzoek (KKV)" section-id="kkv">
            ${KKV_SECTIES.map(sectie => renderSectie(sectie, form.kkv)).join('')}
            <wl-comment-panel section-id="kkv"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Planning & Businesscase" section-id="planning">
            <div class="form-row">
                <div class="form-field">
                    <label>Verwachte startdatum</label>
                    <input type="date" class="form-input" data-path="kkv.startdatum" value="${form.kkv?.startdatum || ''}">
                </div>
                <div class="form-field">
                    <label>Doorlooptijd</label>
                    <input type="text" class="form-input" data-path="kkv.doorlooptijd" value="${escapeHtml(form.kkv?.doorlooptijd || '')}">
                </div>
            </div>
            <h4>Businesscase op hoofdlijnen</h4>
            <div class="businesscase-grid">
                <div class="form-field">
                    <label>Eenmalige kosten</label>
                    <input type="text" class="form-input" data-path="kkv.businesscase.eenmaligeKosten" value="${escapeHtml(form.kkv?.businesscase?.eenmaligeKosten || '')}">
                </div>
                <div class="form-field">
                    <label>Structurele kosten</label>
                    <input type="text" class="form-input" data-path="kkv.businesscase.structureleKosten" value="${escapeHtml(form.kkv?.businesscase?.structureleKosten || '')}">
                </div>
                <div class="form-field">
                    <label>Baten</label>
                    <input type="text" class="form-input" data-path="kkv.businesscase.baten" value="${escapeHtml(form.kkv?.businesscase?.baten || '')}">
                </div>
            </div>
            <wl-comment-panel section-id="planning"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Review / Distributie" section-id="review">
            <wl-stakeholder-table id="review-table" type="akkoord" editable></wl-stakeholder-table>
            <wl-comment-panel section-id="review"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Mandaat Checklist" section-id="checklist">
            <wl-checklist id="mandaat-checklist"></wl-checklist>
            <wl-comment-panel section-id="checklist"></wl-comment-panel>
        </wl-form-section>
    `;
}

/**
 * Render a section based on type
 */
function renderSectie(sectie, data) {
    const value = data?.[sectie.id] ?? '';

    if (sectie.type === 'list') {
        const items = Array.isArray(value) ? value : [];
        return `
            <div class="form-field">
                <label ${sectie.required ? 'class="required"' : ''}>${sectie.label}</label>
                <p class="help-text">${sectie.description}</p>
                <div class="list-input" data-path="kkv.${sectie.id}">
                    ${items.map((item, i) => `
                        <div class="list-input-item">
                            <input type="text" class="form-input" value="${escapeHtml(item)}" data-index="${i}">
                            <button type="button" class="btn-icon delete" onclick="removeListItem(this)">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                    <button type="button" class="btn btn-secondary btn-sm add-item-btn" onclick="addListItem(this)">+ Item toevoegen</button>
                </div>
            </div>
        `;
    }

    return `
        <div class="form-field">
            <label ${sectie.required ? 'class="required"' : ''}>${sectie.label}</label>
            <p class="help-text">${sectie.description}</p>
            <textarea class="form-textarea rich-textarea" data-path="kkv.${sectie.id}">${escapeHtml(value)}</textarea>
        </div>
    `;
}

/**
 * Render ICT Projectmandaat (simplified for brevity)
 */
function renderICTProjectMandaat(form) {
    return `
        <wl-form-section title="Stakeholders I-domein (Akkoord)" section-id="stakeholders-akkoord">
            <wl-stakeholder-table id="stakeholders-akkoord-table" type="akkoord" editable></wl-stakeholder-table>
            <wl-comment-panel section-id="stakeholders-akkoord"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Documentgegevens" section-id="documentgegevens">
            <div class="form-row">
                <div class="form-field">
                    <label class="required">Projectnaam</label>
                    <input type="text" class="form-input" data-path="documentgegevens.projectnaam" value="${escapeHtml(form.documentgegevens?.projectnaam || '')}">
                </div>
                <div class="form-field">
                    <label>Projectnummer</label>
                    <input type="text" class="form-input" data-path="documentgegevens.projectnummer" value="${escapeHtml(form.documentgegevens?.projectnummer || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Auteur</label>
                    <input type="text" class="form-input" data-path="documentgegevens.auteur" value="${escapeHtml(form.documentgegevens?.auteur || '')}">
                </div>
                <div class="form-field">
                    <label>Documentlocatie</label>
                    <input type="text" class="form-input" data-path="documentgegevens.documentlocatie" value="${escapeHtml(form.documentgegevens?.documentlocatie || '')}">
                </div>
            </div>
            <wl-comment-panel section-id="documentgegevens"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Het ICT-projectmandaat" section-id="project">
            ${ICT_PROJECT_SECTIES.map(sectie => `
                <div class="form-field">
                    <label ${sectie.required ? 'class="required"' : ''}>${sectie.label}</label>
                    <p class="help-text">${sectie.description}</p>
                    <textarea class="form-textarea rich-textarea" data-path="project.${sectie.id}">${escapeHtml(form.project?.[sectie.id] || '')}</textarea>
                </div>
            `).join('')}
            <wl-comment-panel section-id="project"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Businesscase" section-id="businesscase">
            <div class="businesscase-grid">
                <div class="form-field">
                    <label>Eenmalige kosten</label>
                    <input type="text" class="form-input" data-path="businesscase.eenmaligeKosten" value="${escapeHtml(form.businesscase?.eenmaligeKosten || '')}">
                </div>
                <div class="form-field">
                    <label>Terugkerende kosten</label>
                    <input type="text" class="form-input" data-path="businesscase.terugkerendeKosten" value="${escapeHtml(form.businesscase?.terugkerendeKosten || '')}">
                </div>
                <div class="form-field">
                    <label>Opbrengst</label>
                    <input type="text" class="form-input" data-path="businesscase.opbrengst" value="${escapeHtml(form.businesscase?.opbrengst || '')}">
                </div>
            </div>
            <wl-comment-panel section-id="businesscase"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Mandaat Checklist" section-id="checklist">
            <wl-checklist id="mandaat-checklist"></wl-checklist>
            <wl-comment-panel section-id="checklist"></wl-comment-panel>
        </wl-form-section>
    `;
}

/**
 * Render Impactanalyse (simplified)
 */
function renderImpactanalyse(form) {
    return `
        <wl-form-section title="Header informatie" section-id="header">
            <div class="form-row">
                <div class="form-field">
                    <label class="required">TP-nummer</label>
                    <input type="text" class="form-input" data-path="header.tpNummer" value="${escapeHtml(form.header?.tpNummer || '')}">
                </div>
                <div class="form-field">
                    <label class="required">Omschrijving</label>
                    <input type="text" class="form-input" data-path="header.omschrijving" value="${escapeHtml(form.header?.omschrijving || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Informatiemanager</label>
                    <input type="text" class="form-input" data-path="header.informatiemanager" value="${escapeHtml(form.header?.informatiemanager || '')}">
                </div>
                <div class="form-field">
                    <label>Business Analist</label>
                    <input type="text" class="form-input" data-path="header.businessAnalist" value="${escapeHtml(form.header?.businessAnalist || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Startdatum</label>
                    <input type="date" class="form-input" data-path="header.startdatum" value="${form.header?.startdatum || ''}">
                </div>
                <div class="form-field">
                    <label>Prognose einddatum</label>
                    <input type="date" class="form-input" data-path="header.prognoseEinddatum" value="${form.header?.prognoseEinddatum || ''}">
                </div>
            </div>
            <wl-comment-panel section-id="header"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="1. Inleiding en scope" section-id="inleiding">
            <div class="form-field">
                <label class="required">Inleiding</label>
                <textarea class="form-textarea rich-textarea" data-path="inleidingScope.inleiding">${escapeHtml(form.inleidingScope?.inleiding || '')}</textarea>
            </div>
            <wl-comment-panel section-id="inleiding"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="2. Situatie omschrijving" section-id="situatie">
            <h4>Huidige situatie</h4>
            <div class="form-field">
                <label>Functioneel</label>
                <textarea class="form-textarea" data-path="situatie.huidig.functioneel">${escapeHtml(form.situatie?.huidig?.functioneel || '')}</textarea>
            </div>
            <div class="form-field">
                <label>Processen</label>
                <textarea class="form-textarea" data-path="situatie.huidig.processen">${escapeHtml(form.situatie?.huidig?.processen || '')}</textarea>
            </div>
            <h4>Gewenste situatie</h4>
            <div class="form-field">
                <label>Functioneel</label>
                <textarea class="form-textarea" data-path="situatie.gewenst.functioneel">${escapeHtml(form.situatie?.gewenst?.functioneel || '')}</textarea>
            </div>
            <div class="form-field">
                <label>Processen</label>
                <textarea class="form-textarea" data-path="situatie.gewenst.processen">${escapeHtml(form.situatie?.gewenst?.processen || '')}</textarea>
            </div>
            <wl-comment-panel section-id="situatie"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="3. Impact" section-id="impact">
            <div class="form-field">
                <label>Privacy & Security</label>
                <textarea class="form-textarea" data-path="impact.privacySecurity">${escapeHtml(form.impact?.privacySecurity || '')}</textarea>
            </div>
            <div class="form-field">
                <label>Architectuur</label>
                <textarea class="form-textarea" data-path="impact.architectuur">${escapeHtml(form.impact?.architectuur || '')}</textarea>
            </div>
            <div class="form-field">
                <label>Informatiebeheer</label>
                <textarea class="form-textarea" data-path="impact.informatiebeheer">${escapeHtml(form.impact?.informatiebeheer || '')}</textarea>
            </div>
            <div class="form-field">
                <label>Verwachte doorlooptijd</label>
                <textarea class="form-textarea" data-path="impact.doorlooptijd">${escapeHtml(form.impact?.doorlooptijd || '')}</textarea>
            </div>
            <wl-comment-panel section-id="impact"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="4. Samenvatting en advies" section-id="conclusie">
            <div class="form-field">
                <label class="required">Conclusie</label>
                <textarea class="form-textarea rich-textarea" data-path="conclusie">${escapeHtml(form.conclusie || '')}</textarea>
            </div>
            <div class="form-field">
                <label class="required">Advies</label>
                <textarea class="form-textarea rich-textarea" data-path="advies">${escapeHtml(form.advies || '')}</textarea>
            </div>
            <wl-comment-panel section-id="conclusie"></wl-comment-panel>
        </wl-form-section>

        <wl-form-section title="Stakeholders I-domein" section-id="stakeholders">
            <wl-stakeholder-table id="stakeholders-table" type="geinformeerd" editable></wl-stakeholder-table>
            <wl-comment-panel section-id="stakeholders"></wl-comment-panel>
        </wl-form-section>
    `;
}

/**
 * Setup form event listeners
 */
function setupFormEvents() {
    // Input changes
    document.querySelectorAll('[data-path]').forEach(input => {
        if (input.tagName === 'BUTTON') return;

        input.addEventListener('change', (e) => {
            updateFormValue(e.target.dataset.path, e.target.value);
        });

        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
            input.addEventListener('input', debounce((e) => {
                updateFormValue(e.target.dataset.path, e.target.value);
            }, 500));
        }
    });

    // Boolean toggles
    document.querySelectorAll('.boolean-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const path = e.target.dataset.path;
            const value = e.target.dataset.value === 'true';
            updateFormValue(path, value);

            // Update UI
            const container = e.target.closest('.boolean-toggle');
            container.querySelectorAll('.boolean-btn').forEach(b => {
                b.classList.remove('selected', 'yes', 'no');
            });
            e.target.classList.add('selected', value ? 'yes' : 'no');
        });
    });

    // Initialize stakeholder tables
    initializeStakeholderTables();

    // Initialize checklists
    initializeChecklists();

    // Initialize comment panels
    initializeCommentPanels();
}

/**
 * Initialize stakeholder tables with data
 */
function initializeStakeholderTables() {
    const tables = document.querySelectorAll('wl-stakeholder-table');
    tables.forEach(table => {
        const id = table.id;
        let data = [];

        if (id.includes('akkoord')) {
            data = currentForm.stakeholdersAkkoord || currentForm.reviewDistributie || [];
        } else {
            data = currentForm.stakeholders || currentForm.stakeholdersGeinformeerd || [];
        }

        table.data = data;

        table.addEventListener('change', (e) => {
            if (id.includes('akkoord')) {
                currentForm.stakeholdersAkkoord = e.detail.data;
            } else if (id === 'review-table') {
                currentForm.reviewDistributie = e.detail.data;
            } else {
                currentForm.stakeholders = e.detail.data;
            }
            triggerAutoSave();
        });
    });
}

/**
 * Initialize checklists with data
 */
function initializeChecklists() {
    const checklist = document.querySelector('wl-checklist');
    if (checklist && currentForm.mandaatChecklist) {
        checklist.items = currentForm.mandaatChecklist;

        checklist.addEventListener('change', (e) => {
            currentForm.mandaatChecklist = e.detail.items;
            triggerAutoSave();
        });
    }
}

/**
 * Initialize comment panels
 */
function initializeCommentPanels() {
    const panels = document.querySelectorAll('wl-comment-panel');
    panels.forEach(panel => {
        const sectionId = panel.getAttribute('section-id');
        const comments = (currentForm.comments || []).filter(c => c.sectionId === sectionId);
        panel.comments = comments;

        panel.addEventListener('comment-added', (e) => {
            if (!currentForm.comments) currentForm.comments = [];
            currentForm.comments.push(e.detail.comment);
            triggerAutoSave();
        });

        panel.addEventListener('comment-deleted', (e) => {
            const idx = currentForm.comments.findIndex(c => c.id === e.detail.comment.id);
            if (idx > -1) currentForm.comments.splice(idx, 1);
            triggerAutoSave();
        });
    });
}

/**
 * Update form value by path
 */
function updateFormValue(path, value) {
    const parts = path.split('.');
    let obj = currentForm;

    for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
    }

    obj[parts[parts.length - 1]] = value;
    triggerAutoSave();
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Setup auto-save
 */
function setupAutoSave() {
    // Clear existing timer
    if (autoSaveTimer) clearInterval(autoSaveTimer);
}

/**
 * Trigger auto-save
 */
function triggerAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveForm(true);
    }, 2000);
}

/**
 * Save form
 */
async function saveForm(isAutoSave = false) {
    if (!currentForm) return;

    await dataService.updateForm(currentForm.id, currentForm);

    const now = new Date();
    const lastSavedEl = document.getElementById('last-saved');
    if (lastSavedEl) {
        lastSavedEl.textContent = formatDate(now.toISOString(), true);
    }

    if (!isAutoSave) {
        showToast('Formulier opgeslagen', 'success');
    }
}

/**
 * Export current form
 */
window.exportCurrentForm = function() {
    if (!currentForm) return;

    const json = JSON.stringify(currentForm, null, 2);
    const filename = `${currentForm.formType}-${getFormName(currentForm).replace(/[^a-z0-9]/gi, '_')}.json`;
    downloadFile(json, filename);
    showToast('Formulier geëxporteerd', 'success');
};

/**
 * Export form by ID
 */
window.exportForm = async function(formId) {
    const form = await dataService.getForm(formId);
    if (!form) return;

    const json = JSON.stringify(form, null, 2);
    const filename = `${form.formType}-${getFormName(form).replace(/[^a-z0-9]/gi, '_')}.json`;
    downloadFile(json, filename);
    showToast('Formulier geëxporteerd', 'success');
};

/**
 * Delete form
 */
window.deleteForm = async function(formId) {
    if (!confirm('Weet je zeker dat je dit formulier wilt verwijderen?')) return;

    await dataService.deleteForm(formId);
    showToast('Formulier verwijderd', 'success');
    renderFormsList();
};

/**
 * Share form
 */
window.shareForm = function() {
    if (!currentForm) return;

    const url = UrlHelpers.generateShareUrl(currentForm.formType, currentForm.id);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Formulier delen</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p><strong>Optie 1: Deel de link</strong></p>
                <p class="text-muted" style="font-size: var(--wl-font-size-sm);">Let op: werkt alleen als de ontvanger ook toegang heeft tot deze browser/computer.</p>
                <div class="share-url-box">
                    <input type="text" value="${url}" readonly>
                    <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${url}'); this.textContent='Gekopieerd!'">Kopieer</button>
                </div>

                <hr style="margin: var(--wl-spacing-lg) 0; border: none; border-top: 1px solid var(--wl-gray-200);">

                <p><strong>Optie 2: Export als bestand</strong></p>
                <p class="text-muted" style="font-size: var(--wl-font-size-sm);">Download het formulier als JSON en deel het via email of Teams.</p>
                <button class="btn btn-secondary" onclick="exportCurrentForm()">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    Download JSON
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

/**
 * Handle file import
 */
async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const content = await readFileAsText(file);
        const formData = dataService.importFromJSON(content);

        // Save imported form
        const savedForm = await dataService.createForm(formData);

        showToast('Formulier geïmporteerd', 'success');
        router.navigate(`/form/${savedForm.formType}/${savedForm.id}`);
    } catch (err) {
        showToast('Fout bij importeren: ' + err.message, 'error');
    }

    e.target.value = '';
}

/**
 * List item helpers
 */
window.addListItem = function(btn) {
    const container = btn.closest('.list-input');
    const path = container.dataset.path;
    const newItem = document.createElement('div');
    newItem.className = 'list-input-item';
    newItem.innerHTML = `
        <input type="text" class="form-input" value="" data-index="${container.querySelectorAll('.list-input-item').length}">
        <button type="button" class="btn-icon delete" onclick="removeListItem(this)">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
        </button>
    `;
    container.insertBefore(newItem, btn);

    // Update form data
    updateListFromDOM(container, path);
};

window.removeListItem = function(btn) {
    const item = btn.closest('.list-input-item');
    const container = item.closest('.list-input');
    const path = container.dataset.path;
    item.remove();
    updateListFromDOM(container, path);
};

function updateListFromDOM(container, path) {
    const items = Array.from(container.querySelectorAll('.list-input-item input')).map(input => input.value);
    updateFormValue(path, items);
}

// Register routes
router
    .register('/', renderHome)
    .register('/formulieren', renderFormsList)
    .register('/new/:formType', (params) => createNewForm(params.formType))
    .register('/form/:formType/:formId', (params) => loadForm(params.formType, params.formId))
    .register('*', () => router.navigate('/'));

// Start app
document.addEventListener('DOMContentLoaded', () => {
    router.start();
});
