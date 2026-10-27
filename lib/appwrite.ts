import { Client, Databases } from "node-appwrite";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Check your .env.local file.`);
  }
  return value;
}

export function getDatabase() {
  const endpoint = required("APPWRITE_ENDPOINT");
  const projectId = required("APPWRITE_PROJECT_ID");
  const apiKey = required("APPWRITE_API_KEY");
  const databaseId = required("APPWRITE_DATABASE_ID");
  const collectionId = required("APPWRITE_COLLECTION_ID");

  // Log in server terminal to verify
  console.log("Connecting to Appwrite Endpoint:", endpoint, collectionId);

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    db: new Databases(client),
    databaseId,
    collectionId,
  };
}