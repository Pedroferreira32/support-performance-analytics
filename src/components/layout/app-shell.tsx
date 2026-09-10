import type { ReactNode } from "react";
import { Activity, CalendarDays, Download, FileDown, Presentation, Upload } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { competencia } from "@/data/support-data";
import { cn } from "@/lib/utils";

const paineis = [
  { to: "/projeto", label: "Projeto" },
  { to: "/gerencial", label: "Gerencial" },
  { to: "/operacao", label: "Operação" },
  { to: "/premiacao", label: "Premiação" },
  { to: "/historico", label: "Histórico" },
  { to: "/auditoria", label: "Auditoria" },
];

interface AppShellProps {
  breadcrumb: string;
  title: string;
  children: ReactNode;
}

export function AppShell({ breadcrumb, title, children }: AppShellProps) {
  const demoNotice = () =>
    toast("Disponível na versão completa", {
      description:
        "Esta demonstração é somente leitura e usa dados sintéticos.",
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho com navegação no topo */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        {/* Linha 1 — identidade e ações */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Activity className="size-4" strokeWidth={2.5} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">
                Performance do Suporte
              </p>
              <p className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                Validação e premiação
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Select defaultValue={competencia.label}>
              <SelectTrigger className="h-8 gap-2 border-border/70 bg-card/60 px-2 mono text-[11px]">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Competência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08/2026">08/2026</SelectItem>
                <SelectItem value="07/2026">07/2026</SelectItem>
                <SelectItem value="06/2026">06/2026</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 border-border/70 bg-card/60 px-2.5 mono text-[11px] text-muted-foreground hover:text-foreground md:inline-flex"
              onClick={demoNotice}
            >
              <FileDown className="size-3.5" />
              Excel
            </Button>
            <Button
              size="sm"
              className="hidden h-8 bg-primary px-2.5 mono text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 md:inline-flex"
              onClick={demoNotice}
            >
              <Presentation className="size-3.5" />
              PPT
            </Button>
            <span className="mono hidden text-[11px] text-muted-foreground lg:block">
              09/09/26
            </span>
          </div>
        </div>

        {/* Linha 2 — navegação */}
        <nav className="flex items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-1">
            {paineis.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 px-3 py-2.5 mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {p.label}
              </NavLink>
            ))}
          </div>
          <div className="hidden shrink-0 items-center gap-1 md:flex">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              onClick={demoNotice}
            >
              <Upload className="size-3.5" />
              Atualizar base
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              onClick={demoNotice}
            >
              <Download className="size-3.5" />
              Relatório
            </Button>
          </div>
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="bg-grid px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          {/* Faixa de demonstração */}
          <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm border border-border/70 bg-card/50 px-3 py-2 mono text-[11px] text-muted-foreground">
            <span className="rounded-sm bg-success/15 px-1.5 py-0.5 font-bold text-success">
              DEMO
            </span>
            <span>Competência {competencia.label}</span>
            <span aria-hidden>·</span>
            <span>{competencia.fonte}</span>
            <span aria-hidden>·</span>
            <span>vs {competencia.anterior}</span>
            <span aria-hidden>·</span>
            <span className="hidden sm:inline">{competencia.regra}</span>
          </div>

          {/* Cabeçalho da página */}
          <div className="mb-5">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {breadcrumb}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">{title}</h1>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
