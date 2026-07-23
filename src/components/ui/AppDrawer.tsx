"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { useStore } from "@nanostores/react";
import {
  BarChart3,
  PartyPopper,
  Calendar,
  Users,
  Plus,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { NewActivityModal } from "@/app/activities/_components/NewActivityModal";
import { SettingsPanel } from "@/components/auth/SettingsPanel";

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppDrawer({ open, onOpenChange }: AppDrawerProps) {
  const router = useRouter();
  const { db, logout } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const [newActivityOpen, setNewActivityOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { href: "/", icon: BarChart3, label: "Dashboard" },
    { href: "/calendar", icon: PartyPopper, label: "Eventos" },
    { href: "/activities", icon: Calendar, label: "Actividades" },
    { href: "/participants", icon: Users, label: "Jugadores" },
  ];

  const handleNavClick = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleNewActivity = () => {
    onOpenChange(false);
    setNewActivityOpen(true);
  };

  const handleNewPlayer = () => {
    onOpenChange(false);
    router.push("/participants/new");
  };

  const handleSettings = () => {
    onOpenChange(false);
    setSettingsOpen(true);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    onOpenChange(false);
    await logout();
  };

  const userInitials = "AD";
  const userName = "Admin";
  const userRole = isAdmin ? "Administrador" : "Visualizador";

  return (
    <>
      <Drawer.Root
        open={open}
        onOpenChange={onOpenChange}
        direction="left"
        shouldScaleBackground={false}
      >
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white shadow-xl pt-safe">
          <Drawer.Title className="sr-only">Menú de navegación</Drawer.Title>
          <div className="flex flex-col h-full">
            {/* User Profile */}
            <div className="p-5 border-b border-surface-dark">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {userInitials}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-dark">{userName}</div>
                  <div className="text-sm text-text-muted">{userRole}</div>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="px-5 py-4 border-b border-surface-dark">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-black text-primary">
                    {db.activities.length}
                  </div>
                  <div className="text-xs text-text-muted">Actividades</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-primary">
                    {db.participants.length}
                  </div>
                  <div className="text-xs text-text-muted">Jugadores</div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                      "hover:bg-surface-dark active:bg-surface-dark/80",
                      "min-h-[44px]"
                    )}
                  >
                    <Icon className="w-5 h-5 text-text-muted" />
                    <span className="font-medium text-dark">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions */}
            {isAdmin && (
              <div className="px-5 py-4 border-t border-surface-dark">
                <div className="text-xs text-text-muted uppercase tracking-wide mb-3 font-semibold">
                  Acciones rápidas
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleNewActivity}
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                    Nueva Actividad
                  </Button>
                  <Button
                    onClick={handleNewPlayer}
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Jugador
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="px-5 py-4 border-t border-surface-dark pb-safe">
              <div className="space-y-2">
                <button
                  onClick={handleSettings}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    "hover:bg-surface-dark active:bg-surface-dark/80",
                    "min-h-[44px]"
                  )}
                >
                  <Settings className="w-5 h-5 text-text-muted" />
                  <span className="font-medium text-dark">Ajustes</span>
                </button>
                <button
                  onClick={handleLogoutClick}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    "hover:bg-red-50 active:bg-red-100",
                    "min-h-[44px]"
                  )}
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-600">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Root>

      {/* Modals */}
      <NewActivityModal
        open={newActivityOpen}
        onOpenChange={setNewActivityOpen}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={handleConfirmLogout}
        role={role}
      />

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Cerrar sesión</h3>
            <p className="text-text-muted text-sm mb-4">
              ¿Estás seguro de que quieres cerrar sesión?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmLogout}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
