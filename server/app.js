import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs";
import { initDb } from "./seed.js";
import { errorHandler, requireAuth } from "./http.js";
import { authRoutes } from "./routes/auth.js";
import { productRoutes } from "./routes/products.js";
import { orderRoutes } from "./routes/orders.js";
import { insightRoutes } from "./routes/insights.js";

export function createApp(db) {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  // Create the tables and seed data once, before the first request is answered.
  const ready = initDb(db);
  app.use("/api", async (_req, _res, next) => {
    await ready;
    next();
  });
  app.get("/api/health", (_req, res) => void res.json({ ok: true, database: db.kind }));
  app.use("/api/auth", authRoutes(db));
  // Generated product pictures are public (they are just pictures); everything else needs a session.
  const publicPath = /^\/art\//;
  const auth = requireAuth(db);
  app.use("/api", (req, res, next) => (publicPath.test(req.path) ? next() : auth(req, res, next)));
  app.use("/api", productRoutes(db), orderRoutes(db), insightRoutes(db));
  app.use("/api", (_req, res) => void res.status(404).json({ message: "No such endpoint." }));
  // When deployed as one process (not on Vercel), serve the built React app too.
  const dist = path.resolve(process.cwd(), "dist");
  if (process.env.SERVE_STATIC === "1" && fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (_req, res) => void res.sendFile(path.join(dist, "index.html")));
  }
  app.use(errorHandler);
  return app;
}
