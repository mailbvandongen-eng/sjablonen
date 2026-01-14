/**
 * Impactanalyse Model
 * Gebaseerd op: Sjabloon Impactanalyse - v1.5.docx
 */

import { FormBase } from './FormBase.js';

export class Impactanalyse extends FormBase {
    constructor() {
        super('impactanalyse');

        // Header info
        this.header = {
            tpNummer: '',
            omschrijving: '',
            startdatum: null,
            prognoseEinddatum: null,
            werkelijkeEinddatum: null,
            informatiemanager: '',
            businessAnalist: ''
        };

        // 1. Inleiding en scope
        this.inleidingScope = {
            inleiding: '',
            scopeBinnen: [],
            scopeBuiten: [],
            relevanteOntwikkelingen: {
                intern: '',
                extern: ''
            }
        };

        // 2. Situatie omschrijving
        this.situatie = {
            huidig: {
                functioneel: '',
                processen: '',
                wetgeving: ''
            },
            gewenst: {
                functioneel: '',
                processen: '',
                wetgeving: ''
            }
        };

        // 3. Impact - Scenario's
        this.scenarios = [
            { naam: 'Niets doen', voordelen: '', nadelen: '', isVoorkeur: false },
            { naam: 'Contract verlengen', voordelen: '', nadelen: '', isVoorkeur: false },
            { naam: 'Vervangen', voordelen: '', nadelen: '', isVoorkeur: false }
        ];

        // Beoordeling oplossingen matrix
        this.beoordelingMatrix = {
            requirements: [],
            oplossingen: [
                { naam: 'Oplossing 1', scores: {} },
                { naam: 'Oplossing 2', scores: {} },
                { naam: 'Oplossing 3', scores: {} }
            ]
        };

        // Impact secties
        this.impact = {
            procesbeleid: '',
            stakeholdersBusiness: {
                aog: '',
                aon: '',
                primairDoelgroep: '',
                secundairDoelgroep: ''
            },
            servicemanagement: '',
            functioneelBeheer: '',
            itb: '',
            privacySecurity: '',
            architectuur: '',
            informatiebeheer: '',
            contractbeheer: '',
            rapportages: {
                operationeel: '',
                tactisch: '',
                strategisch: ''
            },
            doorlooptijd: '',
            resourcemanagement: ''
        };

        // Financiële Business Case
        this.businessCase = {
            methodiek: 1,
            eenmalig: { personeel: '', middelen: '' },
            structureel: { personeel: '', middelen: '' }
        };

        // Risico analyse
        this.risicos = [
            {
                id: '1',
                beschrijving: '',
                kans: '',
                impact: '',
                gevolg: '',
                tegenmaatregel: ''
            }
        ];

        // Conclusie en advies
        this.conclusie = '';
        this.advies = '';

        // Stakeholders I-domein
        this.stakeholders = [
            { team: 'Servicemanagement', naam: '', geinformeerd: null },
            { team: 'Functioneel Beheer', naam: '', geinformeerd: null },
            { team: 'ITB', naam: '', geinformeerd: null },
            { team: 'Architectuur', naam: '', geinformeerd: null },
            { team: 'ISO', naam: '', geinformeerd: null },
            { team: 'Informatiebeheer', naam: '', geinformeerd: null },
            { team: 'Strategische Informatiemanager', naam: 'Mervyn Wiskerke', geinformeerd: null },
            { team: 'BICC', naam: '', geinformeerd: null },
            { team: 'Contractmanagement', naam: '', geinformeerd: null }
        ];
    }

    validate() {
        const errors = super.validate();

        if (!this.header.tpNummer) {
            errors.push({ field: 'header.tpNummer', message: 'TP-nummer is verplicht' });
        }
        if (!this.header.omschrijving) {
            errors.push({ field: 'header.omschrijving', message: 'Omschrijving is verplicht' });
        }
        if (!this.inleidingScope.inleiding) {
            errors.push({ field: 'inleidingScope.inleiding', message: 'Inleiding is verplicht' });
        }
        if (!this.conclusie) {
            errors.push({ field: 'conclusie', message: 'Conclusie is verplicht' });
        }
        if (!this.advies) {
            errors.push({ field: 'advies', message: 'Advies is verplicht' });
        }

        return errors;
    }

