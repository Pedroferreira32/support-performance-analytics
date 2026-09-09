import { useState, type ReactNode } from "react";
import { CalendarDays, FileDown, Menu, Presentation } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { competencia } from "@/data/support-data";
import { SidebarContent } from "./app-sidebar";

interface AppShellProps {
  breadcrumb: string;
  title: string;
  children: ReactNode;
}

export function AppShell({ breadcrumb, title, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  const demoNotice = () =>
    toast("Disponível na versão completa", {
      description:
        "Esta demonstração é somente leitura e usa dados sintéticos.",
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Navegação principal do dashboard
          </SheetDescription>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu"
                onClick={() => setOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {breadcrumb}
                </p>
                <h1 className="truncate text-lg font-bold tracking-tight">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block">
                <Select defaultValue={competencia.label}>
                  <SelectTrigger className="h-9 gap-2 pr-2 text-xs">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Competência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08/2026">Competência 08/2026</SelectItem>
                    <SelectItem value="07/2026">Competência 07/2026</SelectItem>
                    <SelectItem value="06/2026">Competência 06/2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:inline-flex"
                onClick={demoNotice}
              >
                <FileDown className="size-4" />
                Exportar Excel
              </Button>
              <Button
                size="sm"
                className="hidden md:inline-flex"
                onClick={demoNotice}
              >
                <Presentation className="size-4" />
                PowerPoint
              </Button>
              <span className="hidden text-xs text-muted-foreground xl:block">
                09 de set. de 2026
              </span>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {/* Faixa de demonstração */}
            <div className="mb-5 rounded-xl border bg-card px-4 py-3 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Demonstração
                </span>
                <p className="text-xs text-muted-foreground">
                  Dados sintéticos e navegação pública em modo somente leitura.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Competência {competencia.label}
                </span>
                <span aria-hidden>·</span>
                <span>Fonte: {competencia.fonte}</span>
                <span aria-hidden>·</span>
                <span>Comparação: {competencia.anterior}</span>
                <span aria-hidden>·</span>
                <span>Atualizado em {competencia.atualizadoEm}</span>
                <span aria-hidden>·</span>
                <span>{competencia.regra}</span>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
