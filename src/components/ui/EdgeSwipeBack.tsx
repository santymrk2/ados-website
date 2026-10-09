"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMIT_RATIO,
  INDICATOR_MAX,
  getBackAction,
  isEdgeStart,
  shouldCommitBack,
} from "@/lib/edge-swipe";

// Only the iOS home-screen app lacks a back gesture: Safari tabs have the native edge swipe and
// Android's system back gesture would cancel a custom one
function isIosStandalone(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function EdgeSwipeBack() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  // Lazy init instead of setState in an effect (lint rule); safe for hydration because the
  // component renders null on both server and client until a drag starts
  const [enabled] = useState(isIosStandalone);
  const [dragX, setDragX] = useState(0);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const horizontal = useRef(false);

  useEffect(() => {
    const action = getBackAction(pathname);
    if (!enabled || !action) return;

    const reset = () => {
      start.current = null;
      horizontal.current = false;
      setDragX(0);
    };

    // Passive start: a tap on the back button near the edge still reaches the button
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || !isEdgeStart(t.clientX)) return;
      start.current = { x: t.clientX, y: t.clientY, t: e.timeStamp };
      horizontal.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      if (!horizontal.current) {
        // A vertical scroll that starts at the edge keeps scrolling
        if (Math.abs(dy) > 10 && Math.abs(dy) > dx) {
          reset();
          return;
        }
        if (dx > 10) horizontal.current = true;
      }
      if (horizontal.current) {
        e.preventDefault(); // keep the page still while dragging back
        setDragX(Math.max(0, dx));
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const committed =
        horizontal.current &&
        shouldCommitBack(
          t.clientX - start.current.x,
          t.clientY - start.current.y,
          e.timeStamp - start.current.t,
          window.innerWidth,
        );
      reset();
      if (!committed) return;
      if (action.type === "push") router.push(action.href);
      else router.back();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", reset);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [enabled, pathname, router]);

  if (!enabled || dragX === 0) return null;

  const progress = Math.min(1, dragX / (window.innerWidth * COMMIT_RATIO));
  const offset = Math.min(dragX, INDICATOR_MAX);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-0 top-1/2 z-[70] flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-colors",
        progress >= 1
          ? "bg-primary text-primary-foreground"
          : "bg-card text-foreground border border-border",
      )}
      style={{ transform: `translate(${offset - 44}px, -50%)`, opacity: 0.3 + 0.7 * progress }}
    >
      <ChevronLeft className="h-5 w-5" />
    </div>
  );
}
