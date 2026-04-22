"use client";

import React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, getImg } from "@/lib/utils";

export function Avatar({ p, size = 36, className = "" }) {
  const initials =
    `${p.nombre?.[0] || ""}${p.apellido?.[0] || ""}`.toUpperCase();
  const isM = p.sexo === "M";
  const isMX = p.sexo === "MX";

  const borderColor = isM ? "#0891B2" : isMX ? "#4342FF" : "#EC4899";

  const fontSize = Math.round(size * 0.4);
  const borderWidth = Math.max(2, Math.round(size * 0.08));

  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className={cn("inline-block shrink-0", className)}
    >
      <AvatarPrimitive.Root
        className="relative flex h-full w-full shrink-0 overflow-hidden rounded-full"
        style={{ borderWidth, borderColor, borderStyle: "solid" }}
      >
        {p.foto && (
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
    </div>
  );
}