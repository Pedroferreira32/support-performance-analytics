import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, ShieldCheck, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadExcludedNames, saveExcludedNames, saveSnapshot } from "@/lib/dashboard-store";
import { competenceToBr, detectCompetence, officialConfig, processFile } from "@/lib/validation-engine";

export default function AtualizarPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [competence, setCompetence] = useState("");
  const [excluded, setExcluded] = useState(loadExcludedNames());
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; body: string } | null>(null);

  const config = useMemo(() => {
    try {
      if (!competence) return null;
      const [month, year] = competence.split("/");
      return officialConfig(`${year}-${month}`);
    } catch {
      return null;
    }
  }, [competence]);

  async function chooseFile(selected: File | null) {
    setFile(selected);
    setMessage(null);
    if (!selected) return;
    try {
      const detected = await detectCompetence(selected);
      if (detected) setCompetence(competenceToBr(detected));
    } catch (error) {
      setMessage({ tone: "error", title: "Não foi possível ler o arquivo", body: error instanceof Error ? error.message : "Verifique o formato da planilha." });
    }
  }

  async function submit() {
    if (!file) {
      setMessage({ tone: "error", title: "Arquivo não informado", body: "Selecione a exportação mensal do ChatMobi." });
      return;
    }
    if (!/^\d{2}\/\d{4}$/.test(competence)) {
      setMessage({ tone: "error", title: "Competência inválida", body: "Informe a competência no formato MM/AAAA." });
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      const snapshot = await processFile(file, competence, excluded);
      saveExcludedNames(excluded);
      saveSnapshot(snapshot);
      setMessage({
        tone: "success",
        title: `${snapshot.competenciaBr} processada com sucesso`,
        body: `${snapshot.validos.length.toLocaleString("pt-BR")} registros válidos, ${snapshot.excluidos.length.toLocaleString("pt-BR")} excluídos e ${snapshot.ranking.filter((row) => row.premiado).length} premiados.`,
      });
      toast.success("Histórico atualizado", { description: "A competência foi substituída integralmente, sem duplicidade." });
      window.setTimeout(() => {
        navigate("/gerencial");
        window.location.reload();
      }, 800);
    } catch (error) {
      setMessage({ tone: "error", title: "Validação interrompida", body: error instanceof Error ? error.message : "Não foi possível processar o arquivo." });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AppShell breadcrumb="Ferramentas" title="Atualizar base">
      <div className="animate-fade-in-up space-y-5">
        <Alert className="rounded-sm border-primary/30 bg-primary/5">
          <ShieldCheck className="size-4 text-primary" />
          <AlertTitle>Processamento local e privado</AlertTitle>
          <AlertDescription>
            A planilha é validada dentro deste navegador e não é enviada para servidores. O histórico fica salvo somente neste dispositivo.
          </AlertDescription>
        </Alert>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            eyebrow="Arquivo de origem"
            title="Importação mensal do ChatMobi"
            description="Formatos aceitos: CSV, TXT, XLSX, XLS e XLSM. A competência é sugerida pela data de início dos atendimentos."
          >
            <div className="space-y-5">
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-primary/50 bg-primary/5 px-6 py-8 text-center transition-colors hover:bg-primary/10">
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls,.xlsm"
                  className="sr-only"
                  onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)}
                />
                <span className="grid size-12 place-items-center rounded-sm bg-primary/15 text-primary">
                  <Upload className="size-5" />
                </span>
                <span className="mt-3 text-sm font-bold">Selecione ou arraste o arquivo mensal</span>
                <span className="mt-1 text-xs text-muted-foreground">{file ? `${file.name} · ${(file.size / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB` : "Nenhum arquivo selecionado"}</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="competence">Competência</Label>
                  <Input id="competence" value={competence} onChange={(event) => setCompetence(event.target.value)} placeholder="08/2026" inputMode="numeric" />
                  <p className="text-[11px] text-muted-foreground">É usada a data de início; finalizações em 01/09 não movem atendimentos de agosto.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="excluded">Atendentes fora da campanha</Label>
                  <Textarea id="excluded" value={excluded} onChange={(event) => setExcluded(event.target.value)} placeholder="Nomes completos ou parciais, separados por ponto e vírgula" rows={4} />
                  <p className="text-[11px] text-muted-foreground">A lista é armazenada somente neste navegador e aplicada por correspondência parcial do nome.</p>
                </div>
              </div>

              {message && (
                <Alert className={message.tone === "success" ? "rounded-sm border-emerald-400/35 bg-emerald-400/10" : "rounded-sm border-destructive/40 bg-destructive/10"}>
                  {message.tone === "success" ? <CheckCircle2 className="size-4 text-emerald-400" /> : <FileSpreadsheet className="size-4 text-destructive" />}
                  <AlertTitle>{message.title}</AlertTitle>
                  <AlertDescription>{message.body}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" size="lg" onClick={() => void submit()} disabled={processing}>
                {processing ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                {processing ? "Lendo e validando a base..." : "Processar e atualizar histórico"}
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Regra automática"
            title={config?.perfilRegra ?? "Selecione o arquivo para identificar o perfil"}
            description="Os parâmetros são versionados pela competência e não dependem de configuração manual."
            className="h-fit"
          >
            {config ? (
              <dl className="space-y-0">
                {[
                  ["Competência", competence],
                  ["Departamento", "Suporte em Filas/Setores ou Transfers"],
                  ["Período", config.incluirForaExpediente ? "Período integral preservado" : "Segunda a sábado, 08:00–19:59"],
                  ["Duração", `Até ${config.maxHoras} horas`],
                  ["Automáticos", config.incluirFinalizadosAutomaticamente ? "Incluídos; duração protegida" : "Tratamento regular"],
                  ["Avaliação", `Escala de 0 a ${config.escalaAvaliacaoMax}`],
                  ["Meta mínima", `${config.notaMinima} pontos`],
                  ["Premiação", "Top 3 entre elegíveis"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-border/60 py-3 first:pt-0 last:border-0 last:pb-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="max-w-[62%] text-right text-xs font-bold">{value}</dd>
                  </div>
                ))}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Quantidade", `${config.pesoQuantidade} pts`],
                    ["Tempo total", config.pontuacaoTempoTmaFixa ? "7,88 pts fixos" : `${config.pesoTempo} pts`],
                    ["TMA", config.pontuacaoTempoTmaFixa ? "23,62 pts fixos" : `${config.pesoTma} pts`],
                    ["Avaliação", `${config.pesoAvaliacao} pts`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-sm border bg-muted/40 p-3">
                      <p className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </dl>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
                <FileSpreadsheet className="size-8 opacity-50" />
                <p className="mt-3 text-xs">Os parâmetros aparecerão após identificar a competência.</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
