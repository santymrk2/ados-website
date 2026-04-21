"use client";

import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Plus, Zap } from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Modal, Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxValue } from "@/components/ui/combobox";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

export function TabExtras({ act, A, Q, db, locked = false }: { act: any; A: any; Q?: any; db: any; locked?: boolean }) {
  const [view, setView] = useState("ind"); // 'ind' or 'team'
  const [showAdd, setShowAdd] = useState(false);

  const updE = async (id, k, v) => {
    const extras = act.extras || [];
    const item = extras.find((e) => e.id === id);
    if (!item) return;
    
    // Si tiene ID real, actualizar atómicamente
    if (id > 0) {
      try {
        await Q("extra_update", { 
          id, 
          puntos: k === "puntos" ? v : item.puntos,
          motivo: k === "motivo" ? v : item.motivo,
        }, "extras", extras.map(e => e.id === id ? { ...e, [k]: v } : e));
      } catch (e) {
        toast.error("Error al actualizar: " + e.message);
      }
    } else {
      // Solo actualizar estado local para IDs temporales
      A("extras", extras.map((e) => (e.id === id ? { ...e, [k]: v } : e)));
    }
  };

  const updD = async (id, k, v) => {
    const descuentos = act.descuentos || [];
    const item = descuentos.find((d) => d.id === id);
    if (!item) return;
    
    if (id > 0) {
      try {
        await Q("extra_update", { 
          id, 
          tipo: "descuento",
          puntos: k === "puntos" ? v : item.puntos,
          motivo: k === "motivo" ? v : item.motivo,
        }, "descuentos", descuentos.map(d => d.id === id ? { ...d, [k]: v } : d));
      } catch (e) {
        toast.error("Error al actualizar: " + e.message);
      }
    } else {
      A("descuentos", descuentos.map((d) => (d.id === id ? { ...d, [k]: v } : d)));
    }
  };

  const filteredE = (act.extras || []).filter((x) =>
    view === "team" ? !!x.team : !x.team,
  );
  const filteredD = (act.descuentos || []).filter((x) =>
    view === "team" ? !!x.team : !x.team,
  );

  const onAdd = async (type, target, pts, motivo) => {
    const listKey = type === "extra" ? "extras" : "descuentos";
    const tempId = generateTempId();
    const newItem = {
      id: tempId,
      puntos: pts,
      motivo: motivo,
      pid: view === "ind" ? target.id : undefined,
      team: view === "team" ? target : undefined,
    };
    
    // Agregar al estado local inmediatamente
    A(listKey, [...(act[listKey] || []), newItem]);
    setShowAdd(false);
    toast.success(`${type === "extra" ? "Puntos extra" : "Sanción"} aplicada`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
        <div className="flex-1">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ind">Individual</SelectItem>
              <SelectItem value="team">Equipos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          size="lg"
          disabled={locked}
          className="bg-accent text-black font-black gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Agregar Puntos
        </Button>
      </div>

      <div className="space-y-6">
        {filteredE.length > 0 && (
          <div>
            <Label style={{ color: "#22C55E" }}>Extras (+)</Label>
            <div className="flex flex-col gap-2">
              {filteredE.map((e) => (
                <ExtraRow
                  key={e.id}
                  item={e}
                  color="#22C55E"
                  onDel={(id) =>
                    A(
                      "extras",
                      act.extras.filter((x) => x.id !== id),
                    )
                  }
                  db={db}
                  isTeam={view === "team"}
                  locked={locked}
                />
              ))}
            </div>
          </div>
        )}

        {filteredD.length > 0 && (
          <div>
            <Label style={{ color: "#FF6B6B" }}>Descuentos (-)</Label>
            <div className="flex flex-col gap-2">
              {filteredD.map((d) => (
                <ExtraRow
                  key={d.id}
                  item={d}
                  color="#FF6B6B"
                  onDel={(id) =>
                    A(
                      "descuentos",
                      act.descuentos.filter((x) => x.id !== id),
                    )
                  }
                  db={db}
                  isTeam={view === "team"}
                  locked={locked}
                />
              ))}
            </div>
          </div>
        )}

        {filteredE.length === 0 && filteredD.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-surface-dark/50 rounded-3xl border-2 border-dashed border-surface-dark">
            <Zap className="w-8 h-8 text-text-muted opacity-20 mb-2" />
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
              No hay extras ni descuentos
              <br />
              {view === "team" ? "por equipo" : "individuales"}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <ExtraAddModal
          view={view}
          db={db}
          act={act}
          onClose={() => setShowAdd(false)}
          onAdd={onAdd}
        />
      )}
    </div>
  );
}

