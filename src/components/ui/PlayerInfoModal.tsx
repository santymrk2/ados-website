"use client";

import { Dialog, DialogContent } from "./dialog";
import { Avatar } from "./Avatar";

export function PlayerInfoModal({
    player,
    onClose,
}: {
    player: { nombre: string; apellido: string; foto?: string } | null;
    onClose: () => void;
}) {
    if (!player) return null;
    return (
        <Dialog open={!!player} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <div className="flex flex-col items-center p-4">
                    <Avatar p={player} size={80} />
                    <h2 className="text-xl font-bold mt-3">
                        {player.nombre} {player.apellido}
                    </h2>
                </div>
            </DialogContent>
        </Dialog>
    );
}