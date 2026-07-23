"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal, type LucideIcon } from "lucide-react";
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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterContent?: React.ReactNode;
  hasActiveSearch?: boolean;
  hasActiveFilters?: boolean;
  onSearchModeChange?: (open: boolean) => void;
}

const EXPANDED_WIDTH = "min(340px, calc(100vw - 24px))";
const COLLAPSED_HEIGHT = 56;
const FILTER_HEIGHT = 200;

// Configuración de la barra deslizable
const NAV_WIDTH = 220;
const INNER_NAV_WIDTH = 218;
const ITEM_WIDTH = 72;

const SPACER_LEFT = (INNER_NAV_WIDTH - ITEM_WIDTH) / 2;
const SPACER_RIGHT = SPACER_LEFT + 40;

// --- FUNCIÓN DE VIBRACIÓN ---
const triggerHapticFeedback = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
  }
};

export function FloatingNav({
  value,
  items,
  lockedValues = [],
  onValueChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filterContent,
  hasActiveSearch,
  hasActiveFilters,
  onSearchModeChange,
}: FloatingNavProps) {
  const [searchMode, setSearchMode] = useState(false);
  const [filterMode, setFilterMode] = useState(false);
  const [isExpandedMenuOpen, setIsExpandedMenuOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((i) => i.value === value),
    ),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const showSearch = searchValue !== undefined && onSearchChange !== undefined;
  const showFilter = filterContent !== undefined;
  const isSearchActive = hasActiveSearch ?? Boolean(searchValue?.trim());
  const isFilterActive = Boolean(hasActiveFilters);

  const filterHeight = Math.min(Math.max(120, FILTER_HEIGHT), 320);
  const rows = Math.ceil(items.length / 3);
  const gridHeight = rows * 72 + 16;
  const useCallback = !!onValueChange;

  const activeMode: "search" | "filter" | "grid" | null = isExpandedMenuOpen
    ? "grid"
    : searchMode
      ? "search"
      : filterMode
        ? "filter"
        : null;

  const showAll = activeMode === null;

  // Click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSearchMode(false);
        onSearchModeChange?.(false);
        setFilterMode(false);
        setIsExpandedMenuOpen(false);
      }
    }
    if (searchMode || filterMode || isExpandedMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchMode, filterMode, isExpandedMenuOpen, onSearchModeChange]);

  // ── FIX: Sincronizar rueda al cambiar valor, cerrar menú expandido o VOLVER de búsqueda/filtros ──
  useEffect(() => {
    // Añadimos 'showAll' a la comprobación para asegurarnos de que la rueda está en pantalla
    if (showAll && !isExpandedMenuOpen && wheelRef.current) {
      const index = items.findIndex((i) => i.value === value);
      const targetIndex = index >= 0 ? index : 0;
      setActiveIndex(targetIndex);

      wheelRef.current.scrollTo({
        left: targetIndex * ITEM_WIDTH,
        behavior: "instant" as ScrollBehavior,
      });

      const timeout = setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.scrollTo({
            left: targetIndex * ITEM_WIDTH,
            behavior: "instant" as ScrollBehavior,
          });
        }
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [value, items, isExpandedMenuOpen, showAll]); // <-- El fix está aquí: se añadió 'showAll' a las dependencias.

  // Lógica de Scroll y Vibración
  const handleWheelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    cancelLongPress();
    const scrollLeft = e.currentTarget.scrollLeft;
    const index = Math.round(scrollLeft / ITEM_WIDTH);

    if (index !== activeIndex && index >= 0 && index < items.length) {
      setActiveIndex(index);
      triggerHapticFeedback();
    }
  };

  const handleItemClick = (
    e: React.MouseEvent,
    index: number,
    item: NavItem,
  ) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      longPressTriggered.current = false;
      return;
    }

    if (lockedValues.includes(item.value)) {
      e.preventDefault();
      return;
    }

    triggerHapticFeedback();

    if (wheelRef.current) {
      wheelRef.current.scrollTo({
        left: index * ITEM_WIDTH,
        behavior: "smooth",
      });
    }
    setActiveIndex(index);

    if (useCallback && onValueChange) {
      onValueChange(item.value);
    }
    setIsExpandedMenuOpen(false);
  };

  // Lógica de Pulsación Larga
  const startLongPress = (index: number) => {
    if (index !== activeIndex) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      triggerHapticFeedback();
      setIsExpandedMenuOpen(true);
    }, 400);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleOpenSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFilterMode(false);
    setIsExpandedMenuOpen(false);
    setSearchMode(true);
    onSearchModeChange?.(true);
  };

  const handleClearSearch = () => {
    if (searchValue?.trim()) {
      if (onSearchChange) onSearchChange("");
      searchInputRef.current?.focus({ preventScroll: true });
      return;
    }
    setSearchMode(false);
    onSearchModeChange?.(false);
  };

  const handleOpenFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchMode(false);
    onSearchModeChange?.(false);
    setIsExpandedMenuOpen(false);
    setFilterMode(true);
  };

  // Render: Grilla Expandida
  const renderSectionGrid = () => (
    <div className="grid grid-cols-3 gap-1 p-2 w-full h-full bg-background">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.value === value;
        const isLocked = lockedValues.includes(item.value);
        const href = useCallback ? undefined : item.href || `/${item.value}`;
        const commonClasses = cn(
          "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border py-2 px-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20"
            : "hover:bg-muted",
        );

        if (isLocked) {
          return (
            <button
              key={item.value}
              disabled
              className={cn(
                commonClasses,
                "text-muted-foreground/50 cursor-not-allowed",
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        }

        return useCallback ? (
          <button
            key={item.value}
            onClick={(e) => handleItemClick(e, items.indexOf(item), item)}
            className={commonClasses}
          >
            <Icon className="size-5" />
            <span className="text-[10px] text-center leading-tight">
              {item.label}
            </span>
          </button>
        ) : (
          <Link
            key={item.value}
            href={href!}
            onClick={(e) => handleItemClick(e, items.indexOf(item), item)}
            className={commonClasses}
          >
            <Icon className="size-5" />
            <span className="text-[10px] text-center leading-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    const updateKeyboardInset = () => {
      if (!viewport) return setKeyboardInset(0);
      setKeyboardInset(
        Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop),
      );
    };
    updateKeyboardInset();
    viewport?.addEventListener("resize", updateKeyboardInset);
    viewport?.addEventListener("scroll", updateKeyboardInset);
    return () => {
      viewport?.removeEventListener("resize", updateKeyboardInset);
      viewport?.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);

  const bottomOffset = `calc(24px + env(safe-area-inset-bottom, 0px) + ${searchMode || filterMode ? keyboardInset : 0}px)`;
  const pillTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div
      ref={containerRef}
      className="fixed left-1/2 z-[60] -translate-x-1/2 pb-safe flex items-center justify-center gap-2"
      style={{ bottom: bottomOffset, filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.18))' }}
    >
      <AnimatePresence mode="popLayout">
        {/* PILL 1: Sección Principal */}
        {(showAll || activeMode === "grid") && (
          <motion.div
            key="pill-section"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              width: isExpandedMenuOpen ? EXPANDED_WIDTH : NAV_WIDTH,
              height: isExpandedMenuOpen ? gridHeight : COLLAPSED_HEIGHT,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={pillTransition}
            className={cn(
              "rounded-2xl border border-border bg-white shadow-lg overflow-hidden relative",
              isExpandedMenuOpen && "border-primary ring-2 ring-primary/20",
            )}
          >
            {isExpandedMenuOpen ? (
              <div className="w-full h-full fade-in-0 animate-in duration-300">
                {renderSectionGrid()}
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center bg-background">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `,
                  }}
                />

                <div
                  className="absolute top-[6px] bottom-[6px] bg-muted/60 rounded-xl pointer-events-none z-0 transition-all duration-300"
                  style={{
                    width: ITEM_WIDTH - 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />

                <div
                  ref={wheelRef}
                  onScroll={handleWheelScroll}
                  className="w-full h-full overflow-x-auto flex flex-row items-center snap-x snap-mandatory no-scrollbar z-10 touch-pan-x"
                >
                  <div
                    className="pointer-events-none shrink-0"
                    style={{ width: SPACER_LEFT, height: 1 }}
                  />

                  {items.map((item, i) => {
                    const distance = Math.abs(i - activeIndex);
                    const isSelected = i === activeIndex;
                    const isItemLocked = lockedValues.includes(item.value);
                    const ItemIcon = item.icon;
                    const href = useCallback
                      ? undefined
                      : item.href || `/${item.value}`;

                    let scaleClass = "scale-90 opacity-40";
                    if (distance === 0)
                      scaleClass = "scale-105 opacity-100 font-medium";
                    else if (distance === 1) scaleClass = "scale-95 opacity-70";

                    const innerContent = (
                      <>
                        <ItemIcon
                          className={cn(
                            "size-[18px] transition-all duration-200",
                            isSelected ? "text-primary" : "text-foreground",
                            scaleClass,
                          )}
                        />
                        <span
                          className={cn(
                            "text-[10px] text-center leading-tight transition-all duration-200 truncate w-full px-1",
                            isSelected ? "text-foreground" : "text-foreground",
                            isItemLocked && "line-through opacity-30",
                            scaleClass,
                          )}
                        >
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                        )}
                      </>
                    );

                    const commonProps = {
                      onPointerDown: () => startLongPress(i),
                      onPointerUp: cancelLongPress,
                      onPointerLeave: cancelLongPress,
                      onPointerCancel: cancelLongPress,
                      onClick: (e: React.MouseEvent) =>
                        handleItemClick(e, i, item),
                      "aria-label": `${item.label}. Mantén presionado para ver más opciones`,
                      className:
                        "flex flex-col items-center justify-center gap-0.5 shrink-0 snap-center select-none transition-colors",
                      style: {
                        flex: `0 0 ${ITEM_WIDTH}px`,
                        width: ITEM_WIDTH,
                        height: COLLAPSED_HEIGHT,
                      },
                    };

                    if (useCallback)
                      return (
                        <button key={item.value} {...commonProps}>
                          {innerContent}
                        </button>
                      );
                    return (
                      <Link key={item.value} href={href!} {...commonProps}>
                        {innerContent}
                      </Link>
                    );
                  })}

                  <div
                    className="pointer-events-none shrink-0"
                    style={{ width: SPACER_RIGHT, height: 1 }}
                  />
                </div>

                <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
                <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
              </div>
            )}
          </motion.div>
        )}

        {/* PILL 2: Búsqueda */}
        {showSearch && (showAll || activeMode === "search") && (
          <motion.div
            key="pill-search"
            layout
            initial={{
              opacity: 0,
              scale: 0.9,
              width: 56,
              height: COLLAPSED_HEIGHT,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              width: searchMode ? EXPANDED_WIDTH : 56,
              height: COLLAPSED_HEIGHT,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              width: 56,
              height: COLLAPSED_HEIGHT,
            }}
            transition={pillTransition}
            className={cn(
              "rounded-2xl border border-border bg-white shadow-lg overflow-hidden shrink-0",
              searchMode && "border-primary",
              isSearchActive && !searchMode && "ring-2 ring-primary/20",
            )}
          >
            {searchMode ? (
              <div className="flex items-center gap-2 px-3 h-full w-full">
                <Search className="size-4 text-text-muted shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-text-muted"
                />
                <button
                  onClick={handleClearSearch}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-light text-foreground transition-colors shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenSearch}
                className="w-full h-full flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                style={{ height: COLLAPSED_HEIGHT }}
              >
                <Search className="size-5" />
              </button>
            )}
          </motion.div>
        )}

        {/* PILL 3: Filtros */}
        {showFilter && (showAll || activeMode === "filter") && (
          <motion.div
            key="pill-filter"
            layout
            initial={{
              opacity: 0,
              scale: 0.9,
              width: 56,
              height: COLLAPSED_HEIGHT,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              width: filterMode ? EXPANDED_WIDTH : 56,
              height: filterMode ? filterHeight : COLLAPSED_HEIGHT,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              width: 56,
              height: COLLAPSED_HEIGHT,
            }}
            transition={pillTransition}
            className={cn(
              "rounded-2xl border border-border bg-white shadow-lg overflow-hidden shrink-0",
              filterMode && "border-primary",
              isFilterActive && !filterMode && "ring-2 ring-primary/20",
            )}
          >
            {filterMode ? (
              <div className="flex flex-col h-full w-full">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-text-muted" />
                    <span className="text-xs font-bold text-foreground">
                      Filtros
                    </span>
                  </div>
                  <button
                    onClick={() => setFilterMode(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-light text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {filterContent}
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenFilter}
                className="w-full h-full flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                style={{ height: COLLAPSED_HEIGHT }}
              >
                <SlidersHorizontal className="size-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
