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

// Functioneel Beheerders
export const FUNCTIONEEL_BEHEERDERS = [
    { id: 'fbeheer1', naam: 'Functioneel Beheerder 1', email: 'fb1@gemeentewestland.nl' },
    { id: 'fbeheer2', naam: 'Functioneel Beheerder 2', email: 'fb2@gemeentewestland.nl' }
];

// Gebruikersrollen in het systeem
export const USER_ROLES = {
    IM: 'informatiemanager',
    BA: 'business_analist',
    FB: 'functioneel_beheerder',
    PMO: 'pmo',
    KLANT: 'klant',
    STAKEHOLDER: 'stakeholder'
};

export const USER_ROLE_LABELS = {
    [USER_ROLES.IM]: { label: 'Informatiemanager', short: 'IM' },
    [USER_ROLES.BA]: { label: 'Business Analist', short: 'BA' },
    [USER_ROLES.FB]: { label: 'Functioneel Beheerder', short: 'FB' },
    [USER_ROLES.PMO]: { label: 'PMO', short: 'PMO' },
    [USER_ROLES.KLANT]: { label: 'Klant', short: 'Klant' },
    [USER_ROLES.STAKEHOLDER]: { label: 'Stakeholder', short: 'SH' }
};

// Intake workflow statussen - VOLLEDIGE FLOW
export const INTAKE_STATUS = {
    // IM Fase - Aanmaak
    DRAFT: 'draft',                          // Nieuwe intake, nog niet gedeeld

    // Klant Fase - Invoer
    KLANT_INVOER: 'klant_invoer',            // Gedeeld met klant voor invoer

    // IM Fase - Aanvullen
    IM_AANVULLEN: 'im_aanvullen',            // Terug bij IM, klant heeft ingevuld

    // Klant Fase - Akkoord
    KLANT_AKKOORD: 'klant_akkoord',          // Wacht op formeel akkoord klant

    // Stakeholder Fase
    STAKEHOLDER_REVIEW: 'stakeholder_review', // Bij stakeholders voor review

    // IM Fase - Routering
    IM_ROUTERING: 'im_routering',            // IM verwerkt feedback, bepaalt route

    // Route: PROJECT
    BIJ_BA: 'bij_ba',                        // In werkvoorraad Business Analist

    // Route: CHANGE
    FB_BACKLOG: 'fb_backlog',                // Op backlog Functioneel Beheer

    // Eindstatus
    GEARCHIVEERD: 'gearchiveerd'             // Afgerond, zichtbaar voor PMO
};

export const INTAKE_STATUS_LABELS = {
    [INTAKE_STATUS.DRAFT]: {
        label: 'Concept',
        class: 'badge-draft',
        icon: 'edit',
        description: 'Intake is nog in concept'
    },
    [INTAKE_STATUS.KLANT_INVOER]: {
        label: 'Wacht op klant',
        class: 'badge-warning',
        icon: 'clock',
        description: 'Klant vult gegevens in'
    },
    [INTAKE_STATUS.IM_AANVULLEN]: {
        label: 'IM aanvullen',
        class: 'badge-info',
        icon: 'inbox',
        description: 'Klant is gereed, IM vult aan'
    },
    [INTAKE_STATUS.KLANT_AKKOORD]: {
        label: 'Wacht op akkoord',
        class: 'badge-warning',
        icon: 'thumbs-up',
        description: 'Wacht op formeel akkoord klant'
    },
    [INTAKE_STATUS.STAKEHOLDER_REVIEW]: {
        label: 'Stakeholder review',
        class: 'badge-warning',
        icon: 'users',
        description: 'Stakeholders reviewen de intake'
    },
    [INTAKE_STATUS.IM_ROUTERING]: {
        label: 'Routering',
        class: 'badge-info',
        icon: 'git-branch',
        description: 'IM verwerkt feedback en bepaalt route'
    },
    [INTAKE_STATUS.BIJ_BA]: {
        label: 'Bij BA',
        class: 'badge-primary',
        icon: 'user',
        description: 'In werkvoorraad Business Analist'
    },
    [INTAKE_STATUS.FB_BACKLOG]: {
        label: 'FB Backlog',
        class: 'badge-primary',
        icon: 'list',
        description: 'Op backlog Functioneel Beheer'
    },
    [INTAKE_STATUS.GEARCHIVEERD]: {
        label: 'Gearchiveerd',
        class: 'badge-approved',
        icon: 'archive',
        description: 'Intake is afgerond en gearchiveerd'
    }
};

