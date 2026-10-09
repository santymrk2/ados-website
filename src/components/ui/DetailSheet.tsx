"use client";

import { Drawer } from "vaul";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** "plain": round back button and large title, no divider line. */
  headerVariant?: "bar" | "plain";
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
  headerVariant = "bar",
}: DetailSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      shouldScaleBackground={false}
    >
      <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40" />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 top-0 z-50 bg-white",
          "flex flex-col",
          "rounded-t-2xl",
          className
        )}
      >
        <Drawer.Title className="sr-only">{title}</Drawer.Title>

        {/* Header */}
        {headerVariant === "plain" ? (
          <div className="flex-shrink-0 pt-safe">
            <div className="flex items-center gap-3 px-4 pb-2 pt-3">
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Volver"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-all hover:bg-muted active:scale-95"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="text-2xl font-black tracking-tight">{title}</div>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 pt-safe border-b border-surface-dark">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => onOpenChange(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="font-bold text-lg">{title}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </Drawer.Content>
    </Drawer.Root>
  );
}
