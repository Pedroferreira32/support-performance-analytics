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

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/15 text-foreground"
            : "text-sidebar-foreground hover:bg-muted/60 hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400"
            />
          )}
          <item.icon
            className={cn(
              "size-4 shrink-0",
              isActive && "text-primary dark:text-cyan-300"
            )}
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-glow">
          <BarChart3 className="size-5 text-background" />
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
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
          Painéis
        </p>
        <ul className="space-y-0.5">
          {paineis.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        <p className="px-2 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
          Ferramentas
        </p>
        <ul className="space-y-0.5">
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
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="border-t border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" />
          <p className="text-xs font-semibold">Demonstração pública</p>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Base sintética e ambiente somente leitura.
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/50">
          Versão 4.0
        </p>
      </div>
    </div>
  );
}
