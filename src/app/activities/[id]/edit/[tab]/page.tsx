"use client";

import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { newAct } from "@/lib/constants";

import {
  FileText,
  Users,
  LayoutGrid,
  Gamepad2,
  Mail,
  Plus,
  Trophy,
  ChevronLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TabInfo } from "@/app/activities/[id]/edit/tabs/TabInfo";
import { TabAsistencia } from "@/app/activities/[id]/edit/tabs/TabAsistencia";
import { TabEquipos } from "@/app/activities/[id]/edit/tabs/TabEquipos";
import { TabJuegos } from "@/app/activities/[id]/edit/tabs/TabJuegos";
import { TabDeportes } from "@/app/activities/[id]/edit/tabs/TabDeportes";
import { TabInvitados } from "@/app/activities/[id]/edit/tabs/TabInvitados";
import { TabGoles } from "@/app/activities/[id]/edit/tabs/TabGoles";
import { TabExtras } from "@/app/activities/[id]/edit/tabs/TabExtras";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; tab: string }>;
}) {
  const { id, tab } = await params;
  return <ActivityFormWrapper mode="edit" id={id} initialTab={tab} />;
}

function ActivityFormWrapper({
  mode = "edit",
  id,
  initialTab = "info",
}: {
  mode?: "new" | "edit";
  id?: string;
  initialTab?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    db,
    saveActivity,
    quickUpdate,
    saveParticipant,
    isLoading: dbLoading,
  } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const activity = useMemo(() => {
    if (mode !== "edit" || !id || !db?.activities?.length) return null;
    return db.activities.find((a) => a.id === Number(id)) || null;
  }, [mode, id, db?.activities]);

  useEffect(() => {
    if (!isAdmin && mode === "edit") {
      router.push(`/activities/${id}`);
    }
  }, [isAdmin, mode, id, router]);

  const urlTab = searchParams.get("tab") || initialTab;

  if (dbLoading || !db || !db.activities) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && mode === "edit") {
    return null;
  }

  if (mode === "edit" && !activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <ActivityFormContent
      db={db}
      initial={activity}
      mode={mode}
      id={id}
      urlTab={urlTab}
      onClose={() => {
        if (mode === "edit" && id) {
          router.push(`/activities/${id}/view/info`);
        } else {
          router.push("/activities");
        }
      }}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
    />
  );
}

