"""Motor de validação e cálculo do dashboard de performance.

Este módulo reúne as regras de ingestão, qualidade, pontuação, auditoria e
persistência. Ele não depende da interface desktop, o que permite executar o
projeto em servidores Linux e plataformas de hospedagem.
"""

from __future__ import annotations

import csv
import io
import json
import math
import re
import sqlite3
import unicodedata
from copy import copy
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional

try:
    import pandas as pd
except ImportError as exc:  # mensagem mais amigável ao executar fora do ambiente preparado
    print("Dependência ausente:", exc)
    print("Instale com: python -m pip install pandas openpyxl")
    raise


APP_TITLE = "Validação da Premiação do Suporte"
DB_FILENAME = "historico_premiacao.db"
META_PADRAO = 85.0
ESCALA_AVALIACAO_MAX = 5.0
PONTOS_TEMPO_NEUTRALIZADO = 7.88
PONTOS_TMA_NEUTRALIZADO = 23.62
ATENDENTES_FORA_CAMPANHA = "Agente Demonstração Excluído"

CORES = {
    "azul": "#0F4C81",
    "azul_claro": "#EAF2F8",
    "verde": "#118D57",
    "vermelho": "#C0504D",
    "roxo": "#7030A0",
    "cinza": "#5F6B76",
    "fundo": "#F4F6F8",
    "branco": "#FFFFFF",
    "amarelo": "#D99A00",
}

VALORES_INVALIDOS = {
    "",
    "-",
    "NAN",
    "NAT",
    "NONE",
    "NULL",
    "PENDENTE",
    "SEM ATENDENTE",
    "NAO INFORMADO",
    "NÃO INFORMADO",
}

MOTIVOS_DESCRICAO = {
    "SEM_PROTOCOLO": "Protocolo não informado",
    "FORA_SUPORTE": "Departamento diferente de Suporte",
    "STATUS_NAO_FINALIZADO": "Atendimento ainda não finalizado",
    "SEM_ATENDENTE": "Atendente não informado",
    "ATENDENTE_EXCLUIDO": "Atendente fora da campanha",
    "DATA_INVALIDA": "Data de início inválida ou pendente",
    "SEM_FINALIZACAO": "Data final não informada",
    "DURACAO_NEGATIVA": "Data final anterior ao início",
    "ACIMA_H": "Duração acima do limite configurado",
    "PERIODO": "Fora do expediente ou em domingo",
}


def normalizar_texto(valor: object) -> str:
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        return ""
    texto = str(valor).replace("\ufeff", "").strip()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    return texto.upper().strip()


def normalizar_cabecalho(valor: object) -> str:
    return re.sub(r"[^A-Z0-9]", "", normalizar_texto(valor))


def texto_limpo(valor: object) -> str:
    if valor is None or pd.isna(valor):
        return ""
    return str(valor).strip()


def numero_br(valor: object, casas: int = 2) -> str:
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        numero = 0.0
    texto = f"{numero:,.{casas}f}"
    return texto.replace(",", "X").replace(".", ",").replace("X", ".")


def inteiro_br(valor: object) -> str:
    try:
        return f"{int(valor):,}".replace(",", ".")
    except (TypeError, ValueError):
        return "0"


def competencia_para_iso(valor: str) -> str:
    texto = valor.strip()
    for padrao in (r"^(\d{2})/(\d{4})$", r"^(\d{4})-(\d{2})$"):
        achou = re.match(padrao, texto)
        if achou:
            if texto[2] == "/":
                mes, ano = int(achou.group(1)), int(achou.group(2))
            else:
                ano, mes = int(achou.group(1)), int(achou.group(2))
            if 1 <= mes <= 12:
                return f"{ano:04d}-{mes:02d}"
    raise ValueError("Informe a competência no formato MM/AAAA, por exemplo 08/2026.")


def competencia_para_br(valor: str) -> str:
    try:
        ano, mes = valor.split("-")
        return f"{mes}/{ano}"
    except ValueError:
        return valor


def parse_numero(valor: object) -> float:
    if valor is None or pd.isna(valor):
        return float("nan")
    if isinstance(valor, (int, float)):
        return float(valor)
    texto = str(valor).strip().replace(" ", "")
    achou = re.search(r"-?\d+(?:[.,]\d+)?", texto)
    if not achou:
        return float("nan")
    try:
        return float(achou.group(0).replace(",", "."))
    except ValueError:
        return float("nan")


def serie_datas(serie: pd.Series) -> pd.Series:
    """Converte datas brasileiras, ISO e números seriais do Excel."""
    resultado = pd.Series(pd.NaT, index=serie.index, dtype="datetime64[ns]")
    numeros = pd.to_numeric(serie, errors="coerce")
    mask_excel = numeros.between(1, 100000)
    if mask_excel.any():
        resultado.loc[mask_excel] = pd.to_datetime(
            numeros.loc[mask_excel], unit="D", origin="1899-12-30", errors="coerce"
        )

    restante = ~mask_excel
    if restante.any():
        valores = serie.loc[restante].astype(str).str.strip()
        valores = valores.replace(
            {"": None, "nan": None, "NaT": None, "Pendente": None, "PENDENTE": None}
        )
        resultado.loc[restante] = pd.to_datetime(
            valores, errors="coerce", dayfirst=True, format="mixed"
        )
    return resultado


@dataclass
class Configuracao:
    competencia: str
    perfil_regra: str = "Novo modelo oficial"
    modo: str = "padrao"  # padrao | neutralizado
    departamento_alvo: str = "Suporte"
    somente_finalizados: bool = True
    incluir_fora_expediente: bool = False
    hora_inicio: str = "08:00"
    hora_fim: str = "19:59"
    max_horas: float = 9.0
    nota_minima: float = META_PADRAO
    escala_avaliacao_max: float = ESCALA_AVALIACAO_MAX
    peso_quantidade: float = 20.0
    peso_tempo: float = 10.0
    peso_tma: float = 30.0
    peso_avaliacao: float = 40.0
    incluir_finalizados_automaticamente: bool = False
    neutralizar_tempo_automaticos: bool = False
    pontuacao_tempo_tma_fixa: bool = False
    atendentes_excluidos: str = ATENDENTES_FORA_CAMPANHA

    @property
    def excluidos_normalizados(self) -> set[str]:
        return {
            normalizar_texto(nome)
            for nome in self.atendentes_excluidos.split(";")
            if nome.strip()
        }


