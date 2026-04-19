"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Combobox({
  items,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className,
  disabled,
}: {
  items: readonly string[] | { value: string; label: string }[];
  value?: string | number | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const itemList = items.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item,
  );

  const filteredItems = React.useMemo(() => {
    if (!search) return itemList.slice(0, 50);
    const lower = search.toLowerCase();
    return itemList
      .filter((item) => item.label.toLowerCase().includes(lower))
      .slice(0, 50);
  }, [itemList, search]);

  const selectedItem = React.useMemo(() => {
    if (value == null) return null;
    return itemList.find((item) => item.value === value);
  }, [value, itemList]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          selectedItem ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {selectedItem ? selectedItem.label : placeholder}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-popover p-1 shadow-md z-[150]">
            <div className="p-1">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                autoFocus
              />
            </div>
            {filteredItems.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No se encontró
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange?.(item.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === item.value && "bg-accent",
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === item.value && <Check className="h-4 w-4" />}
                  </span>
                  {item.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { Combobox };
