import { NextRequest, NextResponse } from "next/server";
import { eventBus } from "@/lib/eventBus";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {

  let isClosed = false;
  let interval: NodeJS.Timeout;
  let notify: () => void;

  const stream = new ReadableStream({
    start(controller) {
      notify = () => {
        if (isClosed) return;
        try {

          controller.enqueue(encoder.encode("data: update\n\n"));
        } catch (e) {
          console.error("[SSE] Error sending update:", e);
        }
      };

      // Listen to data-changed events
      eventBus.on("data-changed", notify);


      // Send ping every 5 seconds to keep connection alive
      interval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch (e) {}
      }, 5000);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {

        isClosed = true;
        eventBus.off("data-changed", notify);
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {}
      });
    },
    cancel() {

      isClosed = true;
      eventBus.off("data-changed", notify);
      clearInterval(interval);
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