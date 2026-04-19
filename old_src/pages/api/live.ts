import type { APIRoute } from "astro";
import { eventBus } from "../../lib/eventBus";

const encoder = new TextEncoder(); // fuera del handler para reusar

export const GET: APIRoute = async ({ request }) => {
  let isClosed = false;
  let interval: any;
  let notify: () => void;

  const stream = new ReadableStream({
    start(controller) {
      notify = () => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode("data: update\n\n")); // ← encode
        } catch (e) {}
      };

      eventBus.on("data-changed", notify);

      interval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n")); // ← encode
        } catch (e) {}
      }, 5000);

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

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
