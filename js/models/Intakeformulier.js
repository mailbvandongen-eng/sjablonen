/**
 * Intakeformulier Model
 * Gebaseerd op: Sjabloon Intakeformulier.docx
 */

import { FormBase } from './FormBase.js';

export class Intakeformulier extends FormBase {
    constructor() {
        super('intakeformulier');

        // Basisinformatie
        this.basisinfo = {
            onderwerp: '',
            korteOmschrijving: '',
            thinkingPortfolioNummer: '',
            domeinTeam: '',
            datumIntake: null,
            aanvrager: '',
            opdrachtgever: '',
            resultaatProjectclassificatie: ''
        };

        // Vraag/Antwoord secties
        this.vragen = {
            inleiding: '',
            scope: '',
            huidigeSituatie: '',
            gewensteSituatie: '',
            verkenningGedaan: null,
            prioriteitCategorie: '', // Business ontwikkeling, Innovatie, I-domein dienstverlening, Digitale Transformatie
            deadlineNoodzakelijk: null,
            deadline: '',
            impactGeenRealisatie: '',
            opgaveProductVerbeteropdracht: '',
            doel: '',
            baten: '',
            werkprocessen: '',
            procesbeschrijvingBeschikbaar: null,
            informatieverwerking: '',
            nieuwOfBestaand: '', // Nieuw, Bestaand
            contactpersoon: '',
            aantalEindgebruikers: '',
            teamsOfDoelgroepen: '',
            behoeftesWensenEisen: '',
            beleidWijziging: null,
            kostenInschatting: '',
            aiToepassing: null,
            opdrachtImpactAnalyse: '',
            opmerkingen: ''
        };

        // Stakeholders
        this.stakeholders = [
            { team: 'Opdrachtgever', naam: '', geinformeerd: null },
            { team: 'Architectuur', naam: '', geinformeerd: null },
            { team: 'ISO', naam: '', geinformeerd: null },
            { team: 'InformatieBeheer', naam: '', geinformeerd: null },
            { team: 'Strategische Informatiemanager', naam: 'Mervyn Wiskerke', geinformeerd: null },
            { team: 'Business Analist', naam: '', geinformeerd: null },
            { team: 'BICC (productowner)', naam: '', geinformeerd: null }
        ];
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
export const INTAKE_VRAGEN = [
    {
        id: 'inleiding',
        label: 'Inleiding',
        vraag: 'Waarom wordt deze aanvraag gedaan?',
        type: 'textarea',
        required: true
    },
    {
        id: 'scope',
        label: 'Scope',
        vraag: 'Wat is de scope van deze aanvraag?',
        type: 'textarea',
        required: false
    },
    {
        id: 'huidigeSituatie',
        label: 'Huidige situatie',
        vraag: 'Beschrijf de huidige situatie',
        type: 'textarea',
        required: false
    },
    {
        id: 'gewensteSituatie',
        label: 'Gewenste situatie',
        vraag: 'Beschrijf de gewenste situatie',
        type: 'textarea',
        required: false
    },
    {
        id: 'verkenningGedaan',
        label: 'Verkenning gedaan',
        vraag: 'Is er al een verkenning gedaan?',
        type: 'boolean',
        required: false
    },
    {
        id: 'prioriteitCategorie',
        label: 'Prioriteitscategorie',
        vraag: 'Onder welke prioriteitscategorie valt deze aanvraag?',
        type: 'select',
        options: PRIORITEIT_OPTIES,
        required: true
    },
    {
        id: 'deadlineNoodzakelijk',
        label: 'Deadline noodzakelijk',
        vraag: 'Is er een noodzakelijke deadline?',
        type: 'boolean',
        required: false
    },
    {
        id: 'deadline',
        label: 'Deadline',
        vraag: 'Wat is de deadline?',
        type: 'date',
        required: false,
        showIf: 'deadlineNoodzakelijk'
    },
    {
        id: 'impactGeenRealisatie',
        label: 'Impact bij geen realisatie',
        vraag: 'Wat is de impact als dit niet wordt gerealiseerd?',
        type: 'textarea',
        required: false
    },
    {
        id: 'doel',
        label: 'Doel',
        vraag: 'Wat is het doel van deze aanvraag?',
        type: 'textarea',
        required: true
    },
    {
        id: 'baten',
        label: 'Baten',
        vraag: 'Welke baten worden behaald?',
        type: 'textarea',
        required: false
    },
    {
        id: 'informatieverwerking',
        label: 'Informatieverwerking',
        vraag: 'Welke informatie gaat deze oplossing verwerken?',
        type: 'textarea',
        required: false
    },
    {
        id: 'contactpersoon',
        label: 'Contactpersoon',
        vraag: 'Wie is beschikbaar voor inhoudelijke vragen?',
        type: 'text',
        required: true
    },
    {
        id: 'teamsOfDoelgroepen',
        label: 'Teams/Doelgroepen',
        vraag: 'Welke teams/domeinen zijn betrokken?',
        type: 'textarea',
        required: false
    },
    {
        id: 'beleidWijziging',
        label: 'Beleidswijziging',
        vraag: 'Moet er beleid komen of wijzigen?',
        type: 'boolean',
        required: false
    },
    {
        id: 'kostenInschatting',
        label: 'Kosteninschatting',
        vraag: 'Wat is de inschatting van de kosten?',
        type: 'textarea',
        required: false
    },
    {
        id: 'aiToepassing',
        label: 'AI Toepassing',
        vraag: 'Is dit een AI-toepassing?',
        type: 'boolean',
        required: false
    },
    {
        id: 'opmerkingen',
        label: 'Opmerkingen',
        vraag: 'Overige opmerkingen of vrije ruimte',
        type: 'textarea',
        required: false
    }
];

export default Intakeformulier;
