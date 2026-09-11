# Performance do Suporte

Dashboard executivo para validação mensal dos atendimentos, cálculo da premiação e acompanhamento da equipe de suporte.

## Funcionalidades

- Importação de CSV, TXT, XLSX, XLS e XLSM do ChatMobi.
- Limpeza e padronização de cabeçalhos, textos, números, datas e linhas CSV encapsuladas.
- Identificação da competência pela data de início do atendimento.
- Validação do setor de Suporte em Filas/Setores ou campos de transferência.
- Exclusão parcial de nomes fora da campanha.
- Tratamento versionado das regras históricas, de julho/2026 e de agosto/2026 em diante.
- Inclusão e rastreabilidade dos encerramentos automáticos.
- Proteção de Tempo Total e TMA com 31,50 pontos iguais quando prevista pela competência.
- Meta de elegibilidade de 85 pontos e premiação somente do Top 3 elegível.
- Histórico mensal e feedback individual no navegador.
- Painéis de projeto, gestão, operação, premiação, histórico e auditoria.
- Exportação da auditoria em Excel e do relatório executivo em PowerPoint.

## Regras centrais

| Período | Avaliação | Duração | Pesos Qtd./Tempo/TMA/Aval. | Tempo/TMA |
|---|---:|---:|---:|---|
| Até maio/2026 | 0–10 | Até 8h | 30/15/25/30 | Comparativos |
| Junho/2026 | 0–5 | Até 9h | 20/10/30/40 | Comparativos |
| Julho/2026 | 0–5 | Neutralizada | 20/10/30/40 | 31,50 pontos fixos |
| Agosto/2026 em diante | 0–5 | Até 9h | 20/10/30/40 | 31,50 pontos fixos |

No modelo de agosto em diante, encerramentos automáticos são incluídos em Quantidade e Avaliação, enquanto sua duração artificial não entra nos indicadores de Tempo Total e TMA. O mês é sempre definido pela data de início; uma finalização em 01/09 não desloca um atendimento iniciado em agosto.

## Arquitetura

- React 19 e TypeScript para a aplicação.
- Vite para desenvolvimento e compilação.
- Tailwind CSS e componentes Radix UI para a interface.
- Recharts e SVG para visualizações.
- SheetJS (`xlsx`) para importação e exportação de planilhas.
- PptxGenJS para apresentações executivas.
- `localStorage` comprimido com LZ-String para o histórico no dispositivo.
- Vitest para testes automatizados das regras e exportações.
- Vercel para hospedagem.

O processamento do arquivo ocorre no próprio navegador. A planilha não é enviada para um servidor, e o histórico fica restrito ao navegador e dispositivo usados na importação.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
```

Validação completa:

```bash
pnpm check
pnpm build:prod
```

## Publicação

O arquivo `vercel.json` configura o build do Vite e a reescrita necessária para as rotas da aplicação. Atualizações enviadas à branch conectada no GitHub acionam o deploy automático da Vercel.
