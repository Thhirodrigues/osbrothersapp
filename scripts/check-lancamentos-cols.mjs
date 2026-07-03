import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(dbUrl);
const [rows] = await conn.execute('DESCRIBE lancamentos');
rows.forEach(r => console.log(r.Field, '-', r.Type));
await conn.end();
