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
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </Drawer.Content>
    </Drawer.Root>
  );
}