    addScenario(naam = 'Nieuw scenario') {
        this.scenarios.push({
            naam,
            voordelen: '',
            nadelen: '',
            isVoorkeur: false
        });
    }

    removeScenario(index) {
        if (this.scenarios.length > 1) {
            this.scenarios.splice(index, 1);
        }
    }

    addRisico() {
        const newId = (this.risicos.length + 1).toString();
        this.risicos.push({
            id: newId,
            beschrijving: '',
            kans: '',
            impact: '',
            gevolg: '',
            tegenmaatregel: ''
        });
    }

    removeRisico(index) {
        if (this.risicos.length > 1) {
            this.risicos.splice(index, 1);
        }
    }

    addRequirement(naam) {
        this.beoordelingMatrix.requirements.push(naam);
        // Voeg lege score toe voor elke oplossing
        this.beoordelingMatrix.oplossingen.forEach(opl => {
            opl.scores[naam] = '';
        });
    }

    addOplossing(naam = 'Nieuwe oplossing') {
        const scores = {};
        this.beoordelingMatrix.requirements.forEach(req => {
            scores[req] = '';
        });
        this.beoordelingMatrix.oplossingen.push({ naam, scores });
    }
}

export const RISICO_KANS_OPTIES = ['Klein', 'Gemiddeld', 'Groot'];
export const RISICO_IMPACT_OPTIES = ['Klein', 'Gemiddeld', 'Groot'];

export const IMPACT_SECTIES = [
    {
        id: 'inleidingScope',
        label: '1. Inleiding en scope',
        subsecties: [
            { id: 'inleiding', label: 'Inleiding', type: 'textarea' },
            { id: 'scopeBinnen', label: 'Binnen scope', type: 'list' },
            { id: 'scopeBuiten', label: 'Buiten scope', type: 'list' }
        ]
    },
    {
        id: 'situatie',
        label: '2. Situatie omschrijving',
        subsecties: [
            { id: 'huidig', label: '2.1 Huidige situatie', type: 'group' },
            { id: 'gewenst', label: '2.2 Gewenste situatie', type: 'group' }
        ]
    },
    {
        id: 'impact',
        label: '3. Impact',
        subsecties: [
            { id: 'scenarios', label: '3.1 Scenario\'s', type: 'scenarios' },
            { id: 'procesbeleid', label: '3.1.2 Administratieve organisatie', type: 'textarea' },
            { id: 'stakeholdersBusiness', label: '3.1.3 Stakeholders business', type: 'group' },
            { id: 'servicemanagement', label: '3.1.4 Servicemanagement', type: 'textarea' },
            { id: 'itb', label: '3.1.5 ICT', type: 'textarea' },
            { id: 'rapportages', label: '3.1.6 Management Rapportages', type: 'group' },
            { id: 'privacySecurity', label: '3.1.7 Privacy & Security', type: 'textarea' },
            { id: 'architectuur', label: '3.1.8 Architectuur', type: 'textarea' },
            { id: 'informatiebeheer', label: '3.1.9 Informatiebeheer', type: 'textarea' },
            { id: 'contractbeheer', label: '3.1.10 Contractbeheer ICT', type: 'textarea' },
            { id: 'doorlooptijd', label: '3.1.12 (Verwachte) doorlooptijd', type: 'textarea' },
            { id: 'businessCase', label: '3.1.13 Financiële Business Case', type: 'businesscase' },
            { id: 'risicos', label: '3.2 Risico analyse', type: 'risicos' }
        ]
    },
    {
        id: 'conclusieAdvies',
        label: '4. Samenvatting en advies',
        subsecties: [
            { id: 'conclusie', label: '4.1 Conclusie', type: 'textarea' },
            { id: 'advies', label: '4.2 Advies', type: 'textarea' }
        ]
    }
];

export default Impactanalyse;
