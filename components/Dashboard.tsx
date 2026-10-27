"use client";
import { useMemo, useState } from "react";

type Job = {
  $id:string; title:string; company:string; url:string; location:string;
  description:string; source:string; score:number; status:"new"|"interested"|"applied"|"rejected";
  discoveredAt:string; query:string;
};
type Props = {initialJobs:Job[]; setupError:string};

export default function Dashboard({initialJobs,setupError}:Props) {
  const [jobs,setJobs] = useState(initialJobs);
  const [search,setSearch] = useState("");
  const [status,setStatus] = useState("all");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState(setupError);

  const filtered = useMemo(()=>jobs.filter(job=>{
    const q=search.toLowerCase();
    const matches = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase().includes(q);
    return matches && (status==="all" || job.status===status);
  }).sort((a,b)=>b.score-a.score),[jobs,search,status]);

  async function discover() {
    const secret=window.prompt("Enter your CRON_SECRET. This protects the discovery endpoint.");
    if(!secret) return;
    setBusy(true);setError("");setMessage("Searching the web with Exa...");
    try {
      const response=await fetch("/api/discover",{method:"POST",headers:{"authorization":`Bearer ${secret}`}});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Discovery failed.");
      setMessage(`Found ${data.found} results. Saved ${data.saved}; skipped ${data.skipped} duplicates.`);
      const fresh=await fetch("/api/jobs");
      const list=await fresh.json();
      if(!fresh.ok) throw new Error(list.error||"Could not refresh jobs.");
      setJobs(list.jobs);
    } catch(e) {setError(e instanceof Error?e.message:"Something went wrong.");setMessage("");}
    finally {setBusy(false);}
  }

  async function changeStatus(job:Job,next:Job["status"]) {
    const secret=window.prompt("Enter your CRON_SECRET to update this job.");
    if(!secret)return;
    try {
      const response=await fetch(`/api/jobs/${encodeURIComponent(job.$id)}`,{
        method:"PATCH",headers:{"content-type":"application/json","authorization":`Bearer ${secret}`},
        body:JSON.stringify({status:next})
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not update status.");
      setJobs(prev=>prev.map(item=>item.$id===job.$id?{...item,status:next}:item));
    }catch(e){setError(e instanceof Error?e.message:"Could not update status.");}
  }

  const count=(s:string)=>jobs.filter(j=>s==="all"||j.status===s).length;
  return <main className="shell">
    <header className="top">
      <div className="brand"><div className="logo">J</div><div><h1>AI Job Hunter</h1><p className="sub">A calmer way to find your next AI engineering role.</p></div></div>
      <div className="actions"><button className="btn" onClick={()=>location.reload()}>↻ Refresh</button><button className="btn primary" onClick={discover} disabled={busy}>{busy?"Searching…":"+ Discover jobs"}</button></div>
    </header>
    {error && <div className="notice error"><strong>Setup / request issue:</strong> {error}<br/>Check your environment variables and Appwrite permissions, then refresh.</div>}
    {message && <div className="notice">{message}</div>}
    <section className="stats">
      <div className="stat"><small>Total discovered</small><strong>{jobs.length}</strong></div>
      <div className="stat"><small>New to review</small><strong>{count("new")}</strong></div>
      <div className="stat"><small>Interested</small><strong>{count("interested")}</strong></div>
      <div className="stat"><small>Applied</small><strong>{count("applied")}</strong></div>
    </section>
    <section className="panel">
      <div className="filters">
        <input type="search" placeholder="Search roles, companies, skills…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="all">All statuses</option><option value="new">New</option><option value="interested">Interested</option><option value="applied">Applied</option><option value="rejected">Rejected</option>
        </select>
      </div>
    </section>
    <section>
      <div className="section-title"><h2>Opportunities</h2><span className="sub">{filtered.length} shown · best keyword matches first</span></div>
      <div className="jobs">
        {filtered.map(job=><article className="job" key={job.$id}>
          <div>
            <h3>{job.title}</h3><span className="company">{job.company}</span><span className="pill">{job.score}% keyword match</span>
            <div className="meta"><span>⌖ {job.location}</span><span>·</span><span>Found {new Date(job.discoveredAt).toLocaleDateString()}</span><span>·</span><span>{job.source}</span></div>
            <p className="desc">{job.description || "Open the listing to review the full description."}</p>
            <div className="meta"><span>Search: {job.query}</span></div>
          </div>
          <div className="job-actions">
            <a className="btn" href={job.url} target="_blank" rel="noreferrer">Open listing ↗</a>
            <select aria-label={`Status for ${job.title}`} value={job.status} onChange={e=>changeStatus(job,e.target.value as Job["status"])}>
              <option value="new">New</option><option value="interested">Interested</option><option value="applied">Applied</option><option value="rejected">Rejected</option>
            </select>
          </div>
        </article>)}
        {filtered.length===0 && <div className="panel empty"><h3>No jobs yet</h3><p>Set up Exa and Appwrite, then select <strong>Discover jobs</strong> to find your first listings.</p></div>}
      </div>
    </section>
    <p className="foot">Match scores are simple keyword-based estimates, not an AI judgment. Always verify that a role is still open, its location and eligibility, and its details on the employer’s official careers page. This starter does not submit applications automatically.</p>
  </main>;
}