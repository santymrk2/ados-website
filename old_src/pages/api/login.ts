import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password, role } = body;

    // Default passwords
    const DEFAULT_ADMIN_PASSWORD = "activados2026";
    const DEFAULT_VIEWER_PASSWORD = "viewer2026";

    // Get passwords from env, fallbacks to defaults
    const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const viewerPassword = process.env.VIEWER_PASSWORD || DEFAULT_VIEWER_PASSWORD;

    // Validate based on selected role
    if (role === "admin") {
      if (password === adminPassword) {
        return new Response(JSON.stringify({ success: true, role: "admin" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (role === "viewer") {
      if (password === viewerPassword) {
        return new Response(JSON.stringify({ success: true, role: "viewer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Legacy: if no role specified, check admin password (backwards compatibility)
      if (password === adminPassword) {
        return new Response(JSON.stringify({ success: true, role: "admin" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Contraseña incorrecta" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Error en el servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
