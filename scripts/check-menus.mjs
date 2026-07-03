import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';
// Load .env manually
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
} catch(e) {}

const pool = mysql.createPool(process.env.DATABASE_URL);

async function main() {
  const conn = await pool.getConnection();
  
  // Check which tables exist
  const [tables] = await conn.execute("SHOW TABLES LIKE 'menu%'");
  console.log('Tables:', tables.map(t => Object.values(t)[0]));
  
  // Check menus table structure
  try {
    const [cols] = await conn.execute("DESCRIBE menus");
    console.log('\nmenus columns:', cols.map(c => c.Field));
  } catch(e) { console.log('menus table error:', e.message); }
  
  // Check menu_categories table
  try {
    const [cols] = await conn.execute("DESCRIBE menu_categories");
    console.log('\nmenu_categories columns:', cols.map(c => c.Field));
    const [rows] = await conn.execute("SELECT * FROM menu_categories LIMIT 10");
    console.log('menu_categories rows:', rows.length, rows);
  } catch(e) { console.log('menu_categories table error:', e.message); }
  
  // Check menu_items table
  try {
    const [cols] = await conn.execute("DESCRIBE menu_items");
    console.log('\nmenu_items columns:', cols.map(c => c.Field));
    const [rows] = await conn.execute("SELECT * FROM menu_items LIMIT 10");
    console.log('menu_items rows:', rows.length, rows);
  } catch(e) { console.log('menu_items table error:', e.message); }
  
  // Check menus table data
  try {
    const [rows] = await conn.execute("SELECT id, name, is_active, SUBSTRING(categories, 1, 200) as categories_preview FROM menus");
    console.log('\nmenus data:');
    rows.forEach(r => console.log(' -', r.id, r.name, 'active:', r.is_active, 'categories_preview:', r.categories_preview));
  } catch(e) { console.log('menus data error:', e.message); }
  
  conn.release();
  await pool.end();
}

main().catch(console.error);
