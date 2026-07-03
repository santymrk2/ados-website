"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@nanostores/react";
import {
  Users,
  Gamepad2,
  Trophy,
  Plus,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";
import { PageHeader, Empty } from "@/components/ui/Common";
import { Chip } from "@/components/ui/Badges";
import { Button } from "@/components/ui/button";
import { NewActivityModal } from "./_components/NewActivityModal";
import { formatDate, cn } from "@/lib/utils";
import { $role } from "@/store/appStore";
import { useApp } from "@/hooks/useApp";
import type { Activity, Gol } from "@/lib/types";

export default function ActivitiesPage() {
  const router = useRouter();
  const { db } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const [newActivityOpen, setNewActivityOpen] = useState(false);

  const sorted = [...db.activities].sort((a, b) =>
    b.fecha.localeCompare(a.fecha),
  );

  const handleView = (activity: Activity) => {
    router.push(`/activities/${activity.id}`);
  };

  const handleNew = () => {
    setNewActivityOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Actividades"
        sub={`${db.activities.length} registradas`}
      />
      <div className="p-4">
        {isAdmin && (
          <Button onClick={handleNew} className="w-full mb-4" size="lg">
            <Plus className="w-5 h-5" />
            Agregar Actividad
          </Button>
        )}
        {sorted.length === 0 ? (
          <Empty text="No hay actividades todavía" />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((a: Activity) => (
              <div
                key={a.id}
                onClick={() => handleView(a)}
                className="bg-surface rounded-2xl border border-surface-dark overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-black text-base leading-tight">
                        {a.titulo || "Sin título"}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full p-1",
                          a.locked
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {a.locked ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {formatDate(a.fecha)}
                    </div>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between gap-3 border-t border-surface-dark">
                  <div className="flex gap-2 flex-wrap">
                    <Chip icon={Users} val={a.asistentes.length} label="asist." />
                    <Chip icon={Gamepad2} val={a.juegos.length} label="juegos" />
                    <Chip
                      icon={Trophy}
                      val={(a.goles || []).reduce(
                        (s: number, g: Gol) => s + g.cant,
                        0,
                      )}
                      label="goles"
                    />
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                    <Eye className="w-4 h-4" />
                    Abrir
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewActivityModal open={newActivityOpen} onOpenChange={setNewActivityOpen} />
    </div>
  );
}
