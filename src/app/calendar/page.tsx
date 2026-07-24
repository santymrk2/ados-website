"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { ParticipantBasic } from "@/lib/types";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getAge(fechaNacimiento: string | null | undefined) {
  if (!fechaNacimiento) return null;
  const [year, month, day] = fechaNacimiento.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function daysUntilBirthday(fechaNacimiento: string): number {
  const today = new Date();
  const [year, month, day] = fechaNacimiento.split("-").map(Number);
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  if (thisYear < today) {
    thisYear.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function PlayerDetailModal({
  player,
  onClose,
}: {
  player: ParticipantBasic;
  onClose: () => void;
}) {
  if (!player) return null;

  const edad = getAge(player.fechaNacimiento);
  const cumple = player.fechaNacimiento
    ? (() => {
        const [year, month, day] = player.fechaNacimiento
          .split("-")
          .map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
        });
      })()
    : "No definida";

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm bg-surface rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh]"
      >
        <DialogTitle className="sr-only">
          Detalle de {player.nombre} {player.apellido}
        </DialogTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-surface-dark text-text-muted hover:bg-black/10"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center mb-4">
          <Avatar p={player} size={100} />
          <h3 className="font-black text-xl text-dark mt-3 text-center">
            {player.nombre} {player.apellido}
          </h3>
          {player.apodo && (
            <div className="text-sm font-medium text-text-muted">
              &ldquo;{player.apodo}&rdquo;
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center border border-surface-dark">
            <div className="text-2xl font-black text-primary">
              {edad || "—"}
            </div>
            <div className="text-xs font-bold text-text-muted">AÑOS</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-surface-dark">
            <div className="text-sm font-black text-dark">{cumple}</div>
            <div className="text-xs font-bold text-text-muted">CUMPLE</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {player.telefono && (
            <div className="flex justify-between bg-white rounded-lg p-2 border border-surface-dark">
              <span className="text-text-muted">Teléfono</span>
              <span className="font-medium">{player.telefono}</span>
            </div>
          )}
          {player.email && (
            <div className="flex justify-between bg-white rounded-lg p-2 border border-surface-dark">
              <span className="text-text-muted">Email</span>
              <span className="font-medium">{player.email}</span>
            </div>
          )}
          <div className="flex justify-between bg-white rounded-lg p-2 border border-surface-dark">
            <span className="text-text-muted">Sexo</span>
            <span className="font-medium">
              {player.sexo === "M"
                ? "Masculino"
                : player.sexo === "F"
                  ? "Femenino"
                  : "Mixto"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-14 rounded-full" />
        ))}
      </div>
      <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const { db, isLoading } = useApp();
  const { participants } = db;
  const [selectedPlayer, setSelectedPlayer] = useState<ParticipantBasic | null>(null);

  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const birthdaysByMonth = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => [] as ParticipantBasic[]);
    participants.forEach((p) => {
      if (p.fechaNacimiento) {
        const month = parseInt(p.fechaNacimiento.split("-")[1]) - 1;
        byMonth[month].push(p);
      }
    });
    byMonth.forEach((arr) =>
      arr.sort((a, b) => {
        const dayA = parseInt(a.fechaNacimiento!.split("-")[2]);
        const dayB = parseInt(b.fechaNacimiento!.split("-")[2]);
        return dayA - dayB;
      }),
    );
    return byMonth;
  }, [participants]);

  const today = new Date();
  const todayDay = today.getDate();

  const birthdaysToday = useMemo(() => {
    return birthdaysByMonth[today.getMonth()].filter((p) => {
      const day = parseInt(p.fechaNacimiento!.split("-")[2]);
      return day === todayDay;
    });
  }, [birthdaysByMonth, todayDay]);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {birthdaysToday.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-primary/10 rounded-xl border border-primary/15">
          <div className="font-bold text-sm text-primary mb-2">
            Cumpleaños Hoy
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {birthdaysToday.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
                onClick={() => setSelectedPlayer(p)}
              >
                <Avatar p={p} size={40} />
                <div>
                  <div className="font-bold text-sm">{p.nombre} {p.apellido}</div>
                  <div className="text-xs text-primary font-bold">¡Hoy cumple!</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 px-4 pt-4 scrollbar-none">
        {MONTHS.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelectedMonth(i)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              selectedMonth === i
                ? "bg-primary text-white"
                : "bg-surface-dark text-text-muted"
            )}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 space-y-2">
        {birthdaysByMonth[selectedMonth].length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">
            No hay cumpleaños este mes
          </div>
        ) : (
          birthdaysByMonth[selectedMonth].map((p) => {
            const day = parseInt(p.fechaNacimiento!.split("-")[2]);
            const edad = getAge(p.fechaNacimiento);
            const isToday =
              today.getMonth() === selectedMonth && day === todayDay;
            const diff = daysUntilBirthday(p.fechaNacimiento!);

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/15 cursor-pointer"
                onClick={() => setSelectedPlayer(p)}
              >
                <Avatar p={p} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{p.nombre} {p.apellido}</div>
                  <div className="text-xs text-text-muted">
                    {edad !== null ? `${edad} años` : ""} · {day} de {MONTHS[selectedMonth]}
                  </div>
                </div>
                {isToday ? (
                  <span className="text-xs font-bold text-primary">¡Hoy!</span>
                ) : diff <= 365 - 30 ? (
                  <span className="text-xs text-text-muted">en {diff} días</span>
                ) : (
                  <span className="text-xs text-text-muted">hace {365 - diff} días</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
