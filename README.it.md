# Performance dell'Assistenza — Validazione e Premi

[English](README.md) | [Português (Brasil)](README.pt-BR.md) | [Español](README.es.md) | **[Italiano](README.it.md)**

Piattaforma di ingegneria e analisi dei dati per validare le interazioni dell'assistenza, calcolare gli indicatori di performance, individuare i dipendenti idonei e premiare i tre risultati migliori di ogni mese di riferimento.

[Apri la dashboard in produzione](https://support-performance-analytics.vercel.app/) · [Verifica lo stato dell'API](https://support-performance-analytics.vercel.app/api/health)

> La versione pubblica è un progetto di portfolio e utilizza dati sintetici. I dati reali dei dipendenti non devono essere pubblicati prima di implementare autenticazione e controllo degli accessi.

## Sintesi esecutiva

Ho creato il progetto per risolvere una chiusura mensile che richiedeva la verifica manuale dei file esportati da ChatMobi. Occorreva individuare le interazioni effettivamente appartenenti all'assistenza, rimuovere i record non validi, rispettare le regole vigenti in ogni mese, calcolare il punteggio di ciascun dipendente e motivare oggettivamente l'assegnazione dei premi.

La soluzione attuale trasforma i dati operativi in una decisione verificabile. Il sistema:

- importa file CSV, TXT ed Excel;
- identifica e standardizza automaticamente le colonne;
- pulisce testi, numeri, valutazioni e date;
- applica regole di qualità e di business versionate per mese;
- calcola volume, tempo totale, tempo medio di gestione (TMA nell'applicazione), valutazione e copertura delle risposte CSAT;
- determina l'idoneità a partire da 85 punti;
- premia soltanto i primi tre idonei, ordinati per punteggio;
- conserva record validi, esclusioni, parametri, classifiche e feedback nello storico;
- presenta analisi direzionali, operative e individuali;
- identifica i clienti con maggiore volume e ricorrenza di contatti;
- esporta un file Excel di audit e un report direzionale PowerPoint.

Il risultato riunisce **ingegneria dei dati, analisi dei dati, automazione dei processi, visualizzazione, qualità dei dati e intelligence operativa**.

## Problema di business

La premiazione dell'assistenza doveva riconoscere le migliori performance senza dipendere da formule manuali o valutazioni soggettive. I dati grezzi potevano però contenere:

- interazioni di altri reparti;
- operatori esclusi dal programma di premiazione;
- record senza operatore o senza data di chiusura;
- date in formati diversi;
- interazioni concluse nel mese successivo;
- durate negative o superiori al limite;
- interazioni fuori dall'orario di lavoro;
- valutazioni fuori dalla scala vigente;
- chiusure automatiche che alteravano tempo totale e TMA.

Senza un trattamento standardizzato, questi casi modificavano gli indicatori e potevano cambiare la classifica. Ho realizzato il progetto per rendere il calcolo riproducibile, trasparente e spiegabile al responsabile del reparto.

## Decisioni supportate

Alla fine di ogni mese di riferimento, il sistema risponde:

1. Quanti record sono stati importati, validati ed esclusi?
2. Perché ciascun record è stato rimosso dal calcolo?
3. Qual è stata la performance di ogni dipendente?
4. Chi ha raggiunto l'obiettivo minimo di 85 punti?
5. Quali sono i tre risultati migliori tra gli idonei?
6. Quali criteri hanno inciso maggiormente sul punteggio?
7. Quali aspetti devono essere monitorati nel ciclo successivo?
8. Come è cambiato il risultato rispetto ai mesi precedenti?

## Evoluzione del progetto

### 1. Verifica manuale e definizione delle regole

Il processo è iniziato con fogli di calcolo mensili esportati da ChatMobi. Le regole di perimetro, orario, durata, valutazione e punteggio sono state documentate e verificate manualmente per creare una base di riferimento.

### 2. Automazione locale in Python

La validazione è stata automatizzata in Python, con lettura di CSV/Excel, preparazione dei dati, calcolo dei punteggi e storico in SQLite. Questa fase ha ridotto le attività ripetitive della chiusura mensile e prodotto un registro di calcolo riproducibile.

### 3. Prime interfacce web

Sono state provate versioni con Streamlit, Altair e Matplotlib. Problemi di compatibilità tra Python e le librerie hanno portato alla creazione di un ambiente isolato e, successivamente, alla sostituzione dell'interfaccia.

### 4. Dashboard HTML locale

Il sistema è passato a HTML, CSS e JavaScript, eseguiti tramite un server Python locale. Sono stati aggiunti menu laterale, KPI, classifica, storico individuale, audit, feedback, esportazione Excel e generazione PowerPoint. È stato predisposto anche l'accesso dalla rete interna.

### 5. Narrazione dei dati e design direzionale

I pannelli sono stati riorganizzati per presentare prima la decisione, poi i fattori che la determinano e infine le evidenze. Sono stati eliminati grafici a torta, visualizzazioni raggruppate ed elementi poco leggibili. L'interfaccia utilizza confronti diretti, obiettivi visibili, barre ordinate, tabelle analitiche e uno stile ispirato alle dashboard professionali di Power BI.

### 6. React, TypeScript e Vite

Il frontend è stato ricostruito come SPA moderna, mantenendo il layout direzionale approvato. Il progetto utilizza React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI e Recharts.

### 7. Pubblicazione e versionamento

Il codice è stato pubblicato su GitHub con dati sintetici. Render è stato utilizzato in una precedente fase di hosting e poi sostituito da Vercel, che oggi pubblica frontend e API sullo stesso dominio tramite integrazione continua con il branch `main`.

### 8. Ritorno della pipeline Python/Pandas

Il layout moderno è stato mantenuto e l'elaborazione dei dati è tornata al centro della soluzione. FastAPI riceve il file, la pipeline Pandas esegue pulizia, validazione, trasformazione, calcolo e caricamento, mentre il motore TypeScript rimane disponibile come alternativa locale.

### 9. Storico condiviso con Neon Postgres

La persistenza locale è stata estesa a PostgreSQL gestito su Neon. Lo storico può essere centralizzato e consultato da browser diversi senza dipendere dal computer che ha avviato il sistema.

### 10. Analisi automatizzata senza IA generativa

È stata valutata e rimossa un'integrazione sperimentale con Ollama. La versione attuale genera feedback e raccomandazioni tramite regole deterministiche basate sui KPI, mantenendo le spiegazioni collegate ai valori effettivamente calcolati.

## Architettura in produzione

| Livello | Implementazione attuale |
|---|---|
| Origine | File operativi CSV/TXT/XLS/XLSX/XLSM di ChatMobi |
| Elaborazione | Python 3.12 e Pandas 2.2 |
| API | FastAPI eseguita come Vercel Function |
| Persistenza | Neon PostgreSQL in produzione e SQLite nello sviluppo locale |
| Applicazione | React 19, TypeScript e Vite |
| Visualizzazione | Recharts, SVG e componenti analitici personalizzati |
| Esportazioni | SheetJS e PptxGenJS |
| Pubblicazione | GitHub + Vercel, con deploy automatico da `main` |

I dati passano dall'esportazione ChatMobi a FastAPI, Pandas, regole versionate di qualità e business, calcolo di KPI e Top 3, Neon PostgreSQL e dashboard React, fino alle esportazioni Excel e PowerPoint.

In produzione, il frontend richiama l'API sullo stesso dominio. La variabile privata `DATABASE_URL` collega la Function a Neon; non viene mai esposta al browser né salvata nel repository.

## Pipeline di ingegneria dei dati

La chiusura mensile segue una struttura ETL:

### 1. Estrazione

- Ricezione del file esportato da ChatMobi.
- Lettura del primo foglio dei file Excel.
- Rilevamento automatico del delimitatore nei file di testo.
- Individuazione della riga contenente l'intestazione effettiva.

### 2. Standardizzazione dello schema

- Associazione di nomi diversi allo stesso campo logico.
- Rimozione degli spazi superflui e normalizzazione degli accenti.
- Standardizzazione di operatore, reparto, stato e identificativo del ticket.
- Conversione delle valutazioni in valori numerici.

### 3. Gestione temporale

- Conversione di date brasiliane, ISO e seriali Excel.
- Calcolo della durata in ore e del TMA in minuti.
- Assegnazione del mese di riferimento in base alla data iniziale.
- Conservazione delle interazioni iniziate in un mese e concluse nel successivo.

### 4. Qualità e validazione

- Classificazione di ogni riga come valida o esclusa.
- Registrazione del primo motivo di esclusione per evitare doppi conteggi.
- Identificazione delle chiusure potenzialmente automatiche.
- Validazione della scala di valutazione relativa al periodo.
- Riconciliazione tra totale importato, record validi ed esclusi.

### 5. Trasformazione e aggregazione

- Raggruppamento dei record validi per dipendente.
- Calcolo di quantità, ore, media e percentili del TMA.
- Calcolo della valutazione media e della copertura delle risposte CSAT.
- Normalizzazione degli indicatori rispetto al miglior risultato del team.

### 6. Regole di business

- Applicazione del profilo relativo al mese di riferimento.
- Calcolo del punteggio finale e del tetto effettivo.
- Definizione dell'idoneità.
- Ordinamento della classifica e selezione dei tre premiati.

### 7. Caricamento e persistenza

- Scrittura transazionale in PostgreSQL.
- Snapshot completo del mese.
- Sostituzione idempotente del mese rielaborato.
- Storico senza duplicati.

### 8. Utilizzo analitico

- Sincronizzazione con il frontend React.
- Aggiornamento di dashboard e feedback.
- Generazione dell'Excel di audit e del PowerPoint direzionale.

## Formati e campi riconosciuti

### File accettati

- `.csv`
- `.txt`
- `.tsv`
- `.xlsx`
- `.xls`
- `.xlsm`

### Mappatura dei campi

Gli esempi mantengono i nomi effettivi delle colonne di input riconosciute dall'applicazione.

| Campo logico | Esempi riconosciuti | Obbligatorio |
|---|---|---:|
| Operatore | Atendente, User ID, Operador, Usuário, Agente | Sì |
| Inizio | Iniciado, Início, Data Início, Criado, Data, Criado em | Sì |
| Fine | Fim, Data Última Mensagem, Última Mensagem, Finalizado | Sì |
| Reparto | Filas, Fila, Departamento, Setor, Setores, Transfers | Sì |
| Valutazione | Rating, Avaliação, Nota, Satisfação | No |
| Identificativo del ticket | Protocolo, Ticket, ID | No |
| Stato | Status, Situação | No |

Se manca l'identificativo del ticket, il numero della riga di origine viene utilizzato come identificativo di audit.

## Regole di validazione dei dati

Un'interazione può essere esclusa per i seguenti motivi:

- reparto diverso dall'Assistenza;
- operatore non indicato;
- operatore presente nell'elenco degli esclusi dal programma;
- data iniziale non valida o in sospeso;
- data finale assente;
- data finale precedente a quella iniziale;
- durata superiore al limite del mese;
- inizio fuori dall'orario consentito;
- inizio di domenica.

Regole aggiuntive:

- L'Assistenza può comparire in `Filas`, `Setores` o nei campi di trasferimento.
- L'elenco degli esclusi accetta nomi completi o parziali separati da punto e virgola.
- Ogni riga riceve soltanto il primo motivo di esclusione.
- Le valutazioni fuori scala non escludono l'interazione; vengono omesse dalla media.
- Il mese è determinato dalla data iniziale, non dalla chiusura.
- Un record iniziato il `31/08` e concluso il `01/09` rimane in agosto.
- Se la maggior parte degli inizi appartiene a un altro mese, l'elaborazione viene bloccata e il mese rilevato viene segnalato.
- I record senza identificativo rimangono tracciabili tramite il numero di riga.

## Chiusure automatiche

Un'interazione viene segnalata come potenzialmente automatica quando:

- l'orario finale è esattamente `06:00`; oppure
- almeno 20 record terminano nello stesso minuto.

La segnalazione rimane disponibile per l'audit, ma questi record seguono le stesse regole di periodo e durata delle altre interazioni. Nel progetto pubblico non esiste una neutralizzazione speciale del tempo totale o del TMA.

## Regole di punteggio per mese

| Periodo | Scala | Limite ordinario | Volume | Tempo | TMA | Valutazione | Tetto | Trattamento Tempo/TMA |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Fino a maggio/2026 | 0–10 | 8 ore | 30 | 15 | 25 | 30 | 100,00 | Separati e comparativi |
| Da giugno/2026 | 0–5 | 9 ore | 20 | 10 | 30 | 40 | 100,00 | Separati e comparativi |

### Modello storico da 100 punti

Nella prima regola, tempo totale e TMA **non venivano sommati come base comune**. I quattro indicatori erano calcolati separatamente:

- Volume: fino a 30 punti;
- Tempo totale: fino a 15 punti;
- TMA: fino a 25 punti;
- Valutazione: fino a 30 punti.

Da giugno/2026, il tetto rimane di 100 punti e tempo totale e TMA restano indipendenti, con pesi di 10 e 30 punti. I punteggi dimostrativi originariamente riportati sono conservati come riferimento storico; le nuove elaborazioni utilizzano sempre la regola da 100 punti.

## Formule utilizzate

Per ogni dipendente `i`:

~~~text
Volumeᵢ = numero di interazioni valide

Ore totaliᵢ = somma delle durate considerate

TMA medioᵢ = media delle durate considerate in minuti

Valutazione mediaᵢ = media delle valutazioni valide

Copertura CSATᵢ = valutazioni valide / interazioni valide × 100
~~~

### Punteggio del volume

~~~text
Punti volumeᵢ =
(Volumeᵢ / massimo Volume del team) × peso del Volume
~~~

### Punteggio del tempo totale

~~~text
Punti tempoᵢ =
(Ore totaliᵢ / massimo totale di Ore del team) × peso del Tempo
~~~

### Punteggio del TMA

Un TMA inferiore rappresenta maggiore efficienza:

~~~text
Punti TMAᵢ =
(minimo TMA positivo del team / TMA medioᵢ) × peso del TMA
~~~

### Punteggio della valutazione

~~~text
Punti valutazioneᵢ =
(Valutazione mediaᵢ / massima Valutazione media del team) × peso della Valutazione
~~~

### Punteggio finale

~~~text
Punteggio finaleᵢ =
Punti volume + Punti tempo + Punti TMA + Punti valutazione
~~~

I calcoli utilizzano la precisione completa. I valori vengono arrotondati soltanto per la visualizzazione.

## Idoneità, classifica e premi

- **Obiettivo minimo:** punteggio finale maggiore o uguale a 85 punti.
- **Idoneo:** dipendente che ha raggiunto l'obiettivo.
- **Premiato:** soltanto uno dei primi tre idonei.
- **Quarto idoneo:** mantiene l'idoneità, ma rimane fuori dalle posizioni premiate.

Ordine della classifica:

1. punteggio finale più alto;
2. maggior numero di interazioni;
3. valutazione media più alta;
4. ordine alfabetico se la parità persiste.

La regola distingue **raggiungere l'obiettivo** da **ricevere un premio**. Anche se quattro o più persone raggiungono 85 punti, vengono premiati soltanto i tre risultati migliori.

## Analisi e KPI

### Qualità dei dati

- totale importato;
- numero e percentuale di record validi;
- numero e percentuale di esclusi;
- distribuzione dei motivi di esclusione;
- chiusure automatiche identificate e sottoposte ad audit;
- valutazioni valide;
- riconciliazione tra dati importati, dati ammessi alla premiazione ed eccezioni.

### Operatività dell'assistenza

- volume di interazioni per dipendente;
- quota sul volume del team;
- ore totali considerate;
- TMA medio e mediano;
- TMA P90 per osservare la coda delle interazioni lunghe;
- valutazione media;
- copertura delle risposte CSAT;
- distribuzione per orario e giorno della settimana.

### Performance e premi

- punteggio medio e mediano del team;
- leader del mese;
- idonei e premiati;
- distanza individuale dall'obiettivo;
- distanza dal Top 3;
- composizione del punteggio per criterio;
- confronto mensile;
- classifica ordinata;
- principale opportunità di miglioramento.

### Analisi individuale

Lo storico per dipendente presenta posizione, punteggio, interazioni, valutazione, componenti del punteggio ed evoluzione mensile. I feedback sono prodotti da regole oggettive che evidenziano:

- il criterio con il miglior risultato;
- il criterio con la maggiore opportunità;
- la distanza dall'obiettivo o dal Top 3;
- un'azione suggerita in base ai numeri osservati.

## Pannelli del sistema

| Area | Domanda a cui risponde | Contenuto principale |
|---|---|---|
| Progetto | Che cosa è stato costruito e quali regole si usano? | Obiettivo, pipeline, parametri e metodologia |
| Direzionale | Quale decisione deve prendere il responsabile? | KPI, classifica, confronto mensile e piano di monitoraggio |
| Operatività | Come funziona il reparto? | Volume, TMA, P90, CSAT, copertura e distribuzione operativa |
| Clienti critici | Quali clienti hanno contattato maggiormente l'assistenza? | Volume, ricorrenza, quota, giorni attivi, operatori e segnali di monitoraggio |
| Premi | Chi ha raggiunto l'obiettivo e chi sarà premiato? | Classifica, composizione del punteggio, leadership e dettagli di calcolo |
| Storico | Come è progredita ogni persona? | Serie mensile, confronto individuale e feedback |
| Audit | Il risultato è verificabile? | Riconciliazione, esclusioni, automatici, parametri e dati validati |
| Aggiorna | Come elaborare il mese successivo? | Caricamento, mese, esclusioni dal programma e rielaborazione |

### Criteri per i clienti critici

Il pannello utilizza `Contact ID` come identificativo principale e `Contact Number` come alternativa. I numeri di telefono vengono mascherati nell'interfaccia. La classificazione indica concentrazione della domanda, non gravità tecnica:

- **Critico:** volume al 90º percentile del mese, con almeno due contatti;
- **Attenzione:** volume al 75º percentile del mese, con almeno due contatti;
- **Regolare:** gli altri clienti identificati.

Nella dimostrazione pubblica, tutti i nomi, contatti, operatori e identificativi dei ticket mostrati in questo pannello sono fittizi.

## Persistenza e modello dei dati

Neon PostgreSQL utilizza quattro tabelle principali:

| Tabella | Finalità |
|---|---|
| `competencias` | Configurazione, origine, statistiche, avvisi e snapshot mensile |
| `resultados` | Classifica, indicatori, punteggio, idoneità, premi e feedback |
| `atendimentos_validos` | Record effettivamente utilizzati nel calcolo |
| `exclusoes` | Record rimossi, codice e descrizione del motivo |

La rielaborazione è idempotente: i record del mese indicato vengono sostituiti all'interno di una transazione senza duplicare gli altri mesi.

## Esportazioni

### Excel di audit

Il file contiene questi fogli, con i nomi utilizzati dall'applicazione:

- `Ranking`;
- `Historico_Notas`;
- `Base_Validada`;
- `Log_Exclusoes`;
- `Resumo_Validacao`;
- `Parametros_Auditoria`;
- `Finalizados_Automaticos`.

### PowerPoint direzionale

La presentazione viene generata direttamente nel browser e include:

- copertina e decisione del mese;
- indicatori principali;
- regole applicate;
- pipeline di ingegneria dei dati;
- classifica e dettagli di calcolo;
- confronto mensile;
- indicatori operativi;
- controllo delle chiusure automatiche;
- analisi per dipendente;
- evidenze e raccomandazioni.

## Tecnologie utilizzate

| Area | Tecnologie | Utilizzo nel progetto |
|---|---|---|
| Linguaggio dati | Python 3.12 | Pipeline, regole, API e persistenza |
| Ingegneria dei dati | Pandas 2.2 | DataFrame, pulizia, trasformazione, qualità, aggregazione e KPI |
| File Excel | OpenPyXL e xlrd | Lettura di formati moderni e storici |
| Caricamento file | python-multipart | Ricezione di file tramite API |
| API | FastAPI e Pydantic | Endpoint, validazione dei contratti e risposte tipizzate |
| Server locale | Uvicorn | Esecuzione dell'API in sviluppo |
| Driver database | Psycopg 3 | Connessione transazionale a PostgreSQL |
| Database in produzione | Neon PostgreSQL 18 | Storico centrale, persistente e condiviso |
| Database locale | SQLite | Sviluppo e test senza infrastruttura esterna |
| Frontend | React 19 e React DOM | Interfaccia a componenti |
| Linguaggio frontend | TypeScript 5.9 | Tipizzazione e sicurezza del codice |
| Build | Vite 7 | Sviluppo e compilazione ottimizzata |
| Routing | React Router 7 | Navigazione della SPA |
| Dati asincroni | Fetch API e TanStack Query | Comunicazione con l'API e gestione delle richieste |
| Interfaccia | Tailwind CSS, shadcn/ui e Radix UI | Design responsive e componenti accessibili |
| Visualizzazione | Recharts 3 e SVG | Grafici, classifiche, obiettivi e serie storiche |
| Interazione | Lucide React, Sonner e Framer Motion | Icone, notifiche e transizioni |
| Moduli | React Hook Form e Zod | Validazione degli input |
| Date | date-fns e parser personalizzati | Visualizzazione e conversione delle date operative |
| Excel nel browser | SheetJS (`xlsx`) | Importazione alternativa ed esportazione di audit |
| PowerPoint | PptxGenJS | Report direzionale in `.pptx` |
| Cache locale | Local Storage e LZ-String | Copia compressa alternativa nel browser |
| Test frontend | Vitest | Regole TypeScript ed esportazioni |
| Test backend | Pytest | Pipeline Pandas, API e database |
| Qualità del codice | ESLint e TypeScript Compiler | Analisi statica e verifica dei tipi |
| Pacchetti | pnpm | Installazione riproducibile del frontend |
| Versionamento | Git e GitHub | Storico, collaborazione e integrazione continua |
| Hosting | Vercel CDN e Vercel Functions | Frontend e backend sullo stesso dominio |
| Infrastruttura precedente | Render | Fase precedente di hosting, sostituita da Vercel |
| Prototipi precedenti | Streamlit, Altair e Matplotlib | Prime interfacce e validazioni visive |

## API

| Metodo e percorso | Finalità |
|---|---|
| `GET /api/health` | Restituisce versione, pipeline, database e persistenza |
| `GET /api/v1/regras/{AAAA-MM}` | Restituisce i parametri ufficiali del mese |
| `POST /api/v1/detectar-competencia` | Rileva il mese dalla data iniziale |
| `POST /api/v1/competencias/processar` | Esegue la pipeline e salva il mese |
| `GET /api/v1/competencias` | Sincronizza lo storico completo |
| `GET /api/v1/competencias/{AAAA-MM}` | Consulta uno snapshot mensile |
| `PATCH /api/v1/competencias/{AAAA-MM}/feedback/{atendente}` | Aggiorna il feedback individuale |

In produzione, l'API viene utilizzata sullo stesso dominio della dashboard. Se temporaneamente indisponibile, il motore TypeScript può elaborare il file localmente e segnala che il risultato non è ancora stato condiviso con gli altri browser.

## Struttura del repository

| Percorso | Responsabilità |
|---|---|
| `backend/app/main.py` | FastAPI, endpoint e CORS |
| `backend/app/pipeline/rules.py` | Regole versionate per mese |
| `backend/app/pipeline/engine.py` | Pipeline Pandas e calcolo della classifica |
| `backend/app/database.py` | PostgreSQL/SQLite e caricamento idempotente |
| `api/index.py` | Punto di ingresso della Vercel Function |
| `src/components/` | Layout e componenti analitici |
| `src/data/support-data-runtime.ts` | Adattamento degli snapshot ai pannelli |
| `src/lib/data-pipeline-api.ts` | Integrazione con priorità API e alternativa locale |
| `src/lib/validation-engine.ts` | Motore TypeScript equivalente |
| `src/lib/dashboard-store.ts` | Cache locale dei mesi |
| `src/lib/report-export.ts` | Excel e PowerPoint |
| `src/pages/` | Pannelli della dashboard |

## Qualità e test

La suite automatizzata copre:

- regole storiche e attuali;
- tetto di 100 punti per tutti i mesi;
- tempo totale e TMA separati e comparativi;
- mese determinato dalla data iniziale;
- interazioni concluse nel mese successivo;
- filtri per reparto, operatore, orario e durata;
- corrispondenza parziale degli esclusi dal programma;
- chiusure automatiche soggette alle regole ordinarie;
- valutazioni fuori scala;
- idoneità a partire da 85 punti;
- soltanto tre premiati tra gli idonei;
- spareggio e classifica;
- persistenza e rielaborazione senza duplicati;
- endpoint dell'API;
- generazione di Excel e PowerPoint.

Comandi di validazione:

~~~bash
pnpm check
python -m pytest backend/tests -q
pnpm build:prod
~~~

La versione pubblicata è stata validata con test frontend e backend, build di produzione, verifica dello stato dell'API e connessione persistente a PostgreSQL.

## Esecuzione locale

Requisiti:

- Node.js 20 o successivo;
- pnpm;
- Python 3.12 o successivo.

~~~bash
git clone https://github.com/Pedroferreira32/support-performance-analytics.git
cd support-performance-analytics
pnpm install
python -m venv .venv
~~~

Attiva l'ambiente virtuale:

~~~bash
# Windows
.venv\Scripts\activate

# Linux o macOS
source .venv/bin/activate
~~~

Installa le dipendenze e avvia l'API:

~~~bash
pip install -r backend/requirements-dev.txt
uvicorn backend.app.main:app --reload --port 10000
~~~

In un altro terminale, configura e avvia il frontend:

~~~bash
cp .env.example .env
pnpm dev
~~~

Indirizzi locali:

- frontend: `http://localhost:5173`;
- API: `http://localhost:10000`;
- documentazione API: `http://localhost:10000/api/docs`.

Senza `DATABASE_URL`, il backend locale crea un database SQLite in `backend/data/support_performance.db`.

## Pubblicazione su Vercel

Il progetto utilizza un solo deployment:

- React/Vite viene distribuito dalla CDN di Vercel;
- `api/index.py` incapsula FastAPI come Vercel Function;
- `/api/*` viene indirizzato al backend;
- le altre rotte vengono servite dalla SPA;
- Neon viene raggiunto tramite la variabile segreta `DATABASE_URL`;
- il branch `main` attiva il deploy automatico da GitHub.

Variabili principali:

| Variabile | Ambiente | Finalità |
|---|---|---|
| `DATABASE_URL` | Production e Preview | Connessione privata a Neon PostgreSQL |
| `VITE_DATA_API_URL` | Sviluppo | URL del backend locale; non necessario in produzione |
| `VITE_ALLOW_LOCAL_PIPELINE_FALLBACK` | Facoltativa | Controlla il motore TypeScript alternativo |

Non salvare mai password o stringhe di connessione nei file versionati.

## Privacy e governance

- La dimostrazione pubblica utilizza nomi e dati sintetici.
- Il backend non conserva il file originale.
- Il database salva record elaborati, parametri ed evidenze necessari all'audit.
- La stringa di connessione è protetta come secret di Vercel.
- Il file Excel di audit deve essere conservato dopo ogni chiusura ufficiale.
- L'ambiente pubblico attuale non dispone di autenticazione; l'uso operativo di dati reali richiede prima il controllo degli accessi.

## Risultato del progetto

Il sistema sostituisce una validazione mensile frammentata con una pipeline tracciabile e un livello analitico orientato alle decisioni. Oltre a individuare i tre premiati, dimostra:

- ingegneria e qualità dei dati;
- modellazione delle regole di business;
- integrazione tra frontend, API e database;
- analisi dei KPI operativi;
- narrazione dei dati;
- automazione dei report;
- versionamento e CI/CD;
- deployment serverless in produzione.

Il progetto può essere presentato come un caso completo di **Data Engineering + Data Analytics applicato alla gestione della performance dell'assistenza**.
