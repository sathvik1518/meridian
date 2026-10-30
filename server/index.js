import { createApp } from "./app.js";
import { createDb } from "./db.js";

const port = Number(process.env.PORT) || 4000;

const db = createDb({ dataDir: process.env.DATABASE_URL ? undefined : (process.env.PGLITE_DIR ?? ".data/pglite") });

const app = createApp(db);
app.listen(port, () => {
  console.log(`Meridian API on http://localhost:${port}  (database: ${db.kind})`);
});
