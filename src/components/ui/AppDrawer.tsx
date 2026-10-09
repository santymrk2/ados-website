"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
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

const ROW =
  "flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors";

/**
 * Side menu. On large screens (lg) it is a permanent sidebar; below that it is a drawer opened from the header.
 * Both show the same content.
 */
export function AppDrawer({ open, onOpenChange }: AppDrawerProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { logout } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const [newActivityOpen, setNewActivityOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { href: "/", icon: BarChart3, label: "Dashboard" },
    { href: "/calendar", icon: PartyPopper, label: "Cumpleaños" },
    { href: "/activities", icon: Calendar, label: "Actividades" },
    { href: "/participants", icon: Users, label: "Jugadores" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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

  const menu = (
    <div className="flex h-full flex-col">
      {/* User Profile */}
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-bold text-primary">{userInitials}</span>
          </div>
          <div>
            <div className="font-bold text-foreground">{userName}</div>
            <div className="text-sm text-muted-foreground">{userRole}</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                ROW,
                active
                  ? "bg-primary/10 font-bold text-primary"
                  : "font-medium text-foreground hover:bg-muted active:bg-muted",
              )}
            >
              <Icon
                className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {isAdmin && (
        <div className="border-t border-border px-5 py-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Acciones rápidas
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleNewActivity}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Plus className="size-4" />
              Nueva Actividad
            </Button>
            <Button
              onClick={handleNewPlayer}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Plus className="size-4" />
              Nuevo Jugador
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="space-y-1 border-t border-border p-3 pb-safe">
        <button
          onClick={handleSettings}
          className={cn(ROW, "font-medium text-foreground hover:bg-muted active:bg-muted")}
        >
          <Settings className="size-5 text-muted-foreground" />
          <span>Ajustes</span>
        </button>
        <button
          onClick={handleLogoutClick}
          className={cn(
            ROW,
            "font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/15",
          )}
        >
          <LogOut className="size-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Large screens: permanent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-border bg-card pt-safe lg:block">
        {menu}
      </aside>

      {/* Small screens: drawer opened from the header */}
      <Drawer.Root
        open={open}
        onOpenChange={onOpenChange}
        direction="left"
        shouldScaleBackground={false}
      >
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content className="fixed bottom-0 left-0 top-0 z-50 w-[280px] bg-card pt-safe shadow-xl lg:hidden">
          <Drawer.Title className="sr-only">Menú de navegación</Drawer.Title>
          {menu}
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
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-card p-6">
            <h3 className="mb-2 text-lg font-bold text-foreground">Cerrar sesión</h3>
            <p className="mb-4 text-sm text-muted-foreground">
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
                className="flex-1 bg-destructive text-white hover:bg-destructive/90"
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
