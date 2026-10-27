import { NextResponse } from "next/server";
import { discoverJobs } from "@/lib/search";
import { saveJobs } from "@/lib/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request:Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({error:"CRON_SECRET is not configured."},{status:500});
  const auth = request.headers.get("authorization");
  const supplied = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  if (supplied !== expected) return NextResponse.json({error:"Unauthorized."},{status:401});
  try {
    const discovered = await discoverJobs();
    const result = await saveJobs(discovered);
    return NextResponse.json({ok:true,found:discovered.length,...result});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed.";
    return NextResponse.json({error:message},{status:500});
  }
}