// Status transities - welke overgangen zijn toegestaan?
export const INTAKE_STATUS_TRANSITIONS = {
    [INTAKE_STATUS.DRAFT]: {
        next: [INTAKE_STATUS.KLANT_INVOER],
        actions: [
            { to: INTAKE_STATUS.KLANT_INVOER, label: 'Delen met klant', icon: 'share', role: USER_ROLES.IM }
        ]
    },
    [INTAKE_STATUS.KLANT_INVOER]: {
        next: [INTAKE_STATUS.IM_AANVULLEN],
        actions: [
            { to: INTAKE_STATUS.IM_AANVULLEN, label: 'Indienen', icon: 'send', role: USER_ROLES.KLANT }
        ]
    },
    [INTAKE_STATUS.IM_AANVULLEN]: {
        next: [INTAKE_STATUS.KLANT_AKKOORD],
        actions: [
            { to: INTAKE_STATUS.KLANT_AKKOORD, label: 'Vraag akkoord klant', icon: 'thumbs-up', role: USER_ROLES.IM }
        ]
    },
    [INTAKE_STATUS.KLANT_AKKOORD]: {
        next: [INTAKE_STATUS.STAKEHOLDER_REVIEW, INTAKE_STATUS.IM_AANVULLEN],
        actions: [
            { to: INTAKE_STATUS.STAKEHOLDER_REVIEW, label: 'Akkoord gegeven', icon: 'check', role: USER_ROLES.KLANT },
            { to: INTAKE_STATUS.IM_AANVULLEN, label: 'Wijzigingen nodig', icon: 'edit', role: USER_ROLES.KLANT }
        ]
    },
    [INTAKE_STATUS.STAKEHOLDER_REVIEW]: {
        next: [INTAKE_STATUS.IM_ROUTERING],
        actions: [
            { to: INTAKE_STATUS.IM_ROUTERING, label: 'Review afronden', icon: 'check-circle', role: USER_ROLES.IM }
        ]
    },
    [INTAKE_STATUS.IM_ROUTERING]: {
        next: [INTAKE_STATUS.BIJ_BA, INTAKE_STATUS.FB_BACKLOG, INTAKE_STATUS.STAKEHOLDER_REVIEW],
        actions: [
            { to: INTAKE_STATUS.BIJ_BA, label: 'Doorzetten naar BA (Project)', icon: 'arrow-right', role: USER_ROLES.IM, routeType: 'project' },
            { to: INTAKE_STATUS.FB_BACKLOG, label: 'Doorzetten naar FB (Change)', icon: 'list', role: USER_ROLES.IM, routeType: 'change' },
            { to: INTAKE_STATUS.STAKEHOLDER_REVIEW, label: 'Terug naar stakeholders', icon: 'rotate-ccw', role: USER_ROLES.IM }
        ]
    },
    [INTAKE_STATUS.BIJ_BA]: {
        next: [INTAKE_STATUS.GEARCHIVEERD],
        actions: [
            // BA acties komen later (Impact Analyse flow)
        ]
    },
    [INTAKE_STATUS.FB_BACKLOG]: {
        next: [INTAKE_STATUS.GEARCHIVEERD],
        actions: [
            { to: INTAKE_STATUS.GEARCHIVEERD, label: 'Archiveren', icon: 'archive', role: USER_ROLES.IM }
        ]
    },
    [INTAKE_STATUS.GEARCHIVEERD]: {
        next: [],
        actions: []
    }
};

// Werkvoorraad configuratie per rol
export const WORKQUEUE_CONFIG = {
    [USER_ROLES.IM]: {
        label: 'Mijn werkvoorraad',
        statuses: [INTAKE_STATUS.IM_AANVULLEN, INTAKE_STATUS.IM_ROUTERING],
        canSeeAll: true
    },
    [USER_ROLES.BA]: {
        label: 'BA Werkvoorraad',
        statuses: [INTAKE_STATUS.BIJ_BA],
        canSeeAll: false
    },
    [USER_ROLES.FB]: {
        label: 'FB Backlog',
        statuses: [INTAKE_STATUS.FB_BACKLOG],
        canSeeAll: false
    },
    [USER_ROLES.PMO]: {
        label: 'PMO Overzicht',
        statuses: [INTAKE_STATUS.GEARCHIVEERD],
        canSeeAll: true
    },
    [USER_ROLES.KLANT]: {
        label: 'Mijn intakes',
        statuses: [INTAKE_STATUS.KLANT_INVOER, INTAKE_STATUS.KLANT_AKKOORD],
        canSeeAll: false
    }
};

