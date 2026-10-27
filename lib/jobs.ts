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
  let saved = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
const docId = `j${(await hashUrl(item.url)).slice(0, 35)}`;
    try {
      await db.createDocument(
  databaseId,
  collectionId,
  docId,
  item
);

      saved++;
    } catch (error: unknown) {
      const err = error as {
        code?: number;
        message?: string;
        type?: string;
      };

      // Appwrite 409 means this document already exists.
      if (err.code === 409) {
        skipped++;
        continue;
      }

      const detail =
        `URL: ${item.url} | ` +
        `Code: ${err.code ?? "unknown"} | ` +
        `Type: ${err.type ?? "unknown"} | ` +
        `Error: ${err.message ?? "Unknown error"}`;

      errors.push(detail);
      console.error("[Job save failed]", detail);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Saved ${saved}, skipped ${skipped}, failed ${errors.length}. ` +
      errors.slice(0, 3).join("\n")
    );
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