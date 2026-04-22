"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/hooks/useApp";
import { useDatabaseInitialization } from "@/hooks/useDatabaseInitialization";
import { LoginScreen } from "./LoginScreen";
import { Loader } from "./Loader";
import { BottomNav } from "@/components/ui/BottomNav";
import { WifiOff, RefreshCw } from "lucide-react";
import { checkDbConnection } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { ConfirmDialogWrapper } from "@/components/ui/confirm-dialog";
import { PWAInstall } from "@/components/ui/PWAInstall";
import { cn } from "@/lib/utils";

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

interface AuthGateProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function AuthGate({ children, showNav = true }: AuthGateProps) {
  const {
    isAuthenticated,
    isLoading,
    login,
    dbError,
    dbConnected,
    dbChecked,
    refresh,
  } = useApp();

  // Initialize database connection and SSE - with proper cleanup
  useDatabaseInitialization();

  const [loginError, setLoginError] = useState<string | false>(false);
  const [showPass, setShowPass] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleLogin = async (password: string, role: string = "admin") => {
    const result = await login(password, role);
    if (!result.success) {
      setLoginError(result.error);
    } else {
      setLoginError(false);
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

  if (isLoading || isRetrying || !dbChecked) {
    return <Loader />;
  }

  if (dbChecked && !dbConnected && dbError) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <DbErrorScreen error={dbError} onRetry={handleRetry} />
        </div>
      </>
    );
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

  return (
    <>
      <ConfirmDialogWrapper />
      <PWAInstall />
      <div
        className={cn(
          "min-h-screen text-dark font-clash pt-0",
          showNav ? "bg-background pb-24" : "bg-primary pb-0",
        )}
      >
        {children}
        {showNav && <BottomNav />}
      </div>
    </>
  );
}