// Notificatie types
export const NOTIFICATION_TYPES = {
    INTAKE_SHARED: 'intake_shared',
    INTAKE_SUBMITTED: 'intake_submitted',
    AKKOORD_REQUESTED: 'akkoord_requested',
    AKKOORD_GIVEN: 'akkoord_given',
    STAKEHOLDER_REVIEW_START: 'stakeholder_review_start',
    COMMENT_ADDED: 'comment_added',
    COMMENT_RESOLVED: 'comment_resolved',
    ROUTED_TO_BA: 'routed_to_ba',
    ROUTED_TO_FB: 'routed_to_fb',
    INTAKE_ARCHIVED: 'intake_archived'
};

export const NOTIFICATION_LABELS = {
    [NOTIFICATION_TYPES.INTAKE_SHARED]: {
        title: 'Nieuwe intake gedeeld',
        message: 'Er is een intake met je gedeeld voor invoer',
        icon: 'share',
        color: 'info'
    },
    [NOTIFICATION_TYPES.INTAKE_SUBMITTED]: {
        title: 'Intake ingediend',
        message: 'De klant heeft de intake ingediend',
        icon: 'inbox',
        color: 'success'
    },
    [NOTIFICATION_TYPES.AKKOORD_REQUESTED]: {
        title: 'Akkoord gevraagd',
        message: 'Je akkoord wordt gevraagd op een intake',
        icon: 'thumbs-up',
        color: 'warning'
    },
    [NOTIFICATION_TYPES.AKKOORD_GIVEN]: {
        title: 'Akkoord gegeven',
        message: 'De klant heeft akkoord gegeven',
        icon: 'check',
        color: 'success'
    },
    [NOTIFICATION_TYPES.STAKEHOLDER_REVIEW_START]: {
        title: 'Review gestart',
        message: 'Een intake is gedeeld voor stakeholder review',
        icon: 'users',
        color: 'info'
    },
    [NOTIFICATION_TYPES.COMMENT_ADDED]: {
        title: 'Nieuwe opmerking',
        message: 'Er is een opmerking geplaatst',
        icon: 'message-circle',
        color: 'info'
    },
    [NOTIFICATION_TYPES.COMMENT_RESOLVED]: {
        title: 'Opmerking verwerkt',
        message: 'Een opmerking is verwerkt',
        icon: 'check-circle',
        color: 'success'
    },
    [NOTIFICATION_TYPES.ROUTED_TO_BA]: {
        title: 'Intake ontvangen',
        message: 'Een nieuwe intake staat in je werkvoorraad',
        icon: 'arrow-right',
        color: 'primary'
    },
    [NOTIFICATION_TYPES.ROUTED_TO_FB]: {
        title: 'Change ontvangen',
        message: 'Een nieuwe change staat op de backlog',
        icon: 'list',
        color: 'primary'
    },
    [NOTIFICATION_TYPES.INTAKE_ARCHIVED]: {
        title: 'Intake gearchiveerd',
        message: 'Een intake is gearchiveerd',
        icon: 'archive',
        color: 'secondary'
    }
};

// Route types voor routeringsbeslissing
export const ROUTE_TYPES = {
    PROJECT: 'project',
    CHANGE: 'change'
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
    FUNCTIONEEL_BEHEERDERS,
    STAKEHOLDER_ROLLEN,
    STAKEHOLDER_PERSONEN,
    STAKEHOLDERS_IDOMEIN,
    BETROKKENHEID_OPTIES,
    USER_ROLES,
    USER_ROLE_LABELS,
    INTAKE_STATUS,
    INTAKE_STATUS_LABELS,
    INTAKE_STATUS_TRANSITIONS,
    WORKQUEUE_CONFIG,
    NOTIFICATION_TYPES,
    NOTIFICATION_LABELS,
    ROUTE_TYPES,
    KLANT_VELDEN,
    IM_ONLY_VELDEN,
    FEEDBACK_ROLES,
    FEEDBACK_PERMISSIONS,
    COMMENT_STATUS,
    COMMENT_STATUS_LABELS,
    TRACK_CHANGE_STATUS
};
