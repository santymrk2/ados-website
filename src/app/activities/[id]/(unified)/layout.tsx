"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@nanostores/react";
import { $role } from "@/store/appStore";
import { UnifiedActivityProvider } from "@/lib/activity-context";
import { UnifiedActivityShell } from "./_components/UnifiedActivityShell";
import type { Activity } from "@/lib/types";

export default function UnifiedActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const { db, isLoading, quickUpdate, saveParticipant } = useApp();
  const { isAdmin } = useAuth();
  const role = useStore($role);

  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) setResolvedId(id);
  }, [params?.id]);

  const activity = useMemo<Activity | undefined>(() => {
    if (!resolvedId || !db?.activities?.length) return undefined;
    return db.activities.find((a) => a.id === Number(resolvedId));
  }, [resolvedId, db?.activities]);

  const locked = activity?.locked ?? false;
  const canEditBiblia = role === "admin" || role === "viewer";

  const loading = isLoading || !db || !resolvedId;
  const error = !loading && !activity;

  // Don't render provider if we don't have a valid activity yet
  if (loading || error || !activity) {
    return (
      <UnifiedActivityShell
        resolvedId={resolvedId ?? ""}
        activity={activity}
        isLoading={loading}
        error={error}
      >
        {children}
      </UnifiedActivityShell>
    );
  }

  return (
    <UnifiedActivityProvider
      activity={activity}
      db={db!}
      role={role}
      isAdmin={isAdmin()}
      canEditBiblia={canEditBiblia}
      locked={locked}
      quickUpdate={quickUpdate}
      activityId={activity.id}
      activityVersion={activity.version}
      saveParticipant={saveParticipant}
    >
      <UnifiedActivityShell
        resolvedId={resolvedId ?? ""}
        activity={activity}
        isLoading={false}
        error={false}
      >
        {children}
      </UnifiedActivityShell>
    </UnifiedActivityProvider>
  );
}
