import { NextRequest, NextResponse } from "next/server";
import { eventBus } from "@/lib/eventBus";
import { requireAuth } from "@/lib/api-utils";

const encoder = new TextEncoder();

// Frequent enough to survive typical proxy idle timeouts (30-60s) without waking every client constantly
const PING_INTERVAL_MS = 15000;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  let isClosed = false;
  let interval: NodeJS.Timeout | undefined;
  let notify: (() => void) | undefined;

  // Single teardown path shared by abort, cancel and failed writes
  const cleanup = (controller?: ReadableStreamDefaultController) => {
    if (isClosed) return;
    isClosed = true;
    if (notify) {
      eventBus.off("data-changed", notify);
      eventBus.off("rankings-changed", notify);
    }
    if (interval) clearInterval(interval);
    try {
      controller?.close();
    } catch {
      // Already closed by the runtime
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch (e) {
          // The client is gone: stop pushing and free the listeners
          console.error("[SSE] Error sending update:", e);
          cleanup(controller);
        }
      };

      notify = () => send("data: update\n\n");

      eventBus.on("data-changed", notify);
      eventBus.on("rankings-changed", notify);

      interval = setInterval(() => send(": ping\n\n"), PING_INTERVAL_MS);

      request.signal.addEventListener("abort", () => cleanup(controller));
    },
    cancel() {
      cleanup();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
