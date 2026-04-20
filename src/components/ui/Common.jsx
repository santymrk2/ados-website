import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

// MIGRADO: Modal → Dialog de shadcn/ui
export function Modal({ title, onClose, children, isLoading = false }) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[90vw] max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl p-0 border-0 max-h-[90vh]"
      >
        <DialogHeader className="p-4 border-b border-surface-dark bg-white sticky top-0">
          <div className="flex items-center w-full justify-between">
            <DialogTitle className="font-black text-lg text-dark">
              {title}
            </DialogTitle>
            <Button
              onClick={handleClose}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              className={cn(
                "w-11 h-11 rounded-full text-dark p-0 border-0 transition-all",
                isLoading
                  ? "bg-gray-500 cursor-not-allowed opacity-60 hover:bg-gray-500"
                  : "bg-primary hover:bg-primary/90 text-white",
              )}
              title={isLoading ? "Guardando..." : "Cerrar sin guardar"}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M6 6L14 14M6 14L14 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </div>
        </DialogHeader>
        <div className="p-3 md:p-5 overflow-y-auto max-h-[calc(90vh-70px)]">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// MANTENIDO: PageHeader con estilos mejorados
export function PageHeader({ title, sub = "" }) {
  return (
    <div className="bg-primary pt-safe">
      <div className="text-white p-4">
        <div
          className="text-2xl font-black tracking-tight"
          style={{ fontFamily: "ClashGrotesk, sans-serif" }}
        >
          ACTIVADOS
        </div>
        <div className="flex justify-between items-end mt-1">
          <h2 className="text-lg font-bold opacity-80">{title}</h2>
          {sub && <div className="text-sm opacity-60">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

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
export function Label({ children, style }) {
  return (
    <ShadcnLabel
      className="text-xs text-text-muted font-bold uppercase tracking-wide mb-2 block"
      style={style}
    >
      {children}
    </ShadcnLabel>
  );
}

// MANTENIDO: Empty con mejoras
export function Empty({ text, className = "" }) {
  return <div className={cn("text-center py-8 text-text-muted text-sm", className)}>{text}</div>;
}

// MIGRADO: InfoCard → Card de shadcn/ui
export function InfoCard({ text }) {
  return (
    <Card className="border-surface-dark bg-surface-dark">
      <CardContent className="pt-6 text-sm text-text-muted leading-relaxed">
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
export function PillCheck({ label, icon: Icon, active, onClick, color, disabled = false }) {
  return (
    <Toggle
      pressed={active}
      onPressedChange={onClick}
      disabled={disabled}
      className={cn(
        "px-2 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-opacity-90 transition-colors",
        active ? "border-opacity-40" : "border-opacity-100",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      style={{
        border: `1px solid ${active ? color + "66" : "#e5e5e5"}`,
        backgroundColor: active ? color + "33" : "#f5f5f5",
        color: active ? color : "#999",
      }}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" /> : label}
    </Toggle>
  );
}
