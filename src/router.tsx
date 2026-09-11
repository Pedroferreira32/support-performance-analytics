export const routers = [
  {
    path: "/",
    name: "home",
    lazy: async () => ({ Component: (await import("./pages/Index")).default }),
  },
  {
    path: "/atualizar",
    name: "atualizar",
    lazy: async () => ({ Component: (await import("./pages/AtualizarPage")).default }),
  },
  {
    path: "/projeto",
    name: "projeto",
    lazy: async () => ({ Component: (await import("./pages/ProjectPage")).default }),
  },
  {
    path: "/gerencial",
    name: "gerencial",
    lazy: async () => ({ Component: (await import("./pages/GerencialPage")).default }),
  },
  {
    path: "/operacao",
    name: "operacao",
    lazy: async () => ({ Component: (await import("./pages/OperacaoPage")).default }),
  },
  {
    path: "/premiacao",
    name: "premiacao",
    lazy: async () => ({ Component: (await import("./pages/PremiacaoPage")).default }),
  },
  {
    path: "/historico",
    name: "historico",
    lazy: async () => ({ Component: (await import("./pages/HistoricoPage")).default }),
  },
  {
    path: "/auditoria",
    name: "auditoria",
    lazy: async () => ({ Component: (await import("./pages/AuditoriaPage")).default }),
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    lazy: async () => ({ Component: (await import("./pages/NotFound")).default }),
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
