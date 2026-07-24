import { cn } from "@/lib/utils";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

// MEJORADO: Section con Card de shadcn/ui
export function Section({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-5 h-5 text-primary" />}
      <div className="font-bold text-base">{title}</div>
    </div>
  );
}

// MIGRADO: Label → Label de shadcn/ui
export function Label({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
} = {}) {
  return (
    <ShadcnLabel
      className={
        "text-xs text-muted-foreground font-bold uppercase tracking-wide mb-2 block" +
        (className ? " " + className : "")
      }
      style={style}
    >
      {children}
    </ShadcnLabel>
  );
}

// MANTENIDO: Empty con mejoras
export function Empty({ text, className = "" }) {
  return (
    <div className={cn("text-center py-8 text-muted-foreground text-sm", className)}>
      {text}
    </div>
  );
}

// MIGRADO: InfoCard → Card de shadcn/ui
export function InfoCard({ text }) {
  return (
    <Card className="border-border bg-muted">
      <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
        {text}
      </CardContent>
    </Card>
  );
}

// MIGRADO: SegmentedButtons → Button de shadcn/ui
export function SegmentedButtons({
  options,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className={cn(
        "flex gap-2 mb-3",
        disabled && "opacity-60 pointer-events-none",
      )}
    >
      {options.map(({ val, label, color }) => (
        <Button
          key={val}
          onClick={() => !disabled && onChange(val)}
          disabled={disabled}
          className={cn(
            "flex-1 py-3 rounded-lg font-bold text-sm border-none transition-colors",
            value === val
              ? "cursor-pointer"
              : "cursor-pointer hover:opacity-80",
            disabled && "cursor-not-allowed",
          )}
          style={{
            backgroundColor: value === val ? color || "#4342FF" : "#e5e5e5",
            color: value === val ? (color ? "black" : "white") : "#666",
          }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

// MIGRADO: PillCheck → Toggle de shadcn/ui
export function PillCheck({
  label,
  icon: Icon,
  active,
  onClick,
  color,
  disabled = false,
  className,
}: {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  color: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Toggle
      pressed={active}
      onPressedChange={onClick}
      disabled={disabled}
      className={cn(
        "px-2 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-opacity-90 transition-colors font-semibold",
        className,
          active ? "border-opacity-40" : "border-opacity-100",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
        style={{
          border: `1px solid ${active ? color + "66" : "#e5e5e5"}`,
          backgroundColor: active ? color + "33" : "#f5f5f5",
          color: active ? color : "#999",
        }}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label && <span className="text-xs font-medium">{label}</span>}
      </Toggle>
  );
}
