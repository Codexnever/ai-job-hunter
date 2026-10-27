import { listJobs } from "@/lib/jobs";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  let jobs: any[] = [];
  let setupError = "";
  try { jobs = await listJobs(); }
  catch (error) { setupError = error instanceof Error ? error.message : "Could not load jobs."; }
  return <Dashboard initialJobs={jobs} setupError={setupError} />;
}