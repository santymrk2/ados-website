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
  /** Si se provee, habilita el modo búsqueda */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Si se provee, habilita el modo filtros con contenido personalizado */
  filterContent?: React.ReactNode;
  hasActiveSearch?: boolean;
  hasActiveFilters?: boolean;
  onSearchModeChange?: (open: boolean) => void;
}

const COLLAPSED_HEIGHT = 56;
const EXPANDED_WIDTH = "min(320px, calc(100vw - 24px))";

// Cuánto crece el alto en modo filtro según el contenido
const FILTER_HEIGHT = 200;

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [filterMode, setFilterMode] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showSearch = searchValue !== undefined && onSearchChange !== undefined;
  const showFilter = filterContent !== undefined;
  const hasExtras = showSearch || showFilter;
  const isSearchActive = hasActiveSearch ?? Boolean(searchValue?.trim());
  const isFilterActive = Boolean(hasActiveFilters);

  const rows = Math.ceil(items.length / 3);
  const expandedHeight = rows * 72 + 16;
  // Calcular alto del filtro basado en contenido (mínimo 200, máximo 300 con scroll)
  const filterHeight = Math.min(Math.max(120, FILTER_HEIGHT), 320);

  const currentItem = items.find((item) => item.value === value) || items[0];
  const CurrentIcon = currentItem.icon;

  const useCallback = !!onValueChange;

  // Click outside para cerrar menú, search o filter
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchMode(false);
        setFilterMode(false);
      }
    }

    if (isOpen || searchMode || filterMode) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, searchMode, filterMode]);

  const handleSelect = (item: NavItem) => {
    if (lockedValues.includes(item.value)) return;

    if (useCallback && onValueChange) {
      onValueChange(item.value);
    }
    setIsOpen(false);
  };

  const handleToggleMenu = () => {
    if (searchMode || filterMode) return;
    setIsOpen((prev) => !prev);
  };

  const handleOpenSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setFilterMode(false);
    setSearchMode(true);
  };

  const handleClearSearch = () => {
    if (onSearchChange) onSearchChange("");
    // Refocus para que el usuario pueda tipear de inmediato
    searchInputRef.current?.focus({ preventScroll: true });
  };

  const handleOpenFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setSearchMode(false);
    setFilterMode(true);
  };

  const handleCloseFilter = () => {
    setFilterMode(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;

    const updateKeyboardInset = () => {
      if (!viewport) {
        setKeyboardInset(0);
        return;
      }

      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardInset(inset);
    };

    updateKeyboardInset();

    if (!viewport) return;

    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);

  useEffect(() => {
    if (searchMode || filterMode) {
      searchInputRef.current?.focus({ preventScroll: true });
    }
  }, [searchMode, filterMode]);

  useEffect(() => {
    onSearchModeChange?.(searchMode);
  }, [onSearchModeChange, searchMode]);

  // Dimensiones según estado
  const targetWidth = EXPANDED_WIDTH;
  const targetHeight = isOpen ? expandedHeight : filterMode ? filterHeight : COLLAPSED_HEIGHT;
  const bottomOffset = `calc(24px + env(safe-area-inset-bottom, 0px) + ${searchMode || filterMode ? keyboardInset : 0}px)`;

  return (
    <div
      ref={containerRef}
      className="fixed left-1/2 z-[60] -translate-x-1/2 pb-safe"
      style={{ bottom: bottomOffset }}
    >
      <motion.div
        className={cn(
          "rounded-2xl border border-border bg-white shadow-lg overflow-hidden",
          (isOpen || searchMode || filterMode) && "border-primary",
          (isSearchActive || isFilterActive) && "ring-2 ring-primary/20",
          !searchMode && !filterMode && "cursor-pointer",
        )}
        animate={{
          width: targetWidth,
          height: targetHeight,
        }}
        transition={{
          width: { duration: 0.2, ease: "easeOut" },
          height: { duration: 0.2, ease: "easeOut" },
        }}
      >
        {/* ─── ESTADO A: Menú colapsado ─── */}
        <AnimatePresence>
          {!isOpen && !searchMode && !filterMode && (
            <motion.div
              key="collapsed"
              className="absolute inset-0 flex items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
              exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.1, delay: 0.12 },
              }}
            >
              {hasExtras ? (
                <>
                  {/* Botón menú */}
                  <div
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 p-1.5 h-full"
                    onClick={handleToggleMenu}
                  >
                    <CurrentIcon className="size-5 text-foreground" />
                    <span className="text-[10px] text-center leading-tight">
                      {currentItem.label}
                    </span>
                  </div>

                  {/* Separadores y botones extra */}
                  {showSearch && (
                    <>
                      <div className="w-px h-8 bg-border shrink-0" />
                      <button
                        onClick={handleOpenSearch}
                        className="w-12 h-full flex items-center justify-center text-foreground hover:text-primary transition-colors shrink-0"
                        aria-label="Buscar"
                      >
                        <Search className="size-5" />
                      </button>
                    </>
                  )}
                  {showFilter && (
                    <>
                      <div className="w-px h-8 bg-border shrink-0" />
                      <button
                        onClick={handleOpenFilter}
                        className="w-12 h-full flex items-center justify-center text-foreground hover:text-primary transition-colors shrink-0"
                        aria-label="Filtros"
                      >
                        <SlidersHorizontal className="size-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  onClick={handleToggleMenu}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5 p-1.5">
                    <CurrentIcon className="size-5 text-foreground" />
                    <span className="text-[10px] text-center leading-tight">
                      {currentItem.label}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ESTADO B: Menú expandido ─── */}
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
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border py-2 px-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
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
                          "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border py-2 px-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20"
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
                        "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border py-2 px-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20"
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

        {/* ─── ESTADO C: Modo búsqueda ─── */}
        <AnimatePresence>
          {searchMode && (
            <motion.div
              key="search"
              className="absolute inset-0 flex items-center gap-2 px-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
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
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-light text-foreground transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ESTADO D: Modo filtros ─── */}
        <AnimatePresence>
          {filterMode && (
            <motion.div
              key="filter"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {/* Header del filtro con botón cerrar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-text-muted" />
                  <span className="text-xs font-bold text-foreground">Filtros</span>
                </div>
                <button
                  onClick={handleCloseFilter}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-light text-foreground transition-colors"
                  aria-label="Cerrar filtros"
                >
                  <X className="size-4" />
                </button>
              </div>
              {/* Contenido del filtro (scrollable) */}
              <div className="flex-1 overflow-y-auto p-3">
                {filterContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
