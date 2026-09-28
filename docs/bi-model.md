# Modelo analítico demonstrativo

Os dados deste projeto público são **sintéticos**. A carteira mensal é uma fonte separada da exportação de atendimentos: inclui clientes ativos que não abriram chamados. Não deduza clientes ativos a partir de `Contact ID` dos tickets.

## Grãos e relações

| Tabela | Grão | Chave | Papel |
|---|---|---|---|
| `fato_atendimentos.csv` | um atendimento válido | competência + protocolo | volume, TMA, avaliações e clientes com contato |
| `fato_carteira_mensal.csv` | uma revenda por competência | competência + revenda | clientes e assinaturas ativos, inclusive sem chamados |
| `dim_competencia` | um mês | competência | filtro de período compartilhado |
| `dim_revenda` | uma revenda | revenda | filtro de parceiro compartilhado |

No Power BI, crie dimensões com chaves distintas a partir das duas fontes e relacione cada dimensão a **ambas** as tabelas de fatos (um para muitos, direção única). Não relacione diretamente as duas tabelas de fatos por nome de revenda: há muitos atendimentos para cada linha mensal da carteira.

## Medidas DAX iniciais

```dax
Atendimentos = COUNTROWS(fato_atendimentos)

Clientes ativos = SUM(fato_carteira_mensal[clientes_ativos])

Assinaturas ativas = SUM(fato_carteira_mensal[assinaturas_ativas])

Atendimentos por 100 clientes = DIVIDE([Atendimentos] * 100, [Clientes ativos])

Clientes com contato = DISTINCTCOUNT(fato_atendimentos[cliente])

Alcance da carteira = DIVIDE([Clientes com contato], [Clientes ativos])
```

`Clientes com contato` deve ser calculado no contexto de uma revenda e competência. Para um total de vários meses, use uma medida que conte pares cliente/competência, pois o mesmo cliente pode aparecer em meses diferentes. A taxa por 100 pode passar de 100; o alcance, em uma competência, deve ficar entre 0% e 100%.

## Perguntas da página de inteligência de revendas

1. Qual parceiro tem a maior taxa por 100 clientes ativos, e como ela evoluiu?
2. A taxa alta resulta de muitos clientes diferentes ou de chamados recorrentes?
3. A satisfação e a cobertura de avaliações acompanharam o aumento da demanda?

A faixa “Demanda elevada” corresponde ao percentil 90 **da taxa** em cada competência. Ela é relativa ao conjunto observado e serve para investigação; não representa gravidade técnica nem risco contratual. Mantenha volume e tamanho da carteira próximos à taxa para evitar interpretação de amostras pequenas.

## Preparar um exemplo local

```bash
python -m scripts.seed_synthetic_history --database-url sqlite:///backend/data/demo_bi.db
python -m scripts.export_bi --database-url sqlite:///backend/data/demo_bi.db --output-dir generated_demo_history/bi
```

O gerador usa sementes fixas por mês; reexecutar o carregamento substitui as competências sem duplicação. `generated_demo_history/` e o banco local são ignorados pelo Git. O carregamento em uma base remota deve ocorrer apenas em uma base de teste isolada.
