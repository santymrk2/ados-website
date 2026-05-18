import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  
  if (!user) {
    return NextResponse.json({ authenticated: false, role: null });
  }
  
  return NextResponse.json({ authenticated: true, role: user.role });
}