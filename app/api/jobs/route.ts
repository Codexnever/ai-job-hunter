import { NextResponse } from "next/server";
import { listJobs } from "@/lib/jobs";

export async function GET() {
  try { return NextResponse.json({jobs:await listJobs()}); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load jobs.";
    return NextResponse.json({error:message},{status:500});
  }
}