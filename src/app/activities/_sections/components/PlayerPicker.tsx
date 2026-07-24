"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/Avatar";
import { normalizeText } from "@/lib/utils";
import type { ParticipantBasic } from "@/lib/types";

type Player = ParticipantBasic & { team?: string };

interface PlayerPickerProps {
  players: Player[];
  onSelect: (player: Player) => void;
  selected?: Player | null;
  placeholder?: string;
  disabled?: boolean;
}

export function PlayerPicker({
  players,
  onSelect,
  selected,
  placeholder = "Seleccionar jugador",
  disabled = false,
}: PlayerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return players;
    const q = normalizeText(search);
    return players.filter((p) =>
      normalizeText(`${p.nombre} ${p.apellido}`).includes(q),
    );
  }, [players, search]);

  const handleSelect = (player: Player) => {
    onSelect(player);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={
            selected
              ? "flex items-center gap-2 rounded-full border border-surface-dark bg-white px-2.5 py-1 text-xs font-medium shadow-sm"
              : "flex items-center gap-2 rounded-full border border-dashed border-surface-dark px-3 py-1.5 text-xs text-text-muted hover:border-primary/40 transition-colors"
          }
        >
          {selected ? (
            <>
              <Avatar p={selected} size={20} />
              <span>
                {selected.nombre} {selected.apellido}
              </span>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 shadow-xl border-surface-dark">
        <div className="p-2 border-b border-surface-dark bg-surface-light/50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <Input
              placeholder="Buscar jugador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-white"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-auto py-1">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-indigo-50"
              >
                <Avatar p={p} size={24} />
                <span className="text-sm font-medium">
                  {p.nombre} {p.apellido}
                </span>
                {p.team && (
                  <span className="text-xs text-text-muted ml-auto">{p.team}</span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-xs text-text-muted italic">
              {search.trim()
                ? "No se encontraron jugadores"
                : "No hay jugadores disponibles"}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
