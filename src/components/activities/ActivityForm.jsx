"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "../../hooks/use-toast";
import {
  FileText,
  Users,
  LayoutGrid,
  Gamepad2,
  Award,
  Mail,
  Plus,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Search,
  ArrowUpDown,
  X,
  List,
  Coffee,
  Lock,
} from "lucide-react";
import {
  newAct,
  newPart,
  TEAMS,
  getEdad,
  TEAM_COLORS,
  getTeamBg,
  PTS,
  DEPORTES,
} from "@/lib/constants";
import { Modal, Label, Empty, SegmentedButtons, PillCheck } from "../ui/Common";
import { SexBadge, Chip } from "../ui/Badges";
import { Avatar } from "../ui/Avatar";
import { HelpInfo } from "../ui/HelpInfo";
import { TeamTable } from "../ui/TeamTable";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent } from "../ui/tabs";
import { FloatingNav } from "../ui/FloatingNav";
import { cn, formatDate } from "@/lib/utils";
import { confirmDialog } from "@/lib/confirm";
import { TabInfo } from "./forms/tabs/TabInfo";
import { TabAsistencia } from "./forms/tabs/TabAsistencia";
import { TabEquipos } from "./forms/tabs/TabEquipos";
import { TabJuegos } from "./forms/tabs/TabJuegos";
import { TabDeportes } from "./forms/tabs/TabDeportes";
import { TabInvitados } from "./forms/tabs/TabInvitados";
import { TabGoles } from "./forms/tabs/TabGoles";
import { TabExtras } from "./forms/tabs/TabExtras";

// Generar ID único que no sea Date.now()
let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++; // Números negativos garantizan uniqueness

