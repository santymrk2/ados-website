"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { SettingsPanel } from "@/components/auth/SettingsPanel";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  const { db, showSettings, setShowSettings, refresh, logout } = useApp();
  const { participants, activities, rankings } = db;

  // Get role from store
  const role = useStore($role);

  const router = useRouter();

  const [showRanking, setShowRanking] = useState(false);
  const [showTopGoleadores, setShowTopGoleadores] = useState(false);
  const [topGoleadoresGender, setTopGoleadoresGender] = useState("M");

  const handleActivityClick = (activityId: number) => {
    router.push(`/activities/${activityId}`);
  };

  return (
    <>
      <DashboardView
        participants={participants}
        activities={activities}
        rankings={rankings}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showRanking={showRanking}
        setShowRanking={setShowRanking}
        showTopGoleadores={showTopGoleadores}
        setShowTopGoleadores={setShowTopGoleadores}
        topGoleadoresGender={topGoleadoresGender}
        setTopGoleadoresGender={setTopGoleadoresGender}
        onLogout={logout}
        onActivityClick={handleActivityClick}
      />
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={logout}
        role={role}
      />
    </>
  );
}