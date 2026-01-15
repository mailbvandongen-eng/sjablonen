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
import './components/wl-attachments.js';

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

// Import config
import { INFORMATIEMANAGERS, STAKEHOLDERS_IDOMEIN, INTAKE_STATUS, INTAKE_STATUS_LABELS } from './config.js';

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
        </div>
    `;
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
                        <button class="btn btn-primary" onclick="openAIAssistent()">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
                                <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                            </svg>
                            AI Assistent
                        </button>
                        ${form.formType === 'intakeformulier' ? `
                            <button class="btn btn-secondary" onclick="getSimpleIntakeLink()" title="Link voor aanvragers">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
                                </svg>
                                Aanvrager link
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="shareForm()">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                            </svg>
                            Delen
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
function renderIntakeForm(form, isKlantView = false) {
    const statusInfo = INTAKE_STATUS_LABELS[form.intakeStatus] || INTAKE_STATUS_LABELS[INTAKE_STATUS.DRAFT];
    const selectedIM = INFORMATIEMANAGERS.find(im => im.id === form.informatiemanager);

    // Filter vragen op basis van view
    const visibleVragen = isKlantView
        ? INTAKE_VRAGEN.filter(v => v.klantZichtbaar)
        : INTAKE_VRAGEN;

    return `
        ${!isKlantView ? `
        <wl-form-section title="Workflow" section-id="workflow" class="workflow-section">
            <div class="form-row">
                <div class="form-field">
                    <label class="required">Informatiemanager</label>
                    <select class="form-select" data-path="informatiemanager" onchange="updateIM(this.value)">
                        <option value="">-- Selecteer IM --</option>
                        ${INFORMATIEMANAGERS.map(im => `
                            <option value="${im.id}" ${form.informatiemanager === im.id ? 'selected' : ''}>${im.naam}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-field">
                    <label>Intake Status</label>
                    <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
                </div>
            </div>
            ${form.intakeStatus === INTAKE_STATUS.DRAFT ? `
                <div class="workflow-actions mt-2">
                    <button class="btn btn-primary" onclick="deelMetKlant()" ${!form.informatiemanager ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                        </svg>
                        Deel met klant
                    </button>
                </div>
            ` : ''}
            ${form.intakeStatus === INTAKE_STATUS.KLANT_GEREED ? `
                <div class="alert alert-info mt-2">
                    <strong>Klant heeft intake ingediend</strong> op ${form.klantIngediendOp ? formatDate(form.klantIngediendOp, true) : 'onbekend'}
                </div>
                <div class="workflow-actions mt-2">
                    <button class="btn btn-primary" onclick="naarInBehandeling()">In behandeling nemen</button>
                </div>
            ` : ''}
            ${form.intakeStatus === INTAKE_STATUS.IN_BEHANDELING ? `
                <div class="workflow-actions mt-2">
                    <button class="btn btn-primary" onclick="deelMetStakeholders()">
                        Deel met stakeholders
                    </button>
                </div>
            ` : ''}
            ${form.intakeStatus === INTAKE_STATUS.STAKEHOLDER_FEEDBACK ? `
                <div class="workflow-actions mt-2">
                    <button class="btn btn-primary" onclick="maakDefinitief()">Maak definitief</button>
                </div>
            ` : ''}
        </wl-form-section>
        ` : `
        <div class="alert alert-info mb-3">
            <strong>Welkom!</strong> Vul onderstaand formulier in. Als u klaar bent, klik dan onderaan op "Intake indienen".
        </div>
        `}

        <wl-form-section title="Basisinformatie" section-id="basisinfo">
            <div class="form-row">
                <div class="form-field">
                    <label class="required">Onderwerp</label>
                    <input type="text" class="form-input" data-path="basisinfo.onderwerp" value="${escapeHtml(form.basisinfo?.onderwerp || '')}">
                </div>
                ${!isKlantView ? `
                <div class="form-field">
                    <label>TP-nummer</label>
                    <input type="text" class="form-input" data-path="basisinfo.thinkingPortfolioNummer" value="${escapeHtml(form.basisinfo?.thinkingPortfolioNummer || '')}" placeholder="Thinking Portfolio nummer">
                </div>
                ` : ''}
            </div>
            <div class="form-field">
                <label>Korte omschrijving aanvraag</label>
                <textarea class="form-textarea" data-path="basisinfo.korteOmschrijving">${escapeHtml(form.basisinfo?.korteOmschrijving || '')}</textarea>
            </div>
            <div class="form-field">
                <label class="required">Doel van de aanvraag</label>
                <p class="help-text">Wat wil je bereiken met deze aanvraag?</p>
                <textarea class="form-textarea" data-path="basisinfo.doel">${escapeHtml(form.basisinfo?.doel || '')}</textarea>
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
        </wl-form-section>

        <wl-form-section title="${isKlantView ? 'Uw aanvraag' : 'Vragenlijst'}" section-id="vragen">
            ${visibleVragen.map(vraag => renderVraag(vraag, form.vragen, isKlantView)).join('')}
        </wl-form-section>

        ${!isKlantView ? `
        <wl-form-section title="Stakeholders I-domein" section-id="stakeholders">
            <p class="text-muted mb-2">Selecteer stakeholders voor review en akkoord.</p>
            <div class="stakeholder-checklist">
                ${(form.stakeholders || STAKEHOLDERS_IDOMEIN).map((s, idx) => `
                    <div class="stakeholder-check-item">
                        <label class="checkbox-label">
                            <input type="checkbox"
                                   data-stakeholder-idx="${idx}"
                                   ${s.geinformeerd ? 'checked' : ''}
                                   onchange="toggleStakeholder(${idx}, this.checked)">
                            <span class="stakeholder-details">
                                <strong>${escapeHtml(s.rol || s.team)}</strong>
                                <span>${escapeHtml(s.naam)} (${escapeHtml(s.email)})</span>
                            </span>
                        </label>
                        ${s.feedback ? `
                            <div class="stakeholder-feedback">
                                <span class="feedback-date">${formatDate(s.feedbackDatum, true)}</span>
                                <span class="feedback-text">${escapeHtml(s.feedback)}</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </wl-form-section>
        ` : ''}

        <wl-form-section title="Bijlagen" section-id="attachments">
            <wl-attachments id="form-attachments"></wl-attachments>
        </wl-form-section>

        ${isKlantView ? `
        <div class="klant-submit-section">
            <button class="btn btn-primary btn-lg" onclick="klantIndienenIntake()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                Intake indienen
            </button>
        </div>
        ` : ''}
    `;
}

/**
 * Render a single question
 */
function renderVraag(vraag, vragen, isKlantView = false) {
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

    // Initialize attachments
    initializeAttachments();
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
 * Initialize attachments component
 */
function initializeAttachments() {
    const attachments = document.querySelector('wl-attachments');
    if (attachments && currentForm) {
        attachments.links = currentForm.attachments?.links || [];
        attachments.documents = currentForm.attachments?.documents || [];

        attachments.addEventListener('change', (e) => {
            if (!currentForm.attachments) currentForm.attachments = {};
            currentForm.attachments.links = e.detail.links;
            currentForm.attachments.documents = e.detail.documents;
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
    const formName = getFormName(currentForm);

    // Verzamel stakeholders met email
    const stakeholders = getStakeholdersWithEmail();

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Formulier delen</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p><strong>Export als bestand</strong></p>
                <p class="text-muted" style="font-size: var(--wl-font-size-sm);">Download het formulier en verstuur als bijlage.</p>
                <button class="btn btn-secondary" onclick="exportCurrentForm()">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    Download JSON
                </button>

                ${stakeholders.length > 0 ? `
                    <div class="share-stakeholders">
                        <h4>Direct delen met stakeholders</h4>
                        <p class="text-muted" style="font-size: var(--wl-font-size-sm);">Klik op Email of Teams om direct een bericht te sturen.</p>
                        <div class="stakeholder-share-list">
                            ${stakeholders.map(s => {
                                const emailSubject = encodeURIComponent(`Verzoek om review: ${formName}`);
                                const emailBody = encodeURIComponent(`Beste ${s.naam},

Graag vraag ik je om het volgende formulier te reviewen en je feedback te geven:

Formulier: ${formName}
Type: ${FORM_TYPES[currentForm.formType]?.label || currentForm.formType}

Instructies:
1. Download het bijgevoegde JSON bestand
2. Ga naar de formulieren website
3. Klik op "Importeer JSON" op de startpagina
4. Review de gegevens en voeg je opmerkingen toe
5. Exporteer het formulier weer en stuur het terug

Met vriendelijke groet`);
                                const teamsMessage = encodeURIComponent(`Hoi ${s.naam}, kun je dit formulier reviewen? "${formName}" - Graag je feedback/akkoord. Bedankt!`);

                                return `
                                    <div class="stakeholder-share-item">
                                        <div class="stakeholder-info">
                                            <span class="stakeholder-name">${escapeHtml(s.naam)} (${escapeHtml(s.team)})</span>
                                            <span class="stakeholder-email">${escapeHtml(s.email)}</span>
                                        </div>
                                        <div class="share-buttons">
                                            <a href="mailto:${s.email}?subject=${emailSubject}&body=${emailBody}" class="btn-email" title="Open in Outlook">
                                                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                                </svg>
                                                Email
                                            </a>
                                            <a href="https://teams.microsoft.com/l/chat/0/0?users=${s.email}&message=${teamsMessage}" target="_blank" class="btn-teams" title="Open in Teams">
                                                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clip-rule="evenodd"/>
                                                </svg>
                                                Teams
                                            </a>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="mt-2">
                            <button class="btn btn-primary btn-sm" onclick="shareWithAllStakeholders()">
                                Alle stakeholders mailen
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="alert alert-info mt-3">
                        <strong>Tip:</strong> Voeg email adressen toe aan de stakeholders om direct te kunnen delen via Email of Teams.
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

/**
 * Get all stakeholders with email addresses
 */
function getStakeholdersWithEmail() {
    const stakeholders = [];
    const seen = new Set();

    // Verzamel uit verschillende stakeholder arrays
    const sources = [
        currentForm.stakeholders,
        currentForm.stakeholdersAkkoord,
        currentForm.stakeholdersGeinformeerd,
        currentForm.reviewDistributie
    ];

    sources.forEach(source => {
        if (Array.isArray(source)) {
            source.forEach(s => {
                if (s.email && s.naam && !seen.has(s.email)) {
                    seen.add(s.email);
                    stakeholders.push(s);
                }
            });
        }
    });

    return stakeholders;
}

/**
 * Share with all stakeholders at once
 */
window.shareWithAllStakeholders = function() {
    const stakeholders = getStakeholdersWithEmail();
    if (stakeholders.length === 0) return;

    const emails = stakeholders.map(s => s.email).join(';');
    const formName = getFormName(currentForm);
    const subject = encodeURIComponent(`Verzoek om review: ${formName}`);
    const body = encodeURIComponent(`Beste collega's,

Graag vraag ik jullie om het volgende formulier te reviewen:

Formulier: ${formName}
Type: ${FORM_TYPES[currentForm.formType]?.label || currentForm.formType}

Instructies:
1. Download het bijgevoegde JSON bestand
2. Ga naar de formulieren website
3. Klik op "Importeer JSON"
4. Review en voeg je opmerkingen toe
5. Exporteer en stuur terug

Met vriendelijke groet`);

    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
};

/**
 * Open AI Assistent modal
 */
window.openAIAssistent = function() {
    if (!currentForm) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'ai-assistent-modal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3>AI Assistent</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="ai-assistent-steps">
                    <!-- Stap 1: Context invoeren -->
                    <div class="ai-step" id="ai-step-1">
                        <h4>Stap 1: Voeg context toe</h4>
                        <p class="text-muted">Plak hier alle relevante informatie: emails, notities, documenten, etc.</p>
                        <textarea id="ai-context-input" class="form-textarea" style="min-height: 200px;" placeholder="Plak hier de tekst van emails, documenten, notities of andere informatie die je wilt gebruiken om het formulier in te vullen..."></textarea>
                        <div class="mt-2">
                            <button class="btn btn-primary" onclick="generateAIPrompt()">
                                Genereer prompt voor AI
                            </button>
                        </div>
                    </div>

                    <!-- Stap 2: Prompt kopiëren -->
                    <div class="ai-step" id="ai-step-2" style="display: none;">
                        <h4>Stap 2: Kopieer prompt naar ChatGPT/Copilot</h4>
                        <p class="text-muted">Kopieer onderstaande prompt en plak deze in ChatGPT, Copilot, of een andere AI.</p>
                        <textarea id="ai-generated-prompt" class="form-textarea" style="min-height: 250px; font-family: monospace; font-size: 12px;" readonly></textarea>
                        <div class="mt-2 d-flex gap-1">
                            <button class="btn btn-primary" onclick="copyAIPrompt()">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                                </svg>
                                Kopieer prompt
                            </button>
                            <button class="btn btn-secondary" onclick="showAIStep(3)">
                                Volgende: AI antwoord plakken
                            </button>
                            <button class="btn btn-secondary" onclick="showAIStep(1)">
                                Terug
                            </button>
                        </div>
                    </div>

                    <!-- Stap 3: AI antwoord plakken -->
                    <div class="ai-step" id="ai-step-3" style="display: none;">
                        <h4>Stap 3: Plak het AI antwoord</h4>
                        <p class="text-muted">Kopieer het volledige antwoord van de AI (inclusief de JSON) en plak het hieronder.</p>
                        <textarea id="ai-response-input" class="form-textarea" style="min-height: 250px; font-family: monospace; font-size: 12px;" placeholder="Plak hier het volledige AI antwoord..."></textarea>
                        <div class="mt-2 d-flex gap-1">
                            <button class="btn btn-primary" onclick="applyAIResponse()">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                </svg>
                                Formulier invullen
                            </button>
                            <button class="btn btn-secondary" onclick="showAIStep(2)">
                                Terug
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

/**
 * Show specific AI step
 */
window.showAIStep = function(step) {
    document.querySelectorAll('.ai-step').forEach(el => el.style.display = 'none');
    document.getElementById(`ai-step-${step}`).style.display = 'block';
};

/**
 * Generate AI prompt based on form type and context
 */
window.generateAIPrompt = function() {
    const context = document.getElementById('ai-context-input').value;
    if (!context.trim()) {
        showToast('Voer eerst context informatie in', 'error');
        return;
    }

    const formType = currentForm.formType;
    const formStructure = getFormStructureForPrompt(formType);

    const prompt = `Je bent een assistent die helpt bij het invullen van formulieren voor Gemeente Westland.

TAAK: Analyseer de onderstaande informatie en vul het ${FORM_TYPES[formType]?.label || formType} formulier in.

FORMULIER STRUCTUUR:
${formStructure}

CONTEXT INFORMATIE:
---
${context}
---

INSTRUCTIES:
1. Analyseer de context informatie zorgvuldig
2. Extraheer relevante gegevens voor elk veld
3. Als informatie ontbreekt, laat het veld leeg (null)
4. Geef je antwoord als valide JSON in het volgende formaat

ANTWOORD FORMAT (alleen JSON, geen andere tekst):
\`\`\`json
${getFormJSONTemplate(formType)}
\`\`\`

Vul de JSON in met de geëxtraheerde informatie. Gebruik null voor ontbrekende velden.`;

    document.getElementById('ai-generated-prompt').value = prompt;
    showAIStep(2);
};

/**
 * Get form structure description for prompt
 */
function getFormStructureForPrompt(formType) {
    switch(formType) {
        case 'intakeformulier':
            return `- basisinfo: onderwerp, aanvrager, opdrachtgever, domeinTeam, korteOmschrijving, datumIntake
- vragen:
  - inleiding: Aanleiding/inleiding van de aanvraag
  - doel: Wat wil de aanvrager bereiken?
  - huidigeSituatie: Beschrijving huidige situatie
  - gewensteSituatie: Beschrijving gewenste situatie
  - scope: Wat valt binnen/buiten scope?
  - randvoorwaarden: Randvoorwaarden en uitgangspunten
  - afhankelijkheden: Afhankelijkheden met andere projecten
  - risicos: Bekende risico's
  - planning: Gewenste planning/deadline`;

        case 'klein-project-mandaat':
            return `- documentgegevens: kkvNaam, kkvNummer, datum, documentlocatie
- kkv:
  - aanleiding: Waarom dit verzoek?
  - doel: Wat willen we bereiken?
  - scope: Wat valt binnen/buiten scope?
  - oplossingsrichting: Voorgestelde oplossing
  - startdatum, doorlooptijd
  - businesscase: eenmaligeKosten, structureleKosten, baten`;

        case 'ict-projectmandaat':
            return `- documentgegevens: projectnaam, projectnummer, auteur, documentlocatie
- project:
  - aanleiding: Waarom dit project?
  - doelstelling: Wat willen we bereiken?
  - scope: Wat valt binnen/buiten scope?
  - resultaat: Verwachte resultaten
  - risicos: Bekende risico's
- businesscase: eenmaligeKosten, terugkerendeKosten, opbrengst`;

        case 'impactanalyse':
            return `- header: tpNummer, omschrijving, informatiemanager, businessAnalist, startdatum, prognoseEinddatum
- inleidingScope: inleiding
- situatie:
  - huidig: functioneel, processen
  - gewenst: functioneel, processen
- impact: privacySecurity, architectuur, informatiebeheer, doorlooptijd
- conclusie, advies`;

        default:
            return 'Onbekend formuliertype';
    }
}

/**
 * Get JSON template for form type
 */
function getFormJSONTemplate(formType) {
    switch(formType) {
        case 'intakeformulier':
            return `{
  "basisinfo": {
    "onderwerp": "string of null",
    "aanvrager": "string of null",
    "opdrachtgever": "string of null",
    "domeinTeam": "string of null",
    "korteOmschrijving": "string of null",
    "datumIntake": "YYYY-MM-DD of null"
  },
  "vragen": {
    "inleiding": "string of null",
    "doel": "string of null",
    "huidigeSituatie": "string of null",
    "gewensteSituatie": "string of null",
    "scope": "string of null",
    "randvoorwaarden": "string of null",
    "afhankelijkheden": "string of null",
    "risicos": "string of null",
    "planning": "string of null"
  }
}`;

        case 'klein-project-mandaat':
            return `{
  "documentgegevens": {
    "kkvNaam": "string of null",
    "kkvNummer": "string of null",
    "datum": "YYYY-MM-DD of null"
  },
  "kkv": {
    "aanleiding": "string of null",
    "doel": "string of null",
    "scope": "string of null",
    "oplossingsrichting": "string of null",
    "startdatum": "YYYY-MM-DD of null",
    "doorlooptijd": "string of null",
    "businesscase": {
      "eenmaligeKosten": "string of null",
      "structureleKosten": "string of null",
      "baten": "string of null"
    }
  }
}`;

        case 'ict-projectmandaat':
            return `{
  "documentgegevens": {
    "projectnaam": "string of null",
    "projectnummer": "string of null",
    "auteur": "string of null"
  },
  "project": {
    "aanleiding": "string of null",
    "doelstelling": "string of null",
    "scope": "string of null",
    "resultaat": "string of null",
    "risicos": "string of null"
  },
  "businesscase": {
    "eenmaligeKosten": "string of null",
    "terugkerendeKosten": "string of null",
    "opbrengst": "string of null"
  }
}`;

        case 'impactanalyse':
            return `{
  "header": {
    "tpNummer": "string of null",
    "omschrijving": "string of null",
    "informatiemanager": "string of null",
    "businessAnalist": "string of null",
    "startdatum": "YYYY-MM-DD of null",
    "prognoseEinddatum": "YYYY-MM-DD of null"
  },
  "inleidingScope": {
    "inleiding": "string of null"
  },
  "situatie": {
    "huidig": { "functioneel": "string of null", "processen": "string of null" },
    "gewenst": { "functioneel": "string of null", "processen": "string of null" }
  },
  "impact": {
    "privacySecurity": "string of null",
    "architectuur": "string of null",
    "informatiebeheer": "string of null",
    "doorlooptijd": "string of null"
  },
  "conclusie": "string of null",
  "advies": "string of null"
}`;

        default:
            return '{}';
    }
}

/**
 * Copy AI prompt to clipboard
 */
window.copyAIPrompt = function() {
    const prompt = document.getElementById('ai-generated-prompt').value;
    navigator.clipboard.writeText(prompt).then(() => {
        showToast('Prompt gekopieerd! Plak in ChatGPT of Copilot.', 'success');
    });
};

/**
 * Apply AI response to form
 */
window.applyAIResponse = function() {
    const response = document.getElementById('ai-response-input').value;

    // Try to extract JSON from response
    let jsonData = null;

    // Try to find JSON in code block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            jsonData = JSON.parse(jsonMatch[1]);
        } catch (e) {
            // Continue to next method
        }
    }

    // Try to find raw JSON object
    if (!jsonData) {
        const rawJsonMatch = response.match(/\{[\s\S]*\}/);
        if (rawJsonMatch) {
            try {
                jsonData = JSON.parse(rawJsonMatch[0]);
            } catch (e) {
                // Continue
            }
        }
    }

    if (!jsonData) {
        showToast('Kon geen geldige JSON vinden in het antwoord', 'error');
        return;
    }

    // Merge AI data into current form
    mergeAIDataIntoForm(jsonData);

    // Close modal
    document.getElementById('ai-assistent-modal')?.remove();

    // Re-render form
    renderForm(currentForm);
    setupAutoSave();

    showToast('Formulier ingevuld met AI gegevens!', 'success');
};

/**
 * Merge AI data into current form
 */
function mergeAIDataIntoForm(aiData) {
    // Deep merge function
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] === null || source[key] === 'null' || source[key] === 'string of null') {
                continue; // Skip null values
            }
            if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    deepMerge(currentForm, aiData);
}

/**
 * Handle file import (global, from hamburger menu)
 */
window.handleGlobalImport = async function(e) {
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
};

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

/**
 * Load simple intake form (for requesters)
 */
async function loadSimpleIntake(formId) {
    const form = await dataService.getForm(formId);
    if (!form || form.formType !== 'intakeformulier') {
        showToast('Formulier niet gevonden of geen intakeformulier', 'error');
        router.navigate('/');
        return;
    }

    currentForm = form;
    renderSimpleIntake(form);
    setupFormEvents();
}

/**
 * Render simplified intake form for requesters
 */
function renderSimpleIntake(form) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <div class="form-header">
                <h1>Intakeformulier - Aanvraag</h1>
                <p class="text-muted">Vul onderstaande gegevens in om een nieuwe aanvraag te starten.</p>
            </div>

            <div class="alert alert-info">
                <strong>Let op:</strong> Dit is een vereenvoudigd formulier. Vul de basisgegevens in, een informatiemanager zal contact met je opnemen voor verdere details.
            </div>

            <wl-form-section title="Jouw gegevens" section-id="aanvrager">
                <div class="form-row">
                    <div class="form-field">
                        <label class="required">Je naam</label>
                        <input type="text" class="form-input" data-path="basisinfo.aanvrager" value="${escapeHtml(form.basisinfo?.aanvrager || '')}">
                    </div>
                    <div class="form-field">
                        <label>Je team / afdeling</label>
                        <input type="text" class="form-input" data-path="basisinfo.domeinTeam" value="${escapeHtml(form.basisinfo?.domeinTeam || '')}">
                    </div>
                </div>
            </wl-form-section>

            <wl-form-section title="Je aanvraag" section-id="aanvraag">
                <div class="form-field">
                    <label class="required">Onderwerp / titel</label>
                    <input type="text" class="form-input" data-path="basisinfo.onderwerp" value="${escapeHtml(form.basisinfo?.onderwerp || '')}" placeholder="Korte titel voor je aanvraag">
                </div>
                <div class="form-field">
                    <label class="required">Wat wil je bereiken?</label>
                    <p class="help-text">Beschrijf in eigen woorden wat je nodig hebt</p>
                    <textarea class="form-textarea rich-textarea" data-path="vragen.doel">${escapeHtml(form.vragen?.doel || '')}</textarea>
                </div>
                <div class="form-field">
                    <label>Waarom is dit nodig?</label>
                    <p class="help-text">Wat is de aanleiding voor deze aanvraag?</p>
                    <textarea class="form-textarea" data-path="vragen.inleiding">${escapeHtml(form.vragen?.inleiding || '')}</textarea>
                </div>
                <div class="form-field">
                    <label>Huidige situatie</label>
                    <p class="help-text">Hoe werkt het nu?</p>
                    <textarea class="form-textarea" data-path="vragen.huidigeSituatie">${escapeHtml(form.vragen?.huidigeSituatie || '')}</textarea>
                </div>
                <div class="form-field">
                    <label>Gewenste situatie</label>
                    <p class="help-text">Hoe zou je willen dat het werkt?</p>
                    <textarea class="form-textarea" data-path="vragen.gewensteSituatie">${escapeHtml(form.vragen?.gewensteSituatie || '')}</textarea>
                </div>
            </wl-form-section>

            <wl-form-section title="Extra informatie" section-id="extra">
                <div class="form-field">
                    <label>Wie kunnen we benaderen voor vragen?</label>
                    <input type="text" class="form-input" data-path="vragen.contactpersoon" value="${escapeHtml(form.vragen?.contactpersoon || '')}">
                </div>
                <div class="form-field">
                    <label>Opmerkingen</label>
                    <textarea class="form-textarea" data-path="vragen.opmerkingen">${escapeHtml(form.vragen?.opmerkingen || '')}</textarea>
                </div>
            </wl-form-section>

            <wl-form-section title="Bijlagen" section-id="attachments">
                <wl-attachments id="form-attachments"></wl-attachments>
            </wl-form-section>

            <div class="form-actions-bar no-print">
                <div class="actions-left">
                    <span class="save-status" id="save-status">Automatisch opgeslagen</span>
                </div>
                <div class="actions-right">
                    <button class="btn btn-primary" onclick="submitSimpleIntake()">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        Aanvraag indienen
                    </button>
                </div>
            </div>
        </div>
    `;

    // Initialize attachments
    setTimeout(() => {
        initializeAttachments();
    }, 100);
}

/**
 * Submit simple intake
 */
window.submitSimpleIntake = async function() {
    if (!currentForm) return;

    // Basic validation
    if (!currentForm.basisinfo?.aanvrager || !currentForm.basisinfo?.onderwerp || !currentForm.vragen?.doel) {
        showToast('Vul alle verplichte velden in (naam, onderwerp, doel)', 'error');
        return;
    }

    currentForm.status = 'in_review';
    currentForm.submittedAt = new Date().toISOString();
    await dataService.updateForm(currentForm.id, currentForm);

    showToast('Aanvraag ingediend! Je ontvangt bericht.', 'success');

    // Export for sharing
    const json = JSON.stringify(currentForm, null, 2);
    const filename = `intake-${currentForm.basisinfo.onderwerp.replace(/[^a-z0-9]/gi, '_')}.json`;
    downloadFile(json, filename);

    showToast('Download het bestand en stuur het naar je informatiemanager', 'info');
};

/**
 * Generate simple intake link
 */
window.getSimpleIntakeLink = function() {
    if (!currentForm) return;
    const url = window.location.origin + window.location.pathname + '#/intake-simple/' + currentForm.id;
    navigator.clipboard.writeText(url);
    showToast('Link gekopieerd! Deel deze met de aanvrager.', 'success');
    return url;
};

// ==========================================
// INTAKE WORKFLOW FUNCTIES
// ==========================================

/**
 * Update informatiemanager
 */
window.updateIM = function(imId) {
    if (!currentForm) return;
    currentForm.informatiemanager = imId;
    triggerAutoSave();
};

/**
 * Toggle stakeholder selectie
 */
window.toggleStakeholder = function(idx, checked) {
    if (!currentForm || !currentForm.stakeholders) return;
    currentForm.stakeholders[idx].geinformeerd = checked;
    triggerAutoSave();
};

/**
 * Deel intake met klant
 */
window.deelMetKlant = function() {
    if (!currentForm || !currentForm.informatiemanager) {
        showToast('Selecteer eerst een informatiemanager', 'error');
        return;
    }

    // Genereer unieke klant token
    currentForm.klantToken = generateToken();
    currentForm.intakeStatus = INTAKE_STATUS.WACHT_OP_KLANT;

    saveForm().then(() => {
        const klantUrl = window.location.origin + window.location.pathname + '#/klant-intake/' + currentForm.id + '/' + currentForm.klantToken;
        const onderwerp = currentForm.basisinfo?.onderwerp || 'Nieuwe aanvraag';

        const emailSubject = encodeURIComponent(`Intake formulier: ${onderwerp}`);
        const emailBody = encodeURIComponent(`Beste,

Graag wil ik je vragen om het intake formulier in te vullen voor: ${onderwerp}

Klik op onderstaande link om het formulier te openen:
${klantUrl}

Na het invullen klik je op "Indienen" onderaan het formulier.

Met vriendelijke groet`);

        // Toon modal met link
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'deel-klant-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Deel met klant</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-field">
                        <label class="form-label">E-mailadres klant</label>
                        <input type="email" class="form-input" id="klant-email-input" placeholder="naam@organisatie.nl">
                    </div>

                    <div class="share-buttons mt-3">
                        <button class="btn btn-primary btn-block" id="btn-send-email" onclick="window.sendKlantEmail()">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 8px;">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                            Verstuur via e-mail
                        </button>
                        <button class="btn btn-secondary btn-block mt-2" onclick="window.sendKlantTeams()">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 8px;">
                                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                            </svg>
                            Open in Teams chat
                        </button>
                    </div>

                    <div class="divider mt-3 mb-3">
                        <span>of kopieer de link</span>
                    </div>

                    <div class="form-field">
                        <div class="input-with-button">
                            <input type="text" class="form-input" value="${klantUrl}" readonly id="klant-link-input">
                            <button class="btn btn-sm" onclick="navigator.clipboard.writeText('${klantUrl}'); showToast('Link gekopieerd!', 'success');">
                                Kopieer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        // Focus op email input
        setTimeout(() => document.getElementById('klant-email-input')?.focus(), 100);

        // Store URL for sharing functions
        window._klantShareUrl = klantUrl;
        window._klantShareSubject = `Intake formulier: ${onderwerp}`;
        window._klantShareBody = `Beste,

Graag wil ik je vragen om het intake formulier in te vullen voor: ${onderwerp}

Klik op onderstaande link om het formulier te openen:
${klantUrl}

Na het invullen klik je op "Indienen" onderaan het formulier.

Met vriendelijke groet`;

        renderForm(currentForm);
    });
};

window.sendKlantEmail = function() {
    const email = document.getElementById('klant-email-input')?.value;
    if (!email) {
        showToast('Vul een e-mailadres in', 'error');
        return;
    }

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(window._klantShareSubject)}&body=${encodeURIComponent(window._klantShareBody)}`;
    window.location.href = mailtoUrl;

    document.getElementById('deel-klant-modal')?.remove();
    showToast('E-mail wordt geopend...', 'success');
};

window.sendKlantTeams = function() {
    const email = document.getElementById('klant-email-input')?.value;
    const message = encodeURIComponent(window._klantShareBody);

    // Teams deep link voor chat
    let teamsUrl;
    if (email) {
        // Open chat met specifieke persoon
        teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}&message=${message}`;
    } else {
        // Open Teams met message in clipboard
        navigator.clipboard.writeText(window._klantShareBody);
        showToast('Bericht gekopieerd! Plak in Teams chat.', 'success');
        teamsUrl = 'https://teams.microsoft.com/';
    }

    window.open(teamsUrl, '_blank');
    document.getElementById('deel-klant-modal')?.remove();
};

/**
 * Generate random token
 */
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Klant dient intake in
 */
window.klantIndienenIntake = async function() {
    if (!currentForm) return;

    // Validatie
    if (!currentForm.basisinfo?.onderwerp || !currentForm.basisinfo?.aanvrager || !currentForm.basisinfo?.doel) {
        showToast('Vul alle verplichte velden in (onderwerp, aanvrager, doel)', 'error');
        return;
    }

    currentForm.intakeStatus = INTAKE_STATUS.KLANT_GEREED;
    currentForm.klantIngediendOp = new Date().toISOString();

    await saveForm();

    showToast('Intake ingediend! De informatiemanager neemt contact met u op.', 'success');

    // Toon bevestiging
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container" style="padding-top: 3rem;">
            <div class="card" style="text-align: center; max-width: 600px; margin: 0 auto;">
                <div style="font-size: 4rem; color: var(--wl-success); margin-bottom: 1rem;">✓</div>
                <h2>Intake ingediend!</h2>
                <p>Bedankt voor het invullen van het formulier.</p>
                <p class="text-muted">De informatiemanager zal uw aanvraag beoordelen en contact met u opnemen.</p>
                <p class="mt-3"><strong>Referentie:</strong> ${currentForm.basisinfo?.onderwerp}</p>
            </div>
        </div>
    `;
};

/**
 * Neem intake in behandeling
 */
window.naarInBehandeling = async function() {
    if (!currentForm) return;
    currentForm.intakeStatus = INTAKE_STATUS.IN_BEHANDELING;
    await saveForm();
    renderForm(currentForm);
    showToast('Intake in behandeling genomen', 'success');
};

/**
 * Deel met stakeholders
 */
window.deelMetStakeholders = async function() {
    if (!currentForm) return;

    const selectedStakeholders = currentForm.stakeholders?.filter(s => s.geinformeerd) || [];
    if (selectedStakeholders.length === 0) {
        showToast('Selecteer eerst stakeholders', 'error');
        return;
    }

    currentForm.intakeStatus = INTAKE_STATUS.WACHT_OP_STAKEHOLDERS;
    await saveForm();

    // Maak email links
    const formName = currentForm.basisinfo?.onderwerp || 'Intake';
    const emails = selectedStakeholders.map(s => s.email).join(';');
    const subject = encodeURIComponent(`Review verzoek: ${formName}`);
    const body = encodeURIComponent(`Beste collega,

Graag vraag ik je om onderstaande intake te reviewen:

Onderwerp: ${formName}
Aanvrager: ${currentForm.basisinfo?.aanvrager || '-'}
Doel: ${currentForm.basisinfo?.doel || '-'}

Geef je feedback door te reageren op deze email.

Met vriendelijke groet`);

    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;

    renderForm(currentForm);
    showToast('Email geopend voor stakeholders', 'success');
};

/**
 * Maak intake definitief
 */
window.maakDefinitief = async function() {
    if (!currentForm) return;
    currentForm.intakeStatus = INTAKE_STATUS.DEFINITIEF;
    await saveForm();
    renderForm(currentForm);
    showToast('Intake is nu definitief', 'success');
};

/**
 * Laad klant intake view
 */
async function loadKlantIntake(formId, token) {
    const form = await dataService.getForm(formId);
    if (!form || form.klantToken !== token) {
        showToast('Ongeldige of verlopen link', 'error');
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container" style="padding-top: 3rem;">
                <div class="card" style="text-align: center;">
                    <h2>Link ongeldig</h2>
                    <p>Deze link is niet geldig of is verlopen. Neem contact op met de informatiemanager.</p>
                </div>
            </div>
        `;
        return;
    }

    // Check of al ingediend
    if (form.intakeStatus !== INTAKE_STATUS.WACHT_OP_KLANT) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container" style="padding-top: 3rem;">
                <div class="card" style="text-align: center;">
                    <h2>Intake al ingediend</h2>
                    <p>Dit formulier is al ingediend. Neem contact op met de informatiemanager voor wijzigingen.</p>
                </div>
            </div>
        `;
        return;
    }

    currentForm = form;
    renderKlantIntakeView(form);
    setupFormEvents();
}

/**
 * Render klant intake view
 */
function renderKlantIntakeView(form) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <div class="form-header">
                <h1>Intake Formulier</h1>
                <p class="text-muted">${form.basisinfo?.onderwerp || 'Nieuwe aanvraag'}</p>
            </div>

            <div id="form-content">
                ${renderIntakeForm(form, true)}
            </div>

            <div class="form-actions-bar no-print">
                <div class="actions-left"></div>
                <div class="actions-right">
                    <span class="save-status" id="save-status">Automatisch opgeslagen</span>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// WERKVOORRAAD DASHBOARD
// ==========================================

/**
 * Render werkvoorraad dashboard
 */
async function renderWerkvoorraad() {
    const forms = await dataService.listForms();
    const intakes = forms.filter(f => f.formType === 'intakeformulier');

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="page-header">
            <div class="container">
                <h1>Werkvoorraad</h1>
                <p>Overzicht van intakes per status</p>
            </div>
        </div>
        <div class="container">
            <div class="werkvoorraad-filters mb-3">
                <label>Filter op IM:</label>
                <select id="im-filter" class="form-select" style="width: auto; display: inline-block;" onchange="filterWerkvoorraad()">
                    <option value="">Alle</option>
                    ${INFORMATIEMANAGERS.map(im => `<option value="${im.id}">${im.naam}</option>`).join('')}
                </select>
            </div>

            <div class="werkvoorraad-grid" id="werkvoorraad-content">
                ${renderWerkvoorraadContent(intakes, '')}
            </div>
        </div>
    `;
}

function renderWerkvoorraadContent(intakes, filterIM) {
    const filtered = filterIM
        ? intakes.filter(f => f.informatiemanager === filterIM)
        : intakes;

    const statusGroups = {
        [INTAKE_STATUS.KLANT_GEREED]: { title: 'Terug van klant', items: [], class: 'urgent' },
        [INTAKE_STATUS.STAKEHOLDER_FEEDBACK]: { title: 'Feedback stakeholders', items: [], class: 'urgent' },
        [INTAKE_STATUS.DRAFT]: { title: 'Concept', items: [], class: '' },
        [INTAKE_STATUS.WACHT_OP_KLANT]: { title: 'Wacht op klant', items: [], class: 'waiting' },
        [INTAKE_STATUS.IN_BEHANDELING]: { title: 'In behandeling', items: [], class: '' },
        [INTAKE_STATUS.WACHT_OP_STAKEHOLDERS]: { title: 'Wacht op stakeholders', items: [], class: 'waiting' },
        [INTAKE_STATUS.DEFINITIEF]: { title: 'Definitief', items: [], class: 'done' }
    };

    filtered.forEach(form => {
        const status = form.intakeStatus || INTAKE_STATUS.DRAFT;
        if (statusGroups[status]) {
            statusGroups[status].items.push(form);
        }
    });

    return Object.entries(statusGroups).map(([status, group]) => `
        <div class="werkvoorraad-column ${group.class}">
            <div class="column-header">
                <h3>${group.title}</h3>
                <span class="count">${group.items.length}</span>
            </div>
            <div class="column-items">
                ${group.items.length === 0 ? '<p class="text-muted">Geen items</p>' : ''}
                ${group.items.map(form => {
                    const im = INFORMATIEMANAGERS.find(i => i.id === form.informatiemanager);
                    return `
                        <a href="#/form/intakeformulier/${form.id}" class="werkvoorraad-item">
                            <div class="item-title">${escapeHtml(form.basisinfo?.onderwerp || 'Naamloos')}</div>
                            <div class="item-meta">
                                <span>${escapeHtml(form.basisinfo?.aanvrager || '-')}</span>
                                ${im ? `<span class="im-badge">${im.naam}</span>` : ''}
                            </div>
                            <div class="item-date">${formatDate(form.updatedAt)}</div>
                        </a>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

window.filterWerkvoorraad = async function() {
    const filterIM = document.getElementById('im-filter').value;
    const forms = await dataService.listForms();
    const intakes = forms.filter(f => f.formType === 'intakeformulier');
    document.getElementById('werkvoorraad-content').innerHTML = renderWerkvoorraadContent(intakes, filterIM);
};

// Register routes
router
    .register('/', renderHome)
    .register('/formulieren', renderFormsList)
    .register('/werkvoorraad', renderWerkvoorraad)
    .register('/new/:formType', (params) => createNewForm(params.formType))
    .register('/form/:formType/:formId', (params) => loadForm(params.formType, params.formId))
    .register('/intake-simple/:formId', (params) => loadSimpleIntake(params.formId))
    .register('/klant-intake/:formId/:token', (params) => loadKlantIntake(params.formId, params.token))
    .register('*', () => router.navigate('/'));

// Start app
document.addEventListener('DOMContentLoaded', () => {
    router.start();
});
