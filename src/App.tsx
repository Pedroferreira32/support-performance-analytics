import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { replaceSnapshots, selectedCompetence } from "@/lib/dashboard-store";
import { loadPipelineSnapshots, pipelineApiEnabled } from "@/lib/data-pipeline-api";
import { loadPreviewSnapshots, previewDataEnabled } from "@/lib/preview-data";
import { routers } from "./router";

const queryClient = new QueryClient();
const router = createBrowserRouter(routers);

const App = () => {
  const [ready, setReady] = useState(!pipelineApiEnabled() && !previewDataEnabled);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!pipelineApiEnabled() && !previewDataEnabled) return;
    void (previewDataEnabled
      ? loadPreviewSnapshots(selectedCompetence())
      : loadPipelineSnapshots(selectedCompetence()))
      .then((snapshots) => {
        if (snapshots?.length) replaceSnapshots(snapshots);
      })
      .catch((error: unknown) => {
        if (previewDataEnabled) {
          setLoadError(error instanceof Error ? error.message : "Falha ao carregar a demonstração.");
        }
        // A API central mantém o histórico local como contingência.
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Sincronizando histórico da pipeline…
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="grid min-h-screen place-items-center bg-background p-6 text-center text-sm text-muted-foreground">
        <div><p className="font-semibold text-foreground">A base sintética não foi carregada.</p><p className="mt-2">{loadError}</p></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider
          router={router}
          fallbackElement={
            <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
              Carregando painel…
            </div>
          }
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
