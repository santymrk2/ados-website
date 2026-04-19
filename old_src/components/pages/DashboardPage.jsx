import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { navigate } from 'astro:transitions/client';
import { useApp } from '../../hooks/useApp';
import { $role } from '../../store/appStore';
import { SettingsPanel } from '../auth/SettingsPanel';
import { DashboardView } from '../dashboard/DashboardView';

export default function DashboardPage() {
  const { db, showSettings, setShowSettings, refresh, logout } = useApp();
  const { participants, activities, rankings } = db;
  
  // Get role from store
  const role = useStore($role);
  
  const [showRanking, setShowRanking] = useState(false);
  const [showTopGoleadores, setShowTopGoleadores] = useState(false);
  const [topGoleadoresGender, setTopGoleadoresGender] = useState('M');

  const handleActivityClick = (activityId) => {
    navigate(`/activities/${activityId}`);
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
