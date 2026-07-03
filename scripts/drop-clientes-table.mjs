/**
 * Script para verificar e dropar a tabela 'clientes' do banco de dados.
 * Executa: DATABASE_URL=... node scripts/drop-clientes-table.mjs
 */

import mysql from 'mysql2/promise';

const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.replace(/\?ssl=.*$/, '');

if (!cleanUrl) {
  console.error('❌ DATABASE_URL não encontrada. Passe via variável de ambiente.');
  process.exit(1);
}

const pool = mysql.createPool({
  uri: cleanUrl,
  ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
  connectionLimit: 3,
});

async function run() {
  const connection = await pool.getConnection();

  try {
    // 1. Verificar se a tabela clientes existe
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'clientes'`);

    if (!tables || tables.length === 0) {
      console.log('✅ Tabela "clientes" NÃO existe no banco. Nada a fazer.');
      return;
    }

    console.log('⚠️  Tabela "clientes" encontrada. Verificando dados...');

    // 2. Contar registros na tabela clientes
    const [countResult] = await connection.execute('SELECT COUNT(*) AS total FROM clientes');
    const total = countResult[0]?.total ?? 0;
    console.log(`   → ${total} registro(s) na tabela clientes`);

    // 3. Dropar a tabela
    await connection.execute('DROP TABLE IF EXISTS clientes');
    console.log('✅ Tabela "clientes" DROPADA com sucesso!');

    // 4. Confirmar que não existe mais
    const [verify] = await connection.execute(`SHOW TABLES LIKE 'clientes'`);
    if (verify.length === 0) {
      console.log('✅ Confirmado: tabela "clientes" não existe mais no banco.');
    } else {
      console.error('❌ ERRO: tabela "clientes" ainda existe após DROP!');
    }

  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Erro ao executar script:', err.message || err);
  process.exit(1);
});
