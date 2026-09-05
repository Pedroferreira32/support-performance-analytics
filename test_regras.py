from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import pandas as pd

import motor_premiacao as core


def linha(
    protocolo: str,
    atendente: str,
    fila: str = "Suporte",
    transferencia: str = "",
    inicio: str = "03/08/2026 10:00",
    fim: str = "03/08/2026 11:00",
    rating: object = 5,
) -> dict[str, object]:
    return {
        "Protocolo": protocolo,
        "User ID": atendente,
        "Filas": fila,
        "Filas Transfers": transferencia,
        "Iniciado": inicio,
        "Fim": fim,
        "Rating": rating,
    }


class RegrasPremiacaoTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.banco = core.BancoHistorico(Path(self.temp.name) / "teste.db")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_regra_padrao_aplica_filtros_oficiais(self) -> None:
        dados = pd.DataFrame(
            [
                linha("1", "Agente Demonstração Excluído"),
                linha("2", "Lucas Rocha", transferencia="Comercial"),
                linha("3", "Bruno Souza", fila="Comercial", transferencia="Suporte"),
                linha("4", "Domingo", inicio="02/08/2026 10:00", fim="02/08/2026 11:00"),
                linha("5", "Antes Horario", inicio="03/08/2026 07:59", fim="03/08/2026 08:30"),
                linha("6", "Longo", fim="03/08/2026 19:01"),
                linha("7", "Sem Fim", fim=""),
                linha("8", "Outro Setor", fila="Comercial", transferencia="Financeiro"),
                linha("9", "Nota Invalida", rating=7),
            ]
        )

        resultado = core.processar_dados(
            dados, core.configuracao_oficial("2026-08"), self.banco
        )

        self.assertEqual(
            set(resultado.validos["atendente"]),
            {"Lucas Rocha", "Bruno Souza", "Nota Invalida"},
        )
        motivos = dict(
            zip(resultado.excluidos["atendente"], resultado.excluidos["motivo_codigo"])
        )
        self.assertEqual(motivos["Agente Demonstração Excluído"], "ATENDENTE_EXCLUIDO")
        self.assertEqual(motivos["Domingo"], "PERIODO")
        self.assertEqual(motivos["Antes Horario"], "PERIODO")
        self.assertEqual(motivos["Longo"], "ACIMA_H")
        self.assertEqual(motivos["Sem Fim"], "SEM_FINALIZACAO")
        self.assertEqual(motivos["Outro Setor"], "FORA_SUPORTE")
        avaliacao = resultado.validos.loc[
            resultado.validos["atendente"] == "Nota Invalida", "avaliacao"
        ].iloc[0]
        self.assertTrue(pd.isna(avaliacao))

    def test_csv_setores_e_linhas_entre_aspas(self) -> None:
        caminho = Path(self.temp.name) / "chatmobi_agosto.csv"
        caminho.write_text(
            "Protocolo,User ID,Iniciado,Fim,Setores,Setores Transfers,Rating\n"
            "1,Lucas Rocha,03/08/2026 10:00,03/08/2026 11:00,Suporte,,5\n"
            '"2,Marina Costa,04/08/2026 10:00,04/08/2026 11:00,revendax_bot,'
            '""revendax_bot, Suporte"",5"\n',
            encoding="utf-8-sig",
        )

        dados, avisos = core.carregar_arquivo(str(caminho))
        mapeamento = core.mapear_colunas(dados)

        self.assertEqual(len(dados), 2)
        self.assertEqual(dados["User ID"].tolist(), ["Lucas Rocha", "Marina Costa"])
        self.assertEqual(mapeamento["filas"], "Setores")
        self.assertEqual(mapeamento["filas_transfers"], "Setores Transfers")
        self.assertTrue(any("encapsulamento CSV extra" in aviso for aviso in avisos))

    def test_julho_inclui_automatico_e_neutraliza_tempo(self) -> None:
        dados = pd.DataFrame(
            [
                linha(
                    "1",
                    "Lucas Rocha",
                    inicio="05/07/2026 05:30",
                    fim="05/07/2026 06:00",
                ),
                linha("2", "Sem Fim", inicio="06/07/2026 10:00", fim=""),
                linha("3", "", inicio="06/07/2026 10:00", fim="06/07/2026 11:00"),
                linha("4", "Outro Setor", fila="Comercial", transferencia="Financeiro"),
            ]
        )

        config = core.configuracao_oficial("2026-07")
        resultado = core.processar_dados(dados, config, self.banco)

        self.assertEqual(resultado.validos["atendente"].tolist(), ["Lucas Rocha"])
        self.assertEqual(resultado.estatisticas_validacao["AUTOMATICOS_VALIDOS"], 1)
        self.assertAlmostEqual(resultado.ranking.iloc[0]["pontos_tempo"], 7.88)
        self.assertAlmostEqual(resultado.ranking.iloc[0]["pontos_tma"], 23.62)
        self.assertEqual(len(resultado.excluidos), 3)

    def test_agosto_inclui_automatico_e_fixa_tempo_tma_para_todos(self) -> None:
        dados = pd.DataFrame(
            [
                linha(
                    "1",
                    "Lucas Rocha",
                    inicio="03/08/2026 10:00",
                    fim="03/08/2026 11:00",
                    rating=5,
                ),
                linha(
                    "2",
                    "Lucas Rocha",
                    inicio="03/08/2026 10:00",
                    fim="04/08/2026 06:00",
                    rating=4,
                ),
                linha(
                    "3",
                    "Longo manual",
                    inicio="03/08/2026 10:00",
                    fim="03/08/2026 19:01",
                    rating=5,
                ),
                linha(
                    "4",
                    "Marina Costa",
                    inicio="03/08/2026 12:00",
                    fim="03/08/2026 12:30",
                    rating=5,
                ),
            ]
        )

        config = core.configuracao_oficial("2026-08")
        resultado = core.processar_dados(dados, config, self.banco)

        self.assertTrue(config.incluir_finalizados_automaticamente)
        self.assertTrue(config.neutralizar_tempo_automaticos)
        self.assertTrue(config.pontuacao_tempo_tma_fixa)
        self.assertEqual(len(resultado.validos), 3)
        self.assertEqual(
            resultado.estatisticas_validacao["AUTOMATICOS_RECUPERADOS"], 1
        )
        self.assertEqual(resultado.estatisticas_validacao["ACIMA_H"], 1)
        joel = resultado.ranking.loc[
            resultado.ranking["atendente"] == "Lucas Rocha"
        ].iloc[0]
        self.assertEqual(int(joel["atendimentos"]), 2)
        self.assertAlmostEqual(float(joel["horas_total"]), 1.0)
        self.assertAlmostEqual(float(joel["tma_medio_min"]), 60.0)
        self.assertAlmostEqual(float(joel["avaliacao_media"]), 4.5)
        self.assertAlmostEqual(float(joel["pontos_tempo"]), 7.88)
        self.assertAlmostEqual(float(joel["pontos_tma"]), 23.62)
        ana = resultado.ranking.loc[
            resultado.ranking["atendente"] == "Marina Costa"
        ].iloc[0]
        self.assertAlmostEqual(float(ana["pontos_tempo"]), 7.88)
        self.assertAlmostEqual(float(ana["pontos_tma"]), 23.62)

    def test_perfis_historicos(self) -> None:
        maio = core.configuracao_oficial("2026-05")
        junho = core.configuracao_oficial("2026-06")
        julho = core.configuracao_oficial("2026-07")
        agosto = core.configuracao_oficial("2026-08")

        self.assertEqual(maio.max_horas, 8.0)
        self.assertEqual(maio.escala_avaliacao_max, 10.0)
        self.assertEqual(
            (maio.peso_quantidade, maio.peso_tempo, maio.peso_tma, maio.peso_avaliacao),
            (30.0, 15.0, 25.0, 30.0),
        )
        self.assertEqual(junho.max_horas, 9.0)
        self.assertEqual(junho.escala_avaliacao_max, 5.0)
        self.assertEqual(julho.modo, "neutralizado")
        self.assertTrue(julho.incluir_fora_expediente)
        self.assertTrue(agosto.incluir_finalizados_automaticamente)
        self.assertTrue(agosto.neutralizar_tempo_automaticos)
        self.assertTrue(agosto.pontuacao_tempo_tma_fixa)
        self.assertEqual(maio.nota_minima, 85.0)
        self.assertEqual(junho.nota_minima, 85.0)
        self.assertEqual(julho.nota_minima, 85.0)

    def test_somente_top3_elegiveis_sao_premiados(self) -> None:
        dados = pd.DataFrame(
            [
                linha("1", "Atendente A"),
                linha("2", "Atendente B"),
                linha("3", "Atendente C"),
                linha("4", "Atendente D"),
            ]
        )
        resultado = core.processar_dados(
            dados, core.configuracao_oficial("2026-08"), self.banco
        )

        self.assertEqual(int(resultado.ranking["elegivel"].sum()), 4)
        self.assertEqual(int(resultado.ranking["premiado"].sum()), 3)
        self.assertTrue(resultado.ranking.loc[resultado.ranking["rank"] <= 3, "premiado"].all())
        self.assertFalse(bool(resultado.ranking.loc[resultado.ranking["rank"] == 4, "premiado"].iloc[0]))

        self.banco.salvar(resultado)
        ranking_salvo = self.banco.ranking("2026-08")
        self.assertEqual(int(ranking_salvo["premiado"].sum()), 3)

    def test_banco_antigo_migra_elegibilidade_para_85(self) -> None:
        dados = pd.DataFrame([linha("1", "Lucas Rocha")])
        resultado = core.processar_dados(
            dados, core.configuracao_oficial("2026-08"), self.banco
        )
        self.banco.salvar(resultado)

        with self.banco.conectar() as con:
            info = con.execute(
                "SELECT configuracao_json FROM competencias WHERE competencia = '2026-08'"
            ).fetchone()
            config_antiga = json.loads(info[0])
            config_antiga["nota_minima"] = 90.0
            con.execute(
                "UPDATE competencias SET configuracao_json = ? WHERE competencia = '2026-08'",
                (json.dumps(config_antiga, ensure_ascii=False),),
            )
            con.execute(
                """
                UPDATE resultados
                SET nota_final = 87.0, elegivel = 0, feedback = ?
                WHERE competencia = '2026-08' AND atendente = 'Lucas Rocha'
                """,
                (
                    "Ponto forte: bom volume. Foco: manter a qualidade. "
                    "Primeira competência registrada no histórico. "
                    "Faltaram 3,00 pontos para a meta.",
                ),
            )

        migrado = core.BancoHistorico(self.banco.caminho)
        ranking = migrado.ranking("2026-08").iloc[0]
        info = migrado.competencia_info("2026-08")
        config = json.loads(info["configuracao_json"])

        self.assertEqual(config["nota_minima"], 85.0)
        self.assertEqual(int(ranking["elegivel"]), 1)
        self.assertTrue(
            ranking["feedback"].endswith(
                "Meta atingida e posição premiada no Top 3."
            )
        )

    def test_reprocessamento_substitui_competencia(self) -> None:
        dados = pd.DataFrame([linha("1", "Lucas Rocha")])
        config = core.configuracao_oficial("2026-08")
        primeiro = core.processar_dados(dados, config, self.banco)
        self.banco.salvar(primeiro)
        segundo = core.processar_dados(dados, config, self.banco)
        self.banco.salvar(segundo)

        self.assertEqual(len(self.banco.validos("2026-08")), 1)
        self.assertEqual(len(self.banco.ranking("2026-08")), 1)


if __name__ == "__main__":
    unittest.main()
