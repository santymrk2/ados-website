import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMissingEnvVars, REQUIRED_AUTH_ENV_VARS } from "@/lib/api-utils";
import { participants } from "@/lib/schema";

export async function GET() {
  try {
    const missingEnvVars = getMissingEnvVars(["DATABASE_URL", ...REQUIRED_AUTH_ENV_VARS]);
    if (missingEnvVars.length > 0) {
      console.error(`[Health] Missing required environment variables: ${missingEnvVars.join(", ")}`);
      return NextResponse.json({ status: 'error' }, { status: 503 });
    }

    await db.select().from(participants).limit(1);
    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    console.error("[Health] Database check failed:", e);
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
