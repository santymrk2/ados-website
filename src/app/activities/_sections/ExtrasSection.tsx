"use client";

import { useState, useMemo, useCallback } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import type { SectionId } from "@/lib/activity-sections";

import { Plus, Minus, Trash2 } from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Extra, ParticipantBasic } from "@/lib/types";

type ExtraTipo = "extra" | "descuento";

interface AdjustmentItem extends Extra {
  id: number;
  tipo: ExtraTipo;
}

function listKey(tipo: ExtraTipo): "extras" | "descuentos" {
  return tipo === "extra" ? "extras" : "descuentos";
}

function balance(items: AdjustmentItem[]): number {
  return items.reduce((s, x) => s + (x.tipo === "extra" ? x.puntos : -x.puntos), 0);
}

function AdjustmentRow({
  item,
  saving,
  locked,
  onUpdatePoints,
  onUpdateMotivo,
  onDelete,
}: {
  item: AdjustmentItem;
  saving: boolean;
  locked: boolean;
  onUpdatePoints: (v: number) => void;
  onUpdateMotivo: (v: string) => void;
  onDelete: () => void;
}) {
  const [editingPoints, setEditingPoints] = useState(false);
  const [pointsInput, setPointsInput] = useState(String(item.puntos));
  const [editingMotivo, setEditingMotivo] = useState(false);
  const [motivoInput, setMotivoInput] = useState(item.motivo || "");

  const color = item.tipo === "extra" ? "#22C55E" : "#FF6B6B";
  const disabled = locked || saving || item.id < 0;

  const commitMotivo = () => {
    setEditingMotivo(false);
    const v = motivoInput.trim();
    if (v === (item.motivo || "")) return;
    onUpdateMotivo(v);
  };

  const commitPoints = () => {
    setEditingPoints(false);
    const v = parseInt(pointsInput, 10);
    if (isNaN(v) || v < 0) {
      setPointsInput(String(item.puntos));
      return;
    }
    if (v === item.puntos) return;
    onUpdatePoints(v);
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1"
      style={{
        backgroundColor:
          item.tipo === "extra"
            ? "rgba(34, 197, 94, 0.08)"
            : "rgba(255, 107, 107, 0.08)",
      }}
    >
      <span
        className={cn(
          "text-[10px] font-bold uppercase shrink-0 w-7",
          item.tipo === "extra" ? "text-green-600" : "text-red-600",
        )}
      >
        {item.tipo === "extra" ? "Extra" : "Desc"}
      </span>

      {editingMotivo ? (
        <input
          autoFocus
          placeholder="Motivo..."
          value={motivoInput}
          disabled={disabled}
          onChange={(e) => setMotivoInput(e.target.value)}
          onBlur={commitMotivo}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitMotivo();
            if (e.key === "Escape") {
              setMotivoInput(item.motivo || "");
              setEditingMotivo(false);
            }
          }}
          className="h-6 min-w-0 flex-1 bg-white rounded border border-primary outline-none text-[10px] text-foreground placeholder:text-text-muted px-1"
        />
      ) : (
        <span
          className={cn(
            "h-6 min-w-0 flex-1 text-[10px] truncate cursor-pointer hover:bg-white/60 hover:rounded px-0.5 transition-colors self-center leading-6",
            motivoInput ? "text-foreground" : "text-text-muted",
          )}
          onClick={() => {
            if (disabled) return;
            setEditingMotivo(true);
          }}
        >
          {motivoInput || "Motivo..."}
        </span>
      )}

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          disabled={disabled}
          onClick={() => onUpdatePoints(Math.max(0, item.puntos - 1))}
          className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors disabled:opacity-30"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>

        {editingPoints ? (
          <input
            autoFocus
            type="number"
            min="0"
            className="w-8 text-center text-[10px] font-black bg-white rounded border border-primary outline-none p-0 h-5"
            style={{ color }}
            value={pointsInput}
            onChange={(e) => setPointsInput(e.target.value)}
            onBlur={commitPoints}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitPoints();
              if (e.key === "Escape") {
                setPointsInput(String(item.puntos));
                setEditingPoints(false);
              }
            }}
          />
        ) : (
          <span
            className="w-5 text-center text-[10px] font-black cursor-pointer hover:bg-white hover:rounded px-0.5 transition-colors"
            style={{ color }}
            onClick={() => {
              if (disabled) return;
              setPointsInput(String(item.puntos));
              setEditingPoints(true);
            }}
          >
            {item.puntos}
          </span>
        )}

        <button
          disabled={disabled}
          onClick={() => onUpdatePoints(item.puntos + 1)}
          className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-teal-500 transition-colors disabled:opacity-30"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      <button
        onClick={onDelete}
        disabled={locked}
        className="w-5 h-5 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors disabled:opacity-30 shrink-0"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export function ExtrasSection() {
  const {
    activity,
    db,
    locked,
    isAdmin,
    syncStatus,
    editingSection,
    setEditingSection,
    performQuickUpdate,
  } = useUnifiedActivity();

  const isEditing = editingSection === "extras";

  const eligiblePlayers = useMemo(
    () =>
      db.participants.filter((p: ParticipantBasic) => activity.asistentes.includes(p.id)),
    [db.participants, activity.asistentes],
  );

  const activeTeams = useMemo(
    () => TEAMS.slice(0, activity.cantEquipos || 4),
    [activity.cantEquipos],
  );

  const adjustments = useMemo<AdjustmentItem[]>(() => {
    const extras: AdjustmentItem[] = (activity.extras || []).map((e) => ({
      ...e,
      id: e.id!,
      tipo: "extra" as const,
    }));
    const descuentos: AdjustmentItem[] = (activity.descuentos || []).map((e) => ({
      ...e,
      id: e.id!,
      tipo: "descuento" as const,
    }));
    return [...extras, ...descuentos].sort((a, b) => {
      if (a.team && !b.team) return -1;
      if (!a.team && b.team) return 1;
      return (a.id || 0) - (b.id || 0);
    });
  }, [activity.extras, activity.descuentos]);

  const teamItems = useMemo(() => {
    const map: Record<string, AdjustmentItem[]> = {};
    activeTeams.forEach((t) => {
      map[t] = adjustments.filter((x) => x.team === t);
    });
    return map;
  }, [adjustments, activeTeams]);

  const playerItems = useMemo(() => {
    const map: Record<number, AdjustmentItem[]> = {};
    eligiblePlayers.forEach((p) => {
      const items = adjustments.filter((x) => x.pid === p.id);
      if (items.length > 0) map[p.id] = items;
    });
    return map;
  }, [adjustments, eligiblePlayers]);

  const addAdjustment = useCallback(
    async (pid: number | null, team: string | null, tipo: ExtraTipo) => {
      if (locked) return;

      try {
        await performQuickUpdate(
          "extra_add",
          { pid, team, tipo, puntos: 1, motivo: tipo === "extra" ? "Premio" : "Sanción" },
          "extras",
        );
      } catch {
        // Error already handled by performQuickUpdate
      }
    },
    [locked, performQuickUpdate],
  );

  const updateAdjustment = useCallback(
    async (item: AdjustmentItem, patch: Partial<Pick<AdjustmentItem, "puntos" | "motivo">>) => {
      if (locked) return;

      try {
        await performQuickUpdate(
          "extra_update",
          { id: item.id, pid: item.pid, team: item.team, puntos: patch.puntos ?? item.puntos, motivo: patch.motivo ?? item.motivo },
          "extras",
        );
      } catch {
        // Error already handled
      }
    },
    [locked, performQuickUpdate],
  );

  const deleteAdjustment = useCallback(
    async (item: AdjustmentItem) => {
      if (locked) return;

      try {
        await performQuickUpdate("extra_delete", { id: item.id }, "extras");
      } catch {
        // Error already handled
      }
    },
    [locked, performQuickUpdate],
  );

  const startEditing = () => setEditingSection("extras");
  const stopEditing = () => setEditingSection(null);

  const renderEditTeams = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <span className="text-xs font-black uppercase tracking-widest text-primary">
          Equipos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activeTeams.map((t) => {
          const tItems = teamItems[t] || [];
          const total = balance(tItems);

          return (
            <div
              key={t}
              className="rounded-2xl p-4 flex flex-col gap-3 border-2 transition-all relative shadow-sm"
              style={{
                backgroundColor: getTeamBg(t),
                borderColor: TEAM_COLORS[t] + "44",
              }}
            >
              <div className="flex justify-between items-start">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-inner"
                  style={{ backgroundColor: TEAM_COLORS[t] }}
                >
                  {t}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black opacity-60 uppercase">Puntos</div>
                  <div className="text-xl font-black" style={{ color: TEAM_COLORS[t] }}>
                    {total > 0 ? "+" : ""}
                    {total}
                  </div>
                </div>
              </div>

              {tItems.length > 0 && (
                <div className="space-y-1">
                  {tItems.map((item) => (
                    <AdjustmentRow
                      key={item.id}
                      item={item}
                      saving={false}
                      locked={locked}
                      onUpdatePoints={(v) => updateAdjustment(item, { puntos: v })}
                      onUpdateMotivo={(v) => updateAdjustment(item, { motivo: v })}
                      onDelete={() => deleteAdjustment(item)}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => addAdjustment(null, t, "descuento")}
                  size="sm"
                  disabled={locked}
                  className="flex-1 h-9 rounded-xl bg-white/50 hover:bg-white/80 border-none text-red-700 font-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => addAdjustment(null, t, "extra")}
                  size="sm"
                  disabled={locked}
                  className="flex-1 h-9 rounded-xl bg-white/50 hover:bg-white/80 border-none text-primary font-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEditIndividuals = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">
            Individuales
          </span>
        </div>
        <span className="text-[10px] font-bold text-text-muted">
          {eligiblePlayers.length} personas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {eligiblePlayers.map((p) => {
          const pItems = adjustments.filter((x) => x.pid === p.id);
          const total = balance(pItems);

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-3 flex items-start gap-3 border border-surface-dark shadow-sm"
            >
              <Avatar p={p} size={36} className="mt-1" />

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">
                  {p.nombre} {p.apellido}
                </div>
                <div className="text-[10px] font-black text-text-muted uppercase mb-1">
                  Balance:{" "}
                  <span
                    className={cn(
                      total > 0 ? "text-green-600" : total < 0 ? "text-red-600" : "",
                    )}
                  >
                    {total > 0 ? "+" : ""}
                    {total} pts
                  </span>
                </div>

                {pItems.length > 0 && (
                  <div className="space-y-1">
                    {pItems.map((item) => (
                      <AdjustmentRow
                        key={item.id}
                        item={item}
                        saving={false}
                        locked={locked}
                        onUpdatePoints={(v) => updateAdjustment(item, { puntos: v })}
                        onUpdateMotivo={(v) => updateAdjustment(item, { motivo: v })}
                        onDelete={() => deleteAdjustment(item)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <Button
                  onClick={() => addAdjustment(p.id, null, "descuento")}
                  size="icon"
                  variant="ghost"
                  disabled={locked}
                  className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => addAdjustment(p.id, null, "extra")}
                  size="icon"
                  variant="ghost"
                  disabled={locked}
                  className="h-9 w-9 bg-indigo-50 text-primary hover:bg-indigo-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReadTeams = () => (
    <div className="grid grid-cols-2 gap-3">
      {activeTeams.map((t) => {
        const tItems = teamItems[t] || [];
        const total = balance(tItems);

        return (
          <div
            key={t}
            className="rounded-2xl p-4 flex flex-col gap-3 border-2 shadow-sm"
            style={{
              backgroundColor: getTeamBg(t),
              borderColor: TEAM_COLORS[t] + "44",
            }}
          >
            <div className="flex justify-between items-start">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-inner"
                style={{ backgroundColor: TEAM_COLORS[t] }}
              >
                {t}
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black opacity-60 uppercase">Puntos</div>
                <div className="text-xl font-black" style={{ color: TEAM_COLORS[t] }}>
                  {total > 0 ? "+" : ""}
                  {total}
                </div>
              </div>
            </div>
            {tItems.length > 0 ? (
              <div className="space-y-1">
                {tItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px]"
                    style={{
                      backgroundColor:
                        item.tipo === "extra"
                          ? "rgba(34, 197, 94, 0.08)"
                          : "rgba(255, 107, 107, 0.08)",
                    }}
                  >
                    <span
                      className={cn(
                        "font-bold uppercase shrink-0 w-7",
                        item.tipo === "extra" ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {item.tipo === "extra" ? "Extra" : "Desc"}
                    </span>
                    <span className="flex-1 truncate">{item.motivo || "—"}</span>
                    <span
                      className="font-black"
                      style={{
                        color: item.tipo === "extra" ? "#22C55E" : "#FF6B6B",
                      }}
                    >
                      {item.tipo === "extra" ? "+" : "-"}
                      {item.puntos}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] opacity-60 italic">Sin ajustes</p>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderReadIndividuals = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <span className="text-xs font-black uppercase tracking-widest text-primary">
          Individuales
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {eligiblePlayers.length > 0 ? (
          eligiblePlayers.map((p) => {
            const pItems = adjustments.filter((x) => x.pid === p.id);
            const total = balance(pItems);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-surface-dark shadow-sm"
              >
                <Avatar p={p} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">
                    {p.nombre} {p.apellido}
                  </div>
                  {pItems.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pItems.map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            item.tipo === "extra"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700",
                          )}
                        >
                          {item.tipo === "extra" ? "+" : "-"}
                          {item.puntos} {item.motivo || ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "font-black text-sm",
                    total > 0 ? "text-green-600" : total < 0 ? "text-red-600" : "text-text-muted",
                  )}
                >
                  {total > 0 ? "+" : ""}
                  {total}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-white/60 text-center py-4">
            No hay participantes con asistencias
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Extras</h2>
            <div className="flex items-center gap-2">
              {syncStatus.state === "saving" && (
                <span className="text-[10px] text-white/60 animate-pulse">Guardando...</span>
              )}
              {syncStatus.state === "error" && syncStatus.message && (
                <span className="text-[10px] text-red-300">{syncStatus.message}</span>
              )}
              <Button onClick={stopEditing} size="sm" variant="ghost" className="font-black bg-white/20 text-white hover:bg-white/30">
                Listo
              </Button>
            </div>
          </div>
          <div className="space-y-8">
            {renderEditTeams()}
            {renderEditIndividuals()}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Extras</h2>
            {isAdmin && (
              <Button onClick={startEditing} variant="ghost" size="sm" className="bg-white/20 text-white hover:bg-white/30">
                Editar
              </Button>
            )}
          </div>
          <div className="space-y-6">
            {renderReadTeams()}
            {renderReadIndividuals()}
          </div>
        </div>
      )}
    </div>
  );
}
