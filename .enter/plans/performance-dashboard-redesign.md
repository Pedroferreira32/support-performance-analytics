# Redesign do Dashboard "Performance do Suporte"

## Context

O usuário possui um dashboard em produção (support-performance-analytics.vercel.app) que valida e calcula a **premiação da equipe de suporte** (ChatMobi): limpeza da base mensal, aplicação de regras da competência, ranking, elegibilidade (nota ≥ 85) e Top 3 premiado. Ele não gostou do layout e pediu para **recriar tudo do zero** com melhores técnicas de UI/UX.

Decisões confirmadas com o usuário:
- **Escopo**: visual completo + dados sintéticos (sem backend, sem upload real — frontend-only).
- **Páginas**: manter as 6 seções originais (Visão do projeto, Resumo gerencial, Operação, Premiação, Histórico, Auditoria).
- **Direção visual**: light limpo e profissional.

O workspace atual é um template React + Vite + Tailwind + shadcn em branco. Todo o app será construído do zero, com dados sintéticos extraídos do site original (mesmos nomes, notas, regras e textos).

## Direção de Design (Light profissional)

- Fundo cinza-azulado suave (`--background: 220 16% 96%`), cards brancos com borda sutil e sombra leve.
- Sidebar clara com estado ativo azul e agrupamento de menus (PAINÉIS / FERRAMENTAS).
- Cor primária azul profissional (`--primary: 221 83% 53%`), com acento âmbar para premiação/Top 3.
- Cores semânticas de status: verde (premiado/monitorar), âmbar (elegível/média), rosa/vermelho (abaixo da meta/alta), cinza (neutro).
- Tipografia com pesos bem hierarquizados; números de KPI em destaque (tabular-nums).
- Animações sutis (framer-motion já instalado) em cards e transições de página.

## Dados sintéticos (fonte: site original)

- **Equipe (7)**: Marina Costa 91,09 (1º, Premiado) · Lucas Rocha 89,07 (2º) · Camila Alves 87,81 (3º) · Rafael Lima 86,08 (Elegível) · Juliana Melo 83,14 · Bruno Souza 81,34 · Diego Santos 78,98. Volume/TMA/CSAT/cobertura conforme tabela "Memória de cálculo".
- **Competência atual**: 08/2026 · fonte `atendimentos_sinteticos_2026-08.csv` · comparação 07/2026 · atualizado 09/09/2026.
- **Regras**: base fixa 31,50 (Tempo+TMA) + Quantidade 20,00 + Avaliação 40,00 = teto 91,50 · meta 85 · Top 3 entre elegíveis.
- **Métricas**: nota média 85,36 · mediana 86,08 · 4 elegíveis · 3 premiados · base validada 94,9% · cobertura CSAT 88,5%.
- **Comparação mensal**: 06/2026 = 87,52 · 07/2026 = 85,71 · 08/2026 = 85,36.
- **Composição da nota**: Base 31,50/31,50 (100%) · Quantidade 16,30/20,00 (81,5%) · Avaliação 37,56/40,00 (93,9%). Alavanca principal: Quantidade.
- **Regras versionadas**: até maio/2026 · junho/2026 · julho/2026 · agosto/2026 em diante (tabela do original).
- **Base**: 2.350 premiável · 127 excluídos · 40 automáticos incluídos.

## Arquivos

