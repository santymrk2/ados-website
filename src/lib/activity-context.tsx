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
import { optimisticUpdateActivity, type OptimisticResult } from "@/lib/optimisticUpdate";
import { toast } from "@/hooks/use-toast";
import { committedBase, inflightKey, runSerialized } from "@/store/appStore";

// Built-in mutations for attendance/socials (backward compat)
function builtInMutate(type: string, data: unknown): ((act: Activity) => Activity) | undefined {
  if (type !== "attendance" && type !== "socials") return undefined;
  return (act: Activity) => {
    const { participantId, value } = data as { participantId: number; value: boolean };
    const key = type === "attendance" ? "asistentes" : "socials";
    const arr = [...((act[key] as number[]) || [])];
    if (value && !arr.includes(participantId)) arr.push(participantId);
    if (!value) {
      const idx = arr.indexOf(participantId);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return { ...act, [key]: arr };
  };
}

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
  /** Fire-and-forget atomic update — sets syncStatus automatically.
   *  Pass optimisticMutate to get instant UI feedback with automatic revert on error.
   *  Pass buildPrev for compare-and-set types (game_pos, teams_bulk, config*): it
   *  receives the base the request applies to, runs when the request is sent
   *  (same-key requests are queued), and its fields are merged into `data`. */
  performQuickUpdate: (
    type: string,
    data: unknown,
    scope?: string,
    optimisticMutate?: (activity: Activity) => Activity,
    buildPrev?: (base: Activity) => Record<string, unknown>,
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

  // ── Centralized toast for conflict / error states ──────────────────────────
  const prevStatusRef = useRef(syncStatus);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = syncStatus;

    // Only toast when state *changes into* conflict or error
    if (prev.state === syncStatus.state) return;
    if (syncStatus.state === "conflict") {
      toast.error("Conflicto de edición", {
        description: "Otra persona modificó este dato. Se actualizó la vista.",
      });
    } else if (syncStatus.state === "error") {
      toast.error("Error al guardar", {
        description: syncStatus.message || "Ocurrió un error inesperado.",
      });
    }
  }, [syncStatus]);

  const performQuickUpdate = useCallback(
    async (
      type: string,
      data: unknown,
      scope?: string,
      optimisticMutate?: (activity: Activity) => Activity,
      buildPrev?: (base: Activity) => Record<string, unknown>,
    ) => {
      if (!activityId) return;

      const mutate = optimisticMutate || builtInMutate(type, data);
      const record = (data ?? {}) as Record<string, unknown>;
      const key = inflightKey(
        activityId,
        type,
        record.participantId ?? record.juegoId ?? record.id ?? record.pid,
      );
      const withPrev = (base: Activity | undefined) =>
        buildPrev && base ? { ...(data as Record<string, unknown>), ...buildPrev(base) } : data;

      setSyncStatus({ state: "saving" });

      // Optimistic path: instant UI feedback with automatic revert on error
      if (mutate) {
        try {
          await optimisticUpdateActivity(
            activityId,
            key,
            mutate,
            (base) => quickUpdate(activityId, type, withPrev(base), activityVersionRef.current, true) as Promise<OptimisticResult>,
            (version) => { activityVersionRef.current = Math.max(activityVersionRef.current ?? 0, version); },
            () => setSyncStatus({ state: "conflict", message: "Otro usuario modificó este dato." }),
          );
          setSyncStatus({ state: "saved" });
          return;
        } catch (error) {
          const message =
            error instanceof VersionConflictError
              ? "Otro usuario modificó este dato. Se actualizó la vista."
              : error instanceof Error && !(error instanceof TypeError)
                ? error.message
                : "Error al guardar";
          setSyncStatus({
            state: error instanceof VersionConflictError ? "conflict" : "error",
            message,
          });
          throw error;
        }
      }

      // Non-optimistic path for all other types
      try {
        // Compare-and-set requests on the same key are queued so each one is
        // built on the previous one's result instead of self-conflicting
        const send = () => quickUpdate(activityId, type, withPrev(committedBase(activityId)), activityVersionRef.current);
        const result = buildPrev ? await runSerialized(key, send) : await send();
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
            ? "Otro usuario modificó este dato. Se actualizó la vista."
            : error instanceof Error && !(error instanceof TypeError)
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
