/**
 * Configuratie voor Gemeente Westland Projectformulieren
 */

// Informatiemanagers
export const INFORMATIEMANAGERS = [
    { id: 'bvdongen', naam: 'Bob van Dongen', email: 'bvdongen@gemeentewestland.nl' },
    { id: 'fdekkers', naam: 'Frans Dekkers', email: 'famdekkers@gemeentewestland.nl' },
    { id: 'ndjong', naam: 'Nelleke de Jong', email: 'ndjong@gemeentewestland.nl' },
    { id: 'psteevensz', naam: 'Pasqual Steevensz', email: 'pwcsteevensz@gemeentewestland.nl' }
];

// Business Analisten
export const BUSINESS_ANALISTEN = [
    { id: 'dduck', naam: 'Donald Duck', email: 'dduck@gemeentewestland.nl' },
    { id: 'ghenkie', naam: 'Gekke Henkie', email: 'ghenkie@gemeentewestland.nl' },
    { id: 'bhendrik', naam: 'Brave Hendrik', email: 'bhendrik@gemeentewestland.nl' }
];

// Stakeholder rollen I-domein
export const STAKEHOLDER_ROLLEN = [
    'Opdrachtgever',
    'Architectuur',
    'ISO',
    'InformatieBeheer',
    'ITB',
    'Strategische Informatiemanager',
    'Business Analist',
    'BICC (productowner)'
];

// Beschikbare stakeholder personen (voor picklists)
export const STAKEHOLDER_PERSONEN = [
    { id: 'bvdongen', naam: 'Bob van Dongen', email: 'bvdongen@gemeentewestland.nl' },
    { id: 'psteevensz', naam: 'Pasqual Steevensz', email: 'pwcsteevensz@gemeentewestland.nl' }
];

// Stakeholder betrokkenheid opties
export const BETROKKENHEID_OPTIES = [
    'Akkoord',
    'Adviseren',
    'Informeren'
];

// Vaste Stakeholders I-domein (aangepast conform nieuwe template)
export const STAKEHOLDERS_IDOMEIN = [
    { rol: 'Opdrachtgever', persoonId: '', naam: '', email: '', betrokkenheid: 'Akkoord', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Aanvrager', persoonId: '', naam: '', email: '', betrokkenheid: 'Informeren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Architectuur', persoonId: '', naam: '', email: '', betrokkenheid: 'Adviseren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'ISO/Privacy', persoonId: '', naam: '', email: '', betrokkenheid: 'Adviseren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'InformatieBeheer', persoonId: '', naam: '', email: '', betrokkenheid: 'Adviseren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Servicemanagement', persoonId: '', naam: '', email: '', betrokkenheid: 'Informeren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Functioneel Beheer', persoonId: '', naam: '', email: '', betrokkenheid: 'Informeren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'ITB', persoonId: '', naam: '', email: '', betrokkenheid: 'Adviseren', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'BICC/Productowner', persoonId: '', naam: '', email: '', betrokkenheid: 'Informeren', geinformeerd: false, akkoord: null, feedback: '' }
];

// Intake workflow statussen
export const INTAKE_STATUS = {
    DRAFT: 'draft',                      // Nieuwe intake, nog niet gedeeld
    WACHT_OP_KLANT: 'wacht_op_klant',    // Gedeeld met klant, wacht op input
    KLANT_GEREED: 'klant_gereed',        // Klant heeft ingevuld, terug bij IM
    IN_BEHANDELING: 'in_behandeling',    // IM is bezig met aanvullen
    BIJ_BA: 'bij_ba',                    // Doorgezet naar Business Analist
    WACHT_OP_STAKEHOLDERS: 'wacht_op_stakeholders', // Gedeeld met stakeholders
    STAKEHOLDER_FEEDBACK: 'stakeholder_feedback',   // Feedback ontvangen
    DEFINITIEF: 'definitief'             // Afgerond, klaar voor PMO
};

