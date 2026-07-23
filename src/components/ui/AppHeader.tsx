"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, ChevronLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsPanel } from "@/components/auth/SettingsPanel";
import { useApp } from "@/hooks/useApp";
import { useStore } from "@nanostores/react";
import { $role } from "@/store/appStore";

interface AppHeaderProps {
  title: string;
  sub?: string;
  showSettings?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
}

export function AppHeader({
  title,
  sub,
  showSettings = true,
  showBack = false,
  onBack,
  onMenuClick,
}: AppHeaderProps) {
  const router = useRouter();
  const { logout } = useApp();
  const role = useStore($role);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  return (
    <>
      <div className="bg-primary pt-safe">
        <div className="text-white p-4">
          {/* Top Row: Menu/Back + Brand + Settings */}
          <div className="flex items-center justify-between">
            {/* Left: Menu or Back Button */}
            {showBack ? (
              <Button
                onClick={onBack || (() => router.back())}
                variant="ghost"
                size="icon"
                className={cn(
                  "text-white hover:bg-white/10 min-w-[44px] min-h-[44px]"
                )}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            ) : (
              <Button
                onClick={onMenuClick}
                variant="ghost"
                size="icon"
                className={cn(
                  "text-white hover:bg-white/10 min-w-[44px] min-h-[44px]"
                )}
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}

            {/* Center: Brand */}
            <div
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "ClashGrotesk, sans-serif" }}
            >
              ACTIVADOS
            </div>

            {/* Right: Settings */}
            {showSettings ? (
              <Button
                onClick={handleSettingsClick}
                variant="ghost"
                size="icon"
                className={cn(
                  "text-white hover:bg-white/10 min-w-[44px] min-h-[44px]"
                )}
              >
                <Settings className="w-6 h-6" />
              </Button>
            ) : (
              <div className="w-11 h-11" />
            )}
          </div>

          {/* Title Row */}
          <div className="mt-2">
            <h2 className="text-lg font-bold opacity-80">{title}</h2>
            {sub && <div className="text-sm opacity-60">{sub}</div>}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onLogout={logout}
          role={role}
        />
      )}
    </>
  );
}
