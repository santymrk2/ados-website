import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participants } from "@/lib/schema";

export async function GET() {
  try {
    await db.select().from(participants).limit(1);
    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    return NextResponse.json({ status: 'error', message: (e as Error).message }, { status: 503 });
  }
}