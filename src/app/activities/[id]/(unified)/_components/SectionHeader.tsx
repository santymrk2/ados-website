"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sectionTitleClass, savingTextClass, toolbarButtonClass } from "./ui-classes";

interface SectionHeaderProps {
  title: string;
  isEditing: boolean;
  canEdit: boolean;
  onToggleEdit: () => void;
  onAdd?: () => void;
  addLabel?: string;
  locked?: boolean;
  syncStatus?: {
    state: "idle" | "saving" | "saved" | "error";
    message?: string;
  };
}

export function SectionHeader({
  title,
  isEditing,
  canEdit,
  onToggleEdit,
  onAdd,
  addLabel = "Agregar",
  locked = false,
  syncStatus,
}: SectionHeaderProps) {
  const disabled = locked || !canEdit;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 className={sectionTitleClass}>{title}</h2>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {syncStatus?.state === "saving" && (
          <span className={savingTextClass}>
            Guardando...
          </span>
        )}
        {syncStatus?.state === "error" && syncStatus.message && (
          <span className="text-xs text-destructive">{syncStatus.message}</span>
        )}
        {isEditing && onAdd && (
          <Button
            onClick={onAdd}
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              toolbarButtonClass,
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {addLabel}
          </Button>
        )}
        {canEdit && (
          <Button
            onClick={onToggleEdit}
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              toolbarButtonClass,
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {isEditing ? "Listo" : "Editar"}
          </Button>
        )}
      </div>
    </div>
  );
}
