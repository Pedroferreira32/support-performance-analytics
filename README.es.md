# Rendimiento del Soporte — Validación y Premios

[English](README.md) | [Português (Brasil)](README.pt-BR.md) | **[Español](README.es.md)** | [Italiano](README.it.md)

Plataforma de ingeniería y análisis de datos para validar las interacciones de soporte, calcular indicadores de rendimiento, identificar a los empleados elegibles y premiar los tres mejores resultados de cada mes de referencia.

[Acceder al dashboard en producción](https://support-performance-analytics.vercel.app/) · [Comprobar el estado de la API](https://support-performance-analytics.vercel.app/api/health)

> La versión pública es un proyecto de portafolio y utiliza datos sintéticos. No deben publicarse datos reales de empleados antes de implementar autenticación y control de acceso.

## Resumen ejecutivo

Creé este proyecto para resolver un cierre mensual que requería revisar manualmente archivos exportados de ChatMobi. Era necesario identificar qué interacciones pertenecían al soporte, retirar registros inválidos, respetar las reglas vigentes en cada mes, calcular la puntuación de cada empleado y justificar objetivamente los premios.

La solución actual transforma los datos operativos en una decisión auditable. El sistema:

- importa archivos CSV, TXT y Excel;
- identifica y estandariza automáticamente las columnas;
- limpia textos, números, valoraciones y fechas;
- aplica reglas de calidad y de negocio versionadas por mes de referencia;
- calcula volumen, tiempo total, tiempo medio de atención (TMA), valoración y cobertura de respuestas CSAT;
- determina la elegibilidad a partir de 85 puntos;
- premia únicamente al Top 3 entre los elegibles, por mayor puntuación;
- registra datos válidos, exclusiones, parámetros, clasificación y comentarios en el historial;
- presenta análisis de gestión, operativos e individuales;
- identifica a los clientes con mayor volumen y recurrencia de contactos;
- exporta una auditoría en Excel y un informe ejecutivo en PowerPoint.

El resultado reúne **ingeniería de datos, análisis de datos, automatización de procesos, visualización, calidad de datos e inteligencia operativa**.

## Problema de negocio

Los premios del soporte debían reconocer los mejores resultados sin depender de fórmulas manuales ni evaluaciones subjetivas. Sin embargo, los datos sin procesar podían contener:

- interacciones de otros departamentos;
- operadores fuera del programa de premios;
- registros sin agente o sin fecha de finalización;
- fechas en formatos diferentes;
- interacciones finalizadas en el mes siguiente;
- duraciones negativas o superiores al límite;
- interacciones fuera del horario laboral;
- valoraciones fuera de la escala vigente;
- cierres automáticos que distorsionaban el tiempo total y el TMA.

Sin un tratamiento estandarizado, estos casos modificaban los indicadores y podían cambiar la clasificación. Creé el proyecto para convertir este cálculo en un proceso reproducible, transparente y explicable al responsable del departamento.

## Decisiones apoyadas

Al finalizar cada mes de referencia, el sistema responde:

1. ¿Cuántos registros se importaron, validaron y excluyeron?
2. ¿Por qué se retiró cada registro del cálculo?
3. ¿Cuál fue el rendimiento de cada empleado?
4. ¿Quién alcanzó el objetivo mínimo de 85 puntos?
5. ¿Cuáles son los tres mejores resultados entre los elegibles?
6. ¿Qué criterios influyeron más en la puntuación?
7. ¿Qué aspectos deben seguirse en el próximo ciclo?
8. ¿Cómo evolucionó el resultado respecto a meses anteriores?

## Evolución del proyecto

### 1. Revisión manual y definición de reglas

El proceso comenzó con hojas de cálculo mensuales exportadas de ChatMobi. Las reglas de alcance, horario, duración, valoración y puntuación se documentaron y revisaron manualmente para establecer una base de referencia.

### 2. Automatización local con Python

La validación se automatizó con Python: lectura de CSV/Excel, tratamiento de datos, cálculo de puntuaciones e historial en SQLite. Esta etapa redujo las tareas repetitivas del cierre mensual y generó un registro de cálculo reproducible.

### 3. Primeras interfaces web

Se probaron versiones con Streamlit, Altair y Matplotlib. Los problemas de compatibilidad entre Python y las bibliotecas motivaron la creación de un entorno aislado y, posteriormente, la sustitución de esa interfaz.

### 4. Dashboard HTML local

El sistema evolucionó hacia HTML, CSS y JavaScript, ejecutados mediante un servidor Python local. Se incorporaron menú lateral, KPIs, clasificación, historial individual, auditoría, comentarios, exportación a Excel y generación de PowerPoint. También se preparó el acceso por la red interna.

### 5. Narrativa de datos y diseño ejecutivo

Los paneles se reorganizaron para mostrar primero la decisión, después sus factores y finalmente las evidencias. Se retiraron gráficos circulares, visualizaciones agrupadas y elementos difíciles de interpretar. La interfaz pasó a utilizar comparaciones directas, objetivos visibles, barras ordenadas, tablas analíticas y un estilo inspirado en dashboards profesionales de Power BI.

### 6. React, TypeScript y Vite

El frontend se reconstruyó como una SPA moderna, conservando el diseño ejecutivo aprobado. El proyecto pasó a utilizar React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI y Recharts.

### 7. Publicación y control de versiones

El código se publicó en GitHub con datos sintéticos. Render se utilizó en una etapa anterior de alojamiento y después se sustituyó por Vercel, que actualmente publica frontend y API en el mismo dominio mediante integración continua con la rama `main`.

### 8. Regreso del pipeline Python/Pandas

Se conservó el diseño moderno y el procesamiento de datos volvió al centro de la solución. FastAPI recibe el archivo, el pipeline Pandas limpia, valida, transforma, calcula y carga los datos, y el motor TypeScript permanece como alternativa local.

### 9. Historial compartido con Neon Postgres

La persistencia local se amplió a PostgreSQL administrado en Neon. El historial puede centralizarse y consultarse desde distintos navegadores sin depender del equipo que inició el sistema.

### 10. Análisis automatizado sin IA generativa

Se evaluó y retiró una integración experimental con Ollama. La versión actual genera comentarios y recomendaciones mediante reglas deterministas basadas en los KPIs, manteniendo las explicaciones vinculadas a las cifras calculadas.

## Arquitectura en producción

| Capa | Implementación actual |
|---|---|
| Origen | Archivos operativos CSV/TXT/XLS/XLSX/XLSM de ChatMobi |
| Procesamiento | Python 3.12 y Pandas 2.2 |
| API | FastAPI ejecutada como Vercel Function |
| Persistencia | Neon PostgreSQL en producción y SQLite en desarrollo local |
| Aplicación | React 19, TypeScript y Vite |
| Visualización | Recharts, SVG y componentes analíticos propios |
| Exportaciones | SheetJS y PptxGenJS |
| Publicación | GitHub + Vercel, con despliegue automático desde `main` |

Los datos pasan de la exportación de ChatMobi a FastAPI, Pandas, las reglas versionadas de calidad y negocio, el cálculo de KPIs y Top 3, Neon PostgreSQL y el dashboard React, hasta las exportaciones Excel y PowerPoint.

En producción, el frontend llama a la API desde el mismo dominio. La variable privada `DATABASE_URL` conecta la Function con Neon; nunca se expone al navegador ni se almacena en el repositorio.

## Pipeline de ingeniería de datos

El cierre mensual sigue una estructura ETL:

### 1. Extracción

- Recepción del archivo exportado de ChatMobi.
- Lectura de la primera hoja de los archivos Excel.
- Detección automática del delimitador en archivos de texto.
- Localización de la fila que contiene el encabezado real.

### 2. Estandarización del esquema

- Asociación de distintos nombres al mismo campo lógico.
- Eliminación de espacios sobrantes y normalización de acentos.
- Estandarización de agente, departamento, estado e identificador de ticket.
- Conversión de valoraciones a valores numéricos.

### 3. Tratamiento temporal

- Conversión de fechas brasileñas, ISO y números de serie de Excel.
- Cálculo de duración en horas y TMA en minutos.
- Determinación del mes de referencia por la fecha de inicio.
- Conservación de interacciones iniciadas en un mes y finalizadas en el siguiente.

### 4. Calidad y validación

- Clasificación de cada fila como válida o excluida.
- Registro del primer motivo de exclusión para evitar el doble conteo.
- Identificación de cierres potencialmente automáticos.
- Validación de la escala de valoración correspondiente al período.
- Conciliación entre registros importados, válidos y excluidos.

### 5. Transformación y agregación

- Agrupación de registros válidos por empleado.
- Cálculo de cantidades, horas, media y percentiles del TMA.
- Cálculo de valoración media y cobertura de respuestas CSAT.
- Normalización de indicadores según el mejor resultado del equipo.

### 6. Reglas de negocio

- Aplicación del perfil correspondiente al mes de referencia.
- Cálculo de puntuación final y límite efectivo.
- Definición de elegibilidad.
- Ordenación de la clasificación y selección del Top 3 premiado.

### 7. Carga y persistencia

- Escritura transaccional en PostgreSQL.
- Instantánea completa del mes de referencia.
- Sustitución idempotente del mes reprocesado.
- Historial sin duplicados.

### 8. Consumo analítico

- Sincronización de datos con el frontend React.
- Actualización de paneles y comentarios.
- Generación del Excel de auditoría y PowerPoint ejecutivo.

## Formatos y campos reconocidos

### Archivos admitidos

- `.csv`
- `.txt`
- `.tsv`
- `.xlsx`
- `.xls`
- `.xlsm`

### Mapeo de campos

Los ejemplos conservan los nombres reales de las columnas de entrada reconocidas por la aplicación.

| Campo lógico | Ejemplos reconocidos | Obligatorio |
|---|---|---:|
| Agente | Atendente, User ID, Operador, Usuário, Agente | Sí |
| Inicio | Iniciado, Início, Data Início, Criado, Data, Criado em | Sí |
| Finalización | Fim, Data Última Mensagem, Última Mensagem, Finalizado | Sí |
| Departamento | Filas, Fila, Departamento, Setor, Setores, Transfers | Sí |
| Valoración | Rating, Avaliação, Nota, Satisfação | No |
| Identificador de ticket | Protocolo, Ticket, ID | No |
| Estado | Status, Situação | No |

Cuando no existe identificador de ticket, se utiliza el número de fila de origen como identificador de auditoría.

## Reglas de validación de datos

Una interacción puede excluirse por los siguientes motivos:

- departamento distinto de Soporte;
- agente no informado;
- agente incluido en la lista de personas fuera del programa;
- fecha de inicio inválida o pendiente;
- fecha de finalización ausente;
- fecha de finalización anterior al inicio;
- duración superior al límite del mes;
- inicio fuera del horario permitido;
- inicio en domingo.

Reglas adicionales:

- Soporte puede aparecer en `Filas`, `Setores` o campos de transferencia.
- La lista de personas fuera del programa admite nombres completos o parciales separados por punto y coma.
- Cada fila recibe únicamente su primer motivo de exclusión.
- Las valoraciones fuera de escala no excluyen la interacción; se omiten de la media.
- El mes de referencia se determina por el inicio, no por la finalización.
- Un registro iniciado el `31/08` y finalizado el `01/09` permanece en agosto.
- Si la mayoría de los inicios pertenece a otro mes, se bloquea el procesamiento y se informa el mes detectado.
- Los registros sin identificador siguen siendo trazables mediante el número de fila.

## Cierres automáticos

Una interacción se marca como potencialmente automática cuando:

- su hora de finalización es exactamente `06:00`; o
- al menos 20 registros terminan en el mismo minuto.

La marca permanece disponible para auditoría, pero estos registros siguen las mismas reglas de período y duración que las demás interacciones. El proyecto público no aplica una neutralización especial del tiempo total ni del TMA.

## Reglas de puntuación por mes

| Período | Escala | Límite habitual | Volumen | Tiempo | TMA | Valoración | Máximo | Tratamiento de Tiempo/TMA |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Hasta mayo/2026 | 0–10 | 8 horas | 30 | 15 | 25 | 30 | 100,00 | Separados y comparativos |
| Desde junio/2026 | 0–5 | 9 horas | 20 | 10 | 30 | 40 | 100,00 | Separados y comparativos |

### Modelo histórico de 100 puntos

En la primera regla, el tiempo total y el TMA **no se sumaban como una base común**. Los cuatro indicadores se calculaban por separado:

- Volumen: hasta 30 puntos;
- Tiempo total: hasta 15 puntos;
- TMA: hasta 25 puntos;
- Valoración: hasta 30 puntos.

Desde junio/2026, el máximo continúa en 100 puntos y mantiene tiempo total y TMA independientes, con pesos de 10 y 30 puntos. Las puntuaciones de demostración publicadas originalmente se conservan como referencia histórica; los nuevos procesamientos siempre utilizan la regla de 100 puntos.

## Fórmulas utilizadas

Para cada empleado `i`:

~~~text
Volumenᵢ = número de interacciones válidas

Horas totalesᵢ = suma de las duraciones consideradas

TMA medioᵢ = media de las duraciones consideradas en minutos

Valoración mediaᵢ = media de las valoraciones válidas

Cobertura CSATᵢ = valoraciones válidas / interacciones válidas × 100
~~~

### Puntuación de volumen

~~~text
Puntos de volumenᵢ =
(Volumenᵢ / mayor Volumen del equipo) × peso de Volumen
~~~

### Puntuación de tiempo total

~~~text
Puntos de tiempoᵢ =
(Horas totalesᵢ / mayor total de Horas del equipo) × peso de Tiempo
~~~

### Puntuación de TMA

Un TMA menor representa mayor eficiencia:

~~~text
Puntos TMAᵢ =
(menor TMA positivo del equipo / TMA medioᵢ) × peso de TMA
~~~

### Puntuación de valoración

~~~text
Puntos de valoraciónᵢ =
(Valoración mediaᵢ / mayor Valoración media del equipo) × peso de Valoración
~~~

### Puntuación final

~~~text
Puntuación finalᵢ =
Puntos de volumen + Puntos de tiempo + Puntos TMA + Puntos de valoración
~~~

Los cálculos utilizan toda la precisión. Los valores solo se redondean para su presentación.

## Elegibilidad, clasificación y premios

- **Objetivo mínimo:** puntuación final igual o superior a 85 puntos.
- **Elegible:** empleado que alcanzó el objetivo.
- **Premiado:** únicamente uno de los tres primeros elegibles.
- **Cuarto elegible:** mantiene la elegibilidad, pero queda fuera de los puestos premiados.

Orden de clasificación:

1. mayor puntuación final;
2. mayor cantidad de interacciones;
3. mayor valoración media;
4. orden alfabético si persiste el empate.

La regla distingue **alcanzar el objetivo** de **recibir un premio**. Aunque cuatro o más personas lleguen a 85 puntos, solo se premian los tres mejores resultados.

## Análisis y KPIs

### Calidad de los datos

- total importado;
- cantidad y porcentaje de registros válidos;
- cantidad y porcentaje de excluidos;
- distribución de motivos de exclusión;
- cierres automáticos identificados y auditados;
- valoraciones válidas;
- conciliación entre datos importados, datos elegibles para premios y excepciones.

### Operación del soporte

- volumen de interacciones por empleado;
- participación en el volumen del equipo;
- horas totales consideradas;
- TMA medio y mediano;
- TMA P90 para observar la cola de interacciones largas;
- valoración media;
- cobertura de respuestas CSAT;
- distribución por hora y día de la semana.

### Rendimiento y premios

- puntuación media y mediana del equipo;
- líder del mes;
- elegibles y premiados;
- distancia individual al objetivo;
- distancia al Top 3;
- composición de la puntuación por criterio;
- comparación mensual;
- clasificación ordenada;
- principal oportunidad de mejora.

### Análisis individual

El historial por empleado muestra posición, puntuación, interacciones, valoración, componentes y evolución mensual. Los comentarios se generan mediante reglas objetivas que destacan:

- el criterio de mejor aprovechamiento;
- el criterio con mayor oportunidad;
- la distancia al objetivo o al Top 3;
- una acción sugerida según las cifras observadas.

## Paneles del sistema

| Área | Pregunta respondida | Contenido principal |
|---|---|---|
| Proyecto | ¿Qué se construyó y qué reglas se utilizan? | Objetivo, pipeline, parámetros y metodología |
| Gestión | ¿Qué decisión debe tomar el responsable? | KPIs, clasificación, comparación mensual y plan de seguimiento |
| Operación | ¿Cómo funciona el departamento? | Volumen, TMA, P90, CSAT, cobertura y distribución operativa |
| Clientes críticos | ¿Qué clientes contactaron más al soporte? | Volumen, recurrencia, participación, días activos, agentes y señales de seguimiento |
| Premios | ¿Quién alcanzó el objetivo y quién será premiado? | Clasificación, composición de la puntuación, liderazgo y detalle de cálculo |
| Historial | ¿Cómo evolucionó cada persona? | Serie mensual, comparación individual y comentarios |
| Auditoría | ¿Se puede verificar el resultado? | Conciliación, exclusiones, automáticos, parámetros y datos validados |
| Actualizar | ¿Cómo procesar el próximo mes? | Carga, mes de referencia, exclusiones del programa y reprocesamiento |

### Criterio de clientes críticos

El panel utiliza `Contact ID` como identificador principal y `Contact Number` como alternativa. Los teléfonos se muestran enmascarados. La clasificación indica concentración de demanda, no gravedad técnica:

- **Crítico:** volumen en el percentil 90 del mes, con al menos dos contactos;
- **Atención:** volumen en el percentil 75 del mes, con al menos dos contactos;
- **Regular:** demás clientes identificados.

En la demostración pública, todos los nombres, contactos, agentes e identificadores de ticket de este panel son ficticios.

## Persistencia y modelo de datos

Neon PostgreSQL utiliza cuatro tablas principales:

| Tabla | Finalidad |
|---|---|
| `competencias` | Configuración, origen, estadísticas, avisos e instantánea mensual |
| `resultados` | Clasificación, indicadores, puntuación, elegibilidad, premios y comentarios |
| `atendimentos_validos` | Registros efectivamente utilizados en el cálculo |
| `exclusoes` | Registros retirados, código y descripción del motivo |

El reprocesamiento es idempotente: los registros del mes indicado se sustituyen dentro de una transacción, sin duplicar los demás meses.

## Exportaciones

### Excel de auditoría

El archivo contiene estas hojas, conservando los nombres de la aplicación:

- `Ranking`;
- `Historico_Notas`;
- `Base_Validada`;
- `Log_Exclusoes`;
- `Resumo_Validacao`;
- `Parametros_Auditoria`;
- `Finalizados_Automaticos`.

### PowerPoint ejecutivo

La presentación se genera directamente en el navegador e incluye:

- portada y decisión del mes;
- indicadores principales;
- reglas aplicadas;
- pipeline de ingeniería de datos;
- clasificación y detalle de cálculo;
- comparación mensual;
- indicadores operativos;
- control de cierres automáticos;
- análisis por empleado;
- conclusiones y recomendaciones.

## Tecnologías utilizadas

| Área | Tecnologías | Uso en el proyecto |
|---|---|---|
| Lenguaje de datos | Python 3.12 | Pipeline, reglas, API y persistencia |
| Ingeniería de datos | Pandas 2.2 | DataFrames, limpieza, transformación, calidad, agregación y KPIs |
| Archivos Excel | OpenPyXL y xlrd | Lectura de formatos modernos e históricos |
| Carga de archivos | python-multipart | Recepción de archivos mediante la API |
| API | FastAPI y Pydantic | Endpoints, validación de contratos y respuestas tipadas |
| Servidor local | Uvicorn | Ejecución de la API en desarrollo |
| Controlador de base de datos | Psycopg 3 | Conexión transaccional con PostgreSQL |
| Base en producción | Neon PostgreSQL 18 | Historial central, persistente y compartido |
| Base local | SQLite | Desarrollo y pruebas sin infraestructura externa |
| Frontend | React 19 y React DOM | Interfaz basada en componentes |
| Lenguaje del frontend | TypeScript 5.9 | Tipado y seguridad del código |
| Compilación | Vite 7 | Desarrollo y compilación optimizada |
| Rutas | React Router 7 | Navegación de la SPA |
| Datos asíncronos | Fetch API y TanStack Query | Comunicación con la API y gestión de solicitudes |
| Interfaz | Tailwind CSS, shadcn/ui y Radix UI | Diseño adaptable y componentes accesibles |
| Visualización | Recharts 3 y SVG | Gráficos, clasificaciones, objetivos y series históricas |
| Interacción | Lucide React, Sonner y Framer Motion | Iconos, avisos y transiciones |
| Formularios | React Hook Form y Zod | Validación de entradas |
| Fechas | date-fns y analizadores propios | Presentación y conversión de fechas operativas |
| Excel en el navegador | SheetJS (`xlsx`) | Importación alternativa y exportación de auditoría |
| PowerPoint | PptxGenJS | Informe ejecutivo en `.pptx` |
| Caché local | Local Storage y LZ-String | Copia comprimida alternativa en el navegador |
| Pruebas del frontend | Vitest | Reglas TypeScript y exportaciones |
| Pruebas del backend | Pytest | Pipeline Pandas, API y base de datos |
| Calidad del código | ESLint y TypeScript Compiler | Análisis estático y comprobación de tipos |
| Paquetes | pnpm | Instalación reproducible del frontend |
| Control de versiones | Git y GitHub | Historial, colaboración e integración continua |
| Alojamiento | Vercel CDN y Vercel Functions | Frontend y backend en el mismo dominio |
| Infraestructura anterior | Render | Etapa anterior de alojamiento, sustituida por Vercel |
| Prototipos anteriores | Streamlit, Altair y Matplotlib | Primeras interfaces y validaciones visuales |

## API

| Método y ruta | Finalidad |
|---|---|
| `GET /api/health` | Informa versión, pipeline, base de datos y persistencia |
| `GET /api/v1/regras/{AAAA-MM}` | Devuelve los parámetros oficiales del mes |
| `POST /api/v1/detectar-competencia` | Detecta el mes por la fecha de inicio |
| `POST /api/v1/competencias/processar` | Ejecuta el pipeline y guarda el mes |
| `GET /api/v1/competencias` | Sincroniza el historial completo |
| `GET /api/v1/competencias/{AAAA-MM}` | Consulta una instantánea mensual |
| `PATCH /api/v1/competencias/{AAAA-MM}/feedback/{atendente}` | Actualiza el comentario individual |

En producción, la API se consume desde el mismo dominio del dashboard. Si no está disponible temporalmente, el motor TypeScript puede procesar el archivo localmente e informa que el resultado todavía no se ha compartido con otros navegadores.

## Estructura del repositorio

| Ruta | Responsabilidad |
|---|---|
| `backend/app/main.py` | FastAPI, endpoints y CORS |
| `backend/app/pipeline/rules.py` | Reglas versionadas por mes |
| `backend/app/pipeline/engine.py` | Pipeline Pandas y cálculo de clasificación |
| `backend/app/database.py` | PostgreSQL/SQLite y carga idempotente |
| `api/index.py` | Punto de entrada de Vercel Function |
| `src/components/` | Diseño y componentes analíticos |
| `src/data/support-data-runtime.ts` | Adaptación de instantáneas a los paneles |
| `src/lib/data-pipeline-api.ts` | Integración con prioridad de API y alternativa local |
| `src/lib/validation-engine.ts` | Motor TypeScript equivalente |
| `src/lib/dashboard-store.ts` | Caché local de meses |
| `src/lib/report-export.ts` | Excel y PowerPoint |
| `src/pages/` | Paneles del dashboard |

## Calidad y pruebas

La suite automatizada cubre:

- reglas históricas y actuales;
- máximo de 100 puntos en todos los meses;
- tiempo total y TMA separados y comparativos;
- mes determinado por la fecha de inicio;
- interacción finalizada en el mes siguiente;
- filtros de departamento, agente, horario y duración;
- coincidencia parcial de personas fuera del programa;
- cierres automáticos sujetos a las reglas habituales;
- valoraciones fuera de escala;
- elegibilidad a partir de 85 puntos;
- únicamente tres premiados entre los elegibles;
- desempate y clasificación;
- persistencia y reprocesamiento sin duplicados;
- endpoints de la API;
- generación de Excel y PowerPoint.

Comandos de validación:

~~~bash
pnpm check
python -m pytest backend/tests -q
pnpm build:prod
~~~

La versión publicada se validó mediante pruebas del frontend y backend, compilación de producción, comprobación de la API y conexión persistente con PostgreSQL.

## Ejecución local

Requisitos:

- Node.js 20 o superior;
- pnpm;
- Python 3.12 o superior.

~~~bash
git clone https://github.com/Pedroferreira32/support-performance-analytics.git
cd support-performance-analytics
pnpm install
python -m venv .venv
~~~

Active el entorno virtual:

~~~bash
# Windows
.venv\Scripts\activate

# Linux o macOS
source .venv/bin/activate
~~~

Instale las dependencias y ejecute la API:

~~~bash
pip install -r backend/requirements-dev.txt
uvicorn backend.app.main:app --reload --port 10000
~~~

En otra terminal, configure e inicie el frontend:

~~~bash
cp .env.example .env
pnpm dev
~~~

Direcciones locales:

- frontend: `http://localhost:5173`;
- API: `http://localhost:10000`;
- documentación de la API: `http://localhost:10000/api/docs`.

Sin `DATABASE_URL`, el backend local crea una base SQLite en `backend/data/support_performance.db`.

## Publicación en Vercel

El proyecto utiliza un único despliegue:

- React/Vite se distribuye mediante la CDN de Vercel;
- `api/index.py` empaqueta FastAPI como Vercel Function;
- `/api/*` se dirige al backend;
- las demás rutas se sirven mediante la SPA;
- Neon se consulta mediante la variable secreta `DATABASE_URL`;
- la rama `main` activa el despliegue automático desde GitHub.

Variables principales:

| Variable | Entorno | Finalidad |
|---|---|---|
| `DATABASE_URL` | Production y Preview | Conexión privada con Neon PostgreSQL |
| `VITE_DATA_API_URL` | Desarrollo | URL del backend local; innecesaria en producción |
| `VITE_ALLOW_LOCAL_PIPELINE_FALLBACK` | Opcional | Controla el motor TypeScript alternativo |

Nunca almacene contraseñas ni cadenas de conexión en archivos versionados.

## Privacidad y gobernanza

- La demostración pública utiliza nombres y datos sintéticos.
- El backend no conserva el archivo original.
- La base almacena registros tratados, parámetros y evidencias necesarias para auditoría.
- La cadena de conexión se protege como secreto de Vercel.
- El Excel de auditoría debe guardarse después de cada cierre oficial.
- El entorno público actual no tiene autenticación; el uso operativo de datos reales requiere control de acceso previo.

## Resultado del proyecto

El sistema sustituye una validación mensual fragmentada por un pipeline trazable y una capa analítica orientada a decisiones. Además de identificar el Top 3 premiado, demuestra:

- ingeniería y calidad de datos;
- modelado de reglas de negocio;
- integración entre frontend, API y base de datos;
- análisis de KPIs operativos;
- narrativa con datos;
- automatización de informes;
- control de versiones y CI/CD;
- despliegue serverless en producción.

Puede presentarse como un caso completo de **Data Engineering + Data Analytics aplicado a la gestión del rendimiento del soporte**.
