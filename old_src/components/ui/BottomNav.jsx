import { useState, useEffect } from 'react';
import { BarChart3, Calendar, Users, PartyPopper } from 'lucide-react';
import { navigate } from 'astro:transitions/client';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BottomNav() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);
    document.addEventListener('astro:after-transition', handleNavigation);
    document.addEventListener('astro:after-swap', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('astro:after-transition', handleNavigation);
      document.removeEventListener('astro:after-swap', handleNavigation);
    };
  }, []);

  const getActiveValue = () => {
    if (currentPath === '/') return '/';
    if (currentPath === '/calendar') return '/calendar';
    if (currentPath.startsWith('/activities')) return '/activities';
    if (currentPath.startsWith('/participants')) return '/participants';
    return '/';
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pb-6 pb-safe" style={{ transform: 'scale(1.4)' }}>
      <div className="bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark">
        <Tabs value={getActiveValue()}>
          <TabsList>
            <TabsTrigger value="/" onClick={() => navigate('/')}>
              <BarChart3 className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="/calendar" onClick={() => navigate('/calendar')}>
              <PartyPopper className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="/activities" onClick={() => navigate('/activities')}>
              <Calendar className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="/participants" onClick={() => navigate('/participants')}>
              <Users className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