def configuracao_oficial(competencia: str) -> Configuracao:
    """Retorna o perfil aprovado para a competência informada."""
    config = Configuracao(competencia=competencia)
    if competencia <= "2026-05":
        config.perfil_regra = "Modelo histórico (até maio/2026)"
        config.max_horas = 8.0
        config.escala_avaliacao_max = 10.0
        config.peso_quantidade = 30.0
        config.peso_tempo = 15.0
        config.peso_tma = 25.0
        config.peso_avaliacao = 30.0
    elif competencia == "2026-07":
        config.perfil_regra = "Julho/2026 validado — Tempo/TMA fixos em 31,5"
        config.modo = "neutralizado"
        config.incluir_fora_expediente = True
        config.incluir_finalizados_automaticamente = True
        config.neutralizar_tempo_automaticos = True
        config.pontuacao_tempo_tma_fixa = True
    else:
        config.perfil_regra = "Novo modelo oficial — 9 horas"
        if competencia >= "2026-08":
            config.perfil_regra = (
                "Novo modelo oficial — automáticos incluídos e Tempo/TMA fixos em 31,5"
            )
            config.incluir_finalizados_automaticamente = True
            config.neutralizar_tempo_automaticos = True
            config.pontuacao_tempo_tma_fixa = True
    return config


@dataclass
class ResultadoProcessamento:
    configuracao: Configuracao
    origem: str
    total_linhas: int
    validos: pd.DataFrame
    excluidos: pd.DataFrame
    ranking: pd.DataFrame
    mapeamento: dict[str, str]
    estatisticas_validacao: dict[str, int]
    avisos: list[str]


ALIASES = {
    "protocolo": ["PROTOCOLO", "ID DO TICKET", "IDTICKET", "TICKET", "TICKET ID"],
    "atendente": [
        "ATENDENTE",
        "USER ID",
        "USERID",
        "OPERADOR",
        "USUARIO",
        "USUÁRIO",
        "AGENTE",
    ],
    "filas_transfers": [
        "FILAS TRANSFERS",
        "FILASTRANSFERS",
        "FILAS TRANSFER",
        "FILA TRANSFERIDA",
        "SETORES TRANSFERS",
        "SETORESTRANSFERS",
        "SETORES TRANSFER",
        "SETOR TRANSFERIDO",
    ],
    "filas": ["FILAS", "FILA", "DEPARTAMENTO", "SETOR", "SETORES"],
    "status": ["STATUS", "SITUACAO", "SITUAÇÃO"],
    "inicio": ["INICIADO", "DATA", "CRIADO", "DATA INICIO", "DATAINICIO"],
    "fim": [
        "FIM",
        "DATA ULTIMA MENSAGEM",
        "DATAULTIMAMENSAGEM",
        "DATA FINALIZACAO",
        "DATAFINALIZACAO",
        "FINALIZADO EM",
    ],
    "rating": ["RATING", "AVALIACAO", "AVALIAÇÃO", "NOTA", "SATISFACAO"],
    "motivo": ["MOTIVO", "MOTIVO DE ENCERRAMENTO", "MOTIVODEENCERRAMENTO"],
    "origem": ["ORIGEM", "CANAL"],
    "nome_cliente": ["NOME", "CONTATO", "CONTACT NAME", "CONTACTNAME"],
    "numero": ["NUMERO", "NÚMERO", "CONTACT NUMBER", "CONTACTNUMBER"],
}

ALIASES_NORM = {
    chave: [normalizar_cabecalho(item) for item in valores]
    for chave, valores in ALIASES.items()
}
TODOS_ALIASES = {item for valores in ALIASES_NORM.values() for item in valores}


def pontuar_linha_cabecalho(valores: Iterable[object]) -> int:
    norm = {normalizar_cabecalho(v) for v in valores if texto_limpo(v)}
    pontos = len(norm & TODOS_ALIASES)
    if norm & set(ALIASES_NORM["atendente"]):
        pontos += 4
    if norm & set(ALIASES_NORM["inicio"]):
        pontos += 4
    if norm & set(ALIASES_NORM["protocolo"]):
        pontos += 2
    return pontos


def _melhor_linha_cabecalho(amostra: pd.DataFrame) -> tuple[int, int]:
    melhor_linha, melhor_pontuacao = 0, -1
    for indice, linha in amostra.head(20).iterrows():
        pontuacao = pontuar_linha_cabecalho(linha.tolist())
        if pontuacao > melhor_pontuacao:
            melhor_linha, melhor_pontuacao = int(indice), pontuacao
    return melhor_linha, melhor_pontuacao


def _preparar_csv(path: Path, encoding: str) -> tuple[io.StringIO, int]:
    """Corrige exportações em que cada registro foi envolvido por aspas extras.

    Algumas versões do exportador geram o cabeçalho normalmente, mas salvam
    boa parte das linhas como um único campo CSV. A rotina remove somente essa
    camada externa quando a linha volta a ter a mesma quantidade de campos do
    cabeçalho, evitando alterar arquivos CSV já válidos.
    """
    texto = path.read_text(encoding=encoding)
    linhas = texto.splitlines()
    candidatas = [
        linha
        for linha in linhas[:20]
        if linha.strip()
        and not (linha.strip().startswith('"') and linha.strip().endswith('"'))
    ]
    if not candidatas:
        return io.StringIO(texto), 0

    referencia = max(candidatas, key=lambda linha: max(linha.count(","), linha.count(";")))
    delimitador = "," if referencia.count(",") >= referencia.count(";") else ";"
    try:
        campos_esperados = len(next(csv.reader([referencia], delimiter=delimitador)))
    except csv.Error:
        return io.StringIO(texto), 0
    if campos_esperados <= 1:
        return io.StringIO(texto), 0

    corrigidas: list[str] = []
    quantidade_corrigida = 0
    for linha in linhas:
        limpa = linha.strip()
        if limpa.startswith('"') and limpa.endswith('"'):
            try:
                camada_externa = next(csv.reader([limpa], delimiter=delimitador))
                if len(camada_externa) == 1 and delimitador in camada_externa[0]:
                    candidata = camada_externa[0]
                    campos = next(csv.reader([candidata], delimiter=delimitador))
                    if len(campos) == campos_esperados:
                        corrigidas.append(candidata)
                        quantidade_corrigida += 1
                        continue
            except csv.Error:
                pass
        corrigidas.append(linha)

    conteudo = "\n".join(corrigidas)
    if texto.endswith(("\n", "\r")):
        conteudo += "\n"
    return io.StringIO(conteudo), quantidade_corrigida


