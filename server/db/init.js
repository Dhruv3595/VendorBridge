const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'vendorbridge';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 5432);

if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
  throw new Error('DB_NAME may only contain letters, numbers, and underscores.');
}

async function createDatabaseIfMissing() {
  const adminPool = new Pool({
    host: dbHost,
    port: dbPort,
    database: 'postgres',
    user: dbUser,
    password: dbPassword
  });

  try {
    const exists = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (exists.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database "${dbName}".`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } finally {
    await adminPool.end();
  }
}

async function runSqlFile(fileName) {
  const appPool = new Pool({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
    await appPool.query(sql);
    console.log(`Applied ${fileName}.`);
  } finally {
    await appPool.end();
  }
}

async function main() {
  await createDatabaseIfMissing();
  await runSqlFile('schema.sql');

  if (process.argv.includes('--seed')) {
    await runSqlFile('seed.sql');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
