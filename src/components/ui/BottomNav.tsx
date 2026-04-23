"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, Users, PartyPopper } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "../../lib/utils";

function getActiveValue(pathname: string) {
  if (pathname === "/") return "/";
  if (pathname === "/calendar") return "/calendar";
  if (pathname.startsWith("/activities")) return "/activities";
  if (pathname.startsWith("/participants")) return "/participants";
  return "/";
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

  const activeValue = getActiveValue(pathname);

  const navItems = [
    { value: "/", icon: BarChart3, label: "Dashboard" },
    { value: "/calendar", icon: PartyPopper, label: "Eventos" },
    { value: "/activities", icon: Calendar, label: "Actividades" },
    { value: "/participants", icon: Users, label: "Jugadores" },
  ];

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pb-6 pb-safe"
      style={{ transform: 'scale(1.2)' }}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-surface-dark p-1">
        <Tabs value={activeValue}>
          <TabsList className="bg-muted/50 h-12 px-1 gap-1 border-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  onClick={() => router.push(item.value)}
                  className={cn(
                    "group relative px-4 h-10 transition-all duration-300 gap-2 rounded-2xl",
                    "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-black/5 data-[state=active]:text-primary"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-300", "group-data-[state=active]:scale-110")} />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}