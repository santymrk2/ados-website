// Swipe-from-the-left-edge back gesture rules (iOS home-screen app only, see EdgeSwipeBack)
export const EDGE_WIDTH = 24; // px from the left edge where a back swipe may start
export const COMMIT_RATIO = 0.35; // drag at least this share of the screen width...
export const FLICK_VELOCITY = 0.5; // ...or flick faster than this (px/ms)
export const MIN_FLICK_DISTANCE = 40; // a flick still needs some travel, so a twitch is not a back
export const INDICATOR_MAX = 72; // px the indicator travels with the finger

export type BackAction = { type: "push"; href: string } | { type: "back" };

// Mirrors each screen's own back button; null on root screens (no gesture)
export function getBackAction(pathname: string): BackAction | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (/^\/activities\/[^/]+(\/.*)?$/.test(p)) return { type: "push", href: "/activities" };
  if (/^\/participants\/.+$/.test(p)) return { type: "back" };
  return null;
}

export function isEdgeStart(clientX: number): boolean {
  return clientX <= EDGE_WIDTH;
}

export function shouldCommitBack(dx: number, dy: number, elapsedMs: number, viewportWidth: number): boolean {
  if (dx <= 0 || Math.abs(dy) > dx) return false; // must move mostly to the right
  if (dx >= viewportWidth * COMMIT_RATIO) return true;
  return elapsedMs > 0 && dx >= MIN_FLICK_DISTANCE && dx / elapsedMs >= FLICK_VELOCITY;
}
