import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    d = `${y}-${m}-${day}`;
  }
  if (typeof d !== 'string') return '';
  const [y, m, day] = d.split('-');
  return `${day} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(m) - 1]} ${y}`;
}

export function isToday(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    d = `${y}-${m}-${day}`;
  }
  if (typeof d !== 'string') return false;
  const today = new Date();
  const [y, m, day] = d.split('-');
  return parseInt(y) === today.getFullYear() && 
         parseInt(m) === today.getMonth() + 1 && 
         parseInt(day) === today.getDate();
}

export function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}