def carregar_arquivo(caminho: str) -> tuple[pd.DataFrame, list[str]]:
    path = Path(caminho)
    avisos: list[str] = []
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    if path.suffix.lower() in {".xlsx", ".xls", ".xlsm"}:
        planilhas = pd.ExcelFile(path).sheet_names
        candidatos: list[tuple[int, int, str, int]] = []
        for posicao, aba in enumerate(planilhas):
            try:
                amostra = pd.read_excel(path, sheet_name=aba, header=None, nrows=20)
                linha, pontos = _melhor_linha_cabecalho(amostra)
                preferencia = 1 if re.search(r"RAW|BRUT|BASE|CHAT|VALID", normalizar_texto(aba)) else 0
                candidatos.append((pontos, preferencia, aba, linha))
            except Exception:
                continue
        if not candidatos:
            raise ValueError("Não foi possível localizar uma planilha legível no arquivo.")
        candidatos.sort(key=lambda item: (item[0], item[1]), reverse=True)
        pontos, _, aba, linha = candidatos[0]
        if pontos < 6:
            raise ValueError(
                "Não reconheci os campos do ChatMobi. Verifique se o arquivo contém "
                "Atendente/User ID, Iniciado/Data e Protocolo."
            )
        dados = pd.read_excel(path, sheet_name=aba, header=linha)
        avisos.append(f"Aba selecionada automaticamente: {aba}")
    elif path.suffix.lower() in {".csv", ".txt"}:
        ultimo_erro: Optional[Exception] = None
        dados = None
        for encoding in ("utf-8-sig", "latin1"):
            try:
                fonte, linhas_corrigidas = _preparar_csv(path, encoding)
                amostra = pd.read_csv(
                    fonte, header=None, nrows=20, sep=None, engine="python"
                )
                linha, pontos = _melhor_linha_cabecalho(amostra)
                fonte.seek(0)
                dados = pd.read_csv(
                    fonte, header=linha, sep=None, engine="python"
                )
                if pontos < 6:
                    raise ValueError("Cabeçalho do ChatMobi não reconhecido.")
                if linhas_corrigidas:
                    avisos.append(
                        f"{linhas_corrigidas} linha(s) com encapsulamento CSV extra "
                        "foram corrigidas automaticamente."
                    )
                break
            except Exception as exc:
                ultimo_erro = exc
                dados = None
        if dados is None:
            raise ValueError(f"Não foi possível ler o CSV: {ultimo_erro}")
    else:
        raise ValueError("Formato não suportado. Selecione um arquivo CSV, TXT, XLSX, XLS ou XLSM.")

    dados = dados.dropna(how="all").copy()
    dados.columns = [texto_limpo(coluna) or f"COLUNA_{i+1}" for i, coluna in enumerate(dados.columns)]
    return dados, avisos


def mapear_colunas(dados: pd.DataFrame) -> dict[str, str]:
    normalizadas = {normalizar_cabecalho(coluna): coluna for coluna in dados.columns}
    mapeamento: dict[str, str] = {}
    for chave, aliases in ALIASES_NORM.items():
        for alias in aliases:
            if alias in normalizadas:
                mapeamento[chave] = normalizadas[alias]
                break
    faltantes = []
    if "atendente" not in mapeamento:
        faltantes.append("Atendente/User ID")
    if "inicio" not in mapeamento:
        faltantes.append("Iniciado/Data")
    if "fim" not in mapeamento:
        faltantes.append("Fim/Data Última Mensagem")
    if "rating" not in mapeamento:
        faltantes.append("Rating/Avaliação")
    if "filas" not in mapeamento and "filas_transfers" not in mapeamento:
        faltantes.append("Filas/Setores ou Filas/Setores Transfers")
    if faltantes:
        raise ValueError("Campos obrigatórios ausentes: " + ", ".join(faltantes))
    return mapeamento


def atendente_esta_excluido(nome: object, excluidos: set[str]) -> bool:
    """Compara nomes completos e trechos inteiros, sem depender de acentos.

    A lista de exclusão pode usar nomes abreviados, enquanto a plataforma pode
    exportar o nome completo.
    """
    nome_norm = normalizar_texto(nome)
    if not nome_norm:
        return False
    nome_delimitado = f" {nome_norm} "
    return any(
        nome_norm == excluido or f" {excluido} " in nome_delimitado
        for excluido in excluidos
        if excluido
    )


def _serie_texto(dados: pd.DataFrame, mapeamento: dict[str, str], chave: str) -> pd.Series:
    if chave not in mapeamento:
        return pd.Series("", index=dados.index, dtype="object")
    return dados[mapeamento[chave]].map(texto_limpo)


def _hora_para_minutos(valor: str) -> int:
    partes = valor.strip().split(":")
    if len(partes) != 2:
        raise ValueError(f"Horário inválido: {valor}")
    hora, minuto = int(partes[0]), int(partes[1])
    if not (0 <= hora <= 23 and 0 <= minuto <= 59):
        raise ValueError(f"Horário inválido: {valor}")
    return hora * 60 + minuto