export function ActivityFormModal({
  db,
  initial,
  onClose,
  onSave,
  onQuickUpdate,
  onSaveParticipant,
  initialTab = "info",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [act, setAct] = useState({ ...newAct(), ...initial });
  
  // Get tab from URL params
  const urlTab = searchParams.get("tab") || initialTab;
  const [tab, setTab] = useState(urlTab);
  
  // Sync tab when URL changes
  useEffect(() => {
    const newTab = searchParams.get("tab") || initialTab;
    if (newTab !== tab) {
      setTab(newTab);
    }
  }, [searchParams, initialTab]);
  
  const handleTabChange = (item) => {
    if (item.href) {
      router.push(item.href);
    }
    setTab(item.value);
  };
  
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimerRef = useRef(null);
  const isFirstRender = useRef(true);
  const actRef = useRef(act);
  actRef.current = act;
  const skipNextAutoSave = useRef(false);
  const [savingOps, setSavingOps] = useState(new Set());

  const A = (k, v) => setAct((a) => ({ ...a, [k]: v }));

  const Q = async (type, data, k, v, onSuccess) => {
    // Generar clave única para trackear esta operación
    const opId = data.juegoId || data.id || data.participantId || data.pid || '';
    const opKey = `${type}:${opId}`;

    // Marcar para que el auto-save no dispare un POST redundante
    skipNextAutoSave.current = true;
    setSavingOps((prev) => new Set([...prev, opKey]));
    
    // Actualizar estado local inmediatamente
    if (typeof v === 'function') {
      setAct(v);
    } else {
      setAct((a) => ({ ...a, [k]: v }));
    }

    if (act.id) {
      try {
        const skipRefresh = type === "game_pos" || type === "game_add" || type === "game_delete";
        const result = await onQuickUpdate(act.id, type, data, skipRefresh);
        
        // No mostrar toast de "configuración" cuando es lock/unlock - TabInfo ya lo maneja
        if (type === "config" && (data.k === "locked")) {
          return result;
        }
        
        // Ejecutar callback de éxito si existe (el componente maneja su propio toast)
        if (onSuccess) {
          onSuccess(result);
          return result;
        }
        
        // Mensaje descriptivo según el tipo de cambio
        const actionMessages = {
          config: "Configuración actualizada",
          participant: "Asistencia actualizada",
          team: "Equipos actualizados",
          game_pos: "Posiciones de juego actualizadas",
          game_add: "Juego agregado",
          game_delete: "Juego eliminado",
          game_result: "Resultado guardado",
          goals: "Goles actualizados",
          extra: "Dato extra actualizado",
          invite: "Invitado actualizado",
        };
        const message = actionMessages[type] || "Cambios guardados";
        toast.success(message);
        return result;
      } catch (e) {
        const actionMessages = {
          config: "Error al guardar configuración",
          participant: "Error al guardar asistencia",
          team: "Error al guardar equipos",
          game_pos: "Error al guardar posiciones",
          game_add: "Error al agregar juego",
          game_delete: "Error al eliminar juego",
          game_result: "Error al guardar resultado",
          goals: "Error al guardar goles",
          extra: "Error al guardar dato extra",
          invite: "Error al guardar invitado",
        };
        const message = actionMessages[type] || "Error al guardar cambios";
        toast.error(message);
        console.error("QuickUpdate error:", e);
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

  const TABS = (id) => [
    { value: "info", label: "General", icon: FileText, href: `/activities/${id}/edit/info` },
    { value: "asistencia", label: "Asistencia", icon: Users, href: `/activities/${id}/edit/asistencia` },
    { value: "equipos", label: "Equipos", icon: LayoutGrid, href: `/activities/${id}/edit/equipos` },
    { value: "juegos", label: "Juegos", icon: Gamepad2, href: `/activities/${id}/edit/juegos` },
    { value: "invitados", label: "Invitados", icon: Mail, href: `/activities/${id}/edit/invitados` },
    { value: "goles", label: "Goles", icon: Trophy, href: `/activities/${id}/edit/goles` },
    { value: "extras", label: "Extras", icon: Plus, href: `/activities/${id}/edit/extras` },
  ];

  const doSave = useCallback(
    async (currentAct) => {
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
        toast.error("Error al guardar: " + e.message);
        if (e.message.startsWith('VERSION_CONFLICT:')) {
          const serverVersion = e.message.split(':')[1];
          toast.error(`⚠️ Alguien más modificó esta actividad (v${serverVersion}). Recargá la página y volvé a intentar.`);
        } else {
          toast.error("Error al guardar: " + e.message);
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

    // Si el cambio fue hecho via Q() (PATCH), no disparar auto-save POST
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
    // ✓ Solo sincronizar si initial cambió DESDE EL SERVIDOR
    // y no estamos editando/guardando
    if (!initial || !initial.id) return;
    if (saveStatus !== "saved") return; // No sincronizar mientras se guarda

    // Comparar para detectar cambios del servidor
    const initialStr = JSON.stringify(initial);
    const actStr = JSON.stringify(act);

    if (initialStr === actStr) {
      // Están en sync, no hacer nada
      return;
    }

    // Si initial cambió en el servidor, mostrar notificación en lugar de sobrescribir
    // Por ahora: ignorar actualizaciones del servidor si hay cambios locales
    // toast.info('La actividad fue actualizada en otro dispositivo');
  }, [initial, saveStatus]);

  const statusIndicator = {
    saved: { color: "text-accent", label: "Guardado" },
    saving: { color: "text-yellow-500", label: "Guardando..." },
    error: { color: "text-red-500", label: "Error al guardar" },
  }[saveStatus];

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
        <Tabs value={tab} onValueChange={setTab} className="w-full max-w-5xl mx-auto">
          <TabsContent value="info" className="outline-none">
            <div className="p-4 md:p-6 lg:p-8">
              <TabInfo act={act} A={A} Q={Q} locked={!!act.locked} savingOps={savingOps} />
            </div>
          </TabsContent>

          <TabsContent value="asistencia" className="outline-none">
            <TabAsistencia
              act={act}
              A={A}
              Q={Q}
              db={db}
              onSaveParticipant={onSaveParticipant}
              locked={!!act.locked}
              savingOps={savingOps}
            />
          </TabsContent>

          <TabsContent value="equipos" className="outline-none">
            <TabEquipos act={act} A={A} Q={Q} db={db} locked={!!act.locked} savingOps={savingOps} />
          </TabsContent>

          <TabsContent value="juegos" className="outline-none">
            <TabJuegos act={act} A={A} Q={Q} locked={!!act.locked} savingOps={savingOps} />
          </TabsContent>

          <TabsContent value="invitados" className="outline-none">
            <TabInvitados
              act={act}
              A={A}
              Q={Q}
              db={db}
              onSaveParticipant={onSaveParticipant}
              locked={!!act.locked}
            />
          </TabsContent>

          <TabsContent value="goles" className="outline-none">
            <TabGoles act={act} A={A} Q={Q} db={db} locked={!!act.locked} savingOps={savingOps} />
          </TabsContent>

          <TabsContent value="extras" className="outline-none">
            <TabExtras act={act} A={A} db={db} locked={!!act.locked} />
          </TabsContent>
        </Tabs>
      </div>

      <FloatingNav 
        value={tab} 
        items={TABS(act?.id || 'new')}
        lockedValues={act.locked ? TABS(act?.id || 'new').slice(1).map(t => t.value) : []}
      />
    </div>
  );
}
