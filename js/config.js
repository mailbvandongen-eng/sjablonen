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

// Vaste Stakeholders I-domein
export const STAKEHOLDERS_IDOMEIN = [
    { rol: 'Opdrachtgever', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Architectuur', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'ISO', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'InformatieBeheer', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'ITB', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Strategische Informatiemanager', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'Business Analist', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' },
    { rol: 'BICC (productowner)', persoonId: '', naam: '', email: '', geinformeerd: false, akkoord: null, feedback: '' }
];

// Intake workflow statussen
export const INTAKE_STATUS = {
    DRAFT: 'draft',                      // Nieuwe intake, nog niet gedeeld
    WACHT_OP_KLANT: 'wacht_op_klant',    // Gedeeld met klant, wacht op input
    KLANT_GEREED: 'klant_gereed',        // Klant heeft ingevuld, terug bij IM
    IN_BEHANDELING: 'in_behandeling',    // IM is bezig met aanvullen
    WACHT_OP_STAKEHOLDERS: 'wacht_op_stakeholders', // Gedeeld met stakeholders
    STAKEHOLDER_FEEDBACK: 'stakeholder_feedback',   // Feedback ontvangen
    DEFINITIEF: 'definitief'             // Afgerond, klaar voor PMO
};

export const INTAKE_STATUS_LABELS = {
    [INTAKE_STATUS.DRAFT]: { label: 'Concept', class: 'badge-draft', icon: 'edit' },
    [INTAKE_STATUS.WACHT_OP_KLANT]: { label: 'Wacht op klant', class: 'badge-warning', icon: 'clock' },
    [INTAKE_STATUS.KLANT_GEREED]: { label: 'Klant gereed', class: 'badge-info', icon: 'inbox' },
    [INTAKE_STATUS.IN_BEHANDELING]: { label: 'In behandeling', class: 'badge-info', icon: 'edit' },
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

export default {
    INFORMATIEMANAGERS,
    STAKEHOLDER_ROLLEN,
    STAKEHOLDER_PERSONEN,
    STAKEHOLDERS_IDOMEIN,
    INTAKE_STATUS,
    INTAKE_STATUS_LABELS,
    KLANT_VELDEN,
    IM_ONLY_VELDEN
};
