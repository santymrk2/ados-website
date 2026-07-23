"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/hooks/useApp";
import { useDatabaseInitialization } from "@/hooks/useDatabaseInitialization";
import { LoginScreen } from "./LoginScreen";
import { Loader } from "./Loader";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { AppHeader } from "@/components/ui/AppHeader";
import { WifiOff, RefreshCw } from "lucide-react";
import { checkDbConnection } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { ConfirmDialogWrapper } from "@/components/ui/confirm-dialog";
import { PWAInstall } from "@/components/ui/PWAInstall";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface DbErrorScreenProps {
  error: { message?: string };
  onRetry: () => void;
}

function DbErrorScreen({ error, onRetry }: DbErrorScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <WifiOff className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-xl font-black text-red-600 mb-2">
        Sin conexión a la base de datos
      </h1>
      <p className="text-text-muted text-sm mb-6 max-w-xs">
        {error?.message ||
          "No se puede conectar al servidor. Verifica tu conexión a internet."}
      </p>
      <Button onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </Button>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/calendar") return "Eventos";
  if (pathname === "/activities") return "Actividades";
  if (pathname === "/participants") return "Jugadores";
  if (pathname.startsWith("/activities/")) return "Actividad";
  if (pathname.startsWith("/participants/")) return "Jugador";
  return "Activados";
}

function isDetailPage(pathname: string): boolean {
  return (
    (pathname.startsWith("/activities/") && pathname !== "/activities") ||
    (pathname.startsWith("/participants/") && pathname !== "/participants")
  );
}

interface AuthGateProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function AuthGate({ children, showNav = true }: AuthGateProps) {

  const pathname = usePathname();
  const isActivityDetailPage = pathname?.startsWith("/activities/") && pathname !== "/activities";

  const {
    isAuthenticated,
    authLoading,
    login,
    dbError,
    dbConnected,
    dbChecked,
    refresh,
  } = useApp();

  // Initialize database connection and SSE only after auth - with proper cleanup
  useDatabaseInitialization(isAuthenticated);

  const [loginError, setLoginError] = useState<string | false>(false);
  const [showPass, setShowPass] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogin = async (password: string, role: string = "admin") => {
    const result = await login(password, role);
    if (!result.success) {
      setLoginError(result.error);
    } else {
      setLoginError(false);
      await refresh(true);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    const isConnected = await checkDbConnection();
    if (isConnected) {
      await refresh();
    }
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // Register service worker for push notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  if (authLoading || isRetrying) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <LoginScreen
            onLogin={handleLogin}
            error={loginError}
            showPass={showPass}
            setShowPass={setShowPass}
          />
        </div>
      </>
    );
  }

  if (!dbChecked) {
    return <Loader />;
  }

  if (!dbConnected && dbError) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <DbErrorScreen error={dbError} onRetry={handleRetry} />
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmDialogWrapper />
      <PWAInstall />
      <div className="min-h-screen text-dark font-clash">
        {showNav && (
          <AppDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
        )}
        <div
          className={cn(
            "min-h-screen transition-transform duration-300 ease-out",
            isDrawerOpen && "translate-x-[280px]",
            isActivityDetailPage ? "bg-primary" : "bg-background"
          )}
        >
          {showNav && (
            <AppHeader
              title={getPageTitle(pathname || "/")}
              showSettings={false}
              showBack={isDetailPage(pathname || "/")}
              onMenuClick={() => setIsDrawerOpen(true)}
            />
          )}
          {children}
        </div>
      </div>
    </>
  );
}
