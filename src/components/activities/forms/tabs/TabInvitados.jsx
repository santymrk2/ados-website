import { toast } from "../../../../hooks/use-toast";
import { Modal, Label, Empty } from "../../../ui/Common";
import { Button } from "../../../ui/button";
import { Combobox } from "../../../ui/combobox";

export function TabInvitados({ act, A, db, onSaveParticipant, locked = false }) {
  const add = () => {
    A("invitaciones", [
      ...(act.invitaciones || []),
      { id: Math.random(), invitador: null, invitado_id: null },
    ]);
    toast.success("Invitación agregada");
  };
  const del = (id) => {
    A(
      "invitaciones",
      (act.invitaciones || []).filter((i) => i.id !== id),
    );
    toast.success("Invitación eliminada");
  };
  const upd = (id, k, v) =>
    A(
      "invitaciones",
      (act.invitaciones || []).map((i) => (i.id === id ? { ...i, [k]: v } : i)),
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label style={{ margin: 0 }}>Invitaciones</Label>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          disabled={locked}
          className="bg-teal-50 text-teal-600"
        >
          + Invitación
        </Button>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        {(act.invitaciones || []).map((inv) => (
          <div
            key={inv.id}
            className="bg-white rounded-xl border border-surface-dark p-3 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3 text-xs font-black text-text-muted">
              <span>INVITACIÓN</span>
              <Button
                onClick={() => del(inv.id)}
                variant="ghost"
                size="icon"
                disabled={locked}
                className="text-red-500 w-5 h-5"
              >
                ✕
              </Button>
            </div>
            <Label>¿Quién invitó?</Label>
            <Combobox
              className="mb-3"
              items={db.participants
                .filter((p) => act.asistentes.includes(p.id))
                .map((p) => ({
                  value: p.id.toString(),
                  label: `${p.nombre} ${p.apellido}`,
                }))}
              value={inv.invitador?.toString() || ""}
              onChange={(val) => upd(inv.id, "invitador", val ? Number(val) : null)}
              disabled={locked}
              placeholder="— Seleccionar —"
            />
            <Label>Invitado</Label>
            <Combobox
              items={db.participants.map((p) => ({
                value: p.id.toString(),
                label: `${p.nombre} ${p.apellido}`,
              }))}
              value={inv.invitado_id?.toString() || ""}
              onChange={(val) => upd(inv.id, "invitado_id", val ? Number(val) : null)}
              disabled={locked}
              placeholder="— Seleccionar —"
            />
          </div>
        ))}
        {(act.invitaciones || []).length === 0 && (
          <Empty text="Sin invitados" />
        )}
      </div>
    </div>
  );
}
