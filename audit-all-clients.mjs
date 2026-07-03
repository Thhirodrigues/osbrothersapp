#!/usr/bin/env node

/**
 * Script de auditoria para verificar discrepâncias entre débitos e saldos de clientes
 */

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'gateway02.us-east-1.prod.aws.tidbcloud.com',
  user: 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'dyVJYfPkMaKo6dqqnRNgqj',
  port: 4000,
  ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function auditarClientes() {
  const connection = await pool.getConnection();

  try {
    // Buscar todos os clientes
    const [clientes] = await connection.execute(
      `SELECT id, name, email FROM users WHERE role = 'user' ORDER BY name`
    );

    console.log(`\n📊 AUDITORIA DE CLIENTES - Total: ${clientes.length}\n`);
    console.log('='.repeat(100));

    let discrepancias = [];

    for (const cliente of clientes) {
      // Buscar débitos
      const [debitos] = await connection.execute(
        `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos 
         WHERE clienteId = ? AND tipo = 'debito' AND status = 'ativo'`,
        [cliente.id]
      );

      // Buscar pagamentos
      const [pagamentos] = await connection.execute(
        `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos 
         WHERE clienteId = ? AND tipo = 'pagamento' AND status = 'ativo'`,
        [cliente.id]
      );

      const totalDebitos = debitos[0]?.total || 0;
      const totalPagamentos = pagamentos[0]?.total || 0;
      const saldoCalculado = totalDebitos - totalPagamentos;

      // Buscar saldo no banco (se existir coluna)
      let saldoBanco = null;
      try {
        const [saldoRow] = await connection.execute(
          `SELECT saldo FROM users WHERE id = ?`,
          [cliente.id]
        );
        saldoBanco = saldoRow[0]?.saldo;
      } catch (e) {
        // Coluna saldo pode não existir
      }

      // Verificar discrepâncias
      if (saldoCalculado !== 0) {
        const status = saldoCalculado > 0 ? '🔴 DEVENDO' : '🟢 CRÉDITO';
        console.log(`\n${status} ${cliente.name} (ID: ${cliente.id})`);
        console.log(`   Email: ${cliente.email}`);
        console.log(`   Débitos: R$ ${(totalDebitos / 100).toFixed(2)}`);
        console.log(`   Pagamentos: R$ ${(totalPagamentos / 100).toFixed(2)}`);
        console.log(`   Saldo Calculado: R$ ${(saldoCalculado / 100).toFixed(2)}`);
        if (saldoBanco !== null) {
          console.log(`   Saldo no Banco: R$ ${(saldoBanco / 100).toFixed(2)}`);
        }

        if (saldoCalculado !== saldoBanco) {
          discrepancias.push({
            id: cliente.id,
            name: cliente.name,
            saldoCalculado,
            saldoBanco,
          });
        }
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log(`\n⚠️  DISCREPÂNCIAS ENCONTRADAS: ${discrepancias.length}\n`);

    if (discrepancias.length > 0) {
      discrepancias.forEach((d) => {
        console.log(`${d.name}: Calculado R$ ${(d.saldoCalculado / 100).toFixed(2)} vs Banco R$ ${(d.saldoBanco ? d.saldoBanco / 100 : 0).toFixed(2)}`);
      });
    }
  } finally {
    connection.release();
    pool.end();
  }
}

auditarClientes().catch(console.error);
