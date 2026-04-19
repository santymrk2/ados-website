"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateString = (date: Date) => {
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  defaultMonth,
  captionLayout = "buttons",
}: {
  mode?: "single";
  selected?: string | Date;
  onSelect?: (date: string | Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  defaultMonth?: Date;
  captionLayout?: "buttons" | "dropdown";
}) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (defaultMonth) return defaultMonth;
    if (selected) {
      const d = selected instanceof Date ? selected : parseLocalDate(selected);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];


  const isSelected = (date: Date) => {
    if (!selected) return false;
    const selectedDate =
      selected instanceof Date ? selected : parseLocalDate(selected);
    return formatDateString(date) === formatDateString(selectedDate);
  };

  const isDisabled = (date: Date) => {
    if (!disabled) return false;
    return disabled(date);
  };

  const handleSelect = (date: Date) => {
    const dateStr = formatDateString(date);
    onSelect?.(dateStr);
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value);
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
  };

  const years = Array.from(
    { length: 50 },
    (_, i) => new Date().getFullYear() - 25 + i,
  );

  return (
    <div data-slot="calendar" className="p-3">
      <div className="flex items-center justify-between mb-3">
        {captionLayout === "dropdown" ? (
          <div className="flex gap-1 flex-1">
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
            >
              {monthNames.map((month, idx) => (
                <option key={month} value={idx}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-bold text-sm">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const selectedDate = isSelected(date);
          const disabledDate = isDisabled(date);

          return (
            <button
              key={index}
              type="button"
              disabled={disabledDate}
              onClick={() => handleSelect(date)}
              className={cn(
                "h-9 w-9 rounded-lg text-sm font-medium transition-colors",
                selectedDate && "bg-primary text-primary-foreground",
                !selectedDate && !disabledDate && "hover:bg-accent",
                disabledDate && "opacity-50 cursor-not-allowed",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled = false,
}: {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = parseLocalDate(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-AR");
  };

  const handleSelect = (date: string | Date | undefined) => {
    if (date) {
      const dateStr = typeof date === "string" ? date : formatDateString(date);
      onChange?.(dateStr);
      setOpen(false);
    } else {
      onChange?.("");
      setOpen(false);
    }
  };


  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDisplayDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="w-auto overflow-hidden p-0 z-[10051]"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { Calendar, DatePicker };
