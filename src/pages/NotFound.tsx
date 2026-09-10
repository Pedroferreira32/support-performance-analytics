import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-bold tracking-tight text-primary">404</p>
        <h1 className="mt-4 text-xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A rota que você tentou acessar não existe no painel de performance.
        </p>
        <Button asChild className="mt-6">
          <a href="/gerencial">
            <ArrowLeft className="size-4" />
            Voltar ao resumo gerencial
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
