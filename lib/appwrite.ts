import { Client, Databases } from "node-appwrite";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env.local and configure it.`);
  return value;
}

export function getDatabase() {
  const client = new Client()
    .setEndpoint(required("APPWRITE_ENDPOINT"))
    .setProject(required("APPWRITE_PROJECT_ID"))
    .setKey(required("APPWRITE_API_KEY"));
  return {
    db: new Databases(client),
    databaseId: required("APPWRITE_DATABASE_ID"),
    collectionId: required("APPWRITE_COLLECTION_ID")
  };
}