function ActivityFormContent({
  db,
  initial,
  mode,
  id,
  urlTab,
  onClose,
  onSave,
  onQuickUpdate,
  onSaveParticipant,
}: {
  db: any;
  initial: any;
  mode: "new" | "edit";
  id?: string;
  urlTab: string;
  onClose: () => void;
  onSave: any;
  onQuickUpdate: any;
  onSaveParticipant: any;
}) {
  const [act, setAct] = useState({ ...newAct(), ...initial });
  const [tab, setTab] = useState(urlTab);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const actRef = useRef(act);
  actRef.current = act;
  const skipNextAutoSave = useRef(false);
  const [savingOps, setSavingOps] = useState(new Set());

  const A = (k: string, v: any) => setAct((a) => ({ ...a, [k]: v }));

  const Q = async (type: string, data: any, k: string, v: any) => {
    const opId =
      data.juegoId || data.id || data.participantId || data.pid || "";
    const opKey = `${type}:${opId}`;

    skipNextAutoSave.current = true;
    setSavingOps((prev) => new Set([...prev, opKey]));
    setAct((a) => ({ ...a, [k]: v }));

    if (act.id) {
      try {
        const skipRefresh =
          type === "game_pos" || type === "game_add" || type === "game_delete";
        const result = await onQuickUpdate(act.id, type, data, skipRefresh);
        toast.success("Cambios sincronizados");
        return result;
      } catch (e) {
        const err = e as Error;
        toast.error("Error al sincronizar: " + err.message);
      } finally {
        setSavingOps((prev) => {
          const next = new Set(prev);
          next.delete(opKey);
          return next;
        });
      }
    } else {
      setSavingOps((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  };

  const TABS = [
    { value: "info", label: "General", icon: FileText },
    { value: "asistencia", label: "Asistencia", icon: Users },
    { value: "equipos", label: "Equipos", icon: LayoutGrid },
    { value: "juegos", label: "Juegos", icon: Gamepad2 },
    { value: "invitados", label: "Invitados", icon: Mail },
    { value: "goles", label: "Goles", icon: Trophy },
    { value: "extras", label: "Extras", icon: Plus },
  ];

  const doSave = useCallback(
    async (currentAct: any) => {
      if (!currentAct.fecha) return;
      setSaveStatus("saving");
      try {
        const isNew = !currentAct.id;
        const saved = isNew ? { ...currentAct, id: db.nextAid } : currentAct;
        const realId = await onSave(saved, isNew);
        if (isNew && realId) {
          setAct((prev) => ({ ...prev, id: realId }));
        }
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("error");
        const err = e as Error;
        if (err.message.startsWith("VERSION_CONFLICT:")) {
          const serverVersion = err.message.split(":")[1];
          toast.error(
            `⚠️ Alguien más modificó esta actividad (v${serverVersion}). Recargá la página y volvé a intentar.`,
          );
        } else {
          toast.error("Error al guardar: " + err.message);
        }
      }
    },
    [db.nextAid, onSave],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      setSaveStatus("saved");
      return;
    }

    if (!act.id) {
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doSave(actRef.current), 800);
    } else {
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doSave(actRef.current), 3000);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [act, doSave]);

  useEffect(() => {
    if (!initial || !initial.id) return;
    if (saveStatus !== "saved") return;

    const initialStr = JSON.stringify(initial);
    const actStr = JSON.stringify(act);

    if (initialStr === actStr) {
      return;
    }
  }, [initial, saveStatus]);

  const statusIndicator = {
    saved: { color: "text-accent", label: "Guardado" },
    saving: { color: "text-yellow-500", label: "Guardando..." },
    error: { color: "text-red-500", label: "Error al guardar" },
  }[saveStatus] ?? { color: "", label: "" };

  return (
    <div className="fixed inset-0 bg-primary z-50 flex flex-col overflow-hidden">
      <div className="pt-safe sticky top-0 z-10">
        <div className="text-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="bg-white/20 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">
                {act.id ? "Editar" : "Nueva"} Actividad
              </div>
              <div className="text-xs opacity-70">
                {act.titulo || "Sin título"} · {formatDate(act.fecha)}
              </div>
            </div>
            <span
              className={`text-xs font-bold ${saveStatus === "saved" ? "text-accent" : saveStatus === "saving" ? "text-yellow-300" : "text-red-300"}`}
            >
              {statusIndicator.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="w-full">
          <div className="p-4">
            {tab === "info" && (
              <TabInfo
                act={act}
                A={A}
                Q={Q}
                locked={!!act.locked}
                savingOps={savingOps}
              />
            )}

            {tab === "asistencia" && (
              <TabAsistencia
                act={act}
                A={A}
                Q={Q}
                db={db}
                onSaveParticipant={onSaveParticipant}
                locked={!!act.locked}
                savingOps={savingOps}
              />
            )}

            {tab === "equipos" && (
              <TabEquipos
                act={act}
                A={A}
                Q={Q}
                db={db}
                locked={!!act.locked}
                savingOps={savingOps}
              />
            )}

            {tab === "juegos" && (
              <TabJuegos
                act={act}
                A={A}
                Q={Q}
                locked={!!act.locked}
                savingOps={savingOps}
              />
            )}

            {tab === "invitados" && (
              <TabInvitados
                act={act}
                A={A}
                db={db}
                onSaveParticipant={onSaveParticipant}
                locked={!!act.locked}
              />
            )}

            {tab === "goles" && (
              <TabGoles
                act={act}
                A={A}
                Q={Q}
                db={db}
                locked={!!act.locked}
                savingOps={savingOps}
              />
            )}

            {tab === "extras" && (
              <TabExtras act={act} A={A} db={db} locked={!!act.locked} />
            )}
          </div>
        </div>
      </div>

      <FloatingNav
        value={tab}
        onValueChange={setTab}
        items={TABS}
        lockedValues={act.locked ? TABS.slice(1).map((t) => t.value) : []}
      />
    </div>
  );
}