### Estrutura nova
- `src/data/support-data.ts` — tipagens + todos os dados sintéticos (equipe, competências, regras, planos de ação, validações).
- `src/components/layout/app-sidebar.tsx` — sidebar com logo, grupos PAINÉIS (6 rotas) e FERRAMENTAS (Atualizar base, Baixar relatório) + rodapé com status de demonstração.
- `src/components/layout/app-shell.tsx` — layout com sidebar + área principal + header (título da página, seletor Competência 08/2026, botões Exportar Excel/PowerPoint, data).
- `src/components/ui-ext/section-card.tsx` — card de seção com título, descrição e cabeçalho padronizado.
- `src/components/ui-ext/kpi-card.tsx` — card de KPI reutilizável (valor, label, subtexto, cor/destaque).
- `src/components/ui-ext/status-badge.tsx` — badge semântico (Premiado, Elegível, Abaixo da meta, Prioridade Alta/Média/Monitorar).
- `src/components/ui-ext/progress-ratio.tsx` — barra de progresso com rótulo "x / y · % do máximo".
- `src/components/ui-ext/ranking-dot-plot.tsx` — gráfico de ranking (dot plot horizontal) com linha de meta em 85, rótulos e status; feito com SVG/custom para total controle.
- `src/components/ui-ext/hourly-distribution.tsx` — barras de distribuição horária (recharts BarChart, já instalado).
- `src/components/ui-ext/score-history.tsx` — linha de histórico de notas por competência (recharts LineChart).
- `src/pages/ProjectPage.tsx` — **Visão do projeto**: sobre o projeto, fluxo de engenharia (5 etapas), regra selecionada, validações da base, regras versionadas.
- `src/pages/GerencialPage.tsx` — **Resumo gerencial**: KPIs do resultado, ranking da equipe, leitura do gestor, comparação mensal, composição da nota, plano de acompanhamento, comparação individual (acordeão).
- `src/pages/OperacaoPage.tsx` — **Operação**: KPIs operacionais, reconciliação da base (fluxo soma), distribuição horária, detalhe da equipe.
- `src/pages/PremiacaoPage.tsx` — **Premiação**: regra oficial, ranking oficial, formação da nota do líder, liderança, memória de cálculo.
- `src/pages/HistoricoPage.tsx` — **Histórico**: seletor de funcionário, cards de resumo, histórico de notas, resultados mensais, registro de gestão.
- `src/pages/AuditoriaPage.tsx` — **Auditoria**: botão de download Excel (bloqueado na demo), resumo e explicativo.
- `src/pages/Index.tsx` — vira redirecionamento para `/gerencial` (substitui o placeholder atual).
- `src/router.tsx` — adiciona as 6 rotas (`/projeto`, `/gerencial`, `/operacao`, `/premiacao`, `/historico`, `/auditoria`) com `*` como fallback para `/gerencial`.

### Design system (modificar)
- `src/index.css` — tokens semânticos de light theme: primary azul, `--background` claro, cores de sucesso/aviso/perigo, gradiente sutil, sombras, fonte (Inter via import), utilitários de KPI.
- `tailwind.config.ts` — mapear novos tokens (success/warning/danger, radius maior, keyframes de entrada) seguindo o padrão shadcn já existente.

### Reuso
- Componentes shadcn já no template: `button`, `card`, `badge`, `table`, `tabs`, `accordion`, `select`, `progress`, `separator`, `sidebar` (se necessário), `scroll-area`.
- `recharts` e `framer-motion` já instalados no `package.json`.
- `lucide-react` para todos os ícones (nada de emoji).

## Conteúdo em PT-BR
Todo o texto do app será em português (mesmo do original). Os arquivos i18n existentes ficam intocados — o dashboard usa strings diretas em PT-BR (não foi solicitado multilíngue).

## Implementation checklist

