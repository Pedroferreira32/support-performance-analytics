# Performance Analytics: validação e premiação do suporte

Aplicação web desenvolvida em Python para transformar dados brutos de atendimento em uma visão executiva de operação, qualidade, desempenho, ranking e premiação auditável.

**Versão atual:** 4.0 — interface gerencial redesenhada e visualizações com maior legibilidade.

> **Privacidade:** esta edição de portfólio utiliza somente dados sintéticos. Nomes, protocolos, avaliações e atendimentos foram gerados artificialmente e não representam pessoas ou operações reais.

## Demonstração

O dashboard público é distribuído pela **Vercel** a partir da branch `main`. O endereço
de produção é informado no painel da Vercel depois da primeira implantação.

A aplicação inicia preenchida com três competências fictícias. A competência mais recente contém **2.477 registros sintéticos**, permitindo navegar por um cenário próximo da escala analisada no projeto original.

Na hospedagem pública, o ambiente funciona em modo somente leitura. Importações e alterações de feedback permanecem visíveis para demonstrar o fluxo completo, mas ficam bloqueadas para visitantes.

## Problema de negócio

A apuração de uma campanha de desempenho dependia de várias regras aplicadas sobre arquivos mensais de atendimento: período válido, área responsável, duração, qualidade das avaliações, encerramentos automáticos e critérios de elegibilidade. Um processo manual tornava difícil explicar por que cada registro havia sido aceito ou excluído.

## Solução desenvolvida

O sistema implementa um pipeline completo de dados:

1. Importação de arquivos CSV e Excel;
2. Reconhecimento e padronização de colunas;
3. Conversão e validação de datas e valores;
4. Aplicação das regras de negócio por competência;
5. Detecção de registros inválidos e encerramentos automáticos;
6. Cálculo e normalização dos indicadores;
7. Geração do ranking e validação da elegibilidade;
8. Persistência do histórico em SQLite;
9. Apresentação dos resultados em dashboard e relatórios executivos.

Cada exclusão preserva o motivo, a linha de origem e os campos necessários para auditoria. O reprocessamento substitui apenas a competência selecionada, evitando duplicidades no histórico.

## Visões executivas

- **Visão do projeto:** descrição breve, fluxo de engenharia de dados e catálogo completo das regras e validações;
- **Resumo gerencial:** resultado, risco e próxima decisão em uma única tela;
- **Operação:** volume observado, TMA mediano/P90, CSAT, cobertura e exceções;
- **Premiação:** regra oficial, teto efetivo, elegibilidade, Top 3 e memória de cálculo;
- **Histórico:** evolução individual com representatividade das avaliações;
- **Auditoria:** separação entre erros de dados, fora do escopo, exceções operacionais e encerramentos automáticos.

## Interface e visualizações

A **versão 4.0** adota uma interface gerencial direta, com tipografia única, hierarquia previsível, cartões claros e rótulos legíveis. A navegação acompanha a sequência de análise: entender o processo, ler o resultado, investigar os direcionadores e consultar o detalhe. O dashboard usa:

- dot plot para posição individual em relação ao corte de 85 pontos;
- ponte aditiva para explicar a formação da nota;
- fotografias mensais quando mudanças de regra impedem uma tendência contínua;
- linha horária para revelar o perfil da demanda;
- tabelas somente quando o objetivo é conferência exata ou auditoria.

## Indicadores apresentados

- Volume de atendimentos válidos;
- Tempo Médio de Atendimento (média, mediana e P90 na leitura operacional);
- Horas totais absorvidas;
- Avaliação média e cobertura das avaliações;
- Aproveitamento e taxa de exclusão da base;
- Pontuação por componente;
- Nota consolidada, elegibilidade e Top 3;
- Fechamentos mensais da equipe e de cada profissional, com mudança de regra explicitada;
- Volume observado versus qualidade, sem inferir produtividade quando jornada e complexidade não estão disponíveis;
- Concentração de volume e oportunidades de melhoria.

## Funcionalidades

- Resumo gerencial orientado a decisão;
- Análise gerencial baseada em cálculos reproduzíveis e evidências da própria base;
- Visão operacional independente da regra de premiação;
- Ranking e memória de cálculo detalhada;
- Histórico mensal e individual;
- Auditoria dos registros aceitos e excluídos;
- Análise dos encerramentos automáticos;
- Exportação da auditoria para Excel;
- Geração de apresentação PowerPoint no navegador;
- Perfis de regras versionados por competência;
- Modo público protegido e preenchido com dados sintéticos.

