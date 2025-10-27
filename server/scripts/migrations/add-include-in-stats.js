/*
 Simple, one-off migration to add include_in_stats to categories.
 Usage: node server/scripts/migrations/add-include-in-stats.js
 Requires DATABASE_URL in env (already used by the app).
*/
require('dotenv').config();
const { sequelize } = require('../../libs/sequelize');

async function run() {
  const sql = `ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS include_in_stats boolean NOT NULL DEFAULT true;`;
  try {
    console.log('Running migration: add include_in_stats to public.categories ...');
    await sequelize.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