- [ ] Adicionar tokens de design no `src/index.css` (primary azul, background claro, success/warning/danger, gradiente, sombras, fonte Inter, classe `.tabular-nums` de apoio) e refletir em `tailwind.config.ts`.
- [ ] Criar `src/data/support-data.ts` com tipos (`Employee`, `Competencia`, `Rule`, `ActionItem`, `VersionedRule`) e os dados sintéticos completos das seções acima.
- [ ] Criar `app-shell.tsx` + `app-sidebar.tsx`: sidebar com logo "Performance do Suporte", grupos PAINÉIS (6 itens com ícones lucide e estado ativo) e FERRAMENTAS, rodapé "Demonstração pública"; header com breadcrumb, título da página, seletor de competência (08/2026), botões Exportar Excel/PowerPoint e data.
- [ ] Criar componentes base reutilizáveis: `section-card.tsx`, `kpi-card.tsx`, `status-badge.tsx`, `progress-ratio.tsx`.
- [ ] Criar `ranking-dot-plot.tsx` (dot plot 75–95, linha de meta 85, círculos preenchidos para premiados, rótulo "FAIXA ELEGÍVEL · 85+").
- [ ] Criar `hourly-distribution.tsx` (recharts BarChart) e `score-history.tsx` (recharts LineChart).
- [ ] Atualizar `router.tsx` com as 6 rotas e fazer `Index.tsx` redirecionar para `/gerencial`.
- [ ] Implementar `ProjectPage.tsx` (sobre, fluxo 5 etapas com passos numerados, regra selecionada, validações agrupadas em 4 blocos, tabela de regras versionadas).
- [ ] Implementar `GerencialPage.tsx` (banner de resultado + 6 KPIs, ranking dot plot, leitura do gestor, comparação mensal com 3 cards, composição da nota com barras + alavanca, plano de acompanhamento em tabela com badges, comparação individual em acordeão).
- [ ] Implementar `OperacaoPage.tsx` (6 KPIs operacionais, reconciliação da base visual "premiável + exceção = observada", distribuição horária, tabela de detalhe da equipe).
- [ ] Implementar `PremiacaoPage.tsx` (regra oficial, resumo de base/liga/premiados, ranking oficial, formação da nota do líder, liderança em destaque, memória de cálculo completa).
- [ ] Implementar `HistoricoPage.tsx` (seletor de funcionário, 6 cards de resumo, histórico de notas em linha, resultados mensais, registro de gestão).
- [ ] Implementar `AuditoriaPage.tsx` (download Excel desabilitado com aviso de demo, resumo de rastreabilidade, memória de cálculo por funcionário).
- [ ] Garantir responsividade: sidebar colapsável em mobile (menu hambúrguer), grids que empilham, tabelas com overflow horizontal.

## Verification checklist

- [ ] `pnpm run build` (build de produção) passa sem erros de tipo nem de lint.
- [ ] Rotas `/projeto`, `/gerencial`, `/operacao`, `/premiacao`, `/historico`, `/auditoria` renderizam seus conteúdos; URL raiz redireciona para `/gerencial`; rota inexistente cai no fallback.
- [ ] Navegação pela sidebar marca a página ativa e troca de rota corretamente.
- [ ] Dados conferem com o original: ranking Marina 91,09 → Diego 78,98; meta 85; teto 91,50; 4 elegíveis / 3 premiados; comparativo 06–08/2026.
- [ ] Dot plot mostra todos os 7 funcionários, linha de meta em 85 e premiados destacados.
- [ ] Plano de acompanhamento ordena por prioridade (3 Alta, 1 Média, 3 Monitorar) com badges e valores corretos.
- [ ] Composição da nota: 31,50/31,50 · 16,30/20,00 · 37,56/40,00; alavanca = Quantidade.
- [ ] Memória de cálculo: 7 linhas com volume/CSAT/cobertura/nota/distância/situação idênticas ao original.
- [ ] Comparação individual 08 vs 07: deltas de nota, volume e avaliação corretos.
- [ ] Positivo: cards KPIs mostram valor grande + label + subtexto; badges de status distinguíveis por cor.
- [ ] Negativo/default: estados vazios (ex.: auditoria sem dados, feedback bloqueado) mostram mensagem clara, não quebram layout.
- [ ] Responsivo verificado com `website_screenshot` em `mobile_390` e `desktop_1280` (assumindo ambos; ajustar à orientação do usuário): sidebar colapsa, grids empilham, tabelas rolam sem estourar a viewport.
