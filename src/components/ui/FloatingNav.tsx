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

const EXPANDED_WIDTH = "min(320px, calc(100vw - 24px))";
const COLLAPSED_HEIGHT = 56;
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
  const isSearchActive = hasActiveSearch ?? Boolean(searchValue?.trim());
  const isFilterActive = Boolean(hasActiveFilters);

  const rows = Math.ceil(items.length / 3);
  const expandedHeight = rows * 72 + 16;
  const filterHeight = Math.min(Math.max(120, FILTER_HEIGHT), 320);

  const currentItem = items.find((item) => item.value === value) || items[0];
  const CurrentIcon = currentItem.icon;

  const useCallback = !!onValueChange;

  // ── ¿Qué modo está activo? ──────────────────────────────────────────────────
  const activeMode: "section" | "search" | "filter" | null = isOpen
    ? "section"
    : searchMode
      ? "search"
      : filterMode
        ? "filter"
        : null;
  const showAll = activeMode === null;

  // Click outside para cerrar cualquier modo
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
    // Si hay texto, solo lo limpia y mantiene el foco
    if (searchValue?.trim()) {
      if (onSearchChange) onSearchChange("");
      searchInputRef.current?.focus({ preventScroll: true });
      return;
    }
    // Si ya está vacío, cierra el modo búsqueda
    setSearchMode(false);
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

  // Keyboard inset (para el teclado virtual en mobile)
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

  const bottomOffset = `calc(24px + env(safe-area-inset-bottom, 0px) + ${searchMode || filterMode ? keyboardInset : 0}px)`;

  // ── Render: grilla de secciones (expandido) ─────────────────────────────────
  const renderSectionGrid = () => (
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
  );

  // ── Pill animation config ──────────────────────────────────────────────────
  const pillTransition = { duration: 0.2, ease: "easeOut" as const };

  return (
    <div
      ref={containerRef}
      className="fixed left-1/2 z-[60] -translate-x-1/2 pb-safe flex items-center justify-center gap-2"
      style={{ bottom: bottomOffset }}
    >
      <AnimatePresence mode="popLayout">
        {/* ═══════════════════════════════════════════════════════════════════════
             PILL 1: Sección (siempre visible)
           ═══════════════════════════════════════════════════════════════════════ */}
        {(showAll || activeMode === "section") && (
          <motion.div
            key="pill-section"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={pillTransition}
            className={cn(
              "rounded-2xl border border-border bg-white shadow-lg overflow-hidden",
              isOpen && "border-primary",
            )}
          >
            {isOpen ? (
              <div
                className="h-full"
                style={{ width: EXPANDED_WIDTH, height: expandedHeight }}
              >
                {renderSectionGrid()}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 cursor-pointer"
                style={{ height: COLLAPSED_HEIGHT }}
                onClick={handleToggleMenu}
              >
                <CurrentIcon className="size-5 text-foreground" />
                <span className="text-[10px] text-center leading-tight whitespace-nowrap">
                  {currentItem.label}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
             PILL 2: Búsqueda (solo si está habilitada)
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSearch && (showAll || activeMode === "search") && (
          <motion.div
            key="pill-search"
            layout
            initial={{ opacity: 0, scale: 0.9, width: 56, height: COLLAPSED_HEIGHT }}
            animate={{
              opacity: 1,
              scale: 1,
              width: searchMode ? EXPANDED_WIDTH : 56,
              height: COLLAPSED_HEIGHT,
            }}
            exit={{ opacity: 0, scale: 0.9, width: 56, height: COLLAPSED_HEIGHT }}
            transition={pillTransition}
            className={cn(
              "rounded-2xl border border-border bg-white shadow-lg overflow-hidden",
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
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenSearch}
                className="w-full h-full flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                style={{ height: COLLAPSED_HEIGHT }}
                aria-label="Buscar"
              >
                <Search className="size-5" />
              </button>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
             PILL 3: Filtros (solo si está habilitado)
           ═══════════════════════════════════════════════════════════════════════ */}
        {showFilter && (showAll || activeMode === "filter") && (
          <motion.div
            key="pill-filter"
            layout
            initial={{ opacity: 0, scale: 0.9, width: 56, height: COLLAPSED_HEIGHT }}
            animate={{
              opacity: 1,
              scale: 1,
              width: filterMode ? EXPANDED_WIDTH : 56,
              height: filterMode ? filterHeight : COLLAPSED_HEIGHT,
            }}
            exit={{ opacity: 0, scale: 0.9, width: 56, height: COLLAPSED_HEIGHT }}
            transition={pillTransition}
            className={cn(
              "rounded-2xl border border-border bg-white shadow-lg overflow-hidden",
              filterMode && "border-primary",
              isFilterActive && !filterMode && "ring-2 ring-primary/20",
            )}
          >
            {filterMode ? (
              <div className="flex flex-col h-full w-full">
                {/* Header del filtro con botón cerrar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-text-muted" />
                    <span className="text-xs font-bold text-foreground">
                      Filtros
                    </span>
                  </div>
                  <button
                    onClick={handleCloseFilter}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-light text-foreground transition-colors"
                    aria-label="Cerrar filtros"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {/* Contenido del filtro */}
                <div className="flex-1 overflow-y-auto p-3">
                  {filterContent}
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenFilter}
                className="w-full h-full flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                style={{ height: COLLAPSED_HEIGHT }}
                aria-label="Filtros"
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
