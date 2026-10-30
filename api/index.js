// Vercel runs this file as a serverless function; vercel.json sends every /api/* request here.
import { createApp } from "../server/app.js";
import { createDb } from "../server/db.js";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL (a Postgres connection string, e.g. from Neon) in the Vercel project settings.");
export default createApp(createDb());
