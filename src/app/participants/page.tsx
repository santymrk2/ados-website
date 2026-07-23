"use client";

import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import type { ParticipantBasic } from "@/lib/types";

interface ParticipantWithStats extends ParticipantBasic {
  total: number;
  gf: number;
  gh: number;
  gb: number;
  acts: number;
}

function PlayerCard({
  p,
}: {
  p: ParticipantWithStats;
}) {
  return (
    <div className="bg-white rounded-xl p-3 border border-surface-dark flex items-center gap-3">
      <Avatar p={p} size={40} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">
          {p.nombre} {p.apellido}
        </div>
      </div>
    </div>
  );
}

function PlayersSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-10 w-full rounded-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { db, isLoading } = useApp();
  const { participants } = db;

  const [search, setSearch] = useState("");

  const role = useStore($role);
  const isAdmin = role === "admin";

  const list = useMemo(() => {
    if (!search.trim()) {
      return [...(participants || [])].sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`),
      );
    }
    const q = search.toLowerCase();
    return (participants || [])
      .filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(q))
      .sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`),
      );
  }, [participants, search]);

  if (isLoading) {
    return (
      <>
        <PlayersSkeleton />
      </>
    );
  }

  return (
    <div>
      <div className="px-4 pt-2 pb-1 text-xs font-bold text-text-muted">
        {(participants || []).length} registrados
      </div>

      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-10"
          />
        </div>

        {(participants || []).length === 0 ? (
          <div className="text-center py-8">
            <Empty text="No hay jugadores" />
            {isAdmin && (
              <Button
                onClick={() => router.push("/participants/new")}
                className="mt-4"
                size="lg"
              >
                Agregar primer jugador
              </Button>
            )}
          </div>
        ) : list.length === 0 ? (
          <Empty text="No se encontraron resultados" />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/participants/${p.id}`)}
                className="cursor-pointer"
              >
                <PlayerCard
                  p={p as ParticipantWithStats}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={() => router.push("/participants/new")}
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
          >
            <span className="text-xl font-bold">+</span>
          </Button>
        </div>
      )}
    </div>
  );
}
