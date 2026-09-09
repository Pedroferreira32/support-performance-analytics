import {
  BarChart3,
  Download,
  History,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Trophy,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const paineis: NavItem[] = [
  { to: "/projeto", label: "Visão do projeto", icon: Layers },
  { to: "/gerencial", label: "Resumo gerencial", icon: LayoutDashboard },
  { to: "/operacao", label: "Operação", icon: BarChart3 },
  { to: "/premiacao", label: "Premiação", icon: Trophy },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/auditoria", label: "Auditoria", icon: ShieldCheck },
];

const ferramentas: NavItem[] = [
  { to: "/atualizar-base", label: "Atualizar base", icon: Upload },
  { to: "/baixar-relatorio", label: "Baixar relatório", icon: Download },
];

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary-soft text-primary"
      : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-5 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
          <BarChart3 className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">
            Performance do Suporte
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Validação e premiação
          </p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Painéis
        </p>
        <ul className="space-y-1">
          {paineis.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={navLinkClasses}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <p className="px-2 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Ferramentas
        </p>
        <ul className="space-y-1">
          {ferramentas.map((item) => (
            <li key={item.to}>
              <button
                type="button"
                onClick={() => {
                  onNavigate?.();
                  toast("Disponível na versão completa", {
                    description:
                      "Esta demonstração é somente leitura e usa dados sintéticos.",
                  });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="border-t px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" />
          <p className="text-xs font-semibold">Demonstração pública</p>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Base sintética e ambiente somente leitura.
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
          Versão 4.0
        </p>
      </div>
    </div>
  );
}
