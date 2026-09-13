import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { replaceSnapshots } from "@/lib/dashboard-store";
import { loadPipelineSnapshots, pipelineApiEnabled } from "@/lib/data-pipeline-api";
import { routers } from "./router";

const queryClient = new QueryClient();
const router = createBrowserRouter(routers);

const App = () => {
  const [ready, setReady] = useState(!pipelineApiEnabled());

  useEffect(() => {
    if (!pipelineApiEnabled()) return;
    void loadPipelineSnapshots()
      .then((snapshots) => {
        if (snapshots?.length) replaceSnapshots(snapshots);
      })
      .catch(() => {
        // O histórico local permanece disponível como contingência.
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
