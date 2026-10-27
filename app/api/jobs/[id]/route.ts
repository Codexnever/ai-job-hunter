import { NextResponse } from "next/server";
import { updateJobStatus, type JobStatus } from "@/lib/jobs";

const allowed: JobStatus[] = ["new","interested","applied","rejected"];

export async function PATCH(request:Request, context:{params:Promise<{id:string}>}) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /,"");
  if (!expected || supplied !== expected) return NextResponse.json({error:"Unauthorized."},{status:401});
  try {
    const {id} = await context.params;
    const body = await request.json() as {status?:JobStatus};
    if (!body.status || !allowed.includes(body.status)) return NextResponse.json({error:"Invalid status."},{status:400});
    await updateJobStatus(id,body.status);
    return NextResponse.json({ok:true});
  } catch(error) {
    const message = error instanceof Error ? error.message : "Could not update job.";
    return NextResponse.json({error:message},{status:500});
  }
}