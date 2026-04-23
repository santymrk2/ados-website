"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NavItem {
  value: string
  label: string
  icon: LucideIcon
  href?: string
}

interface FloatingNavProps {
  value: string
  items: NavItem[]
  lockedValues?: string[]
  onValueChange?: (value: string) => void
}

export function FloatingNav({ value, items, lockedValues = [], onValueChange }: FloatingNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const currentItem = items.find((item) => item.value === value) || items[0]
  const CurrentIcon = currentItem.icon

  const useCallback = !!onValueChange

  // Click outside para cerrar
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (item: NavItem) => {
    if (lockedValues.includes(item.value)) return
    
    if (useCallback && onValueChange) {
      onValueChange(item.value)
    }
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 pb-6 pb-safe">
      <motion.div
        className={cn(
          "flex rounded-2xl border border-border bg-white shadow-lg overflow-hidden",
          isOpen ? "border-primary" : ""
        )}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        onClick={() => !isOpen && setIsOpen(true)}
        style={{ cursor: "pointer" }}
      >
        {/* Botón principal - solo visible cuando está cerrado */}
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              key="closed"
              className="flex items-center justify-center w-[90px] shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col items-center justify-center gap-1 p-3">
                <CurrentIcon className="size-5 text-foreground" />
                <span className="text-[10px] text-center leading-tight">{currentItem.label}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid de opciones - visible cuando está abierto */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="open"
              className="grid grid-cols-3 gap-1 p-2 w-[300px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {items.map((item) => {
                const Icon = item.icon
                const isActive = item.value === value
                const isLocked = lockedValues.includes(item.value)

                if (isLocked) {
                  return (
                    <button
                      key={item.value}
                      disabled
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border p-3 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                    >
                      <Icon className="size-5" />
                      <span className="text-[10px] text-center leading-tight">{item.label}</span>
                    </button>
                  )
                }

                const href = useCallback ? undefined : (item.href || (item.value ? `/${item.value}` : "/"))

                if (useCallback) {
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border p-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="text-[10px] text-center leading-tight">{item.label}</span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.value}
                    href={href!}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border p-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="size-5" />
                    <span className="text-[10px] text-center leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}