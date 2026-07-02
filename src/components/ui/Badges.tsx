"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const PODIUM_COLORS = [
  { bg: "#F59E0B", text: "#fff", shadow: "#F59E0B44" },
  { bg: "#94A3B8", text: "#fff", shadow: "#94A3B844" },
  { bg: "#B45309", text: "#fff", shadow: "#B4530944" },
];

export function RankBadge({ pos }: { pos: number }) {
  if (pos <= 3) {
    const c = PODIUM_COLORS[pos - 1];
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-light text-sm z-0 shrink-0"
        style={{
          backgroundColor: c.bg,
          color: c.text,
          boxShadow: `0 0 0 3px ${c.shadow}`,
        }}
      >
        {pos}
      </div>
    );
  }

  return (
    <div className="w-8 h-8 flex items-center justify-center font-light text-sm text-text-muted z-0 shrink-0">
      {pos}
    </div>
  );
}

export function PodiumBadge({
  pos,
  className = "",
}: {
  pos: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full border border-surface-dark flex items-center justify-center font-extralight text-xs text-text-muted shrink-0",
        className,
      )}
    >
      {pos}
    </div>
  );
}

export function SexBadge({
  sex,
  size = 14,
  className = "",
}: {
  sex: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-surface-dark text-text-muted font-bold shrink-0",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      title={sex === "M" ? "Masculino" : "Femenino"}
    >
      {sex === "M" ? "M" : "F"}
    </span>
  );
}

export function Chip({
  icon: Icon,
  val,
  label,
}: {
  icon?: LucideIcon;
  val: string | number;
  label: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-1 text-xs font-bold",
        "bg-surface-dark border-surface-dark text-text-muted",
        "hover:bg-surface-dark hover:text-text-muted",
      )}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="font-bold">{val}</span>
      <span className="opacity-50 ml-0.5">{label}</span>
    </Badge>
  );
}
