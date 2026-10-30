import fs from "node:fs";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";

export function createDb(options = {}) {
  const url = options.url ?? process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url, max: 5 });
    return {
      kind: "postgres",
      async query(text, params = []) {
        const result = await pool.query(text, params);
        return result.rows;
      },
      async tx(work) {
        const client = await pool.connect();
        const q = {
          async query(text, params = []) {
            return (await client.query(text, params)).rows;
          },
        };
        try {
          await client.query("BEGIN");
          const result = await work(q);
          await client.query("COMMIT");
          return result;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  }
  // dataDir: a folder path keeps data between restarts; null/undefined keeps it in memory.
  // PGlite will not create parent folders itself, so make ".data" first.
  if (options.dataDir && !options.dataDir.includes("://")) fs.mkdirSync(options.dataDir, { recursive: true });
  const lite = new PGlite(options.dataDir ?? undefined);
  return {
    kind: "pglite",
    async query(text, params = []) {
      const result = await lite.query(text, params);
      return result.rows;
    },
    async tx(work) {
      return lite.transaction(async (t) => {
        const q = {
          async query(text, params = []) {
            return (await t.query(text, params)).rows;
          },
        };
        return work(q);
      });
    },
    close: () => lite.close(),
  };
}
