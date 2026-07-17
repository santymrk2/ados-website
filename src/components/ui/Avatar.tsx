"use client";

import React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, getImg } from "@/lib/utils";
import { imagesEnabled } from "@/lib/images-config";

interface AvatarProps {
  p: {
    nombre?: string | null;
    apellido?: string | null;
    sexo?: string | null;
    foto?: string | null;
  };
  size?: number;
  className?: string;
}

export function Avatar({ p, size = 36, className = "" }: AvatarProps) {
  const initials =
    `${p.nombre?.[0] || ""}${p.apellido?.[0] || ""}`.toUpperCase();
  const sexLetter = p.sexo === "M" ? "M" : "F";

  const fontSize = Math.round(size * 0.4);
  const badgeSize = Math.max(14, Math.round(size * 0.38));
  const badgeFontSize = Math.max(7, Math.round(badgeSize * 0.55));

  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className={cn("relative inline-block shrink-0", className)}
    >
      <AvatarPrimitive.Root className="relative flex h-full w-full shrink-0 overflow-hidden rounded-full border border-[#E5E7EB]">
        {imagesEnabled && p.foto && getImg(p.foto) && (
          <AvatarPrimitive.Image
            src={getImg(p.foto)}
            alt={`${p.nombre} ${p.apellido}`}
            className="aspect-square h-full w-full object-cover"
          />
        )}
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center rounded-full bg-surface-dark text-text-muted font-black"
          style={{ fontSize }}
        >
          {initials || "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {size >= 28 && (
        <div
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white text-text-muted shadow-sm"
          style={{ width: badgeSize, height: badgeSize, fontSize: badgeFontSize, fontWeight: 700 }}
        >
          {sexLetter}
        </div>
      )}
    </div>
  );
}