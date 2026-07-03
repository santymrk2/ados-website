"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Activity, DBData, Participant } from "@/lib/types";
import type { SectionId } from "@/lib/activity-sections";
import type { SyncStatus } from "@/lib/sync-status";
import { initialSyncStatus } from "@/lib/sync-status";
import { VersionConflictError } from "@/lib/errors";

// ── Context shape ────────────────────────────────────────────────────────────

export interface UnifiedActivityContextValue {
  activity: Activity;
  db: DBData;
  role: string;
  isAdmin: boolean;
  canEditBiblia: boolean;
  locked: boolean;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterContent: ReactNode;
  setFilterContent: (content: ReactNode) => void;
  filtersActive: boolean;
  setFiltersActive: (active: boolean) => void;
  currentSection: SectionId;
  setCurrentSection: (id: SectionId) => void;
  /** Is any section currently in edit mode? */
  editingSection: SectionId | null;
  setEditingSection: (id: SectionId | null) => void;
  /** Fire-and-forget atomic update — sets syncStatus automatically */
  performQuickUpdate: (
    type: string,
    data: unknown,
    scope?: string,
  ) => Promise<unknown>;
}

const UnifiedActivityContext = createContext<UnifiedActivityContextValue | null>(
  null,
);

export function useUnifiedActivity(): UnifiedActivityContextValue {
  const ctx = useContext(UnifiedActivityContext);
  if (!ctx) {
    throw new Error(
      "useUnifiedActivity must be used within UnifiedActivityProvider",
    );
  }
  return ctx;
}

// ── Provider props ───────────────────────────────────────────────────────────

interface UnifiedActivityProviderProps {
  activity: Activity;
  db: DBData;
  role: string;
  isAdmin: boolean;
  canEditBiblia: boolean;
  locked: boolean;
  quickUpdate: (
    activityId: number,
    type: string,
    data: unknown,
    version?: number,
    skipRefresh?: boolean,
  ) => Promise<unknown>;
  activityId: number;
  activityVersion?: number;
  saveParticipant: (
    participant: Participant,
    isNew: boolean,
    invitadorId?: number | null,
  ) => Promise<number>;
  children: ReactNode;
}

// ── Provider component ───────────────────────────────────────────────────────

export function UnifiedActivityProvider({
  activity,
  db,
  role,
  isAdmin,
  canEditBiblia,
  locked,
  quickUpdate,
  activityId,
  activityVersion,
  children,
}: UnifiedActivityProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(initialSyncStatus());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterContent, setFilterContent] = useState<ReactNode>(null);
  const [filtersActive, setFiltersActive] = useState(false);
  const [currentSection, setCurrentSection] = useState<SectionId>("asistencia");
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);
  const activityVersionRef = useRef(activityVersion ?? activity.version);

  useEffect(() => {
    activityVersionRef.current = activityVersion ?? activity.version;
  }, [activityVersion, activity.version]);

  const performQuickUpdate = useCallback(
    async (type: string, data: unknown, scope?: string) => {
      if (!activityId) return;
      setSyncStatus({ state: "saving" });
      try {
        const result = await quickUpdate(activityId, type, data, activityVersionRef.current);
        if (
          result &&
          typeof result === "object" &&
          "version" in result &&
          typeof (result as { version?: unknown }).version === "number"
        ) {
          activityVersionRef.current = (result as { version: number }).version;
        }
        setSyncStatus({ state: "saved" });
        return result;
      } catch (error) {
        const message =
          error instanceof VersionConflictError
            ? "Otro usuario modificó esta actividad. Recargá la página."
            : error instanceof Error
              ? error.message
              : "Error al guardar";
        setSyncStatus({
          state: error instanceof VersionConflictError ? "conflict" : "error",
          message,
          errors: scope
            ? [{ scope, message, retryable: true, timestamp: Date.now() }]
            : undefined,
        });
        throw error;
      }
    },
    [activityId, quickUpdate],
  );

  const value = useMemo<UnifiedActivityContextValue>(
    () => ({
      activity,
      db,
      role,
      isAdmin,
      canEditBiblia,
      locked,
      syncStatus,
      setSyncStatus,
      searchQuery,
      setSearchQuery,
      filterContent,
      setFilterContent,
      filtersActive,
      setFiltersActive,
      currentSection,
      setCurrentSection,
      editingSection,
      setEditingSection,
      performQuickUpdate,
    }),
    [
      activity,
      db,
      role,
      isAdmin,
      canEditBiblia,
      locked,
      syncStatus,
      searchQuery,
      filterContent,
      filtersActive,
      currentSection,
      editingSection,
      performQuickUpdate,
    ],
  );

  return (
    <UnifiedActivityContext.Provider value={value}>
      {children}
    </UnifiedActivityContext.Provider>
  );
}
