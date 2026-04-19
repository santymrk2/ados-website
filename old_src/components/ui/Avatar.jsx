"use client";

import React from "react";
import {
  Avatar as AvatarRoot,
  AvatarImage,
  AvatarFallback,
} from "./avatar.tsx";
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
        "--avatar-border-color": borderColor,
      }}
      className="inline-block shrink-0"
    >
      <AvatarRoot
        className={cn(
          "w-full h-full after:border-[3px]! after:border-[var(--avatar-border-color)]!",
        )}
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
