import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'myoffice';

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;
  if (cachedClient) return cachedClient.db(dbName);
  const client = await MongoClient.connect(uri);
  cachedClient = client;
  cachedDb = client.db(dbName);
  return cachedDb;
}

export function getDb() {
  return cachedDb;
}
