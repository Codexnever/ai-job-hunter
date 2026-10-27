import type { Job } from "@/lib/jobs";

type ExaResult = { title?: string; url?: string; publishedDate?: string; author?: string; highlights?: string[]; text?: string };
const QUERIES = (process.env.JOB_SEARCH_QUERIES || [
  "AI retrieval engineer jobs",
  "AI search engineer jobs",
  "vector database engineer jobs",
  "backend AI engineer jobs",
  "machine learning infrastructure engineer jobs"
].join(",")).split(",").map(s=>s.trim()).filter(Boolean);

const PROFILE = [
  "TypeScript", "JavaScript", "Python", "Next.js", "React", "Node.js",
  "Appwrite", "Weaviate", "Qdrant", "Pinecone", "Cohere", "Elastic", "vector search", "retrieval evaluation", "search quality",
  "AI search", "ranking", "embeddings", "RAG"
];

function score(text:string) {
  const normalized = text.toLowerCase();
  const hits = PROFILE.filter(skill=>normalized.includes(skill.toLowerCase()));
  const roleTerms = ["retrieval","search","vector","embedding","ranking","machine learning","ai engineer","backend","rag"];
  const roleHits = roleTerms.filter(term=>normalized.includes(term)).length;
  return Math.min(98, Math.round((hits.length / 8) * 65 + (roleHits / 5) * 35));
}

function companyFrom(title:string, url:string) {
  const match = title.match(/\bat\s+(.+)$/i);
  if (match) return match[1].trim().slice(0,100);
  try { return new URL(url).hostname.replace(/^www\./,""); } catch { return "Unknown"; }
}

export async function discoverJobs(): Promise<Omit<Job,"$id">[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("Missing EXA_API_KEY. Add your Exa key to .env.local.");
  const all: Omit<Job,"$id">[] = [];
  for (const query of QUERIES) {
    const response = await fetch("https://api.exa.ai/search", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey},
      body:JSON.stringify({
query: `${query}. Find real job openings and official company career pages for AI engineers, AI search engineers, retrieval engineers, search infrastructure engineers, machine learning infrastructure engineers, and backend engineers working on AI products. Prioritize roles involving information retrieval, semantic search, vector databases, embeddings, reranking, RAG, search relevance, ranking systems, evaluation, and AI infrastructure. Consider companies working across the AI ecosystem, including search and retrieval platforms, vector databases, foundation models, and AI developer tools. Look for opportunities at companies such as Exa, Weaviate, Qdrant, Pinecone, Elastic, Cohere, Perplexity, Vectara, and other relevant AI companies, without limiting results to these names. Evaluate opportunities based on the actual technical requirements and the candidate's demonstrated projects and skills, rather than requiring a specific job title or tech stack. Include remote roles and positions open to applicants based in India, as well as relocation opportunities. Prefer currently open positions with direct application links.`,
        type:"auto", numResults:10,
        contents:{highlights:true}
      }),
      cache:"no-store"
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Exa API error (${response.status}): ${body.slice(0,250)}`);
    }
    const data = await response.json() as {results?:ExaResult[]};
    for (const result of data.results || []) {
      if (!result.url || !result.title || !/^https?:\/\//i.test(result.url)) continue;
      const description = (result.highlights || []).join(" ").slice(0,1800);
      const combined = `${result.title} ${description} ${result.url}`;
      const looksRelevant = /job|career|engineer|developer|hiring|apply|vacan|recruit|employment|work at/i.test(combined);
      if (!looksRelevant) continue;
      all.push({
        title:result.title.slice(0,250),
        company:companyFrom(result.title,result.url),
        url:result.url.slice(0,1500),
        location:/remote/i.test(combined)?"Remote / check listing":"Not specified",
        description:description || "Open the original listing to review the role details.",
        source:"Exa",
        score:score(combined),
        status:"new",
        discoveredAt:new Date().toISOString(),
        query
      });
    }
  }
  const unique = new Map<string,Omit<Job,"$id">>();
  for (const job of all) {
    const key = job.url.replace(/\/$/,"").split("?")[0].toLowerCase();
    if (!unique.has(key) || unique.get(key)!.score < job.score) unique.set(key,job);
  }
  return [...unique.values()].sort((a,b)=>b.score-a.score);
}