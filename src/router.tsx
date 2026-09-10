import AuditoriaPage from "./pages/AuditoriaPage";
import GerencialPage from "./pages/GerencialPage";
import HistoricoPage from "./pages/HistoricoPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OperacaoPage from "./pages/OperacaoPage";
import PremiacaoPage from "./pages/PremiacaoPage";
import ProjectPage from "./pages/ProjectPage";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/projeto",
    name: "projeto",
    element: <ProjectPage />,
  },
  {
    path: "/gerencial",
    name: "gerencial",
    element: <GerencialPage />,
  },
  {
    path: "/operacao",
    name: "operacao",
    element: <OperacaoPage />,
  },
  {
    path: "/premiacao",
    name: "premiacao",
    element: <PremiacaoPage />,
  },
  {
    path: "/historico",
    name: "historico",
    element: <HistoricoPage />,
  },
  {
    path: "/auditoria",
    name: "auditoria",
    element: <AuditoriaPage />,
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
