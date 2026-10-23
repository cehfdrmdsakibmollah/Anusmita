
import mongoose from "mongoose";
const url = process.env.MONGODB_URI;
type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const state = globalThis as typeof globalThis & { __anusmitaMongoose?: Cached };
const cache = state.__anusmitaMongoose ?? (state.__anusmitaMongoose = { conn: null, promise: null });
export async function db() {
  if (!url) throw new Error("MONGODB_URI is required");
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(url, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
  try { cache.conn = await cache.promise; return cache.conn; }
  catch (error) { cache.promise = null; throw error; }
}
