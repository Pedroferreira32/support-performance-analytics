"""Testes da camada WSGI usada na demonstração da Vercel."""

from __future__ import annotations

import unittest

from app import app


class VercelAppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = app.test_client()

    def test_dashboard_e_arquivos_publicos(self) -> None:
        for caminho in ("/", "/dashboard.css", "/dashboard.js"):
            resposta = self.client.get(caminho)
            self.assertEqual(resposta.status_code, 200)
            resposta.close()

    def test_saude_identifica_a_plataforma(self) -> None:
        resposta = self.client.get("/api/saude")
        self.assertEqual(resposta.status_code, 200)
        payload = resposta.get_json()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["plataforma"], "Vercel")
        self.assertEqual(payload["meta_elegibilidade"], 85.0)

    def test_consultas_usam_a_base_sintetica(self) -> None:
        resumo = self.client.get("/api/resumo").get_json()
        self.assertTrue(resumo["competencias"])
        self.assertTrue(resumo["ranking"])

        competencia = resumo["competencia"]
        gerencial = self.client.get(f"/api/gerencial?competencia={competencia}")
        operacional = self.client.get(f"/api/operacional?competencia={competencia}")
        automaticos = self.client.get(f"/api/automaticos?competencia={competencia}")
        self.assertEqual(gerencial.status_code, 200)
        self.assertEqual(operacional.status_code, 200)
        self.assertEqual(automaticos.status_code, 200)

    def test_exportacao_excel(self) -> None:
        competencia = self.client.get("/api/resumo").get_json()["competencia"]
        resposta = self.client.get(f"/api/exportar?competencia={competencia}")
        self.assertEqual(resposta.status_code, 200)
        self.assertTrue(resposta.data.startswith(b"PK"))

    def test_publicacao_bloqueia_escrita(self) -> None:
        resposta = self.client.post("/api/feedback", json={"feedback": "teste"})
        self.assertEqual(resposta.status_code, 403)
        self.assertIn("somente leitura", resposta.get_json()["erro"])


if __name__ == "__main__":
    unittest.main()
