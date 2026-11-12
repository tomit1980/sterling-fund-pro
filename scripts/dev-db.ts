/**
 * Local development database: starts an embedded PostgreSQL cluster (no Docker needed).
 *
 *   npm run db:start          # start (idempotent; initialises the cluster on first run)
 *   npm run db:stop           # stop a running cluster
 *
 * Connection string matches .env.example: postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, ".data", "pg");
const PID_FILE = path.join(ROOT, ".data", "pg.pid");
const PORT = Number(process.env.DEV_PG_PORT ?? 5433);
const USER = "sfp";
const PASSWORD = "sfp";
const DB_NAME = process.env.DEV_PG_DB ?? "sterling_fund_pro";

function pg(onLog = (m: unknown) => console.log(String(m).trim())) {
  return new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    authMethod: "password",
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog,
    onError: (m: unknown) => {
      const s = String(m).trim();
      if (s) console.error(s);
    },
  });
}

async function start() {
  mkdirSync(path.dirname(DATA_DIR), { recursive: true });
  const instance = pg();
  const fresh = !existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (fresh) {
    console.log(`[dev-db] initialising cluster in ${DATA_DIR}`);
    await instance.initialise();
  }
  console.log(`[dev-db] starting PostgreSQL on 127.0.0.1:${PORT}`);
  await instance.start();
  if (fresh) {
    await instance.createDatabase(DB_NAME);
    console.log(`[dev-db] created database ${DB_NAME}`);
  } else {
    // Ensure the database exists even if a previous run was interrupted.
    const client = instance.getPgClient();
    await client.connect();
    const r = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
    if (r.rowCount === 0) await client.query(`CREATE DATABASE "${DB_NAME}"`);
    await client.end();
  }
  writeFileSync(PID_FILE, String(process.pid));
  console.log(`[dev-db] ready: postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}`);
  console.log("[dev-db] press Ctrl+C to stop");

  const shutdown = async () => {
    console.log("\n[dev-db] stopping…");
    try {
      await instance.stop();
    } finally {
      if (existsSync(PID_FILE)) rmSync(PID_FILE);
      process.exit(0);
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  // keep alive
  setInterval(() => {}, 1 << 30);
}

async function stop() {
  // Stopping = sending pg_ctl stop through a fresh instance bound to the same data dir.
  const instance = pg(() => {});
  try {
    await instance.stop();
    console.log("[dev-db] stopped");
  } catch (err) {
    console.error("[dev-db] stop failed (is it running?)", err instanceof Error ? err.message : err);
  }
  if (existsSync(PID_FILE)) {
    const pid = Number(readFileSync(PID_FILE, "utf8"));
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already gone */
    }
    rmSync(PID_FILE);
  }
}

const cmd = process.argv[2] ?? "start";
(cmd === "stop" ? stop() : start()).catch((err) => {
  console.error("[dev-db] error", err);
  process.exit(1);
});
