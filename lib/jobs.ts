import { ID, Query } from "node-appwrite";
import { getDatabase } from "@/lib/appwrite";

export type JobStatus = "new" | "interested" | "applied" | "rejected";
export type Job = {
  $id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  description: string;
  source: string;
  score: number;
  status: JobStatus;
  discoveredAt: string;
  query: string;
};

export async function listJobs(): Promise<Job[]> {
  const { db, databaseId, collectionId } = getDatabase();

  const response = await db.listDocuments(
    databaseId,
    collectionId,
    [Query.orderDesc("discoveredAt"), Query.limit(100)]
  );

  return response.documents as unknown as Job[];
}

export async function saveJobs(items: Omit<Job, "$id">[]) {
  const { db, databaseId, collectionId } = getDatabase();
  let saved = 0,
    skipped = 0;

  for (const item of items) {
    try {
      // URL is the stable identity; Appwrite document IDs cannot contain arbitrary URLs.
      const docId = `j${await hashUrl(item.url)}`;
      try {
        await db.getDocument(databaseId, collectionId, docId);
        skipped++;
      } catch {
        await db.createDocument(databaseId, collectionId, docId, item);
        saved++;
      }
    } catch (error) {
      // Avoid silently hiding a configuration/permission issue.
      if (
        error instanceof Error &&
        /permission|unauthorized|collection|database/i.test(error.message)
      ) {
        throw error;
      }
      skipped++;
    }
  }

  return { saved, skipped };
}

async function hashUrl(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 20)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const { db, databaseId, collectionId } = getDatabase();
  return db.updateDocument(databaseId, collectionId, id, { status });
}