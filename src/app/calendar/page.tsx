"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getInitials(nombre: string, apellido: string) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

function SimpleAvatar({ p, size = 36 }: { p: any; size?: number }) {
  const initials = getInitials(p.nombre, p.apellido);
  const isM = p.sexo === "M";
  const isMX = p.sexo === "MX";
  const bgColor = isM ? "#0891B2" : isMX ? "#4342FF" : "#EC4899";

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{ color: "white", fontSize: size * 0.4, fontWeight: "bold" }}
      >
        {initials || "?"}
      </span>
    </div>
  );
}

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

function PlayerDetailModal({
  player,
  onClose,
}: {
  player: any;
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
              "{player.apodo}"
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

export default function Page() {
  const { db } = useApp();
  const { participants } = db;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const birthdaysByMonth = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => [] as any[]);
    participants.forEach((p) => {
      if (p.fechaNacimiento) {
        const month = parseInt(p.fechaNacimiento.split("-")[1]) - 1;
        byMonth[month].push(p);
      }
    });
    byMonth.forEach((arr) =>
      arr.sort((a, b) => {
        const dayA = parseInt(a.fechaNacimiento.split("-")[2]);
        const dayB = parseInt(b.fechaNacimiento.split("-")[2]);
        return dayA - dayB;
      }),
    );
    return byMonth;
  }, [participants]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const birthdaysToday = birthdaysByMonth[currentMonth].filter((p) => {
    const day = parseInt(p.fechaNacimiento.split("-")[2]);
    return day === new Date().getDate();
  });

  const prevMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary pt-safe">
        <div className="text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <div
                className="text-2xl font-black tracking-tight"
                style={{ fontFamily: "ClashGrotesk, sans-serif" }}
              >
                ACTIVADOS
              </div>
              <h1 className="text-lg font-bold mt-1 opacity-80">Calendario</h1>
            </div>
          </div>
        </div>
        <div className="mt-4"></div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white border-b border-surface-dark">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-surface-dark rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-black text-lg">
          {MONTHS[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-surface-dark rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 bg-white">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-text-muted py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 bg-white flex-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const birthdays = birthdaysByMonth[currentMonth].filter((p) => {
            const bday = parseInt(p.fechaNacimiento.split("-")[2]);
            return bday === day;
          });

          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === currentMonth &&
            new Date().getFullYear() === currentYear;

          return (
            <div
              key={day}
              className={cn(
                "min-h-[60px] lg:min-h-[80px] p-1 rounded-lg border transition-colors",
                isToday
                  ? "border-primary bg-primary/5"
                  : "border-surface-dark hover:bg-surface-dark/30",
              )}
            >
              <div
                className={cn(
                  "text-xs font-bold mb-1",
                  isToday ? "text-primary" : "text-text-muted",
                )}
              >
                {day}
              </div>
              <div className="flex flex-col gap-0.5">
                {birthdays.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 cursor-pointer hover:bg-white/50 rounded p-0.5 -mx-0.5"
                    onClick={() => setSelectedPlayer(p)}
                  >
                    <SimpleAvatar p={p} size={20} />
                    <span className="text-[10px] lg:text-xs font-medium truncate">
                      {p.nombre}
                    </span>
                  </div>
                ))}
                {birthdays.length > 3 && (
                  <span className="text-[10px] text-text-muted">
                    +{birthdays.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {birthdaysToday.length > 0 && (
        <div className="p-4 bg-primary/10 border-t border-primary/20">
          <div className="font-bold text-sm text-primary mb-2">
            🎂 Cumpleaños hoy
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {birthdaysToday.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedPlayer(p)}
              >
                <SimpleAvatar p={p} size={48} />
                <span className="text-xs font-bold text-center">
                  {p.nombre} {p.apellido}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-t border-surface-dark">
        <div className="font-bold text-sm mb-3">Cumpleaños este mes</div>
        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          {birthdaysByMonth[currentMonth].length === 0 ? (
            <div className="text-sm text-text-muted text-center py-4">
              No hay cumpleaños este mes
            </div>
          ) : (
            birthdaysByMonth[currentMonth].map((p) => {
              const day = parseInt(p.fechaNacimiento.split("-")[2]);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-surface-dark/30 cursor-pointer hover:bg-surface-dark/60 transition-colors"
                  onClick={() => setSelectedPlayer(p)}
                >
                  <SimpleAvatar p={p} size={32} />
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {p.nombre} {p.apellido}
                    </div>
                    <div className="text-xs text-text-muted">
                      {day} de {MONTHS[currentMonth]}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
