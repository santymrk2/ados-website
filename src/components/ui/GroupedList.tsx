import type { ReactNode } from "react";

/** One rounded container with thin dividers between its rows. */
export function GroupedList({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
      {children}
    </div>
  );
}
