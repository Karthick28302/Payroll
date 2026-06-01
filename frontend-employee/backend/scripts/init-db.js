const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const run = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL missing in backend/.env");
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const root = path.resolve(__dirname, "../../database");
  const schemaFiles = [
    "schema/users.sql",
    "schema/employee_profiles.sql",
    "schema/attendance.sql",
    "schema/salaries.sql",
    "schema/events.sql",
    "schema/holidays.sql",
  ];

  const seedFiles = [
    "seeds/seed_events.sql",
  ];

  for (const rel of [...schemaFiles, ...seedFiles]) {
    // Strip UTF-8 BOM if present to avoid Postgres parser error at position 1.
    const sql = fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
    await client.query(sql);
    console.log(`Applied: ${rel}`);
  }

  await client.end();
  console.log("Database setup completed.");
};

run().catch((error) => {
  console.error("DB setup failed:");
  console.error(error);
  process.exit(1);
});
