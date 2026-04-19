"use client";

import { X } from "lucide-react";
import { Avatar } from "./Avatar";
import { getEdad } from "@/lib/constants";
import { Dialog, DialogContent } from "./dialog";
import { Button } from "./button";

export function PlayerInfoModal({ player, onClose }) {
  if (!player) return null;

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xs sm:max-w-sm bg-surface rounded-3xl p-6 flex flex-col items-center overflow-y-auto max-h-[90vh]"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-surface-dark text-text-muted hover:bg-black/10"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="mb-4 mt-2">
          <Avatar p={player} size="lg" />
        </div>

        <h3 className="font-black text-2xl text-center leading-tight text-dark mb-1">
          {player.nombre} <br /> {player.apellido}
        </h3>

        <div className="mt-3 text-sm font-black text-text-muted bg-surface-dark px-4 py-1.5 rounded-full uppercase tracking-wider">
          {getEdad(player.fechaNacimiento)} años
        </div>
      </DialogContent>
    </Dialog>
  );
}