def _feedback(
    linha: pd.Series,
    config: Configuracao,
    nota_anterior: Optional[float],
) -> str:
    componentes = {
        "volume": linha["pontos_quantidade"] / config.peso_quantidade
        if config.peso_quantidade
        else 0,
        "qualidade": linha["pontos_avaliacao"] / config.peso_avaliacao
        if config.peso_avaliacao
        else 0,
    }
    if config.modo == "padrao" and not config.pontuacao_tempo_tma_fixa:
        componentes.update(
            {
                "carga": linha["pontos_tempo"] / config.peso_tempo if config.peso_tempo else 0,
                "agilidade": linha["pontos_tma"] / config.peso_tma if config.peso_tma else 0,
            }
        )

    forca = max(componentes, key=componentes.get)
    oportunidade = min(componentes, key=componentes.get)
    forcas = {
        "volume": "bom volume de atendimentos",
        "qualidade": "boa avaliação dos clientes",
        "carga": "boa participação na carga total do time",
        "agilidade": "boa eficiência no tempo médio",
    }
    oportunidades = {
        "volume": "ganhar consistência no volume atendido",
        "qualidade": "elevar a média das avaliações",
        "carga": "ampliar a participação na carga do time",
        "agilidade": "reduzir o TMA",
    }
    if int(linha["avaliacoes"]) == 0:
        oportunidade_texto = "obter avaliações válidas para medir a qualidade"
    else:
        oportunidade_texto = oportunidades[oportunidade]

    if nota_anterior is None:
        tendencia = "Primeira competência registrada no histórico."
    else:
        delta = float(linha["nota_final"]) - float(nota_anterior)
        if delta >= 1:
            tendencia = f"Evolução de {numero_br(delta)} pontos frente ao mês anterior."
        elif delta <= -1:
            tendencia = f"Recuo de {numero_br(abs(delta))} pontos; vale acompanhar a tendência."
        else:
            tendencia = "Resultado estável em relação ao mês anterior."

    if bool(linha.get("premiado", False)):
        situacao = "Meta atingida e posição premiada no Top 3."
    elif float(linha["nota_final"]) >= config.nota_minima:
        situacao = "Meta atingida, mas fora das três posições premiadas."
    else:
        situacao = (
            f"Faltaram {numero_br(config.nota_minima - float(linha['nota_final']))} "
            "pontos para a meta."
        )
    return (
        f"Ponto forte: {forcas[forca]}. Foco: {oportunidade_texto}. "
        f"{tendencia} {situacao}"
    )


