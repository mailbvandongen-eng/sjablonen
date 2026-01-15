/**
 * Intakeformulier Model
 * Gebaseerd op: Sjabloon Intakeformulier.docx
 */

import { FormBase } from './FormBase.js';
import { STAKEHOLDERS_IDOMEIN, INTAKE_STATUS } from '../config.js';

export class Intakeformulier extends FormBase {
    constructor() {
        super('intakeformulier');

        // Workflow velden
        this.informatiemanager = '';      // ID van toegewezen IM
        this.intakeStatus = INTAKE_STATUS.DRAFT;
        this.klantToken = '';             // Unieke token voor klant-link
        this.klantIngediendOp = null;     // Wanneer klant heeft ingediend
        this.stakeholderFeedback = [];    // Feedback van stakeholders

        // Basisinformatie
        this.basisinfo = {
            onderwerp: '',
            korteOmschrijving: '',
            doel: '',                     // Verplaatst: direct onder korte omschrijving
            thinkingPortfolioNummer: '',  // Alleen IM
            domeinTeam: '',
            datumIntake: null,
            aanvrager: '',
            opdrachtgever: ''
        };

        // Vraag/Antwoord secties
        this.vragen = {
            inleiding: '',
            scope: '',
            huidigeSituatie: '',
            gewensteSituatie: '',
            verkenningGedaan: null,       // Alleen IM
            prioriteitCategorie: '',       // Alleen IM
            deadlineNoodzakelijk: null,
            deadline: '',
            impactGeenRealisatie: '',     // Alleen IM
            doel: '',                      // Legacy, nu in basisinfo
            baten: '',                     // Alleen IM
            informatieverwerking: '',      // Alleen IM
            contactpersoon: '',
            teamsOfDoelgroepen: '',
            beleidWijziging: null,         // Alleen IM
            kostenInschatting: '',         // Alleen IM
            aiToepassing: null,            // Alleen IM
            opmerkingen: ''
        };

        // Stakeholders I-domein (vaste rollen met picklist personen)
        this.stakeholders = STAKEHOLDERS_IDOMEIN.map(s => ({
            rol: s.rol,
            persoonId: s.persoonId || '',
            naam: s.naam || '',
            email: s.email || '',
            geinformeerd: false,
            akkoord: null,
            feedbackDatum: null,
            feedback: ''
        }));
    }

    validate() {
        const errors = super.validate();

        // Verplichte velden
        if (!this.basisinfo.onderwerp) {
            errors.push({ field: 'basisinfo.onderwerp', message: 'Onderwerp is verplicht' });
        }
        if (!this.basisinfo.aanvrager) {
            errors.push({ field: 'basisinfo.aanvrager', message: 'Aanvrager is verplicht' });
        }
        if (!this.vragen.inleiding) {
            errors.push({ field: 'vragen.inleiding', message: 'Inleiding is verplicht' });
        }
        if (!this.vragen.doel) {
            errors.push({ field: 'vragen.doel', message: 'Doel van de aanvraag is verplicht' });
        }

        return errors;
    }
}

// Prioriteit opties
export const PRIORITEIT_OPTIES = [
    'Business ontwikkeling',
    'Innovatie',
    'I-domein dienstverlening (exploitatie)',
    'Digitale Transformatie (CIP)'
];

// Vraag definities voor het formulier
// klantZichtbaar: true = zichtbaar voor klant, false = alleen IM
export const INTAKE_VRAGEN = [
    {
        id: 'inleiding',
        label: 'Inleiding / Aanleiding',
        vraag: 'Waarom wordt deze aanvraag gedaan? Wat is de aanleiding?',
        type: 'textarea',
        required: true,
        klantZichtbaar: true
    },
    {
        id: 'huidigeSituatie',
        label: 'Huidige situatie',
        vraag: 'Beschrijf de huidige situatie. Hoe werkt het nu?',
        type: 'textarea',
        required: false,
        klantZichtbaar: true
    },
    {
        id: 'gewensteSituatie',
        label: 'Gewenste situatie',
        vraag: 'Beschrijf de gewenste situatie. Hoe zou het moeten werken?',
        type: 'textarea',
        required: false,
        klantZichtbaar: true
    },
    {
        id: 'scope',
        label: 'Scope',
        vraag: 'Wat valt binnen en buiten de scope van deze aanvraag?',
        type: 'textarea',
        required: false,
        klantZichtbaar: true
    },
    {
        id: 'teamsOfDoelgroepen',
        label: 'Betrokken teams/doelgroepen',
        vraag: 'Welke teams of domeinen zijn betrokken bij deze aanvraag?',
        type: 'textarea',
        required: false,
        klantZichtbaar: true
    },
    {
        id: 'deadlineNoodzakelijk',
        label: 'Deadline noodzakelijk',
        vraag: 'Is er een noodzakelijke deadline?',
        type: 'boolean',
        required: false,
        klantZichtbaar: true
    },
    {
        id: 'deadline',
        label: 'Deadline',
        vraag: 'Wat is de gewenste deadline?',
        type: 'date',
        required: false,
        showIf: 'deadlineNoodzakelijk',
        klantZichtbaar: true
    },
    {
        id: 'contactpersoon',
        label: 'Contactpersoon',
        vraag: 'Wie kunnen we benaderen voor inhoudelijke vragen?',
        type: 'text',
        required: true,
        klantZichtbaar: true
    },
    {
        id: 'opmerkingen',
        label: 'Opmerkingen',
        vraag: 'Overige opmerkingen of aanvullende informatie',
        type: 'textarea',
        required: false,
        klantZichtbaar: true
    },
    // IM-only velden hieronder
    {
        id: 'prioriteitCategorie',
        label: 'Prioriteitscategorie',
        vraag: 'Onder welke prioriteitscategorie valt deze aanvraag?',
        type: 'select',
        options: PRIORITEIT_OPTIES,
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'verkenningGedaan',
        label: 'Verkenning gedaan',
        vraag: 'Is er al een verkenning gedaan?',
        type: 'boolean',
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'impactGeenRealisatie',
        label: 'Impact bij geen realisatie',
        vraag: 'Wat is de impact als dit niet wordt gerealiseerd?',
        type: 'textarea',
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'baten',
        label: 'Baten',
        vraag: 'Welke baten worden behaald?',
        type: 'textarea',
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'informatieverwerking',
        label: 'Informatieverwerking',
        vraag: 'Welke informatie gaat deze oplossing verwerken?',
        type: 'textarea',
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'beleidWijziging',
        label: 'Beleidswijziging',
        vraag: 'Moet er beleid komen of wijzigen?',
        type: 'boolean',
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'kostenInschatting',
        label: 'Kosteninschatting',
        vraag: 'Wat is de inschatting van de kosten?',
        type: 'textarea',
        required: false,
        klantZichtbaar: false
    },
    {
        id: 'aiToepassing',
        label: 'AI Toepassing',
        vraag: 'Is dit een AI-toepassing?',
        type: 'boolean',
        required: false,
        klantZichtbaar: false
    }
];

export default Intakeformulier;
