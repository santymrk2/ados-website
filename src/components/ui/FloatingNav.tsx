"use client";

import { useState, useRef, useEffect } from "react";
import { type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavItem {
  value: string;
  label: string;
  icon: LucideIcon;
  href?: string;
}

interface FloatingNavProps {
  value: string;
  items: NavItem[];
  lockedValues?: string[];
  onValueChange?: (value: string) => void;
}

// Dimensiones fijas para cada estado
const COLLAPSED_WIDTH = 90;
const COLLAPSED_HEIGHT = 80;
const EXPANDED_WIDTH = 320;
const EXPANDED_HEIGHT = 220;

export function FloatingNav({
  value,
  items,
  lockedValues = [],
  onValueChange,
}: FloatingNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = items.find((item) => item.value === value) || items[0];
  const CurrentIcon = currentItem.icon;

  const useCallback = !!onValueChange;

  // Click outside para cerrar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (item: NavItem) => {
    if (lockedValues.includes(item.value)) return;

    if (useCallback && onValueChange) {
      onValueChange(item.value);
    }
    setIsOpen(false);
  };

  const handleToggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 pb-safe"
    >
      {/* Contenedor animado que cambia de tamaño */}
      <motion.div
        className={cn(
          "rounded-2xl border border-border bg-white shadow-lg overflow-hidden",
          isOpen ? "border-primary" : "",
        )}
        animate={{
          width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          height: isOpen ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
        }}
        transition={{
          width: { duration: 0.2, ease: "easeOut" },
          height: { duration: 0.2, ease: "easeOut" },
        }}
        onClick={handleToggle}
        style={{ cursor: "pointer" }}
      >
        {/* Estado A: Collapsed - ícono + label de sección activa */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              key="collapsed"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
              exit={{
                opacity: 0,
                scale: 0.9,
                transition: {
                  duration: 0.1,
                  delay: 0.12,
                },
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1 p-2">
                <CurrentIcon className="size-5 text-foreground" />
                <span className="text-[10px] text-center leading-tight">
                  {currentItem.label}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estado B: Expanded - grid de opciones */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="expanded"
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.15, delay: 0.1 }}
            >
              <div className="grid grid-cols-3 gap-1 p-2 w-full h-full">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.value === value;
                  const isLocked = lockedValues.includes(item.value);

                  if (isLocked) {
                    return (
                      <button
                        key={item.value}
                        disabled
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border p-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                      >
                        <Icon className="size-5" />
                        <span className="text-[10px] text-center leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  }

                  const href = useCallback
                    ? undefined
                    : item.href || (item.value ? `/${item.value}` : "/");

                  if (useCallback) {
                    return (
                      <button
                        key={item.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border p-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-white border-primary"
                            : "hover:bg-muted",
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="text-[10px] text-center leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.value}
                      href={href!}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border p-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="text-[10px] text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
