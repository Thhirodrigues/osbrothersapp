/**
 * Migração: adicionar colunas de autoria, aprovação e soft delete na tabela lancamentos
 */
import mysql from 'mysql2/promise';

const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.replace(/\?ssl=.*$/, '');

if (!cleanUrl) {
  console.error('❌ DATABASE_URL não encontrada.');
  process.exit(1);
}

const pool = mysql.createPool({
  uri: cleanUrl,
  ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
  connectionLimit: 3,
});

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('🔍 Verificando estrutura atual da tabela lancamentos...');
    const [desc] = await conn.execute('DESCRIBE lancamentos');
    console.log('Colunas existentes:', desc.map(r => r.Field).join(', '));

    // 1. registrado_por: 'admin' | 'user' | 'conta_geral'
    if (!await columnExists(conn, 'lancamentos', 'registrado_por')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN registrado_por ENUM('admin','user','conta_geral') NOT NULL DEFAULT 'admin' AFTER descricao`);
      console.log('✅ Coluna registrado_por adicionada');
    } else {
      console.log('⏭️  registrado_por já existe');
    }

    // 2. registrado_por_id: id do usuário que registrou
    if (!await columnExists(conn, 'lancamentos', 'registrado_por_id')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN registrado_por_id VARCHAR(50) NULL AFTER registrado_por`);
      console.log('✅ Coluna registrado_por_id adicionada');
    } else {
      console.log('⏭️  registrado_por_id já existe');
    }

    // 3. registrado_por_nome: nome legível de quem registrou
    if (!await columnExists(conn, 'lancamentos', 'registrado_por_nome')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN registrado_por_nome VARCHAR(200) NULL AFTER registrado_por_id`);
      console.log('✅ Coluna registrado_por_nome adicionada');
    } else {
      console.log('⏭️  registrado_por_nome já existe');
    }

    // 4. status: ativo | pendente | inativo (soft delete = inativo)
    if (!await columnExists(conn, 'lancamentos', 'status')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN status ENUM('ativo','pendente','inativo') NOT NULL DEFAULT 'ativo' AFTER registrado_por_nome`);
      console.log('✅ Coluna status adicionada');
    } else {
      console.log('⏭️  status já existe');
    }

    // 5. excluido_por: nome do admin que fez soft delete
    if (!await columnExists(conn, 'lancamentos', 'excluido_por')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN excluido_por VARCHAR(200) NULL AFTER status`);
      console.log('✅ Coluna excluido_por adicionada');
    } else {
      console.log('⏭️  excluido_por já existe');
    }

    // 6. excluido_em: timestamp do soft delete
    if (!await columnExists(conn, 'lancamentos', 'excluido_em')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN excluido_em DATETIME NULL AFTER excluido_por`);
      console.log('✅ Coluna excluido_em adicionada');
    } else {
      console.log('⏭️  excluido_em já existe');
    }

    // 7. motivo_exclusao: texto opcional
    if (!await columnExists(conn, 'lancamentos', 'motivo_exclusao')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN motivo_exclusao TEXT NULL AFTER excluido_em`);
      console.log('✅ Coluna motivo_exclusao adicionada');
    } else {
      console.log('⏭️  motivo_exclusao já existe');
    }

    // 8. aprovado_por: nome do admin que aprovou (para conta_geral)
    if (!await columnExists(conn, 'lancamentos', 'aprovado_por')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN aprovado_por VARCHAR(200) NULL AFTER motivo_exclusao`);
      console.log('✅ Coluna aprovado_por adicionada');
    } else {
      console.log('⏭️  aprovado_por já existe');
    }

    // 9. aprovado_em: timestamp da aprovação
    if (!await columnExists(conn, 'lancamentos', 'aprovado_em')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN aprovado_em DATETIME NULL AFTER aprovado_por`);
      console.log('✅ Coluna aprovado_em adicionada');
    } else {
      console.log('⏭️  aprovado_em já existe');
    }

    // 10. token_aprovacao: token único para link de aprovação por e-mail
    if (!await columnExists(conn, 'lancamentos', 'token_aprovacao')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN token_aprovacao VARCHAR(100) NULL AFTER aprovado_em`);
      console.log('✅ Coluna token_aprovacao adicionada');
    } else {
      console.log('⏭️  token_aprovacao já existe');
    }

    // 11. cliente_confirmou: se o cliente confirmou via e-mail
    if (!await columnExists(conn, 'lancamentos', 'cliente_confirmou')) {
      await conn.execute(`ALTER TABLE lancamentos ADD COLUMN cliente_confirmou TINYINT(1) NOT NULL DEFAULT 0 AFTER token_aprovacao`);
      console.log('✅ Coluna cliente_confirmou adicionada');
    } else {
      console.log('⏭️  cliente_confirmou já existe');
    }

    console.log('\n✅ Migração concluída com sucesso!');

    // Verificar estrutura final
    const [finalDesc] = await conn.execute('DESCRIBE lancamentos');
    console.log('\nEstrutura final:');
    finalDesc.forEach(r => console.log(`  ${r.Field} | ${r.Type} | ${r.Null} | default: ${r.Default}`));

  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Erro:', err.message || err);
  process.exit(1);
});
