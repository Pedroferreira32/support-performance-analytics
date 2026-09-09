"""Entrada WSGI da demonstração pública hospedada na Vercel.

Esta camada expõe, por Flask, as mesmas consultas usadas pelo servidor local.
O ambiente publicado é deliberadamente somente leitura e trabalha apenas com
o conjunto sintético criado em ``/tmp``.
"""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime
from io import BytesIO
from pathlib import Path

from flask import Flask, Response, request, send_file

# A demonstração nunca deve apontar para o banco operacional local.
os.environ["PREMIACAO_DEMO"] = "1"
os.environ["PREMIACAO_DB_PATH"] = str(
    Path(tempfile.gettempdir()) / "performance_analytics_demo.db"
)

import motor_premiacao as core  # noqa: E402
import servidor_html as painel  # noqa: E402
from dados_demonstracao import inicializar_demonstracao  # noqa: E402


app = Flask(__name__)
_BANCO = inicializar_demonstracao(painel.DB_PATH)


def _query() -> dict[str, list[str]]:
    return {chave: request.args.getlist(chave) for chave in request.args}


def _competencia() -> str | None:
    return painel.competencia_selecionada(_query(), _BANCO)


def _json(payload: object, status: int = 200) -> Response:
    corpo = json.dumps(
        painel.limpar_json(payload),
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
    )
    resposta = Response(corpo, status=status, content_type="application/json; charset=utf-8")
    resposta.headers["Cache-Control"] = "no-store"
    return resposta


def _erro(mensagem: str, status: int = 400) -> Response:
    return _json({"ok": False, "erro": mensagem}, status)


@app.get("/")
@app.get("/dashboard.html")
def dashboard() -> Response:
    return send_file(painel.APP_DIR / "dashboard.html", max_age=0)


@app.get("/<path:caminho>")
def arquivo_publico(caminho: str) -> Response:
    nome = painel.ARQUIVOS_PUBLICOS.get(f"/{caminho}")
    if not nome:
        return _erro("Recurso não encontrado.", 404)
    resposta = send_file(painel.APP_DIR / nome, max_age=0)
    resposta.headers["Cache-Control"] = "no-cache"
    return resposta


@app.get("/api/resumo")
def api_resumo() -> Response:
    return _json(painel.resumo_competencia(_BANCO, _competencia()))


@app.get("/api/gerencial")
def api_gerencial() -> Response:
    return _json(painel.resumo_gerencial(_BANCO, _competencia()))


@app.get("/api/operacional")
def api_operacional() -> Response:
    return _json(painel.resumo_operacional(_BANCO, _competencia()))


@app.get("/api/perfil")
def api_perfil() -> Response:
    competencia = request.args.get("competencia", datetime.now().strftime("%m/%Y"))
    return _json(painel.perfil_competencia(competencia))


@app.get("/api/historico")
def api_historico() -> Response:
    atendente = request.args.get("atendente", "").strip()
    if not atendente:
        return _erro("Informe o atendente.")
    return _json(
        {
            "atendente": atendente,
            "historico": painel.registros(_BANCO.historico(atendente)),
        }
    )


@app.get("/api/auditoria")
def api_auditoria() -> Response:
    competencia = _competencia()
    if not competencia:
        return _json({"competencia": None, "exclusoes": [], "validos": []})

    info = _BANCO.competencia_info(competencia) or {}
    exclusoes = _BANCO.exclusoes(competencia)
    validos = _BANCO.validos(competencia)
    resumo = []
    if not exclusoes.empty:
        resumo = painel.registros(
            exclusoes.groupby(["motivo_codigo", "motivo"], as_index=False)
            .size()
            .sort_values("size", ascending=False)
        )
    return _json(
        {
            "competencia": competencia,
            "info": {
                **painel.limpar_json(info),
                "configuracao": painel.carregar_json(info.get("configuracao_json"), {}),
                "mapeamento": painel.carregar_json(info.get("mapeamento_json"), {}),
                "estatisticas": painel.carregar_json(
                    info.get("estatisticas_validacao_json"), {}
                ),
                "avisos": painel.carregar_json(info.get("avisos_json"), []),
            },
            "resumo_exclusoes": resumo,
            "exclusoes": painel.registros(exclusoes),
            "validos": painel.registros(validos.head(500)),
            "validos_total": len(validos),
        }
    )


@app.get("/api/automaticos")
def api_automaticos() -> Response:
    return _json(painel.resumo_automaticos(_BANCO, _competencia()))


@app.get("/api/powerpoint-resumo")
def api_powerpoint() -> Response:
    return _json(painel.resumo_powerpoint(_BANCO, _competencia()))


@app.get("/api/exportar")
def api_exportar() -> Response:
    competencia = request.args.get("competencia", "")
    if competencia not in _BANCO.competencias():
        return _erro("Competência não encontrada.", 404)

    caminho: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as arquivo:
            caminho = Path(arquivo.name)
        core.exportar_competencia(_BANCO, competencia, str(caminho))
        conteudo = BytesIO(caminho.read_bytes())
    finally:
        if caminho:
            caminho.unlink(missing_ok=True)
    return send_file(
        conteudo,
        as_attachment=True,
        download_name=f"Premiacao_Suporte_{competencia}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        max_age=0,
    )


@app.get("/api/saude")
def api_saude() -> Response:
    return _json(
        {
            "ok": True,
            "versao": "Versão 4.0",
            "meta_elegibilidade": core.META_PADRAO,
            "demonstracao": True,
            "plataforma": "Vercel",
        }
    )


@app.post("/api/<path:_recurso>")
def api_somente_leitura(_recurso: str) -> Response:
    return _erro(
        "A demonstração pública é somente leitura e utiliza dados sintéticos.",
        403,
    )


@app.errorhandler(Exception)
def erro_inesperado(exc: Exception) -> Response:
    if request.path.startswith("/api/"):
        return _erro(str(exc), 500)
    return _erro("Não foi possível carregar o recurso.", 500)
