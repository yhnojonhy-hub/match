import { mkdirSync } from "node:fs";
import { writeFileSync, existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const port = 5433;
const superPassword = process.env.POSTGRES_SUPER_PASSWORD ?? "match-local-super";
const migratorPassword = process.env.MATCH_MIGRATOR_PASSWORD ?? "match-local-migrator";
const appPassword = process.env.MATCH_APP_PASSWORD ?? "match-local-app";
const dataDir = "data/postgres";

function quote(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

mkdirSync("data", { recursive: true });

const embedded = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user: "postgres",
  password: superPassword,
  persistent: true,
  onLog: () => {},
  onError: (message) => {
    const text = String(message);
    if (!text.includes("database system is ready")) console.error(text);
  },
});

if (!existsSync(`${dataDir}/PG_VERSION`)) {
  await embedded.initialise();
}
await embedded.start();

const admin = new pg.Client({
  host: "127.0.0.1",
  port,
  user: "postgres",
  password: superPassword,
  database: "postgres",
});
await admin.connect();

await admin.query(`
  DO $$ BEGIN
    CREATE ROLE match_migrator LOGIN PASSWORD ${quote(migratorPassword)} CREATEDB;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);
await admin.query(`
  DO $$ BEGIN
    CREATE ROLE match_app LOGIN PASSWORD ${quote(appPassword)} NOSUPERUSER NOCREATEDB NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);
await admin.query(`ALTER ROLE match_migrator PASSWORD ${quote(migratorPassword)}`);
await admin.query(`ALTER ROLE match_app PASSWORD ${quote(appPassword)}`);

const databases = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'match'");
if (databases.rowCount === 0) {
  await admin.query("CREATE DATABASE match OWNER match_migrator");
}
await admin.query("GRANT CONNECT ON DATABASE match TO match_app");
await admin.end();

const env = `POSTGRES_SUPER_PASSWORD=${superPassword}
MATCH_MIGRATOR_PASSWORD=${migratorPassword}
MATCH_APP_PASSWORD=${appPassword}
MIGRATE_URL=postgresql://match_migrator:${encodeURIComponent(migratorPassword)}@127.0.0.1:5433/match
DATABASE_URL=postgresql://match_app:${encodeURIComponent(appPassword)}@127.0.0.1:5433/match
SEED_ADMIN_PASSWORD=${process.env.SEED_ADMIN_PASSWORD ?? "admin-local-match"}
SEED_DEMO_PASSWORD=${process.env.SEED_DEMO_PASSWORD ?? "demo-local-match"}
`;

if (!existsSync(".env")) {
  writeFileSync(".env", env);
  console.log("Arquivo .env criado para o banco local.");
}

console.log("Postgres do Match escutando em 127.0.0.1:5433");
await new Promise(() => {});