class BancoHistorico:
    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        self._criar_schema()
        self._atualizar_meta_elegibilidade()

    def conectar(self) -> sqlite3.Connection:
        conexao = sqlite3.connect(self.caminho)
        conexao.row_factory = sqlite3.Row
        return conexao

    def _criar_schema(self) -> None:
        with self.conectar() as con:
            con.executescript(
                """
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS competencias (
                    competencia TEXT PRIMARY KEY,
                    processado_em TEXT NOT NULL,
                    arquivo_origem TEXT,
                    total_linhas INTEGER NOT NULL,
                    validos INTEGER NOT NULL,
                    excluidos INTEGER NOT NULL,
                    suspeitos_automaticos INTEGER NOT NULL DEFAULT 0,
                    modo TEXT NOT NULL,
                    configuracao_json TEXT NOT NULL,
                    mapeamento_json TEXT NOT NULL,
                    estatisticas_validacao_json TEXT NOT NULL DEFAULT '{}',
                    avisos_json TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS resultados (
                    competencia TEXT NOT NULL,
                    atendente TEXT NOT NULL,
                    rank INTEGER NOT NULL,
                    atendimentos INTEGER NOT NULL,
                    tma_medio_min REAL,
                    horas_total REAL,
                    avaliacao_media REAL,
                    avaliacoes INTEGER NOT NULL,
                    pontos_quantidade REAL NOT NULL,
                    pontos_tempo REAL NOT NULL,
                    pontos_tma REAL NOT NULL,
                    pontos_avaliacao REAL NOT NULL,
                    nota_final REAL NOT NULL,
                    elegivel INTEGER NOT NULL,
                    feedback TEXT NOT NULL,
                    PRIMARY KEY (competencia, atendente),
                    FOREIGN KEY (competencia) REFERENCES competencias(competencia) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS exclusoes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    competencia TEXT NOT NULL,
                    linha_origem INTEGER,
                    protocolo TEXT,
                    atendente TEXT,
                    departamento TEXT,
                    inicio TEXT,
                    fim TEXT,
                    duracao_horas REAL,
                    motivo_codigo TEXT NOT NULL,
                    motivo TEXT NOT NULL,
                    FOREIGN KEY (competencia) REFERENCES competencias(competencia) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS atendimentos_validos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    competencia TEXT NOT NULL,
                    linha_origem INTEGER,
                    protocolo TEXT,
                    atendente TEXT NOT NULL,
                    departamento TEXT,
                    status TEXT,
                    inicio TEXT,
                    fim TEXT,
                    avaliacao REAL,
                    duracao_horas REAL,
                    tma_minutos REAL,
                    suspeito_automatico INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (competencia) REFERENCES competencias(competencia) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_resultados_atendente
                ON resultados(atendente, competencia);
                """
            )
            colunas_competencias = {
                row[1] for row in con.execute("PRAGMA table_info(competencias)").fetchall()
            }
            if "estatisticas_validacao_json" not in colunas_competencias:
                con.execute(
                    "ALTER TABLE competencias ADD COLUMN "
                    "estatisticas_validacao_json TEXT NOT NULL DEFAULT '{}'"
                )

    def _atualizar_meta_elegibilidade(self) -> None:
        """Aplica a meta vigente também ao histórico criado por versões anteriores.

        A atualização é idempotente: preserva notas, posições, bases e feedbacks
        editados, alterando somente a configuração da meta, a elegibilidade e a
        frase-padrão de situação quando ela ainda estiver presente no feedback.
        """
        padrao_situacao = re.compile(
            r"(?:Meta atingida\.|Meta atingida e posição premiada no Top 3\.|"
            r"Meta atingida, mas fora das três posições premiadas\.|"
            r"Faltaram [\d.,]+ pontos? para a meta\.)$"
        )
        with self.conectar() as con:
            competencias = con.execute(
                "SELECT competencia, configuracao_json FROM competencias"
            ).fetchall()
            for row in competencias:
                try:
                    configuracao = json.loads(row["configuracao_json"] or "{}")
                except (TypeError, json.JSONDecodeError):
                    continue
                if float(configuracao.get("nota_minima", META_PADRAO)) != META_PADRAO:
                    configuracao["nota_minima"] = META_PADRAO
                    con.execute(
                        "UPDATE competencias SET configuracao_json = ? WHERE competencia = ?",
                        (
                            json.dumps(configuracao, ensure_ascii=False),
                            row["competencia"],
                        ),
                    )

            resultados = con.execute(
                "SELECT competencia, atendente, rank, nota_final, elegivel, feedback FROM resultados"
            ).fetchall()
            for row in resultados:
                nota = float(row["nota_final"])
                elegivel = int(nota >= META_PADRAO)
                feedback = str(row["feedback"] or "")
                if elegivel and int(row["rank"]) <= 3:
                    situacao = "Meta atingida e posição premiada no Top 3."
                elif elegivel:
                    situacao = "Meta atingida, mas fora das três posições premiadas."
                else:
                    situacao = (
                        f"Faltaram {numero_br(META_PADRAO - nota)} pontos para a meta."
                    )
                feedback_atualizado = (
                    padrao_situacao.sub(situacao, feedback)
                    if padrao_situacao.search(feedback)
                    else feedback
                )
                if elegivel != int(row["elegivel"]) or feedback_atualizado != feedback:
                    con.execute(
                        """
                        UPDATE resultados
                        SET elegivel = ?, feedback = ?
                        WHERE competencia = ? AND atendente = ?
                        """,
                        (
                            elegivel,
                            feedback_atualizado,
                            row["competencia"],
                            row["atendente"],
                        ),
                    )

    def nota_anterior(self, atendente: str, competencia: str) -> Optional[float]:
        with self.conectar() as con:
            row = con.execute(
                """
                SELECT nota_final FROM resultados
                WHERE atendente = ? AND competencia < ?
                ORDER BY competencia DESC LIMIT 1
                """,
                (atendente, competencia),
            ).fetchone()
        return float(row[0]) if row else None

    def salvar(self, resultado: ResultadoProcessamento) -> None:
        comp = resultado.configuracao.competencia
        suspeitos = int(resultado.validos.get("suspeito_automatico", pd.Series(dtype=bool)).sum())
        with self.conectar() as con:
            con.execute("PRAGMA foreign_keys = ON")
            con.execute("DELETE FROM competencias WHERE competencia = ?", (comp,))
            con.execute(
                """
                INSERT INTO competencias (
                    competencia, processado_em, arquivo_origem, total_linhas, validos,
                    excluidos, suspeitos_automaticos, modo, configuracao_json,
                    mapeamento_json, estatisticas_validacao_json, avisos_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    comp,
                    datetime.now().isoformat(timespec="seconds"),
                    resultado.origem,
                    resultado.total_linhas,
                    len(resultado.validos),
                    len(resultado.excluidos),
                    suspeitos,
                    resultado.configuracao.modo,
                    json.dumps(asdict(resultado.configuracao), ensure_ascii=False),
                    json.dumps(resultado.mapeamento, ensure_ascii=False),
                    json.dumps(resultado.estatisticas_validacao, ensure_ascii=False),
                    json.dumps(resultado.avisos, ensure_ascii=False),
                ),
            )

            linhas_resultado = []
            for _, row in resultado.ranking.iterrows():
                linhas_resultado.append(
                    (
                        comp,
                        row["atendente"],
                        int(row["rank"]),
                        int(row["atendimentos"]),
                        _sql_float(row["tma_medio_min"]),
                        _sql_float(row["horas_total"]),
                        _sql_float(row["avaliacao_media"]),
                        int(row["avaliacoes"]),
                        float(row["pontos_quantidade"]),
                        float(row["pontos_tempo"]),
                        float(row["pontos_tma"]),
                        float(row["pontos_avaliacao"]),
                        float(row["nota_final"]),
                        int(bool(row["elegivel"])),
                        row["feedback"],
                    )
                )
            con.executemany(
                """
                INSERT INTO resultados VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                linhas_resultado,
            )

            linhas_exclusao = []
            for _, row in resultado.excluidos.iterrows():
                linhas_exclusao.append(
                    (
                        comp,
                        int(row["linha_origem"]),
                        row["protocolo"],
                        row["atendente"],
                        row["departamento"],
                        _sql_data(row["inicio"]),
                        _sql_data(row["fim"]),
                        _sql_float(row["duracao_horas"]),
                        row["motivo_codigo"],
                        row["motivo"],
                    )
                )
            con.executemany(
                """
                INSERT INTO exclusoes (
                    competencia, linha_origem, protocolo, atendente, departamento,
                    inicio, fim, duracao_horas, motivo_codigo, motivo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                linhas_exclusao,
            )

            linhas_validas = []
            for _, row in resultado.validos.iterrows():
                linhas_validas.append(
                    (
                        comp,
                        int(row["linha_origem"]),
                        row["protocolo"],
                        row["atendente"],
                        row["departamento"],
                        row["status"],
                        _sql_data(row["inicio"]),
                        _sql_data(row["fim"]),
                        _sql_float(row["avaliacao"]),
                        _sql_float(row["duracao_horas"]),
                        _sql_float(row["tma_minutos"]),
                        int(bool(row["suspeito_automatico"])),
                    )
                )
            con.executemany(
                """
                INSERT INTO atendimentos_validos (
                    competencia, linha_origem, protocolo, atendente, departamento,
                    status, inicio, fim, avaliacao, duracao_horas, tma_minutos,
                    suspeito_automatico
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                linhas_validas,
            )

    def competencias(self) -> list[str]:
        with self.conectar() as con:
            rows = con.execute(
                "SELECT competencia FROM competencias ORDER BY competencia"
            ).fetchall()
        return [row[0] for row in rows]

    def atendentes(self) -> list[str]:
        with self.conectar() as con:
            rows = con.execute(
                "SELECT DISTINCT atendente FROM resultados ORDER BY atendente COLLATE NOCASE"
            ).fetchall()
        return [row[0] for row in rows]

    def ranking(self, competencia: str) -> pd.DataFrame:
        with self.conectar() as con:
            return pd.read_sql_query(
                """
                SELECT *,
                    CASE WHEN elegivel = 1 AND rank <= 3 THEN 1 ELSE 0 END AS premiado
                FROM resultados WHERE competencia = ? ORDER BY rank
                """,
                con,
                params=(competencia,),
            )

    def competencia_info(self, competencia: str) -> Optional[dict]:
        with self.conectar() as con:
            row = con.execute(
                "SELECT * FROM competencias WHERE competencia = ?", (competencia,)
            ).fetchone()
        return dict(row) if row else None

    def historico(self, atendente: Optional[str] = None) -> pd.DataFrame:
        sql = (
            "SELECT *, CASE WHEN elegivel = 1 AND rank <= 3 "
            "THEN 1 ELSE 0 END AS premiado FROM resultados"
        )
        params: tuple = ()
        if atendente:
            sql += " WHERE atendente = ?"
            params = (atendente,)
        sql += " ORDER BY competencia, rank"
        with self.conectar() as con:
            return pd.read_sql_query(sql, con, params=params)

    def exclusoes(self, competencia: str) -> pd.DataFrame:
        with self.conectar() as con:
            return pd.read_sql_query(
                "SELECT * FROM exclusoes WHERE competencia = ? ORDER BY linha_origem",
                con,
                params=(competencia,),
            )

    def validos(self, competencia: str) -> pd.DataFrame:
        with self.conectar() as con:
            return pd.read_sql_query(
                "SELECT * FROM atendimentos_validos WHERE competencia = ? ORDER BY linha_origem",
                con,
                params=(competencia,),
            )

    def atualizar_feedback(self, competencia: str, atendente: str, feedback: str) -> None:
        with self.conectar() as con:
            con.execute(
                "UPDATE resultados SET feedback = ? WHERE competencia = ? AND atendente = ?",
                (feedback.strip(), competencia, atendente),
            )


def _sql_float(valor: object) -> Optional[float]:
    if valor is None or pd.isna(valor):
        return None
    return float(valor)


def _sql_data(valor: object) -> Optional[str]:
    if valor is None or pd.isna(valor):
        return None
    return pd.Timestamp(valor).isoformat()


def processar_dados(
    dados: pd.DataFrame,
    config: Configuracao,
    banco: BancoHistorico,
    origem: str = "",
    avisos: Optional[list[str]] = None,
) -> ResultadoProcessamento:
    avisos = list(avisos or [])
    mapeamento = mapear_colunas(dados)
    total_linhas = len(dados)

    base = pd.DataFrame(index=dados.index)
    base["linha_origem"] = range(2, len(dados) + 2)
    base["protocolo"] = _serie_texto(dados, mapeamento, "protocolo")
    if "protocolo" not in mapeamento:
        base["protocolo"] = [f"LINHA-{n}" for n in base["linha_origem"]]
        avisos.append("Protocolo ausente: foi usado o número da linha para auditoria.")
    else:
        protocolo_invalido = base["protocolo"].map(normalizar_texto).isin(VALORES_INVALIDOS)
        base.loc[protocolo_invalido, "protocolo"] = [
            f"LINHA-{n}" for n in base.loc[protocolo_invalido, "linha_origem"]
        ]
        if protocolo_invalido.any():
            avisos.append(
                f"{int(protocolo_invalido.sum())} protocolo(s) vazio(s) receberam o número "
                "da linha para auditoria; o protocolo não é critério de exclusão."
            )
    base["atendente"] = _serie_texto(dados, mapeamento, "atendente")
    fila_transfer = _serie_texto(dados, mapeamento, "filas_transfers")
    fila = _serie_texto(dados, mapeamento, "filas")
    base["departamento"] = [
        " | ".join(dict.fromkeys(valor for valor in (origem, transferencia) if valor.strip()))
        for origem, transferencia in zip(fila, fila_transfer)
    ]
    base["status"] = _serie_texto(dados, mapeamento, "status")
    base["inicio"] = serie_datas(_serie_texto(dados, mapeamento, "inicio"))
    if "fim" in mapeamento:
        base["fim"] = serie_datas(_serie_texto(dados, mapeamento, "fim"))
    else:
        base["fim"] = pd.NaT
    base["avaliacao"] = _serie_texto(dados, mapeamento, "rating").map(parse_numero)
    base.loc[
        ~base["avaliacao"].between(0, config.escala_avaliacao_max), "avaliacao"
    ] = float("nan")
    base["duracao_horas"] = (base["fim"] - base["inicio"]).dt.total_seconds() / 3600
    base["tma_minutos"] = base["duracao_horas"] * 60

    end_key = base["fim"].dt.strftime("%Y-%m-%d %H:%M")
    frequencia_fim = end_key.map(end_key.value_counts()).fillna(0)
    base["suspeito_automatico"] = base["fim"].notna() & (
        ((base["fim"].dt.hour == 6) & (base["fim"].dt.minute == 0))
        | (frequencia_fim >= 20)
    )

    motivo = pd.Series("", index=base.index, dtype="object")
    detalhe = pd.Series("", index=base.index, dtype="object")

    def marcar(mask: pd.Series, codigo: str, observacao: str = "") -> None:
        aplicar = mask.fillna(False) & motivo.eq("")
        motivo.loc[aplicar] = codigo
        detalhe.loc[aplicar] = observacao or MOTIVOS_DESCRICAO[codigo]

    alvo = normalizar_texto(config.departamento_alvo)
    depto_valido = (
        fila.map(normalizar_texto).str.contains(alvo, regex=False)
        | fila_transfer.map(normalizar_texto).str.contains(alvo, regex=False)
    )
    marcar(~depto_valido, "FORA_SUPORTE")

    atendente_norm = base["atendente"].map(normalizar_texto)
    marcar(atendente_norm.isin(VALORES_INVALIDOS), "SEM_ATENDENTE")
    marcar(
        base["atendente"].map(
            lambda nome: atendente_esta_excluido(nome, config.excluidos_normalizados)
        ),
        "ATENDENTE_EXCLUIDO",
    )
    marcar(base["inicio"].isna(), "DATA_INVALIDA")
    if config.somente_finalizados:
        marcar(base["fim"].isna(), "SEM_FINALIZACAO")
    marcar(base["duracao_horas"] < 0, "DURACAO_NEGATIVA")

    if config.modo == "padrao":
        acima_limite = base["duracao_horas"] > config.max_horas
        if config.incluir_finalizados_automaticamente:
            marcar(acima_limite & ~base["suspeito_automatico"], "ACIMA_H")
        else:
            marcar(acima_limite, "ACIMA_H")
        if not config.incluir_fora_expediente:
            inicio_min = _hora_para_minutos(config.hora_inicio)
            fim_min = _hora_para_minutos(config.hora_fim)
            minuto_dia = base["inicio"].dt.hour * 60 + base["inicio"].dt.minute
            periodo_invalido = (
                (base["inicio"].dt.weekday == 6)
                | (minuto_dia < inicio_min)
                | (minuto_dia > fim_min)
            )
            marcar(periodo_invalido, "PERIODO")
        if config.incluir_finalizados_automaticamente:
            avisos.append(
                "Finalizados automaticamente incluídos: contam em Quantidade e Avaliação; "
                "a duração artificial não participa de Tempo Total nem de TMA."
            )
    else:
        avisos.append(
            "Tempo/TMA neutralizados: encerramentos automáticos e atendimentos fora do expediente "
            "permanecem contabilizados; somente erros essenciais são retirados."
        )

    base["motivo_codigo"] = motivo
    base["motivo"] = detalhe.where(detalhe.ne(""), motivo.map(MOTIVOS_DESCRICAO))
    excluidos = base.loc[motivo.ne("")].copy()
    validos = base.loc[motivo.eq("")].copy()

    contagem_motivos = excluidos["motivo_codigo"].value_counts().to_dict()
    automaticos_validos = validos["suspeito_automatico"]
    automaticos_recuperados = (
        automaticos_validos & (validos["duracao_horas"] > config.max_horas)
        if config.modo == "padrao" and config.incluir_finalizados_automaticamente
        else pd.Series(False, index=validos.index)
    )
    estatisticas_validacao = {
        "TOTAL_IMPORTADO": int(total_linhas),
        "VALIDOS": int(len(validos)),
        "EXCLUIDOS": int(len(excluidos)),
        **{
            codigo: int(contagem_motivos.get(codigo, 0))
            for codigo in MOTIVOS_DESCRICAO
        },
        "AUTOMATICOS_IDENTIFICADOS": int(base["suspeito_automatico"].sum()),
        "AUTOMATICOS_VALIDOS": int(automaticos_validos.sum()),
        "AUTOMATICOS_RECUPERADOS": int(automaticos_recuperados.sum()),
        "AUTOMATICOS_EXCLUIDOS": int(
            excluidos["suspeito_automatico"].sum()
        ),
        "AUTOMATICOS_NEUTRALIZADOS_TEMPO": int(
            automaticos_validos.sum()
            if config.neutralizar_tempo_automaticos
            else 0
        ),
        "REGULARES_VALIDOS": int((~automaticos_validos).sum()),
        "AVALIACOES_VALIDAS": int(validos["avaliacao"].notna().sum()),
    }

    if validos.empty:
        raise ValueError("Nenhum atendimento válido restou após a aplicação das regras.")

    base_pontuacao = validos.copy()
    base_pontuacao["duracao_pontuacao_horas"] = base_pontuacao["duracao_horas"]
    base_pontuacao["tma_pontuacao_minutos"] = base_pontuacao["tma_minutos"]
    if config.modo == "padrao" and config.neutralizar_tempo_automaticos:
        mask_automatico = base_pontuacao["suspeito_automatico"]
        base_pontuacao.loc[mask_automatico, "duracao_pontuacao_horas"] = float("nan")
        base_pontuacao.loc[mask_automatico, "tma_pontuacao_minutos"] = float("nan")

    agrupado = (
        base_pontuacao.groupby("atendente", dropna=False)
        .agg(
            atendimentos=("protocolo", "size"),
            tma_medio_min=("tma_pontuacao_minutos", "mean"),
            horas_total=("duracao_pontuacao_horas", "sum"),
            avaliacao_media=("avaliacao", "mean"),
            avaliacoes=("avaliacao", "count"),
        )
        .reset_index()
    )
    agrupado["horas_total"] = agrupado["horas_total"].fillna(0.0)

    max_qtd = float(agrupado["atendimentos"].max())
    max_horas = float(agrupado["horas_total"].max())
    tmas_positivos = agrupado.loc[agrupado["tma_medio_min"] > 0, "tma_medio_min"]
    min_tma = float(tmas_positivos.min()) if not tmas_positivos.empty else 0.0
    max_aval = (
        float(agrupado["avaliacao_media"].max())
        if agrupado["avaliacao_media"].notna().any()
        else 0.0
    )

    agrupado["pontos_quantidade"] = (
        agrupado["atendimentos"] / max_qtd * config.peso_quantidade
        if max_qtd
        else 0.0
    )
    if config.modo == "neutralizado" or config.pontuacao_tempo_tma_fixa:
        agrupado["pontos_tempo"] = PONTOS_TEMPO_NEUTRALIZADO
        agrupado["pontos_tma"] = PONTOS_TMA_NEUTRALIZADO
    else:
        agrupado["pontos_tempo"] = (
            agrupado["horas_total"] / max_horas * config.peso_tempo if max_horas else 0.0
        )
        agrupado["pontos_tma"] = agrupado["tma_medio_min"].map(
            lambda tma: min_tma / tma * config.peso_tma
            if pd.notna(tma) and tma > 0 and min_tma > 0
            else 0.0
        )
    agrupado["pontos_avaliacao"] = (
        agrupado["avaliacao_media"].fillna(0) / max_aval * config.peso_avaliacao
        if max_aval
        else 0.0
    )
    agrupado["nota_final"] = agrupado[
        ["pontos_quantidade", "pontos_tempo", "pontos_tma", "pontos_avaliacao"]
    ].sum(axis=1)
    agrupado["elegivel"] = agrupado["nota_final"] >= config.nota_minima
    agrupado = agrupado.sort_values(
        ["nota_final", "atendimentos", "avaliacao_media"],
        ascending=[False, False, False],
        na_position="last",
    ).reset_index(drop=True)
    agrupado["rank"] = range(1, len(agrupado) + 1)
    agrupado["premiado"] = agrupado["elegivel"] & agrupado["rank"].le(3)

    feedbacks = []
    for _, row in agrupado.iterrows():
        anterior = banco.nota_anterior(row["atendente"], config.competencia)
        feedbacks.append(_feedback(row, config, anterior))
    agrupado["feedback"] = feedbacks

    colunas = [
        "rank",
        "atendente",
        "atendimentos",
        "tma_medio_min",
        "horas_total",
        "avaliacao_media",
        "avaliacoes",
        "pontos_quantidade",
        "pontos_tempo",
        "pontos_tma",
        "pontos_avaliacao",
        "nota_final",
        "elegivel",
        "premiado",
        "feedback",
    ]
    ranking = agrupado[colunas].copy()
    estatisticas_validacao["ATENDENTES_RANKING"] = int(len(ranking))

    return ResultadoProcessamento(
        configuracao=config,
        origem=origem,
        total_linhas=total_linhas,
        validos=validos,
        excluidos=excluidos,
        ranking=ranking,
        mapeamento=mapeamento,
        estatisticas_validacao=estatisticas_validacao,
        avisos=avisos,
    )


def exportar_competencia(banco: BancoHistorico, competencia: str, caminho: str) -> None:
    ranking = banco.ranking(competencia)
    info = banco.competencia_info(competencia)
    if ranking.empty or not info:
        raise ValueError("Competência sem dados para exportação.")
    validos = banco.validos(competencia)
    automaticos = validos.loc[validos["suspeito_automatico"].eq(1)].copy()
    if not automaticos.empty:
        automaticos["gatilho_identificacao"] = automaticos["fim"].map(
            lambda valor: (
                "Encerramento exatamente às 06:00"
                if valor and str(valor)[11:16] == "06:00"
                else "20 ou mais encerramentos no mesmo minuto"
            )
        )
        config_exportacao = json.loads(info.get("configuracao_json") or "{}")
        automaticos["tratamento_pontuacao"] = (
            "Conta em Quantidade/Avaliação; Tempo 7,88 e TMA 23,62 fixos para todos"
            if config_exportacao.get("pontuacao_tempo_tma_fixa", False)
            or config_exportacao.get("modo") == "neutralizado"
            else "Conta conforme a regra histórica da competência"
        )
        automaticos["duracao_considerada_horas"] = None
        automaticos["tma_considerado_minutos"] = None
    exclusoes = banco.exclusoes(competencia)
    historico = banco.historico()
    estatisticas = json.loads(info.get("estatisticas_validacao_json") or "{}")
    resumo_validacao = pd.DataFrame(
        [{"indicador": chave, "quantidade": valor} for chave, valor in estatisticas.items()]
    )
    parametros = pd.DataFrame(
        [
            {"campo": "competencia", "valor": competencia_para_br(competencia)},
            {"campo": "arquivo_origem", "valor": info["arquivo_origem"]},
            {"campo": "processado_em", "valor": info["processado_em"]},
            {"campo": "total_linhas", "valor": info["total_linhas"]},
            {"campo": "validos", "valor": info["validos"]},
            {"campo": "excluidos", "valor": info["excluidos"]},
            {"campo": "suspeitos_automaticos", "valor": info["suspeitos_automaticos"]},
            {"campo": "modo", "valor": info["modo"]},
            {"campo": "configuracao_json", "valor": info["configuracao_json"]},
            {"campo": "mapeamento_json", "valor": info["mapeamento_json"]},
            {
                "campo": "estatisticas_validacao_json",
                "valor": info.get("estatisticas_validacao_json", "{}"),
            },
            {"campo": "avisos_json", "valor": info["avisos_json"]},
        ]
    )
    with pd.ExcelWriter(caminho, engine="openpyxl") as writer:
        ranking.to_excel(writer, sheet_name="Ranking", index=False)
        historico.to_excel(writer, sheet_name="Historico_Notas", index=False)
        validos.to_excel(writer, sheet_name="Base_Validada", index=False)
        automaticos.to_excel(
            writer, sheet_name="Finalizados_Automaticos", index=False
        )
        exclusoes.to_excel(writer, sheet_name="Log_Exclusoes", index=False)
        resumo_validacao.to_excel(writer, sheet_name="Resumo_Validacao", index=False)
        parametros.to_excel(writer, sheet_name="Parametros_Auditoria", index=False)
        for ws in writer.book.worksheets:
            ws.freeze_panes = "A2"
            ws.auto_filter.ref = ws.dimensions
            for cell in ws[1]:
                fonte = copy(cell.font)
                fonte.bold = True
                fonte.color = "FFFFFF"
                cell.font = fonte
                preenchimento = copy(cell.fill)
                preenchimento.fill_type = "solid"
                preenchimento.fgColor.rgb = "000F4C81"
                cell.fill = preenchimento
            for coluna in ws.columns:
                letra = coluna[0].column_letter
                largura = min(60, max(12, max(len(str(c.value or "")) for c in coluna) + 2))
                ws.column_dimensions[letra].width = largura
