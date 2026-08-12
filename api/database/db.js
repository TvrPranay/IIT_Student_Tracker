import pg from 'pg';
import dotenv from 'dotenv';
import { schemaSql } from './schemaSql.js';

// Load dotenv configuration locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
    ? false
    : { rejectUnauthorized: false }
});

// Helper to convert SQLite '?' parameters to PostgreSQL '$1', '$2', etc.
function convertSql(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

const checkDbUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing. Please configure it in your Vercel Project Settings.');
  }
};

// Emulate SQLite 'db.all' -> returns all rows
export const query = async (sql, params = []) => {
  checkDbUrl();
  const convertedSql = convertSql(sql);
  const res = await pool.query(convertedSql, params);
  return res.rows;
};

// Emulate SQLite 'db.get' -> returns first row or null
export const get = async (sql, params = []) => {
  checkDbUrl();
  const convertedSql = convertSql(sql);
  const res = await pool.query(convertedSql, params);
  return res.rows[0] || null;
};

// Emulate SQLite 'db.run' -> returns { id, changes }
export const run = async (sql, params = []) => {
  checkDbUrl();
  let convertedSql = convertSql(sql);
  
  // Append RETURNING * to INSERT queries to easily capture primary keys (like id or user_id)
  const isInsert = convertedSql.trim().toUpperCase().startsWith('INSERT');
  const finalSql = isInsert ? `${convertedSql} RETURNING *` : convertedSql;
  
  const res = await pool.query(finalSql, params);
  const row = res.rows[0];
  const id = row ? (row.id || row.user_id) : null;
  
  return { id, changes: res.rowCount };
};

// Execute multiple SQL statements
export const exec = async (sql) => {
  checkDbUrl();
  await pool.query(sql);
};

export const initDb = async () => {
  try {
    await exec(schemaSql);
    console.log('PostgreSQL database tables successfully verified/created.');
  } catch (err) {
    console.error('Error initializing PostgreSQL tables:', err.message);
    throw err;
  }
};

export default pool;
