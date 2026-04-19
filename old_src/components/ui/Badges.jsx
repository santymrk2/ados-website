"use client";

import React from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

/**
 * Colores del podio (Gold, Silver, Bronze)
 * Posiciones 1, 2, 3 respectivamente
 */
const PODIUM_COLORS = [
  { bg: "#F59E0B", text: "#fff", shadow: "#F59E0B44" }, // Gold
  { bg: "#94A3B8", text: "#fff", shadow: "#94A3B844" }, // Silver
  { bg: "#B45309", text: "#fff", shadow: "#B4530944" }, // Bronze
];

/**
 * Colores por sexo
 * M = Cyan, F = Pink, MX = Indigo
 */
const SEX_COLORS = {
  M: "bg-cyan-500", // Male
  F: "bg-pink-500", // Female
  MX: "bg-indigo-500", // Other/Non-binary
};

/**
 * RankBadge - Muestra la posición en el ranking
 * Para las primeras 3 posiciones usa colores del podio (oro, plata, bronce)
 * Para otras posiciones muestra el número en texto
 *
 * @param {number} pos - Posición en el ranking
 */
export function RankBadge({ pos }) {
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

/**
 * PodiumBadge - Versión minimalista del badge de posición
 * Círculo con borde fino y número delgado
 */
export function PodiumBadge({ pos, className = "" }) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full border border-surface-dark flex items-center justify-center font-extralight text-xs text-text-muted shrink-0",
        className
      )}
    >
      {pos}
    </div>
  );
}

/**
 * SexBadge - Muestra un punto de color según el sexo
 * M (Masculino) = Cyan
 * F (Femenino) = Pink
 * MX (Otro) = Indigo
 *
 * @param {string} sex - Sexo (M, F, MX)
 * @param {string} className - Clases adicionales
 */
export function SexBadge({ sex, className = "" }) {
  const isM = sex === "M";
  const isMX = sex === "MX";

  return (
    <span
      className={cn(
        "inline-block rounded-full shrink-0",
        isM ? "bg-cyan-500" : isMX ? "bg-indigo-500" : "bg-pink-500",
        className,
      )}
      style={{ width: "8px", height: "8px", minWidth: "8px" }}
      title={sex === "M" ? "Masculino" : sex === "F" ? "Femenino" : "Otro"}
    />
  );
}

/**
 * Chip - Badge reutilizable con icono, valor y label
 * Usado para mostrar estadísticas o información compacta
 *
 * @param {React.ComponentType} icon - Componente de icono (ej: LucideIcon)
 * @param {string|number} val - Valor principal a mostrar
 * @param {string} label - Etiqueta/descripción del valor
 */
export function Chip({ icon: Icon, val, label }) {
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
