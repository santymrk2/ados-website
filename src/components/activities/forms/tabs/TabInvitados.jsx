import { toast } from "../../../../hooks/use-toast";
import { Modal, Label, Empty } from "../../../ui/Common";
import { Button } from "../../../ui/button";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "../../../ui/combobox";

export function TabInvitados({ act, A, Q, db, onSaveParticipant, locked = false }) {
  const add = async () => {
    // Crear invitación vacía temporalmente en UI
    const tempId = Math.random();
    A("invitaciones", [
      ...(act.invitaciones || []),
      { id: tempId, invitador: null, invitado_id: null },
    ]);
    toast.success("Invitación agregada");
  };

  const del = async (id) => {
    // Si es un ID temporal (negativo), solo borrar del estado local
    if (id < 0) {
      A(
        "invitaciones",
        (act.invitaciones || []).filter((i) => i.id !== id),
      );
      toast.success("Invitación eliminada");
      return;
    }

    // Si es un ID real, hacer operación atómica
    try {
      await Q("invitacion_delete", { id });
      A(
        "invitaciones",
        (act.invitaciones || []).filter((i) => i.id !== id),
      );
      toast.success("Invitación eliminada");
    } catch (e) {
      toast.error("Error al eliminar invitación: " + e.message);
    }
  };

  const upd = async (id, k, v) => {
    const inv = (act.invitaciones || []).find((i) => i.id === id);
    if (!inv) return;

    // Si es ID temporal y estamos actualizando el invitado, crear en DB
    if (id < 0 && k === "invitado_id" && v) {
      try {
        const result = await Q("invitacion_add", {
          invitador: inv.invitador,
          invitado_id: v,
        });
        // Reemplazar el temporal por el real
        A(
          "invitaciones",
          (act.invitaciones || []).map((i) =>
            i.id === id ? { ...i, id: result.id, [k]: v } : i
          ),
        );
        toast.success("Invitación guardada");
      } catch (e) {
        toast.error("Error al guardar invitación: " + e.message);
      }
      return;
    }

    // Si ya existe en DB, actualizar atómicamente
    if (id > 0) {
      try {
        await Q("invitacion_update", {
          id,
          invitador: k === "invitador" ? v : inv.invitador,
          invitado_id: k === "invitado_id" ? v : inv.invitado_id,
        });
        A(
          "invitaciones",
          (act.invitaciones || []).map((i) => (i.id === id ? { ...i, [k]: v } : i)),
        );
      } catch (e) {
        toast.error("Error al actualizar invitación: " + e.message);
      }
      return;
    }

    // Solo actualizar estado local para IDs temporales sinDB aún
    A(
      "invitaciones",
      (act.invitaciones || []).map((i) => (i.id === id ? { ...i, [k]: v } : i)),
    );
  };

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
              onValueChange={(val) => upd(inv.id, "invitador", val ? Number(val) : null)}
              disabled={locked}
            >
              <ComboboxInput placeholder="— Seleccionar —" showTrigger={true} />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Label>Invitado</Label>
            <Combobox
              items={db.participants.map((p) => ({
                value: p.id.toString(),
                label: `${p.nombre} ${p.apellido}`,
              }))}
              value={inv.invitado_id?.toString() || ""}
              onValueChange={(val) => upd(inv.id, "invitado_id", val ? Number(val) : null)}
              disabled={locked}
            >
              <ComboboxInput placeholder="— Seleccionar —" showTrigger={true} />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        ))}
        {(act.invitaciones || []).length === 0 && (
          <Empty text="Sin invitados" />
        )}
      </div>
    </div>
  );
}