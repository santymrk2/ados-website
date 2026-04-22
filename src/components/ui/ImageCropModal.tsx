"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getDualCroppedImg, PixelCrop } from "@/lib/image-utils";
import { ZoomIn, ZoomOut, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

export function ImageCropModal({ image, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

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
    if (!croppedAreaPixels) return;
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
      <DialogContent className="max-w-xl p-0 bg-black overflow-hidden border-none rounded-3xl h-[80vh] flex flex-col">
        <DialogHeader className="p-4 bg-zinc-900/50 shrink-0">
          <DialogTitle className="text-white text-center font-black">
            Recortar Foto
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 bg-zinc-900 overflow-hidden">
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

        <div className="p-6 bg-zinc-900/50 space-y-6 shrink-0">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-zinc-500" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <ZoomIn className="w-5 h-5 text-zinc-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDone}
              className="bg-primary text-white font-black rounded-xl"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
