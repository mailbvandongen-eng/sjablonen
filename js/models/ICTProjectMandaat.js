/**
 * ICT-Projectmandaat Model
 * Gebaseerd op: Sjabloon ICT-projectmandaat.docx
 */

import { FormBase } from './FormBase.js';

export class ICTProjectMandaat extends FormBase {
    constructor() {
        super('ict-projectmandaat');

        // Stakeholders I-domein (Akkoord)
        this.stakeholdersAkkoord = [
            { team: 'Servicemanagement', naam: '', akkoord: null },
            { team: 'Functioneel Beheer', naam: '', akkoord: null },
            { team: 'ITB', naam: '', akkoord: null },
            { team: 'Architectuur', naam: '', akkoord: null },
            { team: 'ISO', naam: '', akkoord: null },
            { team: 'Informatiebeheer', naam: '', akkoord: null },
            { team: 'Strategische Informatiemanager', naam: 'Mervyn Wiskerke', akkoord: null }
        ];

        // Stakeholders I-domein (Geïnformeerd)
        this.stakeholdersGeinformeerd = [
            { team: 'BICC', naam: '', geinformeerd: null },
            { team: 'Contractmanagement', naam: '', geinformeerd: null },
            { team: 'Proces Kwaliteit Management', naam: '', geinformeerd: null }
        ];

        // Documentgegevens
        this.documentgegevens = {
            sjabloonversie: 'Sjabloon ICT-projectmandaat v2.1',
            projectnaam: '',
            projectnummer: '',
            documentlocatie: '',
            auteur: '',
            functie: ''
        };

        // Projectinhoud
        this.project = {
            achtergrond: '',
            doelstelling: '',
            productOfOpgave: '',
            scope: '',
            resultaten: [],
            uitsluitingen: [],
            uitgangspunten: [],
            randvoorwaarden: [],
            kwaliteitseisen: [],
            relatieAndereProjecten: '',
            startdatum: null,
            einddatum: null
        };

        // Businesscase
        this.businesscase = {
            eenmaligeKosten: '',
            terugkerendeKosten: '',
            opbrengst: '',
            personeel: '',
            middelen: ''
        };

        // Relevante documenten
        this.relevanteDocumenten = {
            slaContract: '',
            verwerkersovereenkomst: '',
            dpia: ''
        };

        // Mandaat checklist
        this.mandaatChecklist = [
            { item: 'Alle kosten gedekt', waarde: null, rol: 'Opdrachtgever' },
            { item: 'Opdrachtgever (business) benoemd en akkoord', waarde: null, rol: '' },
            { item: 'Basis rollen in stuurgroep ingevuld', waarde: null, rol: '' },
            { item: 'Applicatie eigenaar vastgesteld', waarde: null, rol: '' },
            { item: 'Afgestemd met IV, ITB, IB, ISO en architectuur', waarde: null, rol: '' },
            { item: 'Verwachte omvang bepaald (business case)', waarde: null, rol: '' }
        ];
    }

    validate() {
        const errors = super.validate();

        if (!this.documentgegevens.projectnaam) {
            errors.push({ field: 'documentgegevens.projectnaam', message: 'Projectnaam is verplicht' });
        }
        if (!this.project.achtergrond) {
            errors.push({ field: 'project.achtergrond', message: 'Achtergrond en aanleiding is verplicht' });
        }
        if (!this.project.doelstelling) {
            errors.push({ field: 'project.doelstelling', message: 'Doelstelling is verplicht' });
        }
        if (!this.project.scope) {
            errors.push({ field: 'project.scope', message: 'Projectscope is verplicht' });
        }

        // Check of minimaal één stakeholder akkoord heeft gegeven
        const heeftAkkoord = this.stakeholdersAkkoord.some(s => s.akkoord === true);
        if (this.status === 'approved' && !heeftAkkoord) {
            errors.push({ field: 'stakeholdersAkkoord', message: 'Minimaal één stakeholder moet akkoord geven' });
        }

        return errors;
    }

    addResultaat(resultaat) {
        if (!this.project.resultaten) this.project.resultaten = [];
        this.project.resultaten.push(resultaat);
    }

    addUitsluiting(uitsluiting) {
        if (!this.project.uitsluitingen) this.project.uitsluitingen = [];
        this.project.uitsluitingen.push(uitsluiting);
    }

    addUitgangspunt(uitgangspunt) {
        if (!this.project.uitgangspunten) this.project.uitgangspunten = [];
        this.project.uitgangspunten.push(uitgangspunt);
    }

    addRandvoorwaarde(randvoorwaarde) {
        if (!this.project.randvoorwaarden) this.project.randvoorwaarden = [];
        this.project.randvoorwaarden.push(randvoorwaarde);
    }
}

export const ICT_PROJECT_SECTIES = [
    {
        id: 'achtergrond',
        label: 'Achtergrond en aanleiding',
        description: 'Beschrijf de achtergrond en directe aanleiding voor dit ICT-project',
        type: 'textarea',
        required: true
    },
    {
        id: 'doelstelling',
        label: 'Doelstelling',
        description: 'Wat wil de organisatie bereiken met dit project?',
        type: 'textarea',
        required: true
    },
    {
        id: 'productOfOpgave',
        label: 'Product of Opgave',
        description: 'Betreft dit een product of een opgave?',
        type: 'textarea',
        required: false
    },
    {
        id: 'scope',
        label: 'Projectscope',
        description: 'Welke werkzaamheden vallen binnen de scope van dit project?',
        type: 'textarea',
        required: true
    },
    {
        id: 'resultaten',
        label: 'Belangrijkste project-resultaten (producten)',
        description: 'Welke concrete resultaten/producten worden opgeleverd?',
        type: 'list',
        required: false
    },
    {
        id: 'uitsluitingen',
        label: 'Uitsluitingen',
        description: 'Wat valt expliciet buiten de scope?',
        type: 'list',
        required: false
    },
    {
        id: 'uitgangspunten',
        label: 'Uitgangspunten',
        description: 'Welke uitgangspunten gelden voor dit project?',
        type: 'list',
        required: false
    },
    {
        id: 'randvoorwaarden',
        label: 'Randvoorwaarden',
        description: 'Welke randvoorwaarden moeten worden ingevuld?',
        type: 'list',
        required: false
    },
    {
        id: 'kwaliteitseisen',
        label: 'Kwaliteitseisen',
        description: 'Welke specifieke kwaliteitseisen gelden?',
        type: 'list',
        required: false
    },
    {
        id: 'relatieAndereProjecten',
        label: 'Relatie met andere projecten',
        description: 'Zijn er relaties met andere projecten of initiatieven?',
        type: 'textarea',
        required: false
    }
];

export default ICTProjectMandaat;
