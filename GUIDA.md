# Guida Avvio - AppMeetingRoom Frontend

## Prerequisiti

- **Node.js 20+** — scarica da https://nodejs.org/
- **Backend avviato** su `http://localhost:5121` (vedi la guida nel progetto backend)

Verifica Node.js:

```bash
node --version   # deve essere >= 20
npm --version
```

---

## Avvio Rapido

```bash
# 1. Entra nella cartella del frontend
cd digibite-appmeetingroom-frontend

# 2. Installa le dipendenze (solo la prima volta o dopo un pull)
npm install

# 3. Avvia il server di sviluppo
npm run dev
```

Il terminale mostrerà:

```
VITE v8.0.3  ready in 800ms
➜  Local:   http://localhost:3000/
```

Apri **http://localhost:3000** nel browser. Vedrai la pagina di login.

---

## Come funziona il collegamento col backend

Il frontend gira su porta **3000**, il backend su porta **5121**.

Non serve configurare CORS: il proxy di Vite inoltra automaticamente tutte le chiamate `/api/*` al backend. La configurazione è in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5121',
      changeOrigin: true,
    },
  },
},
```

Quando il frontend chiama `GET /api/sites`, Vite lo inoltra a `http://localhost:5121/api/sites`.

---

## Comandi Disponibili

| Comando | Cosa fa |
|---------|---------|
| `npm run dev` | Avvia il server di sviluppo con hot-reload |
| `npm run build` | Crea la build di produzione in `dist/` |
| `npm run preview` | Serve la build di produzione localmente |

---

## Struttura del Progetto

```
src/
├── api/           → Chiamate HTTP al backend (Axios)
├── assets/        → CSS, immagini
├── components/    → Componenti riutilizzabili (StatusBadge, PageHeader, etc.)
├── composables/   → Logica condivisa (useStoreAction, useApiCall, etc.)
├── i18n/          → Traduzioni italiano/inglese
├── layouts/       → Layout pagine (AuthLayout, MainLayout con sidebar)
├── router/        → Navigazione e protezione rotte
├── stores/        → Stato globale Pinia (auth, bookings, resources, etc.)
├── types/         → Interfacce TypeScript
└── views/         → Pagine dell'applicazione
    ├── auth/          → Login
    ├── dashboard/     → Dashboard con KPI
    ├── calendar/      → Calendario prenotazioni (FullCalendar)
    ├── bookings/      → Lista, wizard 8 step, dettaglio prenotazione
    ├── sites/         → Gestione sedi
    ├── resources/     → Gestione risorse (sale, postazioni, etc.)
    ├── resource-types/ → Tipi risorsa con campi personalizzati
    ├── visitor-types/ → Tipologie visitatore
    ├── notification-rules/ → Regole notifica
    ├── unavailability/ → Blocchi indisponibilità e festivi
    ├── user-groups/   → Gruppi utenti e relazioni
    ├── audit-log/     → Log di audit
    └── superadmin/    → Gestione tenant (solo SuperAdmin)
```

---

## Stack Tecnologico

- **Vue 3** + Composition API + `<script setup lang="ts">`
- **TypeScript** per la tipizzazione statica
- **Vite 8** come build tool
- **PrimeVue 4** (tema Aura) per i componenti UI
- **Tailwind CSS 4** per lo styling utility-first
- **FullCalendar 6** per il calendario prenotazioni
- **Pinia** per lo state management
- **Axios** per le chiamate HTTP
- **Vue I18n 9** per le traduzioni (IT/EN)
- **Vue Router 4** con lazy loading e auth guard
- **Vuelidate** per la validazione form

---

## Flusso di Autenticazione

1. L'utente inserisce email e password nella pagina di Login
2. Il frontend chiama `POST /api/auth/login`
3. Il backend restituisce un JWT access token + refresh token
4. Il token viene salvato nello store Pinia (`auth.store.ts`)
5. Ogni chiamata API successiva include il token nell'header `Authorization: Bearer <token>`
6. L'interceptor Axios in `api/client.ts` gestisce automaticamente:
   - Aggiunta del token a ogni richiesta
   - Aggiunta dell'header `X-Tenant-Id`
   - Refresh automatico del token su 401
   - Redirect al login se il refresh fallisce

---

## Problemi Comuni

**Il frontend non si connette al backend:**
- Verifica che il backend sia avviato (`http://localhost:5121/api/health`)
- Verifica che la porta proxy in `vite.config.ts` sia `5121`
- Guarda la console del browser (F12) per errori di rete

**`npm install` fallisce:**
- Cancella `node_modules` e `package-lock.json`, poi riprova
- Verifica la versione di Node.js (`node --version` >= 20)

**Errore "Port 3000 already in use":**
- Un altro processo usa la porta. Chiudilo, oppure cambia porta in `vite.config.ts`

**Le modifiche ai file non si vedono nel browser:**
- Il hot-reload è automatico. Se non funziona, riavvia `npm run dev`

---

## Variabili d'Ambiente

Il frontend non richiede file `.env`. Tutta la configurazione (porta, proxy backend) è in `vite.config.ts`.

Per personalizzare il backend target in produzione, modifica il proxy oppure configura il web server (Nginx/IIS) per inoltrare le richieste `/api/*`.
