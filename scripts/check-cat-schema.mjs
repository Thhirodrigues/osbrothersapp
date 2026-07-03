import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('DESCRIBE menu_categories');
console.log('menu_categories columns:');
rows.forEach(r => console.log(`  ${r.Field} | ${r.Type} | Null:${r.Null} | Default:${r.Default} | Extra:${r.Extra}`));
await conn.end();
