"use client";

import React from "react";
import {
  Avatar as AvatarRoot,
  AvatarImage,
  AvatarFallback,
} from "./avatar";
import { cn } from "@/lib/utils";

export function Avatar({ p, size = 36 }) {
  const initials =
    `${p.nombre?.[0] || ""}${p.apellido?.[0] || ""}`.toUpperCase();
  const isM = p.sexo === "M";
  const isMX = p.sexo === "MX";

  const borderColor = isM ? "#0891B2" : isMX ? "#4342FF" : "#EC4899";

  const fontSize = Math.round(size * 0.4);

  return (
    <div
style={{
          width: size,
          height: size,
        }}
        className={cn("w-full h-full", className)}
      >
        <AvatarPrimitive.Root
          className="relative flex h-full w-full shrink-0 overflow-hidden rounded-full"
          style={{ borderWidth: 3, borderColor, borderStyle: "solid" }}
      >
        {p.foto && (
          <AvatarImage
            src={p.foto}
            alt={`${p.nombre} ${p.apellido}`}
            className="w-full h-full object-cover"
          />
        )}
        <AvatarFallback
          className="bg-surface-dark text-text-muted font-black"
          style={{ fontSize }}
        >
          {initials || "?"}
        </AvatarFallback>
      </AvatarRoot>
    </div>
  );
}