export const INTAKE_STATUS_LABELS = {
    [INTAKE_STATUS.DRAFT]: { label: 'Concept', class: 'badge-draft', icon: 'edit' },
    [INTAKE_STATUS.WACHT_OP_KLANT]: { label: 'Wacht op klant', class: 'badge-warning', icon: 'clock' },
    [INTAKE_STATUS.KLANT_GEREED]: { label: 'Klant gereed', class: 'badge-info', icon: 'inbox' },
    [INTAKE_STATUS.IN_BEHANDELING]: { label: 'In behandeling', class: 'badge-info', icon: 'edit' },
    [INTAKE_STATUS.BIJ_BA]: { label: 'Bij Business Analist', class: 'badge-info', icon: 'user' },
    [INTAKE_STATUS.WACHT_OP_STAKEHOLDERS]: { label: 'Wacht op stakeholders', class: 'badge-warning', icon: 'users' },
    [INTAKE_STATUS.STAKEHOLDER_FEEDBACK]: { label: 'Feedback ontvangen', class: 'badge-info', icon: 'message' },
    [INTAKE_STATUS.DEFINITIEF]: { label: 'Definitief', class: 'badge-approved', icon: 'check' }
};

// Velden zichtbaar voor klant
export const KLANT_VELDEN = {
    basisinfo: ['onderwerp', 'korteOmschrijving', 'doel', 'aanvrager', 'opdrachtgever', 'domeinTeam', 'datumIntake'],
    vragen: ['inleiding', 'huidigeSituatie', 'gewensteSituatie', 'scope', 'deadlineNoodzakelijk', 'deadline', 'contactpersoon', 'teamsOfDoelgroepen', 'opmerkingen']
};

// Velden alleen voor IM
export const IM_ONLY_VELDEN = {
    basisinfo: ['thinkingPortfolioNummer'],
    vragen: ['prioriteitCategorie', 'verkenningGedaan', 'impactGeenRealisatie', 'baten', 'informatieverwerking', 'beleidWijziging', 'kostenInschatting', 'aiToepassing']
};

// Feedback rollen
export const FEEDBACK_ROLES = {
    IM: 'informatiemanager',
    BA: 'business_analist',
    STAKEHOLDER: 'stakeholder',
    KLANT: 'klant'
};

// Feedback permissies per rol
export const FEEDBACK_PERMISSIONS = {
    informatiemanager: {
        canCreateComment: true,
        canReply: true,
        canResolve: true,
        canReject: true,
        canReopen: true,
        canAcceptChanges: true,
        canRejectChanges: true,
        canMakeChanges: true,
        canDeleteOwnComments: true,
        canDeleteAllComments: true
    },
    business_analist: {
        canCreateComment: true,
        canReply: true,
        canResolve: true,
        canReject: true,
        canReopen: true,
        canAcceptChanges: true,
        canRejectChanges: true,
        canMakeChanges: true,
        canDeleteOwnComments: true,
        canDeleteAllComments: false
    },
    stakeholder: {
        canCreateComment: true,
        canReply: true,
        canResolve: false,
        canReject: false,
        canReopen: false,
        canAcceptChanges: false,
        canRejectChanges: false,
        canMakeChanges: false,
        canDeleteOwnComments: true,
        canDeleteAllComments: false
    },
    klant: {
        canCreateComment: true,
        canReply: true,
        canResolve: false,
        canReject: false,
        canReopen: false,
        canAcceptChanges: false,
        canRejectChanges: false,
        canMakeChanges: true,  // Kan eigen velden aanpassen
        canDeleteOwnComments: true,
        canDeleteAllComments: false
    }
};

// Comment status opties
export const COMMENT_STATUS = {
    OPEN: 'open',
    VERWERKT: 'verwerkt',
    AFGEWEZEN: 'afgewezen'
};

export const COMMENT_STATUS_LABELS = {
    [COMMENT_STATUS.OPEN]: { label: 'Open', class: 'status-open', icon: 'circle' },
    [COMMENT_STATUS.VERWERKT]: { label: 'Verwerkt', class: 'status-resolved', icon: 'check' },
    [COMMENT_STATUS.AFGEWEZEN]: { label: 'Afgewezen', class: 'status-rejected', icon: 'x' }
};

// Track change status
export const TRACK_CHANGE_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

export default {
    INFORMATIEMANAGERS,
    BUSINESS_ANALISTEN,
    STAKEHOLDER_ROLLEN,
    STAKEHOLDER_PERSONEN,
    STAKEHOLDERS_IDOMEIN,
    BETROKKENHEID_OPTIES,
    INTAKE_STATUS,
    INTAKE_STATUS_LABELS,
    KLANT_VELDEN,
    IM_ONLY_VELDEN
};
