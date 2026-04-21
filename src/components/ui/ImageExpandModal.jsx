"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./dialog";

export function ImageExpandModal({ image, playerName, onClose }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (image) {
      setIsLoading(true);
    }
  }, [image]);

  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl max-h-[90vh] bg-transparent border-0 p-0 shadow-none overflow-visible w-full flex flex-col items-center">
        <DialogTitle className="sr-only">Imagen de {playerName}</DialogTitle>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
          title="Cerrar"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="w-full flex-1 flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden min-h-[300px] relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-sm font-bold opacity-70">Cargando alta resolución...</span>
            </div>
          )}
          
          <img
            src={image}
            alt={playerName}
            className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
          />
        </div>

        <div className="text-center mt-4 text-white font-bold">
          {playerName}
        </div>
      </DialogContent>
    </Dialog>
  );
}
