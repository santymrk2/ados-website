"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  const [search, setSearch] = React.useState("");

  const selectedItem = React.useMemo(() => {
    if (value == null || !value) return null;
    return items.find((item) => item.value === value) ?? null;
  }, [value, items]);

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(lower));
  }, [items, search]);

  const handleSelect = React.useCallback(
    (itemValue: string) => {
      onValueChange?.(itemValue);
      setOpen(false);
      setSearch("");
    },
    [onValueChange]
  );

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSearch("");
      }
    },
    []
  );

  const handleClose = React.useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            selectedItem ? "text-foreground" : "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
        >
          {selectedItem ? selectedItem.label : placeholder}
          {selectedItem && !disabled ? (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onValueChange?.(null);
              }}
            />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        side="bottom"
        align="start"
        sideOffset={4}
        onInteractOutside={(e) => {
          // Don't close when clicking inside the popover content
          const target = e.target as HTMLElement;
          if (target.closest('[data-slot="popover-content"]')) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <div className="p-1">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-8"
              autoFocus
            />
          </div>
          <CommandList className="max-h-60 overflow-auto">
            {filteredItems.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => handleSelect(item.value)}
                  className={cn(
                    "cursor-pointer",
                    value === item.value && "bg-accent"
                  )}
                >
                  {item.label}
                  {value === item.value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}