function ExtraAddModal({ view, db, act, onClose, onAdd }) {
  const [motivo, setMotivo] = useState("");
  const [selected, setSelected] = useState(null);

  const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);

  const availablePlayers = useMemo(() => {
    return db.participants
      .filter(
        (p) =>
          act.asistentes.includes(p.id) && !(act.socials || []).includes(p.id),
      )
      .map((p) => ({
        value: p.id.toString(),
        label: `${p.nombre} ${p.apellido}`,
      }));
  }, [db.participants, act.asistentes, act.socials]);

  // Función para obtener el label a partir del value (ID)
  const getParticipantLabel = (id) => {
    if (!id) return "";
    const p = db.participants.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : "";
  };

  return (
    <Modal
      title={`${view === "ind" ? "Sanción/Premio Individual" : "Puntos por Equipo"}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {view === "ind" ? (
          <div>
            <Label>1. Buscar Persona</Label>
            <div className="mb-3">
              <Combobox
                value={selected?.id?.toString() || ""}
                onValueChange={(val) => {
                  if (val) {
                    const p = db.participants.find((p) => p.id === Number(val));
                    setSelected(p);
                  } else {
                    setSelected(null);
                  }
                }}
                items={availablePlayers}
                disabled={locked}
              >
                <ComboboxInput placeholder="Seleccionar jugador..." />
                <ComboboxValue>
                  {({ value }) => value ? getParticipantLabel(Number(value)) : "Seleccionar jugador..."}
                </ComboboxValue>
                <ComboboxContent>
                  <ComboboxList>
                    {availablePlayers.map((p) => (
                      <ComboboxItem key={p.value} value={p.value}>
                        {p.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        ) : (
          <div>
            <Label>1. Seleccionar Equipo</Label>
            <div className="grid grid-cols-3 gap-3 p-1">
              {activeTeams.map((t) => (
                <Button
                  key={t}
                  onClick={() => setSelected(t)}
                  variant={selected === t ? "default" : "outline"}
                  className={cn(
                    "h-16 rounded-2xl font-black text-xl transition-all shadow-sm",
                    selected === t && "scale-95",
                  )}
                  style={{
                    color: selected === t ? "white" : TEAM_COLORS[t],
                    backgroundColor:
                      selected === t ? TEAM_COLORS[t] : getTeamBg(t),
                  }}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>2. Motivo (Opcional)</Label>
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="¿Por qué los puntos?"
          />
        </div>

        {selected && (
          <div className="mt-2 animate-in fade-in slide-in-from-bottom-2">
            <Label>3. Elegir Puntos</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-black text-red-500 uppercase text-center">
                  Descontar
                </div>
                {[2, 5, 10].map((v) => (
                  <Button
                    key={v}
                    onClick={() => onAdd("descuento", selected, v, motivo)}
                    variant="destructive"
                    size="lg"
                    className="py-3 rounded-xl font-black text-lg"
                  >
                    -{v}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-black text-green-600 uppercase text-center">
                  Sumar
                </div>
                {[2, 5, 10].map((v) => (
                  <Button
                    key={v}
                    onClick={() => onAdd("extra", selected, v, motivo)}
                    variant="secondary"
                    size="lg"
                    className="py-3 rounded-xl font-black text-lg bg-green-100 text-green-600 hover:bg-green-500 hover:text-white"
                  >
                    +{v}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ExtraRow({ item, color, onDel, db, isTeam, locked = false }) {
  const p = !isTeam ? db.participants.find((p) => p.id === item.pid) : null;

  return (
    <div
      className="bg-white rounded-xl p-3 border shadow-sm"
      style={{ borderColor: color + "33" }}
    >
      <div className="flex gap-2 items-center">
        <div
          className="bg-surface-dark px-2 py-1 rounded-lg font-black text-xs"
          style={{ color }}
        >
          {item.puntos}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">
            {isTeam ? (
              <span style={{ color: TEAM_COLORS[item.team] }}>{item.team}</span>
            ) : p ? (
              `${p.nombre} ${p.apellido}`
            ) : (
              "Desconocido"
            )}
          </div>
          {item.motivo && (
            <div className="text-[10px] text-text-muted truncate italic">
              {item.motivo}
            </div>
          )}
        </div>
        <Button
          onClick={() => onDel(item.id)}
          variant="destructive"
          size="icon"
          disabled={locked}
          className="w-8 h-8"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
