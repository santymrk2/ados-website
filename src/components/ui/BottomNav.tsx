"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, Users, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function getNavConfig(pathname: string) {
  const items = [
    { href: "/", label: "Inicio", icon: BarChart3, value: "/" },
    { href: "/calendar", label: "Cumple", icon: PartyPopper, value: "/calendar" },
    { href: "/activities", label: "Actividades", icon: Calendar, value: "/activities" },
    { href: "/participants", label: "Jugadores", icon: Users, value: "/participants" },
  ];

  const active = items.find(item => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });

  return { items, activeValue: active?.value || "/" };
}

function shouldShowNav(pathname: string) {
  // Hide on form pages
  if (pathname.includes("/new")) return false;
  if (pathname.includes("/edit")) return false;
  // Hide on activity view pages (they have their own FloatingNav)
  if (pathname.includes("/activities/") && (pathname.includes("/view/") || pathname.includes("/edit/"))) return false;
  // Hide on participant detail pages
  if (pathname.match(/^\/participants\/[^\/]+$/)) return false;
  return true;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (!shouldShowNav(pathname)) return null;

  const { items, activeValue } = getNavConfig(pathname);

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pb-6 pb-safe"
      style={{ transform: 'scale(1.4)' }}
    >
      <div className="bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex gap-1 p-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.value === activeValue;
          
          return (
            <Button
              key={item.value}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-0 px-3 py-1.5 rounded-full min-w-[60px]",
                isActive 
                  ? "bg-primary text-white" 
                  : "text-text-muted hover:text-foreground hover:bg-surface-dark"
              )}
              onClick={() => router.push(item.href)}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}