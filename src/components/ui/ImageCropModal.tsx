"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getDualCroppedImg } from "@/lib/imageUtils";
import { ZoomIn, ZoomOut, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function ImageCropModal({ image, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (_croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleDone = async () => {
    try {
      const { altaCalidad, thumb } = await getDualCroppedImg(
        image,
        croppedAreaPixels,
      );
      onCropComplete({ altaCalidad, thumb });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Error al procesar la imagen.");
    }
  };

  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="z-[10051]" />
        <div className="fixed inset-0 z-[10052] flex items-center justify-center p-4 outline-none pointer-events-none">
          <div
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-black/95 border-0 p-0 flex flex-col max-h-[95vh] gap-0 rounded-2xl outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 pointer-events-auto",
            )}
          >
            <DialogHeader className="bg-black/50 border-b border-white/10 p-4 shrink-0">
              <div className="flex justify-between items-center w-full">
                <DialogTitle className="text-white font-bold text-lg">
                  Recortar Foto
                </DialogTitle>
                <Button
                  onClick={handleDone}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Check className="w-6 h-6" />
                </Button>
              </div>
            </DialogHeader>

            <div className="relative flex-1 overflow-hidden min-h-[300px]">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={onCropChange}
                onCropComplete={onCropCompleteInternal}
                onZoomChange={onZoomChange}
              />
            </div>

            <div className="p-4 space-y-4 border-t border-white/10 bg-black/50 shrink-0">
              <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4">
                <ZoomOut className="w-5 h-5 text-white/50 shrink-0" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-primary h-2 rounded-lg appearance-none cursor-pointer bg-white/20"
                />
                <ZoomIn className="w-5 h-5 text-white/50 shrink-0" />
              </div>

              <Button
                onClick={handleDone}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                Confirmar Recorte
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
