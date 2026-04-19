"use client";

import { cn } from "@/lib/utils";

/**
 * Overlay visual que se muestra sobre un componente mientras se está guardando.
 * Bloquea la interacción y muestra un indicador de guardado.
 * 
 * @param {boolean} saving - Si true, muestra el overlay
 * @param {string} className - Clases adicionales para el contenedor
 * @param {React.ReactNode} children - Contenido hijo
 * @param {string} label - Texto del indicador (default: "Guardando...")
 */
export function SavingOverlay({ saving, children, className, label = "Guardando..." }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {saving && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center pointer-events-auto">
          <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-xl shadow-lg border border-primary/20">
            <div className="saving-spinner" />
            <span className="text-xs font-bold text-primary">{label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook helper para verificar si una operación está en progreso.
 * 
 * @param {Set} savingOps - Set de operaciones en curso
 * @param {string} prefix - Prefijo de la operación (ej: "game_pos")
 * @param {string|number} id - ID del recurso
 * @returns {boolean} true si la operación está en curso
 */
export function isSavingOp(savingOps, prefix, id) {
  if (!savingOps || savingOps.size === 0) return false;
  const key = `${prefix}:${id || ''}`;
  for (const op of savingOps) {
    if (op === key || op.startsWith(`${prefix}:`)) return true;
  }
  return false;
}

/**
 * Verifica si cualquier operación con el prefijo dado está en curso.
 */
export function isAnySavingOp(savingOps, prefix) {
  if (!savingOps || savingOps.size === 0) return false;
  for (const op of savingOps) {
    if (op.startsWith(`${prefix}:`)) return true;
  }
  return false;
}
