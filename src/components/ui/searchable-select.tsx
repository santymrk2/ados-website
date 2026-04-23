"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Combobox as ComboboxPrimitive,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

type Item = {
  value: string;
  label: string;
};

interface SearchableSelectProps {
  items: readonly Item[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  className,
  disabled = false,
  emptyMessage = "No se encontró",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Get selected item label
  const selectedItem = React.useMemo(() => {
    if (value == null || !value) return null;
    return items.find((item) => item.value === value) ?? null;
  }, [value, items]);

  const handleValueChange = React.useCallback(
    (newValue: string | string[] | null) => {
      const val = Array.isArray(newValue) ? newValue[0] : newValue;
      onValueChange?.(val ?? null);
    },
    [onValueChange]
  );

  return (
    <ComboboxPrimitive
      value={value ?? ""}
      onValueChange={handleValueChange}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={selectedItem?.label ?? placeholder}
        className={cn("w-full", className)}
        showClear={!!selectedItem}
        onClear={() => onValueChange?.(null)}
      />
      <ComboboxContent side="bottom" sideOffset={4}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {items.map((item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
              {value === item.value && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxPrimitive>
  );
}