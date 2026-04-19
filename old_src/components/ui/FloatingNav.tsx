"use client"

import * as React from "react"
import { ChevronUp, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  value: string
  label: string
  icon: LucideIcon
}

interface FloatingNavProps {
  value: string
  onValueChange: (value: string) => void
  items: NavItem[]
  lockedValues?: string[]
}

export function FloatingNav({ value, onValueChange, items, lockedValues = [] }: FloatingNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const currentItem = items.find((item) => item.value === value) || items[0]
  const CurrentIcon = currentItem.icon

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 pb-6 pb-safe">
      {/* Dropdown menu - appears above */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 mb-2 -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-white p-1 shadow-lg transition-all duration-200",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <div className="flex w-48 flex-col">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.value === value
            const isLocked = lockedValues.includes(item.value)
            return (
              <button
                key={item.value}
                onClick={() => !isLocked && handleSelect(item.value)}
                disabled={isLocked}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : isLocked
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-foreground/60 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4" />
                {item.label}
                {isLocked && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3 ml-auto text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-surface-dark bg-white px-4 py-2.5 shadow-lg shadow-black/10 transition-all hover:bg-accent",
          isOpen && "bg-accent"
        )}
      >
        <CurrentIcon className="size-4 text-foreground" />
        <span className="text-sm font-medium text-foreground">{currentItem.label}</span>
        <ChevronUp
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
    </div>
  )
}
