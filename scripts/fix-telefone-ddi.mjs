/**
 * Script: fix-telefone-ddi.mjs
 * Objetivo: Adicionar +55 apenas nos registros da tabela users
 * onde o campo telefone começa com "11" (sem DDI).
 * Registros que já têm +55, +, ou outro formato são ignorados.
 */

import mysql from 'mysql2/promise';
// Ler DATABASE_URL do ambiente
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não encontrada nas variáveis de ambiente');
  process.exit(1);
}

async function main() {
  // DATABASE_URL já contém o parâmetro ssl
  const conn = await mysql.createConnection(DATABASE_URL);

  // 1. Verificar registros elegíveis (telefone começa com "11")
  const [candidatos] = await conn.execute(
    `SELECT id, name, telefone FROM users WHERE telefone LIKE '11%' ORDER BY id`
  );

  console.log(`\n=== Registros elegíveis (telefone começa com "11") ===`);
  if (candidatos.length === 0) {
    console.log('Nenhum registro encontrado com telefone iniciando em "11".');
    await conn.end();
    return;
  }

  candidatos.forEach(r => {
    console.log(`  ID ${r.id} | ${r.name} | ${r.telefone} → +55${r.telefone}`);
  });

  // 2. Executar UPDATE cirúrgico
  const [result] = await conn.execute(
    `UPDATE users SET telefone = CONCAT('+55', telefone) WHERE telefone LIKE '11%'`
  );
  console.log(`\n✅ UPDATE executado: ${result.affectedRows} registro(s) atualizado(s).`);

  // 3. Verificar resultado
  const ids = candidatos.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const [atualizados] = await conn.execute(
    `SELECT id, name, telefone FROM users WHERE id IN (${placeholders}) ORDER BY id`,
    ids
  );

  console.log(`\n=== Resultado após UPDATE ===`);
  atualizados.forEach(r => {
    console.log(`  ID ${r.id} | ${r.name} | ${r.telefone}`);
  });

  // 4. Mostrar todos os registros com telefone para conferência
  const [todos] = await conn.execute(
    `SELECT id, name, telefone FROM users WHERE telefone IS NOT NULL ORDER BY id`
  );
  console.log(`\n=== Todos os registros com telefone (conferência final) ===`);
  todos.forEach(r => {
    console.log(`  ID ${r.id} | ${r.name} | ${r.telefone}`);
  });

  await conn.end();
  console.log('\n✅ Script concluído com sucesso.');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
