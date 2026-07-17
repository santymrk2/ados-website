"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, Users, PartyPopper } from "lucide-react";
import { cn } from "../../lib/utils";

function getActiveValue(pathname: string) {
  if (pathname === "/") return "/";
  if (pathname === "/calendar") return "/calendar";
  if (pathname.startsWith("/activities")) return "/activities";
  if (pathname.startsWith("/participants")) return "/participants";
  return "/";
}

function shouldShowNav(pathname: string) {
  if (pathname.includes("/new")) return false;
  if (pathname.includes("/edit")) return false;
  if (pathname.startsWith("/activities/") && pathname !== "/activities") return false;
  if (pathname.includes("/activities/") && (pathname.includes("/view/") || pathname.includes("/edit/"))) return false;
  if (pathname.match(/^\/participants\/[^\/]+$/)) return false;
  return true;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (!shouldShowNav(pathname)) return null;

  const activeValue = getActiveValue(pathname);

  const navItems = [
    { value: "/", icon: BarChart3, label: "Dashboard" },
    { value: "/calendar", icon: PartyPopper, label: "Eventos" },
    { value: "/activities", icon: Calendar, label: "Actividades" },
    { value: "/participants", icon: Users, label: "Jugadores" },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] pb-safe">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/8 border border-slate-200/60 p-1.5">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeValue === item.value;
            return (
              <button
                key={item.value}
                onClick={() => router.push(item.value)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-slate-400 hover:bg-slate-100"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