## Bases analíticas

A interface distingue três universos para evitar interpretações incorretas:

1. **Base premiável:** registros que atendem a todos os critérios da campanha;
2. **Base operacional observada:** base premiável mais casos acima do limite de duração;
3. **Qualidade e escopo:** erros de preenchimento/coerência e exclusões legítimas da campanha são apresentados separadamente.

Encerramentos automáticos permanecem identificados no volume e são retirados da leitura operacional de tempo. O volume é apresentado como observado; não equivale a produtividade por hora sem jornada e complexidade na fonte.

## Tecnologias

- **Python e Pandas:** ingestão, limpeza, validação e cálculo;
- **SQLite:** histórico e rastreabilidade;
- **HTML, CSS e JavaScript:** interface responsiva e visualizações;
- **OpenPyXL e xlrd:** leitura e exportação de planilhas;
- **PptxGenJS e JSZip:** geração do relatório PowerPoint;
- **unittest:** validação das regras de negócio e das APIs;
- **Flask e Vercel Functions:** camada WSGI da demonstração pública;
- **Vercel:** hospedagem e implantação contínua a partir do GitHub.

## Estrutura principal

```text
.
├── app.py                    # entrada Flask/WSGI usada pela Vercel
├── servidor_html.py          # servidor HTTP local e funções compartilhadas
├── motor_premiacao.py        # regras, qualidade, KPIs e persistência
├── dados_demonstracao.py     # geração determinística dos dados sintéticos
├── dashboard.html            # estrutura da interface
├── dashboard.css             # apresentação responsiva
├── dashboard.js              # comportamento e visualizações
├── powerpoint.js             # relatório executivo em PPTX
├── package.json              # dependência usada no teste do PowerPoint
├── vercel.json               # configuração da Vercel Function
├── .python-version           # runtime Python da publicação
├── .github/workflows/        # integração contínua no GitHub Actions
└── test_*.py                 # testes automatizados
```

## Executando localmente

Requer Python 3.11 ou superior.

```bash
python -m venv .venv
```

No Windows:

```bash
.venv\Scripts\activate
```

No Linux ou macOS:

```bash
source .venv/bin/activate
```

Instale as dependências e inicie o servidor:

```bash
pip install -r requirements.txt
python servidor_html.py
```

Acesse `http://localhost:8501`.

Para executar o fluxo operacional local, com importação habilitada, defina `PREMIACAO_DEMO=0` antes de iniciar. Arquivos reais e o banco local estão ignorados pelo Git.

## Publicação na Vercel

1. Importe este repositório do GitHub em um novo projeto da Vercel;
2. Mantenha o diretório raiz e as configurações de build detectadas automaticamente;
3. Faça a implantação sem cadastrar banco ou credenciais;
4. Confirme a publicação acessando `/api/saude` no domínio criado.

A Vercel detecta `app.py` como aplicação Flask. A demonstração recria uma base
sintética em `/tmp`, bloqueia requisições de escrita e não recebe arquivos reais.
O histórico operacional permanece somente na versão local, no arquivo
`historico_premiacao.db`.

## Testes

```bash
python -m unittest discover -v
```

Os testes cobrem filtros, perfis históricos, cálculo dos indicadores, Top 3, migração da meta, reprocessamento, endpoints, auditoria e exportação.

Cada envio para a branch `main` também executa essa suíte automaticamente no GitHub Actions.

Para validar também a geração do PowerPoint localmente:

```bash
npm install
npm run test:pptx
```

## Decisões de engenharia

- A camada de cálculo foi separada da antiga interface desktop para permitir execução em servidores Linux sem dependências gráficas.
- O dashboard usa JavaScript nativo e gráficos SVG, reduzindo dependências no navegador.
- O modo demonstrativo bloqueia alterações no servidor e recria uma base sintética determinística.
- As análises gerenciais são calculadas por regras explícitas e podem ser conferidas na memória de cálculo.

## Autor

**Pedro Aurélio Gonçalves Ferreira**  
Projeto de portfólio em Análise de Dados, Business Intelligence e automação de processos.
