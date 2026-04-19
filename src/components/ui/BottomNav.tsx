"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, Users, PartyPopper } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function shouldShowNav(pathname: string) {
  // Hide on form pages
  if (pathname.includes('/new')) return false;
  if (pathname.includes('/edit')) return false;
  return true;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (!shouldShowNav(pathname)) return null;

  const getActiveValue = () => {
    if (pathname === '/') return '/';
    if (pathname === '/calendar') return '/calendar';
    if (pathname.startsWith('/activities')) return '/activities';
    if (pathname.startsWith('/participants')) return '/participants';
    return '/';
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pb-6 pb-safe" style={{ transform: 'scale(1.4)' }}>
      <div className="bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark">
        <Tabs value={getActiveValue()}>
          <TabsList>
            <TabsTrigger value="/" onClick={() => router.push('/')}>
              <BarChart3 className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="/calendar" onClick={() => router.push('/calendar')}>
              <PartyPopper className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="/activities" onClick={() => router.push('/activities')}>
              <Calendar className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="/participants" onClick={() => router.push('/participants')}>
              <Users className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}