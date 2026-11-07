# Support Performance — Validation and Awards

**[English](README.md)** | [Português (Brasil)](README.pt-BR.md) | [Español](README.es.md) | [Italiano](README.it.md)

Data engineering and analytics platform for validating support interactions, calculating performance indicators, identifying eligible employees, and rewarding the three highest results in each reporting month.

[Open the production dashboard](https://support-performance-analytics.vercel.app/) · [Check API health](https://support-performance-analytics.vercel.app/api/health)

> The public version is a portfolio project using synthetic data. Real employee datasets must not be published before authentication and access control are in place.

## Executive overview

I created this project to address a monthly closing process that required manually checking files exported from ChatMobi. I needed to identify interactions belonging to support, remove invalid records, apply the rules in effect for each month, calculate each employee's score, and provide an objective explanation for the awards.

The current solution turns operational data into an auditable decision. It:

- imports CSV, TXT, and Excel files;
- automatically identifies and standardizes columns;
- cleans text, numbers, ratings, and dates;
- applies data quality and business rules versioned by reporting month;
- calculates volume, total time, average handling time (AHT, labeled TMA in the application), ratings, and CSAT response coverage;
- determines eligibility from 85 points;
- rewards only the Top 3 eligible employees, ordered by score;
- stores valid records, exclusions, parameters, rankings, and feedback in history;
- provides management, operational, and individual analyses;
- identifies customers with the highest contact volume and recurrence;
- exports an Excel audit workbook and an executive PowerPoint report.

The result brings together **data engineering, data analytics, process automation, visualization, data quality, and operational intelligence**.

## Business problem

Support awards needed to recognize the strongest performance without relying on manual formulas or subjective assessments. However, raw data could contain:

- interactions from other departments;
- operators outside the award program;
- records without an agent or an end date;
- dates in different formats;
- interactions ending in the following month;
- negative durations or durations above the limit;
- interactions outside business hours;
- ratings outside the applicable scale;
- automatic closures distorting total time and AHT.

Without standardized treatment, these cases affected indicators and could change the ranking. I built the project to make the calculation reproducible, transparent, and explainable to the department manager.

## Decisions supported

At the end of each reporting month, the system answers:

1. How many records were imported, validated, and excluded?
2. Why was each record removed from the calculation?
3. How did each employee perform?
4. Who reached the minimum target of 85 points?
5. Which three eligible employees achieved the highest results?
6. Which criteria contributed most to the score?
7. What should be monitored in the next cycle?
8. How did results change compared with previous months?

## Project evolution

### 1. Manual checks and rule definition

The process started with monthly spreadsheets exported from ChatMobi. Scope, schedule, duration, rating, and scoring rules were documented and checked manually to establish a reference dataset.

### 2. Local Python automation

Validation was automated in Python, including CSV/Excel ingestion, data preparation, score calculation, and SQLite history. This reduced repetitive monthly work and produced reproducible calculation records.

### 3. Early web interfaces

Versions using Streamlit, Altair, and Matplotlib were tested. Compatibility issues between Python and library versions led to an isolated environment and, later, replacement of that interface.

### 4. Local HTML dashboard

The system evolved into HTML, CSS, and JavaScript served by a local Python server. It gained a sidebar, KPIs, rankings, individual history, audit views, feedback, Excel exports, and PowerPoint generation. Internal network access was also prepared.

### 5. Data storytelling and executive design

The dashboards were reorganized to present the decision first, then its drivers, and finally the evidence. Pie charts, clustered visuals, and hard-to-read elements were removed. The interface adopted direct comparisons, visible targets, sorted bars, analytical tables, and a presentation style inspired by professional Power BI dashboards.

### 6. React, TypeScript, and Vite

The frontend was rebuilt as a modern SPA while retaining the approved executive layout. The stack became React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, and Recharts.

### 7. Publishing and version control

The code was published on GitHub with synthetic data. Render was used during an earlier hosting phase and later replaced by Vercel, which now serves the frontend and API on the same domain through continuous integration with the `main` branch.

### 8. Return of the Python/Pandas pipeline

The modern layout was preserved while data processing returned to the center of the solution. FastAPI receives the file, the Pandas pipeline cleans, validates, transforms, calculates, and loads the data, and the TypeScript engine remains available as a local fallback.

### 9. Shared history with Neon Postgres

Local persistence was extended to managed PostgreSQL on Neon. History can now be centralized and accessed from different browsers, independently of the computer that started the system.

### 10. Automated analysis without generative AI

An experimental Ollama integration was evaluated and removed. The current version generates feedback and recommendations through deterministic KPI-based rules, keeping explanations tied to the calculated numbers.

## Production architecture

| Layer | Current implementation |
|---|---|
| Source | ChatMobi operational CSV/TXT/XLS/XLSX/XLSM files |
| Processing | Python 3.12 and Pandas 2.2 |
| API | FastAPI running as a Vercel Function |
| Persistence | Neon PostgreSQL in production and SQLite for local development |
| Application | React 19, TypeScript, and Vite |
| Visualization | Recharts, SVG, and custom analytical components |
| Exports | SheetJS and PptxGenJS |
| Deployment | GitHub + Vercel, automatically deployed from `main` |

Data flows from the ChatMobi export through FastAPI, Pandas, versioned quality and business rules, KPIs and Top 3 calculation, Neon PostgreSQL, and the React dashboard to Excel and PowerPoint exports.

In production, the frontend calls the API on the same domain. The private `DATABASE_URL` variable connects the Function to Neon; it is never exposed to the browser or stored in the repository.

## Data engineering pipeline

The monthly closing process follows an ETL structure:

### 1. Extraction

- Receive the file exported from ChatMobi.
- Read the first worksheet in Excel files.
- Automatically detect delimiters in text files.
- Locate the row containing the actual header.

### 2. Schema standardization

- Map different column names to the same logical field.
- Remove excess whitespace and normalize accents.
- Standardize agents, departments, statuses, and ticket identifiers.
- Convert ratings to numeric values.

### 3. Temporal processing

- Convert Brazilian dates, ISO dates, and Excel serial dates.
- Calculate duration in hours and AHT in minutes.
- Assign the reporting month using the start date.
- Preserve interactions starting in one month and ending in the next.

### 4. Quality and validation

- Classify every row as valid or excluded.
- Record the first exclusion reason to prevent double counting.
- Identify potentially automatic closures.
- Validate ratings against the scale applicable to the period.
- Reconcile imported, valid, and excluded totals.

### 5. Transformation and aggregation

- Group valid records by employee.
- Calculate counts, hours, and AHT means and percentiles.
- Calculate average ratings and CSAT response coverage.
- Normalize indicators against the team's best result.

### 6. Business rules

- Apply the rule profile for the reporting month.
- Calculate the final score and effective ceiling.
- Determine eligibility.
- Sort the ranking and select the Top 3 award recipients.

### 7. Loading and persistence

- Write transactionally to PostgreSQL.
- Store a complete monthly snapshot.
- Replace a reprocessed month idempotently.
- Maintain history without duplicates.

### 8. Analytical consumption

- Synchronize data with the React frontend.
- Update dashboards and feedback.
- Generate the Excel audit workbook and executive PowerPoint.

## Supported formats and fields

### Accepted files

- `.csv`
- `.txt`
- `.tsv`
- `.xlsx`
- `.xls`
- `.xlsm`

### Field mapping

The examples below retain the actual input column names recognized by the application.

| Logical field | Recognized examples | Required |
|---|---|---:|
| Agent | Atendente, User ID, Operador, Usuário, Agente | Yes |
| Start | Iniciado, Início, Data Início, Criado, Data, Criado em | Yes |
| End | Fim, Data Última Mensagem, Última Mensagem, Finalizado | Yes |
| Department | Filas, Fila, Departamento, Setor, Setores, Transfers | Yes |
| Rating | Rating, Avaliação, Nota, Satisfação | No |
| Ticket identifier | Protocolo, Ticket, ID | No |
| Status | Status, Situação | No |

When a ticket identifier is missing, the source row number is used as the audit identifier.

## Dataset validation rules

An interaction may be excluded for the following reasons:

- a department other than Support;
- a missing agent;
- an agent listed as outside the award program;
- an invalid or pending start date;
- a missing end date;
- an end date earlier than the start date;
- a duration exceeding the month's limit;
- a start time outside permitted business hours;
- a Sunday start date.

Additional rules:

- Support may appear in `Filas`, `Setores`, or transfer fields.
- The exclusion list accepts full or partial names separated by semicolons.
- Each row receives only its first exclusion reason.
- Out-of-scale ratings do not exclude an interaction; they are omitted from the average.
- The reporting month is determined by the start date, not the end date.
- A record starting on `31/08` and ending on `01/09` remains in August.
- If most start dates belong to a different month, processing is blocked and the detected month is reported.
- Records without ticket identifiers remain traceable through their row numbers.

## Automatic closures

An interaction is flagged as potentially automatic when:

- its end time is exactly `06:00`; or
- at least 20 records end in the same minute.

The flag remains available for auditing, but these records follow the same period and duration rules as other interactions. The public project does not apply special neutralization of total time or AHT.

## Scoring rules by reporting month

| Period | Rating scale | Regular limit | Volume | Time | AHT | Rating | Ceiling | Time/AHT treatment |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Through May 2026 | 0–10 | 8 hours | 30 | 15 | 25 | 30 | 100.00 | Separate, comparative indicators |
| From June 2026 | 0–5 | 9 hours | 20 | 10 | 30 | 40 | 100.00 | Separate, comparative indicators |

### Historical 100-point model

Under the first rule, total time and AHT **were not combined into a common base**. The four indicators were calculated separately:

- Volume: up to 30 points;
- Total time: up to 15 points;
- AHT: up to 25 points;
- Rating: up to 30 points.

From June 2026, the ceiling remains 100 points and total time and AHT stay independent, with weights of 10 and 30 points. Originally reported demonstration scores are preserved as historical references; new processing always uses the 100-point rule.

## Formulas

For each employee `i`:

~~~text
Volumeᵢ = number of valid interactions

Total hoursᵢ = sum of included durations

Average AHTᵢ = mean included duration in minutes

Average ratingᵢ = mean valid rating

CSAT coverageᵢ = valid ratings / valid interactions × 100
~~~

### Volume score

~~~text
Volume pointsᵢ =
(Volumeᵢ / highest team Volume) × Volume weight
~~~

### Total time score

~~~text
Time pointsᵢ =
(Total hoursᵢ / highest team total Hours) × Time weight
~~~

### AHT score

Since a lower AHT represents greater efficiency:

~~~text
AHT pointsᵢ =
(lowest positive team AHT / Average AHTᵢ) × AHT weight
~~~

### Rating score

~~~text
Rating pointsᵢ =
(Average ratingᵢ / highest team Average rating) × Rating weight
~~~

### Final score

~~~text
Final scoreᵢ =
Volume points + Time points + AHT points + Rating points
~~~

Calculations use full precision. Values are rounded only for display.

## Eligibility, ranking, and awards

- **Minimum target:** a final score of at least 85 points.
- **Eligible:** an employee who reaches the target.
- **Award recipient:** only one of the first three eligible employees.
- **Fourth eligible employee:** remains eligible but outside the awarded positions.

Ranking order:

1. highest final score;
2. highest interaction count;
3. highest average rating;
4. alphabetical order if the tie remains.

The rule distinguishes **reaching the target** from **receiving an award**. Even if four or more people reach 85 points, only the three highest results receive awards.

## Analyses and KPIs

### Data quality

- total imported;
- number and percentage of valid records;
- number and percentage of excluded records;
- distribution of exclusion reasons;
- automatic closures identified and audited;
- valid ratings;
- reconciliation of imported data, award-eligible data, and exceptions.

### Support operations

- interactions per employee;
- share of team volume;
- total included hours;
- mean and median AHT;
- P90 AHT to examine the tail of long interactions;
- average rating;
- CSAT response coverage;
- distribution by hour and weekday.

### Performance and awards

- team mean and median scores;
- monthly leader;
- eligible employees and award recipients;
- individual gap to target;
- gap to the Top 3;
- score composition by criterion;
- monthly comparison;
- sorted ranking;
- main improvement opportunity.

### Individual analysis

Employee history presents position, score, interaction count, rating, score components, and month-to-month progress. Objective rules generate feedback highlighting:

- the best-performing criterion;
- the criterion with the greatest opportunity;
- the gap to the target or the Top 3;
- a suggested action based on the observed numbers.

## Dashboard areas

| Area | Question answered | Main content |
|---|---|---|
| Project | What was built and which rules are used? | Purpose, pipeline, parameters, and methodology |
| Management | What decision does the manager need to make? | KPIs, ranking, monthly comparisons, and follow-up plan |
| Operations | How is the department operating? | Volume, AHT, P90, CSAT, coverage, and operational distribution |
| Critical customers | Which customers contacted support most? | Volume, recurrence, share, active days, agents, and follow-up signals |
| Awards | Who reached the target and who receives an award? | Ranking, score composition, leadership, and calculation details |
| History | How has each person progressed? | Monthly series, individual comparisons, and feedback |
| Audit | Can the result be verified? | Reconciliation, exclusions, automatic closures, parameters, and validated data |
| Update | How is the next reporting month processed? | Upload, month selection, program exclusions, and reprocessing |

### Critical customer criteria

The dashboard uses `Contact ID` as the primary identifier and `Contact Number` as a fallback. Phone numbers are masked in the interface. Classification indicates demand concentration rather than technical severity:

- **Critical:** volume at the month's 90th percentile, with at least two contacts;
- **Attention:** volume at the month's 75th percentile, with at least two contacts;
- **Regular:** other identified customers.

In the public demonstration, all names, contacts, agents, and ticket identifiers shown in this area are fictional.

## Persistence and data model

Neon PostgreSQL uses four main tables:

| Table | Purpose |
|---|---|
| `competencias` | Configuration, source, statistics, warnings, and monthly snapshot |
| `resultados` | Ranking, indicators, score, eligibility, awards, and feedback |
| `atendimentos_validos` | Records actually used in the calculation |
| `exclusoes` | Removed records, reason code, and description |

Reprocessing is idempotent: records for the selected month are replaced within a transaction without duplicating other months.

## Exports

### Excel audit workbook

The Excel file contains these worksheets, retaining their application names:

- `Ranking`;
- `Historico_Notas`;
- `Base_Validada`;
- `Log_Exclusoes`;
- `Resumo_Validacao`;
- `Parametros_Auditoria`;
- `Finalizados_Automaticos`.

### Executive PowerPoint

The presentation is generated directly in the browser and includes:

- cover and monthly decision;
- core indicators;
- applied rules;
- data engineering pipeline;
- ranking and calculation details;
- monthly comparison;
- operational indicators;
- automatic closure controls;
- employee analysis;
- insights and recommendations.

## Technology stack

| Area | Technologies | Use in this project |
|---|---|---|
| Data language | Python 3.12 | Pipeline, rules, API, and persistence |
| Data engineering | Pandas 2.2 | DataFrames, cleaning, transformation, quality, aggregation, and KPIs |
| Excel files | OpenPyXL and xlrd | Reading modern and legacy formats |
| Uploads | python-multipart | Receiving files through the API |
| API | FastAPI and Pydantic | Endpoints, contract validation, and typed responses |
| Local server | Uvicorn | Running the development API |
| Database driver | Psycopg 3 | Transactional PostgreSQL connections |
| Production database | Neon PostgreSQL 18 | Centralized, persistent, shared history |
| Local database | SQLite | Development and tests without external infrastructure |
| Frontend | React 19 and React DOM | Component-based interface |
| Frontend language | TypeScript 5.9 | Typing and code safety |
| Build | Vite 7 | Development and optimized builds |
| Routing | React Router 7 | SPA navigation |
| Asynchronous data | Fetch API and TanStack Query | API communication and request management |
| Interface | Tailwind CSS, shadcn/ui, and Radix UI | Responsive design and accessible components |
| Visualization | Recharts 3 and SVG | Charts, rankings, targets, and historical series |
| Interaction | Lucide React, Sonner, and Framer Motion | Icons, notifications, and transitions |
| Forms | React Hook Form and Zod | Input validation |
| Dates | date-fns and custom parsers | Display and conversion of operational dates |
| Browser Excel | SheetJS (`xlsx`) | Fallback imports and audit exports |
| PowerPoint | PptxGenJS | Executive `.pptx` reports |
| Local cache | Local Storage and LZ-String | Compressed browser fallback copy |
| Frontend tests | Vitest | TypeScript rules and exports |
| Backend tests | Pytest | Pandas pipeline, API, and database |
| Code quality | ESLint and TypeScript Compiler | Static analysis and type checking |
| Packages | pnpm | Reproducible frontend installation |
| Version control | Git and GitHub | History, collaboration, and continuous integration |
| Hosting | Vercel CDN and Vercel Functions | Frontend and backend on the same domain |
| Previous infrastructure | Render | Earlier hosting phase, replaced by Vercel |
| Earlier prototypes | Streamlit, Altair, and Matplotlib | Initial interfaces and visual validation |

## API

| Method and route | Purpose |
|---|---|
| `GET /api/health` | Reports version, pipeline, database, and persistence |
| `GET /api/v1/regras/{AAAA-MM}` | Returns the official monthly parameters |
| `POST /api/v1/detectar-competencia` | Detects the month from start dates |
| `POST /api/v1/competencias/processar` | Runs the pipeline and saves the reporting month |
| `GET /api/v1/competencias` | Synchronizes the complete history |
| `GET /api/v1/competencias/{AAAA-MM}` | Retrieves a monthly snapshot |
| `PATCH /api/v1/competencias/{AAAA-MM}/feedback/{atendente}` | Updates individual feedback |

In production, the API is accessed on the dashboard's domain. If temporarily unavailable, the TypeScript engine can process the file locally and indicates that the result has not yet been shared with other browsers.

## Repository structure

| Path | Responsibility |
|---|---|
| `backend/app/main.py` | FastAPI, endpoints, and CORS |
| `backend/app/pipeline/rules.py` | Rules versioned by reporting month |
| `backend/app/pipeline/engine.py` | Pandas pipeline and ranking calculation |
| `backend/app/database.py` | PostgreSQL/SQLite and idempotent loading |
| `api/index.py` | Vercel Function entry point |
| `src/components/` | Layout and analytical components |
| `src/data/support-data-runtime.ts` | Adapting snapshots for dashboards |
| `src/lib/data-pipeline-api.ts` | API-first integration and fallback |
| `src/lib/validation-engine.ts` | Equivalent TypeScript engine |
| `src/lib/dashboard-store.ts` | Local monthly cache |
| `src/lib/report-export.ts` | Excel and PowerPoint |
| `src/pages/` | Dashboard pages |

## Quality and tests

The automated suite covers:

- historical and current rules;
- a 100-point ceiling for every reporting month;
- separate, comparative total time and AHT;
- reporting month determined by start date;
- interactions ending in the following month;
- department, agent, business-hour, and duration filters;
- partial matching of people outside the award program;
- automatic closures following regular rules;
- out-of-scale ratings;
- eligibility from 85 points;
- only three award recipients among eligible employees;
- tie-breaking and ranking;
- persistence and duplicate-free reprocessing;
- API endpoints;
- Excel and PowerPoint generation.

Validation commands:

~~~bash
pnpm check
python -m pytest backend/tests -q
pnpm build:prod
~~~

The published version was validated with frontend and backend tests, a production build, API health checks, and a persistent PostgreSQL connection.

## Local setup

Requirements:

- Node.js 20 or later;
- pnpm;
- Python 3.12 or later.

~~~bash
git clone https://github.com/Pedroferreira32/support-performance-analytics.git
cd support-performance-analytics
pnpm install
python -m venv .venv
~~~

Activate the virtual environment:

~~~bash
# Windows
.venv\Scripts\activate

# Linux or macOS
source .venv/bin/activate
~~~

Install dependencies and run the API:

~~~bash
pip install -r backend/requirements-dev.txt
uvicorn backend.app.main:app --reload --port 10000
~~~

In another terminal, configure and start the frontend:

~~~bash
cp .env.example .env
pnpm dev
~~~

Local addresses:

- frontend: `http://localhost:5173`;
- API: `http://localhost:10000`;
- API documentation: `http://localhost:10000/api/docs`.

Without `DATABASE_URL`, the local backend creates a SQLite database at `backend/data/support_performance.db`.

## Deployment on Vercel

The project uses a single deployment:

- React/Vite is distributed through Vercel's CDN;
- `api/index.py` packages FastAPI as a Vercel Function;
- `/api/*` is routed to the backend;
- other routes are served by the SPA;
- Neon is accessed through the secret `DATABASE_URL` variable;
- the `main` branch triggers automatic GitHub deployments.

Main variables:

| Variable | Environment | Purpose |
|---|---|---|
| `DATABASE_URL` | Production and Preview | Private connection to Neon PostgreSQL |
| `VITE_DATA_API_URL` | Development | Local backend URL; unnecessary in production |
| `VITE_ALLOW_LOCAL_PIPELINE_FALLBACK` | Optional | Controls the fallback TypeScript engine |

Never store passwords or connection strings in versioned files.

## Privacy and governance

- The public demonstration uses synthetic names and data.
- The backend does not retain the original file.
- The database stores processed records, parameters, and evidence needed for auditing.
- The connection string is protected as a Vercel secret.
- The audit workbook should be saved after every official monthly closing.
- The current public environment has no authentication; real data requires access control before operational use.

## Project outcome

The system replaces fragmented monthly validation with a traceable pipeline and a decision-oriented analytical layer. Beyond identifying the Top 3 award recipients, it demonstrates:

- data engineering and quality;
- business rule modeling;
- frontend, API, and database integration;
- operational KPI analysis;
- data storytelling;
- report automation;
- version control and CI/CD;
- production serverless deployment.

The project can be presented as a complete **Data Engineering + Data Analytics case applied to support performance management**.
