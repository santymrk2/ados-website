"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

// Gold, silver and bronze: the same podium palette the app already used
const MEDALS = ["#F59E0B", "#94A3B8", "#B45309"];

/** A number that counts up when it appears (and when its value changes). */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(reduce ? value : 0);
  const text = useTransform(motionValue, (v) => String(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, motionValue]);

  return <motion.span className={cn("tabular-nums", className)}>{text}</motion.span>;
}

/** Short entrance (fade + rise); `index` staggers consecutive blocks. */
export function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(index, 6) * 0.06 }}
    >
      {children}
    </motion.div>
  );
}

/** Section heading that opens the full list: "Title ›". */
export function SectionTitle({ title, onOpen }: { title: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group mb-3 flex select-none items-center gap-1"
    >
      <span className="text-xl font-black tracking-tight text-foreground">{title}</span>
      <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-active:translate-x-1" />
    </button>
  );
}

export function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

interface LeaderRowProps {
  p: {
    nombre?: string | null;
    apellido?: string | null;
    sexo?: string | null;
    foto?: string | null;
  };
  pos: number;
  value: number;
  unit: string;
  /** Value of the leader: the thin bar shows each row relative to it. */
  max: number;
  onClick?: () => void;
}

/** Ranking row: avatar with position badge, name, relative bar and the value on the right. */
export function LeaderRow({ p, pos, value, unit, max, onClick }: LeaderRowProps) {
  const medal = pos <= 3 ? MEDALS[pos - 1] : null;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;

  const content = (
    <>
      <div className="relative shrink-0">
        <Avatar p={p} size={44} />
        <span
          className={cn(
            "absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full text-[11px] font-black ring-2 ring-card",
            medal ? "text-white" : "bg-muted text-muted-foreground",
          )}
          style={medal ? { backgroundColor: medal } : undefined}
        >
          {pos}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold leading-tight text-foreground">
          {p.nombre} {p.apellido}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full origin-left rounded-full", !medal && "bg-muted-foreground/30")}
            style={medal ? { backgroundColor: medal } : undefined}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-2xl font-black leading-none tabular-nums text-foreground">{value}</div>
        <div className="mt-1 text-xs font-bold text-muted-foreground">{unit}</div>
      </div>
    </>
  );

  const base = "flex w-full items-center gap-3 px-4 py-3";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, "text-left transition-colors hover:bg-muted active:bg-muted")}
      >
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition-colors active:scale-95",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Row of pills that scrolls sideways; several can be on, and the first one clears the selection. */
export function ChipFilter({
  allLabel,
  options,
  selected,
  onChange,
}: {
  allLabel: string;
  options: readonly { id: number; label: string }[];
  selected: number[];
  onChange: (next: number[]) => void;
}) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip active={selected.length === 0} onClick={() => onChange([])}>
        {allLabel}
      </Chip>
      {options.map((option) => (
        <Chip key={option.id} active={selected.includes(option.id)} onClick={() => toggle(option.id)}>
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

interface SegmentOption<T extends string> {
  key: T;
  label: string;
  Icon?: ComponentType<{ className?: string }>;
}

/** Pill selector with a highlight that slides between options. */
export function SegmentedControl<T extends string>({
  id,
  value,
  options,
  onChange,
  className,
}: {
  id: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 grid grid-flow-col auto-cols-fr rounded-full bg-muted p-1", className)}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={cn(
              "relative flex items-center justify-center whitespace-nowrap rounded-full px-2 py-2 text-sm font-bold transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segment-${id}`}
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.Icon && <option.Icon className="size-4" />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
