# Implementatie Handleiding - Gemeente Westland Projectformulieren

## Overzicht

Deze handleiding beschrijft hoe de projectformulieren website geïmplementeerd kan worden binnen de gemeente Westland, inclusief de benodigde stappen en tijdsinschatting.

---

## Huidige Status (GitHub Pages Demo)

De huidige versie draait volledig statisch en kan direct getest worden:

**Live URL:** `https://mailbvandongen-eng.github.io/sjablonen/`

### Wat werkt nu al:
- 4 volledig functionele formulieren
- Data opslag in browser (LocalStorage)
- PDF export
- JSON export/import voor delen
- Commentaar/notities per sectie
- Document uploads (max 2MB, lokaal opgeslagen)
- Email/Teams share links
- Beperkte intake view voor aanvragers

### Beperkingen huidige versie:
- Data blijft alleen lokaal in de browser
- Geen centrale database
- Geen automatische notificaties
- Documenten worden base64 encoded opgeslagen (limiet ~2MB)

---

## Implementatie Opties

### Optie 1: Statische Website op Intranet (Snel)

**Benodigdheden:**
- Webserver (IIS, Apache, of nginx)
- Map op intranet server

**Stappen:**
1. Kopieer alle bestanden naar intranet webserver
2. Configureer webserver om index.html als default te serveren
3. Klaar!

**Tijdsinschatting:** 1-2 uur

**Voordelen:**
- Geen backend nodig
- Direct werkend
- Eenvoudig te updaten

**Nadelen:**
- Elke gebruiker heeft eigen lokale data
- Geen centrale opslag
- Delen alleen via export/import

---

### Optie 2: Met SharePoint Integratie (Medium)

**Benodigdheden:**
- SharePoint Online of On-Premises
- SharePoint Lists voor data opslag
- Power Automate licentie (voor notificaties)

**Stappen:**

1. **SharePoint Lists aanmaken:**
   ```
   - Intakeformulieren (lijst)
   - KleinProjectMandaten (lijst)
   - ICTProjectMandaten (lijst)
   - Impactanalyses (lijst)
   - FormulierBijlagen (documentbibliotheek)
   ```

2. **SharePoint API Adapter bouwen:**
   Vervang `LocalStorageAdapter.js` door `SharePointAdapter.js`:
   ```javascript
   class SharePointAdapter {
       constructor(siteUrl) {
           this.siteUrl = siteUrl;
       }

       async save(key, data) {
           // POST naar SharePoint REST API
       }

       async load(key) {
           // GET van SharePoint REST API
       }
   }
   ```

3. **Power Automate flows maken:**
   - Flow voor email notificatie bij nieuwe intake
   - Flow voor Teams bericht bij statuswijziging
   - Flow voor herinnering bij wachtende goedkeuring

**Tijdsinschatting:** 2-3 weken

**Voordelen:**
- Centrale data opslag
- Automatische notificaties
- Integratie met bestaande Microsoft 365
- Versiebeheer via SharePoint

**Nadelen:**
- Vereist SharePoint kennis
- Power Automate licenties nodig
- Complexere setup

---

### Optie 3: Met Custom Backend (Volledig)

**Benodigdheden:**
- Backend server (Node.js, .NET, of Python)
- Database (SQL Server, PostgreSQL, of MongoDB)
- SMTP server voor email
- Optioneel: Microsoft Graph API voor Teams

**Architectuur:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Database      │
│   (deze app)    │     │   (.NET/Node)   │     │   (SQL Server)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Email/Teams    │
                        │  Notificaties   │
                        └─────────────────┘
```

**API Endpoints nodig:**
```
GET    /api/forms                    - Lijst alle formulieren
GET    /api/forms/:type/:id          - Haal specifiek formulier
POST   /api/forms/:type              - Nieuw formulier
PUT    /api/forms/:type/:id          - Update formulier
DELETE /api/forms/:type/:id          - Verwijder formulier

