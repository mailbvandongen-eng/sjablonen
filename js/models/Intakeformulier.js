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
        this.businessAnalist = '';        // ID van toegewezen BA
        this.intakeStatus = INTAKE_STATUS.DRAFT;
        this.klantToken = '';             // Unieke token voor klant-link
        this.klantIngediendOp = null;     // Wanneer klant heeft ingediend
        this.stakeholderFeedback = [];    // Feedback van stakeholders

        // Classificatie (bepaalt Project vs Change)
        this.classificatie = '';          // Small, Medium, Large, XL, Change
        this.classificatieScore = 0;      // Berekende impact score
        this.tshirtSize = '';             // Change, S, M, L, XL, XXL

        // Classificatie vragen (13 vragen voor impact score)
        this.classificatieVragen = {
            beheerIA: '',           // ja_volledig, ja_deels, nee
            bestaandeOplossing: '', // bestaand, vervanging, nieuw
            aantalApplicaties: '',  // 0, max5, meer5
            aantalClusters: '',     // 1, 2, meer2
            aantalTeams: '',        // 1, max3, meer3
            aantalGebruikers: '',   // 1_15, 16_50, meer50
            aanbesteding: '',       // nee, uitzoeken, ja
            doorlooptijd: '',       // max3mnd, 3_6mnd, meer6mnd
            externeLeveranciers: '',// 0, 1, meer1
            kennisAanwezig: '',     // nee, onbekend, ja
            aanleiding: '',         // applicatie, business, directie
            trainingNodig: '',      // 0, 1_15, meer15
            wijzigtProces: ''       // nee, onbekend, ja
        };

        // T-Shirt Size vragen (aanvullend op impact score)
        this.tshirtVragen = {
            urgentie: '',           // optioneel, kansen, operationeel, strategisch, juridisch
            tijdhorizon: '',        // max3mnd, 3_6mnd, 6_9mnd, 9_12mnd, 12_18mnd, meer18mnd
            risico: ''              // change, small, medium, large, xl, xxl
        };

        // 1. Basisgegevens
        this.basisinfo = {
            onderwerp: '',
            aanvrager: '',
            opdrachtgever: '',
            domeinTeam: '',
            thinkingPortfolioNummer: '',  // Alleen IM
            datumIntake: null
        };

        // 2. Aanleiding & Probleem
        this.aanleiding = {
            aanleiding: '',
            impactNietsDoen: '',
            voorverkenning: ''
        };

        // 3. Doel & Gewenste Uitkomst
        this.doelUitkomst = {
            doel: '',
            gewensteSituatie: '',
            baten: ''
        };

        // 4. Scope
        this.scope = {
            binnenScope: '',
            buitenScope: '',
            aannames: ''
        };

        // 5. Werkprocessen & Gebruikers
        this.werkprocessen = {
            geraakteProcessen: '',
            procesbeschrijvingen: '',
            verwerktInformatie: '',
            eindgebruikers: ''
        };

        // 6. Functionele Wensen & Eisen
        this.functioneleEisen = {
            wensen: '',
            koppelingen: '',
            rapportages: '',
            aiComponent: null
        };

        // 7. Kaders & Verplichtingen
        this.kaders = {
            wettelijkeVerplichtingen: '',
            beleidWijziging: '',
            ogwKoppeling: ''
        };

        // 8. Tijdslijnen
        this.tijdslijnen = {
            noodzakelijkeDatum: '',
            deadlines: ''
        };

        // 10. Kostenindicatie
        this.kosten = {
            eenmalig: '',
            structureel: '',
            middelenBeschikbaar: null
        };

        // 11. Output naar Impact Analyse
        this.outputIA = {
            kernvragen: '',
            relevanteDocumenten: '',
            opmerkingen: ''
        };

        // Legacy vragen object (voor backwards compatibility)
        this.vragen = {
            inleiding: '',
            scope: '',
            huidigeSituatie: '',
            gewensteSituatie: '',
            verkenningGedaan: null,
            prioriteitCategorie: '',
            deadlineNoodzakelijk: null,
            deadline: '',
            impactGeenRealisatie: '',
            doel: '',
            baten: '',
            informatieverwerking: '',
            contactpersoon: '',
            teamsOfDoelgroepen: '',
            beleidWijziging: null,
            kostenInschatting: '',
            aiToepassing: null,
            opmerkingen: ''
        };

        // 9. Stakeholders I-domein (vaste rollen met picklist personen)
        this.stakeholders = STAKEHOLDERS_IDOMEIN.map(s => ({
            rol: s.rol,
            persoonId: s.persoonId || '',
            naam: s.naam || '',
            email: s.email || '',
            betrokkenheid: '',            // Akkoord / Adviseren / Informeren
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
        if (!this.aanleiding.aanleiding) {
            errors.push({ field: 'aanleiding.aanleiding', message: 'Aanleiding is verplicht' });
        }
        if (!this.doelUitkomst.doel) {
            errors.push({ field: 'doelUitkomst.doel', message: 'Doel is verplicht' });
        }

        return errors;
    }

    /**
     * Genereer Copilot Feed YAML
     */
    generateCopilotFeed() {
        return `intake_feed:
  projectnaam: '${this.basisinfo.onderwerp || ''}'
  aanvrager: '${this.basisinfo.aanvrager || ''}'
  opdrachtgever: '${this.basisinfo.opdrachtgever || ''}'
  aanleiding: '${this.aanleiding.aanleiding || ''}'
  impact_niets_doen: '${this.aanleiding.impactNietsDoen || ''}'
  doel: '${this.doelUitkomst.doel || ''}'
  gewenste_situatie: '${this.doelUitkomst.gewensteSituatie || ''}'
  baten: ['${this.doelUitkomst.baten || ''}']
  scope:
    binnen: ['${this.scope.binnenScope || ''}']
    buiten: ['${this.scope.buitenScope || ''}']
    aannames: ['${this.scope.aannames || ''}']
  processen: ['${this.werkprocessen.geraakteProcessen || ''}']
  informatie: ['${this.werkprocessen.verwerktInformatie || ''}']
  eindgebruikers: ['${this.werkprocessen.eindgebruikers || ''}']
  wensen: ['${this.functioneleEisen.wensen || ''}']
  koppelingen: ['${this.functioneleEisen.koppelingen || ''}']
  rapportages: ['${this.functioneleEisen.rapportages || ''}']
  ai_toepassing: '${this.functioneleEisen.aiComponent ? 'ja' : 'nee'}'
  deadlines: ['${this.tijdslijnen.deadlines || ''}']
  stakeholders: [${this.stakeholders.filter(s => s.naam || s.persoonId).map(s => `'${s.rol}: ${s.naam}'`).join(', ')}]
  kosten:
    eenmalig_globaal: '${this.kosten.eenmalig || ''}'
    structureel_globaal: '${this.kosten.structureel || ''}'
    beschikbaar: '${this.kosten.middelenBeschikbaar ? 'ja' : 'nee'}'
  ia_kernvragen: ['${this.outputIA.kernvragen || ''}']`;
    }
}

// Prioriteit opties
export const PRIORITEIT_OPTIES = [
    'Business ontwikkeling',
    'Innovatie',
    'I-domein dienstverlening (exploitatie)',
    'Digitale Transformatie (CIP)'
];

// Classificatie opties (bepaalt Project vs Change)
export const CLASSIFICATIE_OPTIES = [
    { value: 'small', label: 'Small', type: 'project', iaNodig: true },
    { value: 'medium', label: 'Medium', type: 'project', iaNodig: true },
    { value: 'large', label: 'Large', type: 'project', iaNodig: true },
    { value: 'xl', label: 'XL', type: 'project', iaNodig: true },
    { value: 'change', label: 'Change', type: 'change', iaNodig: false }
];

// Stakeholder betrokkenheid opties
export const BETROKKENHEID_OPTIES = [
    'Akkoord',
    'Adviseren',
    'Informeren'
];

// Intake secties met velden - nieuwe structuur gebaseerd op Lean BA-proof template
export const INTAKE_SECTIES = [
    {
        id: 'basisgegevens',
        nummer: 1,
        titel: 'Basisgegevens',
        klantZichtbaar: true,
        velden: [
            { id: 'onderwerp', path: 'basisinfo.onderwerp', label: 'Projectnaam / Onderwerp', help: 'Naam van de aanvraag', type: 'text', required: true },
            { id: 'aanvrager', path: 'basisinfo.aanvrager', label: 'Aanvrager (naam + team)', help: 'Wie dient dit in?', type: 'text', required: true },
            { id: 'opdrachtgever', path: 'basisinfo.opdrachtgever', label: 'Opdrachtgever', help: 'Teammanager verantwoordelijk', type: 'text', required: false },
            { id: 'domeinTeam', path: 'basisinfo.domeinTeam', label: 'Domein / Team', help: 'Bijv. Sociaal, Publiekszaken, Bedrijfsvoering', type: 'text', required: false },
            { id: 'tpNummer', path: 'basisinfo.thinkingPortfolioNummer', label: 'TP-nummer', help: 'Indien bekend', type: 'text', required: false, klantZichtbaar: false },
            { id: 'datumIntake', path: 'basisinfo.datumIntake', label: 'Datum intake', type: 'date', required: false }
        ]
    },
    {
        id: 'aanleiding',
        nummer: 2,
        titel: 'Aanleiding & Probleem',
        klantZichtbaar: true,
        velden: [
            { id: 'aanleiding', path: 'aanleiding.aanleiding', label: 'Aanleiding', help: 'Wat is er gebeurd?', type: 'textarea', required: true },
            { id: 'impactNietsDoen', path: 'aanleiding.impactNietsDoen', label: 'Impact niets doen', help: 'Risico\'s, wettelijke verplichtingen', type: 'textarea', required: false, klantZichtbaar: false },
            { id: 'voorverkenning', path: 'aanleiding.voorverkenning', label: 'Voorverkenning', help: 'Ja/nee + bevindingen', type: 'textarea', required: false, klantZichtbaar: false }
        ]
    },
    {
        id: 'doelUitkomst',
        nummer: 3,
        titel: 'Doel & Gewenste Uitkomst',
        klantZichtbaar: true,
        velden: [
            { id: 'doel', path: 'doelUitkomst.doel', label: 'Doel', help: 'Functioneel, meetbaar', type: 'textarea', required: true },
            { id: 'gewensteSituatie', path: 'doelUitkomst.gewensteSituatie', label: 'Gewenste situatie', help: 'Hoe ziet succes eruit?', type: 'textarea', required: false },
            { id: 'baten', path: 'doelUitkomst.baten', label: 'Baten', help: 'Tijdsbesparing, kwaliteit, compliance', type: 'textarea', required: false, klantZichtbaar: false }
        ]
    },
    {
        id: 'scope',
        nummer: 4,
        titel: 'Scope',
        klantZichtbaar: true,
        velden: [
            { id: 'binnenScope', path: 'scope.binnenScope', label: 'Binnen scope', help: 'Functioneel/proces/techniek', type: 'textarea', required: false },
            { id: 'buitenScope', path: 'scope.buitenScope', label: 'Buiten scope', help: 'Expliciet niet', type: 'textarea', required: false },
            { id: 'aannames', path: 'scope.aannames', label: 'Aannames', help: 'Nog onbevestigde aannames', type: 'textarea', required: false }
        ]
    },
    {
        id: 'werkprocessen',
        nummer: 5,
        titel: 'Werkprocessen & Gebruikers',
        klantZichtbaar: true,
        velden: [
            { id: 'geraakteProcessen', path: 'werkprocessen.geraakteProcessen', label: 'Geraakte werkprocessen', help: 'Welke processen?', type: 'textarea', required: false },
            { id: 'procesbeschrijvingen', path: 'werkprocessen.procesbeschrijvingen', label: 'Procesbeschrijvingen', help: 'Ja/nee + locatie', type: 'textarea', required: false },
            { id: 'verwerktInformatie', path: 'werkprocessen.verwerktInformatie', label: 'Verwerkte informatie', help: 'AVG / IB relevant', type: 'textarea', required: false, klantZichtbaar: false },
            { id: 'eindgebruikers', path: 'werkprocessen.eindgebruikers', label: 'Eindgebruikers', help: 'Teams, doelgroepen', type: 'textarea', required: false }
        ]
    },
    {
        id: 'functioneleEisen',
        nummer: 6,
        titel: 'Functionele Wensen & Eisen',
        klantZichtbaar: true,
        velden: [
            { id: 'wensen', path: 'functioneleEisen.wensen', label: 'Wensen', help: 'Max 5-10 bullets', type: 'textarea', required: false },
            { id: 'koppelingen', path: 'functioneleEisen.koppelingen', label: 'Koppelingen', help: 'Systemen', type: 'textarea', required: false },
            { id: 'rapportages', path: 'functioneleEisen.rapportages', label: 'Rapportages', help: 'Stuurinformatie', type: 'textarea', required: false },
            { id: 'aiComponent', path: 'functioneleEisen.aiComponent', label: 'AI-component', help: 'Ja/nee', type: 'boolean', required: false }
        ]
    },
    {
        id: 'kaders',
        nummer: 7,
        titel: 'Kaders & Verplichtingen',
        klantZichtbaar: false,
        velden: [
            { id: 'wettelijkeVerplichtingen', path: 'kaders.wettelijkeVerplichtingen', label: 'Wettelijke verplichtingen', help: 'Deadlines, keten', type: 'textarea', required: false },
            { id: 'beleidWijziging', path: 'kaders.beleidWijziging', label: 'Beleid', help: 'Nieuw of wijziging nodig?', type: 'textarea', required: false },
            { id: 'ogwKoppeling', path: 'kaders.ogwKoppeling', label: 'OGW-koppeling', help: 'Opgave / Product / Verbeteropdracht', type: 'textarea', required: false }
        ]
    },
    {
        id: 'tijdslijnen',
        nummer: 8,
        titel: 'Tijdslijnen',
        klantZichtbaar: true,
        velden: [
            { id: 'noodzakelijkeDatum', path: 'tijdslijnen.noodzakelijkeDatum', label: 'Noodzakelijke datum', help: 'Vanaf wanneer nodig?', type: 'date', required: false },
            { id: 'deadlines', path: 'tijdslijnen.deadlines', label: 'Belangrijke deadlines', type: 'textarea', required: false }
        ]
    },
    {
        id: 'kosten',
        nummer: 10,
        titel: 'Kostenindicatie (globaal)',
        klantZichtbaar: false,
        velden: [
            { id: 'eenmalig', path: 'kosten.eenmalig', label: 'Eenmalig', help: 'Licenties, implementatie', type: 'textarea', required: false },
            { id: 'structureel', path: 'kosten.structureel', label: 'Structureel', help: 'Beheerlast, licenties', type: 'textarea', required: false },
            { id: 'middelenBeschikbaar', path: 'kosten.middelenBeschikbaar', label: 'Middelen beschikbaar?', help: 'Ja/nee', type: 'boolean', required: false }
        ]
    },
    {
        id: 'outputIA',
        nummer: 11,
        titel: 'Output naar Impact Analyse',
        klantZichtbaar: false,
        velden: [
            { id: 'kernvragen', path: 'outputIA.kernvragen', label: 'Kernvragen voor IA', help: 'Max 5 punten', type: 'textarea', required: false },
            { id: 'relevanteDocumenten', path: 'outputIA.relevanteDocumenten', label: 'Relevante documenten', help: 'URLs, locaties', type: 'textarea', required: false },
            { id: 'opmerkingen', path: 'outputIA.opmerkingen', label: 'Opmerkingen', type: 'textarea', required: false }
        ]
    }
];

// Legacy INTAKE_VRAGEN voor backwards compatibility
export const INTAKE_VRAGEN = [
    { id: 'inleiding', label: 'Inleiding / Aanleiding', vraag: 'Waarom wordt deze aanvraag gedaan?', type: 'textarea', required: true, klantZichtbaar: true },
    { id: 'huidigeSituatie', label: 'Huidige situatie', vraag: 'Beschrijf de huidige situatie.', type: 'textarea', required: false, klantZichtbaar: true },
    { id: 'gewensteSituatie', label: 'Gewenste situatie', vraag: 'Beschrijf de gewenste situatie.', type: 'textarea', required: false, klantZichtbaar: true },
    { id: 'scope', label: 'Scope', vraag: 'Wat valt binnen en buiten scope?', type: 'textarea', required: false, klantZichtbaar: true },
    { id: 'teamsOfDoelgroepen', label: 'Betrokken teams', vraag: 'Welke teams zijn betrokken?', type: 'textarea', required: false, klantZichtbaar: true },
    { id: 'deadlineNoodzakelijk', label: 'Deadline noodzakelijk', vraag: 'Is er een deadline?', type: 'boolean', required: false, klantZichtbaar: true },
    { id: 'deadline', label: 'Deadline', vraag: 'Wat is de deadline?', type: 'date', required: false, showIf: 'deadlineNoodzakelijk', klantZichtbaar: true },
    { id: 'contactpersoon', label: 'Contactpersoon', vraag: 'Wie is contactpersoon?', type: 'text', required: true, klantZichtbaar: true },
    { id: 'opmerkingen', label: 'Opmerkingen', vraag: 'Overige opmerkingen', type: 'textarea', required: false, klantZichtbaar: true },
    { id: 'prioriteitCategorie', label: 'Prioriteitscategorie', vraag: 'Prioriteitscategorie?', type: 'select', options: PRIORITEIT_OPTIES, required: false, klantZichtbaar: false },
    { id: 'verkenningGedaan', label: 'Verkenning gedaan', vraag: 'Is er verkenning gedaan?', type: 'boolean', required: false, klantZichtbaar: false },
    { id: 'impactGeenRealisatie', label: 'Impact geen realisatie', vraag: 'Impact als niet gerealiseerd?', type: 'textarea', required: false, klantZichtbaar: false },
    { id: 'baten', label: 'Baten', vraag: 'Welke baten?', type: 'textarea', required: false, klantZichtbaar: false },
    { id: 'informatieverwerking', label: 'Informatieverwerking', vraag: 'Welke informatie verwerkt?', type: 'textarea', required: false, klantZichtbaar: false },
    { id: 'beleidWijziging', label: 'Beleidswijziging', vraag: 'Beleid wijzigen?', type: 'boolean', required: false, klantZichtbaar: false },
    { id: 'kostenInschatting', label: 'Kosteninschatting', vraag: 'Kosteninschatting?', type: 'textarea', required: false, klantZichtbaar: false },
    { id: 'aiToepassing', label: 'AI Toepassing', vraag: 'Is dit AI-toepassing?', type: 'boolean', required: false, klantZichtbaar: false }
];

export default Intakeformulier;
