"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

export function LoginScreen({ onLogin, error, showPass, setShowPass }) {
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [showAdminToggle, setShowAdminToggle] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password, role);
  };

  const roleText = role === "admin" ? "Administrador" : "Observador";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-8 w-full max-w-sm border border-surface-dark shadow-xl">
        <div 
          className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 cursor-pointer select-none transition-transform active:scale-95"
          onDoubleClick={() => setShowAdminToggle(!showAdminToggle)}
          title="Doble click"
        >
          <Lock className="w-8 h-8 text-primary pointer-events-none" />
        </div>
        <h2 className="text-2xl font-black text-center mb-2">Acceso</h2>
        
        {showAdminToggle ? (
          <div className="flex items-center justify-center gap-3 mb-6 animate-in fade-in zoom-in duration-300">
            <Label htmlFor="admin-mode" className={cn("text-sm font-bold cursor-pointer transition-colors", role === "viewer" ? "text-primary" : "text-text-muted")}>Viewer</Label>
            <Switch
              id="admin-mode"
              checked={role === "admin"}
              onCheckedChange={(checked) => setRole(checked ? "admin" : "viewer")}
            />
            <Label htmlFor="admin-mode" className={cn("text-sm font-bold cursor-pointer transition-colors", role === "admin" ? "text-primary" : "text-text-muted")}>Admin</Label>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center mb-6">
            Ingresá la contraseña para continuar
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Input
              type={showPass ? "text" : "password"}
              placeholder={`Contraseña de ${roleText}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className={cn(error && "border-red-500")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-dark"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center mb-4 font-bold">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg">
            Ingresar como {roleText}
          </Button>
        </form>

        {/* Helper text for passwords */}
        {showAdminToggle && (
          <p className="text-xs text-text-muted text-center mt-4">
            {role === "admin"
              ? "Admin: acceso total para gestionar jugadores y actividades"
              : "Viewer: solo ver y recibir notificaciones"}
          </p>
        )}
      </div>
    </div>
  );
}
