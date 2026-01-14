/**
 * Klein Project Mandaat Model
 * Gebaseerd op: Sjabloon Klein Project Mandaat versie 1.1.docx
 */

import { FormBase } from './FormBase.js';

export class KleinProjectMandaat extends FormBase {
    constructor() {
        super('klein-project-mandaat');

        // Versiegeschiedenis
        this.historie = [
            { versie: '0.1', datum: null, status: 'Initieel', auteur: '', aanpassingen: 'Eerste versie' }
        ];

        // Review/Distributie
        this.reviewDistributie = [
            { naam: '', rol: 'Opdrachtgever', versie09: false, versie10: false },
            { naam: '', rol: 'Portfoliomanager', versie09: false, versie10: false },
            { naam: '', rol: 'Functioneel/technisch beheer', versie09: false, versie10: false }
        ];

        // Documentgegevens
        this.documentgegevens = {
            sjabloonversie: 'Sjabloon ICT-KKV-mandaat v1.0',
            kkvNaam: '',
            kkvNummer: '',
            documentlocatie: '',
            datum: null
        };

        // KKV Inhoud
        this.kkv = {
            achtergrond: '',
            doelstelling: '',
            scope: '',
            resultaten: [],
            uitsluitingen: '',
            uitgangspuntenRandvoorwaarden: '',
            kwaliteitseisen: '',
            relatieAndereProjecten: '',
            startdatum: null,
            doorlooptijd: '',
            businesscase: {
                eenmaligeKosten: '',
                structureleKosten: '',
                baten: '',
                urenIncidenteel: '',
                urenStructureel: ''
            },
            relevanteDocumenten: ''
        };

        // Mandaat checklist
        this.mandaatChecklist = [
            { item: 'Alle kosten gedekt', waarde: null, rol: 'Portfoliomanager / Budgethouder vakafdeling' },
            { item: 'Opdrachtgever benoemd', waarde: null, rol: 'Clusterdirecteur of teammanager' },
            { item: 'Afgestemd met IV, ITB, IB, ISO en Architect', waarde: null, rol: 'Informatiemanager' },
            { item: 'Oplossingsrichting en proces bepaald', waarde: null, rol: 'I-adviseur Informatiemanager / Business analist' },
            { item: 'Verwachte omvang bepaald', waarde: null, rol: 'I-adviseur Informatiemanager' },
            { item: 'Prioriteit vastgesteld op producttafel I&A', waarde: null, rol: 'Portfoliomanager' }
        ];
    }

    validate() {
        const errors = super.validate();

        if (!this.documentgegevens.kkvNaam) {
            errors.push({ field: 'documentgegevens.kkvNaam', message: 'KKV naam is verplicht' });
        }
        if (!this.kkv.achtergrond) {
            errors.push({ field: 'kkv.achtergrond', message: 'Achtergrond en aanleiding is verplicht' });
        }
        if (!this.kkv.doelstelling) {
            errors.push({ field: 'kkv.doelstelling', message: 'Doelstelling is verplicht' });
        }
        if (!this.kkv.scope) {
            errors.push({ field: 'kkv.scope', message: 'KKV scope is verplicht' });
        }

        return errors;
    }

    addHistorieEntry(auteur, aanpassingen, status = 'In bewerking') {
        const versieNum = this.historie.length;
        const nieuwVersie = versieNum < 10 ? `0.${versieNum + 1}` : `1.${versieNum - 9}`;

        this.historie.push({
            versie: nieuwVersie,
            datum: new Date().toISOString(),
            status,
            auteur,
            aanpassingen
        });
    }

    addResultaat(resultaat) {
        if (!this.kkv.resultaten) this.kkv.resultaten = [];
        this.kkv.resultaten.push(resultaat);
    }
}

export const KKV_SECTIES = [
    {
        id: 'achtergrond',
        label: 'Achtergrond en aanleiding',
        description: 'Beschrijf de achtergrond en directe aanleiding voor dit kleine klantverzoek',
        type: 'textarea',
        required: true
    },
    {
        id: 'doelstelling',
        label: 'Doelstelling',
        description: 'Wat wil de organisatie bereiken met dit KKV?',
        type: 'textarea',
        required: true
    },
    {
        id: 'scope',
        label: 'KKV scope / opdracht',
        description: 'Welke werkzaamheden vallen binnen de scope van dit KKV?',
        type: 'textarea',
        required: true
    },
    {
        id: 'resultaten',
        label: 'Belangrijkste KKV-resultaten (producten)',
        description: 'Welke concrete resultaten/producten worden opgeleverd?',
        type: 'list',
        required: false
    },
    {
        id: 'uitsluitingen',
        label: 'Uitsluitingen',
        description: 'Wat valt expliciet buiten de scope?',
        type: 'textarea',
        required: false
    },
    {
        id: 'uitgangspuntenRandvoorwaarden',
        label: 'Uitgangspunten en randvoorwaarden',
        description: 'Welke uitgangspunten en randvoorwaarden gelden?',
        type: 'textarea',
        required: false
    },
    {
        id: 'kwaliteitseisen',
        label: 'Kwaliteitseisen',
        description: 'Welke specifieke kwaliteitseisen gelden? (optioneel)',
        type: 'textarea',
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

export default KleinProjectMandaat;
