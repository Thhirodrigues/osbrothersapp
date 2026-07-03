#!/usr/bin/env node

/**
 * Script de Importação de Usuários do Excel
 * 
 * Uso: node scripts/import-users.mjs <caminho-do-arquivo-excel>
 * 
 * Funcionalidades:
 * - Lê dados do Excel
 * - Verifica duplicidade de emails no banco de dados
 * - Importa apenas usuários novos
 * - Gera relatório de importação
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getConnection() {
  try {
    // Usar DATABASE_URL se disponível (padrão do Manus)
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL não configurada. Defina a variável de ambiente.');
    }

    // Parse DATABASE_URL format: mysql://user:password@host:port/database
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false }, // TiDB Cloud requer SSL
    });
    return connection;
  } catch (error) {
    log(`❌ Erro ao conectar ao banco de dados: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function readExcelFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    log(`✅ Excel lido com sucesso: ${data.length} registros encontrados`, 'green');
    return data;
  } catch (error) {
    log(`❌ Erro ao ler Excel: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function checkExistingEmails(connection, users) {
  try {
    const emails = users.map(u => u.email).filter(Boolean);
    
    if (emails.length === 0) {
      return new Set();
    }

    const placeholders = emails.map(() => '?').join(',');
    const query = `SELECT email FROM users WHERE email IN (${placeholders})`;
    
    const [rows] = await connection.execute(query, emails);
    const existingEmails = new Set(rows.map(row => row.email));
    
    return existingEmails;
  } catch (error) {
    log(`❌ Erro ao verificar emails existentes: ${error.message}`, 'red');
    throw error;
  }
}

function validateUser(user) {
  const errors = [];

  if (!user.email || typeof user.email !== 'string') {
    errors.push('Email inválido ou ausente');
  }

  if (!user.name || typeof user.name !== 'string') {
    errors.push('Nome inválido ou ausente');
  }

  if (!user.role || !['admin', 'user'].includes(user.role)) {
    errors.push('Role inválido (deve ser "admin" ou "user")');
  }

  return errors;
}

async function importUsers(connection, users, existingEmails) {
  const imported = [];
  const skipped = [];
  const errors = [];

  for (const user of users) {
    try {
      // Validação básica
      const validationErrors = validateUser(user);
      if (validationErrors.length > 0) {
        skipped.push({
          email: user.email,
          reason: `Validação falhou: ${validationErrors.join(', ')}`,
        });
        continue;
      }

      // Verificar duplicidade
      if (existingEmails.has(user.email)) {
        skipped.push({
          email: user.email,
          reason: 'Email já existe no banco de dados',
        });
        continue;
      }

      // Preparar dados para inserção
      const userData = {
        openId: user.openId || null,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod || 'manual',
        role: user.role || 'user',
        createdAt: user.createdAt ? new Date(user.createdAt).getTime() : Date.now(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now(),
        lastSignedIn: user.lastSignedIn ? new Date(user.lastSignedIn).getTime() : null,
        template_whatsapp: user.template_whatsapp || null,
        email_notificacao: user.email_notificacao || null,
        ativo: user.ativo !== undefined ? (user.ativo === 1 || user.ativo === 'true' ? 1 : 0) : 1,
        menu_fixo_id: user.menu_fixo_id || null,
        theme_preference: user.theme_preference || 'light',
        telefone: user.telefone || null,
        password_hash: user.password_hash || null,
      };

      // Inserir usuário
      const query = `
        INSERT INTO users (
          openId, name, email, loginMethod, role, createdAt, updatedAt,
          lastSignedIn, template_whatsapp, email_notificacao, ativo,
          menu_fixo_id, theme_preference, telefone, password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        userData.openId,
        userData.name,
        userData.email,
        userData.loginMethod,
        userData.role,
        userData.createdAt,
        userData.updatedAt,
        userData.lastSignedIn,
        userData.template_whatsapp,
        userData.email_notificacao,
        userData.ativo,
        userData.menu_fixo_id,
        userData.theme_preference,
        userData.telefone,
        userData.password_hash,
      ];

      await connection.execute(query, values);

      imported.push({
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Adicionar email aos existentes para evitar duplicatas na mesma importação
      existingEmails.add(user.email);
    } catch (error) {
      errors.push({
        email: user.email,
        error: error.message,
      });
    }
  }

  return { imported, skipped, errors };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('❌ Uso: node scripts/import-users.mjs <caminho-do-arquivo-excel>', 'red');
    process.exit(1);
  }

  const filePath = args[0];
  const connection = await getConnection();

  try {
    log('\n📊 Iniciando importação de usuários...', 'cyan');
    log(`📁 Arquivo: ${filePath}`, 'blue');

    // Ler Excel
    const users = await readExcelFile(filePath);

    // Verificar emails existentes
    log('\n🔍 Verificando emails duplicados...', 'blue');
    const existingEmails = await checkExistingEmails(connection, users);
    log(`   ${existingEmails.size} emails já existem no banco de dados`, 'yellow');

    // Importar usuários
    log('\n📥 Importando usuários...', 'blue');
    const { imported, skipped, errors } = await importUsers(connection, users, existingEmails);

    // Relatório
    log('\n' + '='.repeat(60), 'cyan');
    log('📋 RELATÓRIO DE IMPORTAÇÃO', 'cyan');
    log('='.repeat(60), 'cyan');

    log(`\n✅ Usuários Importados: ${imported.length}`, 'green');
    if (imported.length > 0) {
      imported.forEach(user => {
        log(`   • ${user.name} (${user.email}) - ${user.role}`, 'green');
      });
    }

    log(`\n⏭️  Usuários Ignorados: ${skipped.length}`, 'yellow');
    if (skipped.length > 0) {
      skipped.forEach(item => {
        log(`   • ${item.email}: ${item.reason}`, 'yellow');
      });
    }

    log(`\n❌ Erros: ${errors.length}`, 'red');
    if (errors.length > 0) {
      errors.forEach(item => {
        log(`   • ${item.email}: ${item.error}`, 'red');
      });
    }

    log('\n' + '='.repeat(60), 'cyan');
    log(`Total de Registros: ${users.length}`, 'cyan');
    log(`Importados: ${imported.length} | Ignorados: ${skipped.length} | Erros: ${errors.length}`, 'cyan');
    log('='.repeat(60), 'cyan');

    // Salvar relatório em arquivo
    const reportPath = path.join(__dirname, `../import-report-${Date.now()}.json`);
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          file: filePath,
          summary: {
            total: users.length,
            imported: imported.length,
            skipped: skipped.length,
            errors: errors.length,
          },
          imported,
          skipped,
          errors,
        },
        null,
        2
      )
    );

    log(`\n📄 Relatório salvo em: ${reportPath}`, 'green');
  } catch (error) {
    log(`\n❌ Erro durante importação: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  log(`❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
