"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { MotionConfig } from "framer-motion";
import { GroupedList } from "@/components/ui/GroupedList";
import { CountUp, EmptyBlock, Reveal } from "@/app/_components/home-ui";
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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Signed days from today (at midnight) to this year's birthday: negative once it has passed. */
function daysToThisYearBirthday(fechaNacimiento: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [, month, day] = fechaNacimiento.split("-").map(Number);
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  return Math.round((thisYear.getTime() - today.getTime()) / MS_PER_DAY);
}

function pluralDays(n: number) {
  return `${n} ${n === 1 ? "día" : "días"}`;
}

/** "hace N días" for birthdays in the last 30 days, otherwise days until the next one. */
function birthdayCountdownLabel(fechaNacimiento: string): string {
  const diff = daysToThisYearBirthday(fechaNacimiento);
  if (diff >= 0) return `en ${pluralDays(diff)}`;
  if (diff >= -30) return `hace ${pluralDays(-diff)}`;

  const [, month, day] = fechaNacimiento.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = new Date(now.getFullYear() + 1, month - 1, day);
  return `en ${pluralDays(Math.round((next.getTime() - today.getTime()) / MS_PER_DAY))}`;
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
  const todayMonth = today.getMonth();

  const birthdaysToday = birthdaysByMonth[todayMonth].filter((p) => {
    const day = parseInt(p.fechaNacimiento!.split("-")[2]);
    return day === todayDay;
  });

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  const monthBirthdays = birthdaysByMonth[selectedMonth];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="max-w-3xl space-y-5 p-4">
          <Reveal index={0}>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={monthBirthdays.length}
                className="text-5xl font-black tracking-tight text-foreground"
              />
              <span className="text-base font-bold text-muted-foreground">
                cumpleaños en {MONTHS[selectedMonth]}
              </span>
            </div>
          </Reveal>

          {birthdaysToday.length > 0 && (
            <Reveal index={1}>
              <div
                className="overflow-hidden rounded-3xl border border-border bg-card"
                style={{ boxShadow: "inset 4px 0 0 var(--primary)" }}
              >
                <div className="px-4 pt-3 text-sm font-black uppercase tracking-widest text-primary">
                  Cumpleaños hoy
                </div>
                <div className="divide-y divide-border">
                  {birthdaysToday.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlayer(p)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <Avatar p={p} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bold leading-tight text-foreground">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-primary">¡Hoy cumple!</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(i)}
                aria-pressed={selectedMonth === i}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  selectedMonth === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>

          {monthBirthdays.length === 0 ? (
            <EmptyBlock text="No hay cumpleaños este mes" />
          ) : (
            <Reveal index={2}>
              <GroupedList>
                {monthBirthdays.map((p) => {
                  const day = parseInt(p.fechaNacimiento!.split("-")[2]);
                  const edad = getAge(p.fechaNacimiento);
                  const isToday = today.getMonth() === selectedMonth && day === todayDay;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlayer(p)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                      style={isToday ? { boxShadow: "inset 4px 0 0 var(--primary)" } : undefined}
                    >
                      <Avatar p={p} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bold leading-tight text-foreground">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {edad !== null ? `${edad} años` : ""} · {day} de {MONTHS[selectedMonth]}
                        </div>
                      </div>
                      {isToday ? (
                        <span className="shrink-0 text-sm font-bold text-primary">¡Hoy!</span>
                      ) : (
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {birthdayCountdownLabel(p.fechaNacimiento!)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </GroupedList>
            </Reveal>
          )}
        </div>

        {selectedPlayer && (
          <PlayerDetailModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