POST   /api/forms/:id/share          - Deel met stakeholders
POST   /api/forms/:id/approve        - Goedkeuring registreren
POST   /api/attachments              - Upload bijlage
GET    /api/attachments/:id          - Download bijlage
```

**Tijdsinschatting:** 4-8 weken

**Voordelen:**
- Volledige controle
- Onbeperkte bestandsgroottes
- Echte notificaties (email/Teams)
- Audit trail en rapportages
- Single Sign-On mogelijk

**Nadelen:**
- Vereist development resources
- Beheer en onderhoud nodig
- Langere implementatietijd

---

## Aanbevolen Aanpak

### Fase 1: Pilot (Week 1-2)
1. Deploy huidige versie op intranet (Optie 1)
2. Test met kleine groep gebruikers
3. Verzamel feedback

### Fase 2: SharePoint Integratie (Week 3-5)
1. Maak SharePoint Lists
2. Bouw SharePoint adapter
3. Configureer Power Automate flows
4. Test notificaties

### Fase 3: Uitrol (Week 6)
1. Communicatie naar organisatie
2. Training key users
3. Go-live

---

## Technische Details

### DataService Architectuur

De applicatie is ontworpen voor eenvoudige backend migratie:

```javascript
// Huidige configuratie (LocalStorage)
const dataService = new DataService(new LocalStorageAdapter());

// Toekomstige configuratie (API)
const dataService = new DataService(new ApiAdapter('https://api.westland.nl'));

// Of SharePoint
const dataService = new DataService(new SharePointAdapter('https://westland.sharepoint.com'));
```

### Nieuwe Adapter Maken

Implementeer deze interface:

```javascript
class CustomAdapter {
    async save(key, data) {
        // Sla data op met gegeven key
    }

    async load(key) {
        // Laad data met gegeven key, return null als niet bestaat
    }

    async delete(key) {
        // Verwijder data met gegeven key
    }

    async list(prefix) {
        // Return array van keys die beginnen met prefix
    }
}
```

---

## Benodigde Licenties en Resources

### Optie 1 (Statisch)
- Geen extra licenties
- Webserver ruimte: ~5MB

### Optie 2 (SharePoint)
- Microsoft 365 licenties (waarschijnlijk al aanwezig)
- Power Automate per user licentie (~€12/maand) of Premium (~€35/maand)

### Optie 3 (Custom Backend)
- Server (VM of container)
- Database licentie
- Developer tijd: 160-320 uur

---

## Security Overwegingen

### Authenticatie
- Gebruik gemeente SSO (Azure AD/ADFS)
- Geen aparte login nodig als op intranet

### Autorisatie
- Definieer rollen: Aanvrager, Reviewer, Beheerder
- Beperk toegang per formuliertype indien nodig

### Data Beveiliging
- Alle data binnen gemeente netwerk
- HTTPS verplicht
- Geen externe dependencies

---

## Onderhoud

### Regulier Onderhoud
- Browser cache issues: Versienummer in bestandsnamen
- Bug fixes: Update bestanden op server

### Updates Doorvoeren
1. Test wijzigingen lokaal
2. Commit naar Git repository
3. Deploy naar productie server

---

## Contact en Support

Voor vragen over deze implementatie:
- Technische documentatie: Zie comments in broncode
- GitHub repository: https://github.com/mailbvandongen-eng/sjablonen

---

## Samenvatting Tijdsinschatting

| Optie | Tijd | Complexiteit | Aanbevolen voor |
|-------|------|--------------|-----------------|
| Statisch op intranet | 1-2 uur | Laag | Snelle pilot |
| SharePoint integratie | 2-3 weken | Medium | Productie |
| Custom backend | 4-8 weken | Hoog | Enterprise |

**Aanbeveling:** Start met Optie 1 voor directe pilot, plan Optie 2 voor productie-uitrol.
