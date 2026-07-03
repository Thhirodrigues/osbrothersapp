/**
 * SERVIDOR COM MYSQL (TiDB Cloud)
 * Adaptado para usar schema EXISTENTE do banco
 * Persistência de dados garantida
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { initializeEmailService, notificarNovoLancamento, notificarPagamentoCliente } from './emailService.js';
import { bannersRouter } from './banners.js';
import { initializeBannersTable } from './initBannersTable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// CONEXÃO COM MYSQL (TiDB Cloud)
// ============================================================================

// Limpar DATABASE_URL removendo parâmetro SSL inválido
const rawDatabaseUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/caderninho';
const cleanDatabaseUrl = rawDatabaseUrl.replace(/\?ssl=.*$/, ''); // Remove ?ssl={...} do final

const pool = mysql.createPool({
  uri: cleanDatabaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  // TiDB Cloud requer SSL obrigatório com certificado válido
  ssl: ({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  } as any),
} as any);

console.log(`[DB] Conectando a: ${cleanDatabaseUrl.replace(/:[^@]*@/, ':***@')}`);

// Listeners SSE
const sseClients = new Set<any>();

// ============================================================================
// INICIALIZAR BANCO DE DADOS
// ============================================================================

async function initializeDatabase() {
  try {
    console.log('[DB] Tentando conectar ao banco de dados...');
    const connection = await pool.getConnection();
    console.log('[DB] ✅ Conexão estabelecida com sucesso!');
    connection.release();
    console.log('[DB] ✅ Banco de dados pronto (usando schema existente)');
  } catch (error: any) {
    console.error('[DB] ❌ Erro ao inicializar banco:', error?.message || error);
    console.error('[DB] Detalhes:', error);
  }
}

// ============================================================================
// FUNÇÃO PARA NOTIFICAR CLIENTES SSE
// ============================================================================

function notifySSEClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      sseClients.delete(client);
    }
  });
}

// ============================================================================
// ROTA: SSE (Server-Sent Events)
// ============================================================================

app.get('/api/events/subscribe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  sseClients.add(res);
  console.log(`[SSE] Cliente conectado. Total: ${sseClients.size}`);

  // Enviar sincronização completa ao conectar
  const syncEvent = { type: 'sync:full', data: { users: [], lancamentos: [] } };
  res.write(`data: ${JSON.stringify(syncEvent)}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`[SSE] Cliente desconectado. Total: ${sseClients.size}`);
  });
});

// ============================================================================
// ROTAS: USUÁRIOS (tabela 'users')
// ============================================================================

app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM users ORDER BY id DESC LIMIT 1000');
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar usuários:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar usuários', details: error?.message });
  }
});

// GET /api/users/:userId/active-menu - Retorna o cardápio ativo do usuário
app.get('/api/users/:userId/active-menu', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    // Buscar menu_fixo_id do usuário
    const [users] = await connection.execute(
      'SELECT menu_fixo_id FROM users WHERE id = ?',
      [userId]
    ) as any;
    
    connection.release();
    
    if (!users || (users as any[]).length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const user = (users as any[])[0];
    const activeMenuId = user.menu_fixo_id || 'after-menu-1'; // Padrão: After
    
    res.json({ menuId: activeMenuId });
  } catch (error: any) {
    console.error('[API] Erro ao buscar cardápio ativo:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar cardápio ativo', details: error?.message });
  }
});

// Normaliza telefone: remove não-dígitos, adiciona +55 se não tiver DDI
function normalizarTelefone(tel: string | undefined | null): string | null {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  if (!digits) return null;
  // Se já começa com 55 e tem 12-13 dígitos, assume DDI já presente
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  return `+55${digits}`;
}

app.post('/api/users', async (req, res) => {
  try {
    // Aceitar tanto 'nome' quanto 'name', 'senha' quanto 'password'
    const { name, nome, email, telefone, password, senha, tipo } = req.body;
    const userName = name || nome;
    const userPassword = password || senha;

    if (!userName || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const connection = await pool.getConnection();
    
    // Inserir usuário na tabela 'users'
    const telefoneFmt = normalizarTelefone(telefone);
    // Hash da senha com bcrypt (salt rounds = 10)
    const passwordHash = userPassword ? await bcrypt.hash(userPassword, 10) : null;
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, telefone, role, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userName, email, telefoneFmt, tipo === 'admin' ? 'admin' : 'user', passwordHash]
    ) as any;

    connection.release();

    const novoUsuario = { 
      id: userResult.insertId,
      name: userName, 
      email: email,
      telefone: telefoneFmt,
      role: tipo === 'admin' ? 'admin' : 'user'
    };
    notifySSEClients({ type: 'users:created', data: novoUsuario });

    res.json(novoUsuario);
  } catch (error: any) {
    console.error('[API] Erro ao criar usuário:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar usuário', details: error?.message });
  }
});

// Rota de login com validação de senha bcrypt
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, senha } = req.body;
    const userPassword = password || senha;

    if (!email || !userPassword) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, name, email, role, password_hash, telefone FROM users WHERE email = ? AND ativo = 1 LIMIT 1',
      [email]
    ) as any;
    connection.release();

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const user = rows[0];

    // Se o usuário não tem senha cadastrada (criado antes da feature), negar acesso
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Senha não cadastrada. Entre em contato com o administrador.' });
    }

    // Validar senha com bcrypt
    const senhaValida = await bcrypt.compare(userPassword, user.password_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      telefone: user.telefone
    });
  } catch (error: any) {
    console.error('[API] Erro no login:', error?.message || error);
    res.status(500).json({ error: 'Erro ao realizar login', details: error?.message });
  }
});

// Solicitar recuperação de senha por e-mail
app.post('/api/auth/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, name FROM users WHERE email = ? AND ativo = 1 LIMIT 1', [email]
    ) as any;

    if (!rows || rows.length === 0) {
      connection.release();
      // Não revelar se o e-mail existe ou não
      return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });
    }

    const user = rows[0];
    // Gerar token seguro
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await connection.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );
    connection.release();

    // Enviar e-mail com link de redefinição
    const { enviarEmail } = await import('./emailService.js');
    const resetUrl = `${req.headers.origin || 'https://osbrothersadega.manus.space'}/redefinir-senha?token=${token}`;
    await enviarEmail({
      para: email,
      assunto: 'Redefinição de senha - Os Brothers Adega',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Redefinição de Senha</h2>
          <p>Olá, <strong>${user.name}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>Clique no botão abaixo para definir uma nova senha (válido por 1 hora):</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Redefinir Senha</a>
          <p style="color: #666; font-size: 0.875rem;">Se você não solicitou isso, ignore este e-mail.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 0.75rem;">Os Brothers Adega</p>
        </div>
      `
    });

    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });
  } catch (error: any) {
    console.error('[API] Erro ao solicitar reset de senha:', error?.message || error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Verificar identidade por nome (pergunta de segurança) e definir nova senha
app.post('/api/auth/reset-by-name', async (req, res) => {
  try {
    const { email, nome, novaSenha } = req.body;
    if (!email || !nome || !novaSenha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, name FROM users WHERE email = ? AND ativo = 1 LIMIT 1', [email]
    ) as any;

    if (!rows || rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'E-mail ou nome incorretos' });
    }

    const user = rows[0];
    // Comparar nome (case insensitive, sem espaços extras)
    const nomeNormalizado = (user.name || '').trim().toLowerCase();
    const nomeInformado = nome.trim().toLowerCase();
    if (nomeNormalizado !== nomeInformado) {
      connection.release();
      return res.status(401).json({ error: 'E-mail ou nome incorretos' });
    }

    const passwordHash = await bcrypt.hash(novaSenha, 10);
    await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
    connection.release();

    res.json({ message: 'Senha definida com sucesso' });
  } catch (error: any) {
    console.error('[API] Erro ao redefinir senha por nome:', error?.message || error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// Redefinir senha via token de e-mail
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    ) as any;

    if (!rows || rows.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const resetToken = rows[0];
    const passwordHash = await bcrypt.hash(novaSenha, 10);
    await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, resetToken.user_id]);
    await connection.execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetToken.id]);
    connection.release();

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error: any) {
    console.error('[API] Erro ao redefinir senha:', error?.message || error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const connection = await pool.getConnection();
    
    const telefoneFmtUpd = normalizarTelefone(telefone);
    const [result] = await connection.execute(
      'UPDATE users SET name = ?, email = ?, telefone = ? WHERE id = ?',
      [nome, email, telefoneFmtUpd, id]
    ) as any;

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    connection.release();

    const usuarioAtualizado = { id, name: nome, email, telefone: telefoneFmtUpd };
    notifySSEClients({ type: 'users:updated', data: usuarioAtualizado });

    res.json(usuarioAtualizado);
  } catch (error: any) {
    console.error('[API] Erro ao atualizar usuário:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atualizar usuário', details: error?.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    connection.release();

    notifySSEClients({ type: 'users:deleted', data: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar usuário:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar usuário', details: error?.message });
  }
});

// ============================================================================
// ROTAS: CONFIGURAÇÕES DO APP (Template WhatsApp, etc)
// ============================================================================

// GET /api/config - Obter configurações do app
app.get('/api/config', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Tentar buscar de app_config, se não existir, retornar padrão
    const [rows] = await connection.execute(
      'SELECT template_whatsapp FROM app_config LIMIT 1'
    ) as any;
    
    connection.release();
    
    if (rows && (rows as any[]).length > 0) {
      const config = (rows as any[])[0];
      res.json({ templateWhatsapp: config.template_whatsapp });
    } else {
      // Retornar template padrão
      res.json({ 
        templateWhatsapp: `Olá, {cliente}! Passando para lembrar que a sua continha de {valor} na adega está em aberto. Segue o pix para pagamento osbrothersadega@gmail.com` 
      });
    }
  } catch (error: any) {
    console.error('[API] Erro ao buscar configurações:', error?.message || error);
    // Retornar template padrão em caso de erro
    res.json({ 
      templateWhatsapp: `Olá, {cliente}! Passando para lembrar que a sua continha de {valor} na adega está em aberto. Segue o pix para pagamento osbrothersadega@gmail.com` 
    });
  }
});

// PUT /api/config - Salvar configurações do app
app.put('/api/config', async (req, res) => {
  try {
    const { templateWhatsapp } = req.body;
    const connection = await pool.getConnection();
    
    // Verificar se existe registro
    const [existing] = await connection.execute(
      'SELECT id FROM app_config LIMIT 1'
    ) as any;
    
    if (existing && (existing as any[]).length > 0) {
      // Atualizar registro existente
      await connection.execute(
        'UPDATE app_config SET template_whatsapp = ? WHERE id = 1',
        [templateWhatsapp]
      );
    } else {
      // Criar novo registro
      await connection.execute(
        'INSERT INTO app_config (id, template_whatsapp) VALUES (1, ?)',
        [templateWhatsapp]
      );
    }
    
    connection.release();
    res.json({ success: true, templateWhatsapp });
  } catch (error: any) {
    console.error('[API] Erro ao salvar configurações:', error?.message || error);
    res.status(500).json({ error: 'Erro ao salvar configurações', details: error?.message });
  }
});

// ============================================================================
// ROTAS: /api/clientes — REMOVIDAS. Use /api/users diretamente.
// Mantido apenas como redirect de compatibilidade temporária.
// ============================================================================

// GET /api/clientes — redireciona para /api/users (apenas role='user')
app.get('/api/clientes', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT id, name AS nome, telefone, email, ativo FROM users WHERE role != 'admin' ORDER BY name ASC LIMIT 1000`
    );
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar users:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar users', details: error?.message });
  }
});

// POST /api/clientes — redireciona para POST /api/users
app.post('/api/clientes', async (req, res) => {
  // Redirecionar internamente: usar mesma lógica de /api/users
  const { nome, name, telefone, email, tipo } = req.body;
  const userName = nome || name;
  if (!userName || !userName.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  req.body = { ...req.body, name: userName, nome: userName, tipo: tipo || 'user' };
  // Chamar a mesma rota de criação de users
  try {
    const connection = await pool.getConnection();
    const telefoneFmt = normalizarTelefone(telefone);
    const emailFinal = email || `${userName.trim().toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@caderninho.local`;
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, telefone, role) VALUES (?, ?, ?, ?)',
      [userName.trim(), emailFinal, telefoneFmt, 'user']
    ) as any;
    connection.release();
    const novoUser = { id: result.insertId, nome: userName.trim(), name: userName.trim(), telefone: telefoneFmt, email: emailFinal, ativo: 1 };
    notifySSEClients({ type: 'users:created', data: novoUser });
    res.json(novoUser);
  } catch (error: any) {
    console.error('[API] Erro ao criar user via /api/clientes:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar user', message: error?.message });
  }
});

// ============================================================================
// ROTAS: LANÇAMENTOS (tabela 'lancamentos')
// ============================================================================

app.get('/api/lancamentos', async (req, res) => {
  try {
    const { adminView, clienteId: qClienteId } = req.query as { adminView?: string; clienteId?: string };
    const connection = await pool.getConnection();

    // Admins vêem tudo (incluindo inativos/pendentes); clientes só vêem ativos
    let sql: string;
    let params: any[] = [];

    // Admins vêem tudo (incluindo inativos/pendentes); clientes só vêem ativos
    if (adminView === '1') {
      // Admin: todos os status, incluindo inativos (soft delete)
      if (qClienteId) {
        sql = `SELECT id, clienteId, tipo, valor, descricao, data,
               registrado_por, registrado_por_id, registrado_por_nome,
               status, excluido_por, excluido_em, motivo_exclusao,
               aprovado_por, aprovado_em, cliente_confirmou
               FROM lancamentos WHERE clienteId = ? ORDER BY id DESC LIMIT 1000`;
        params = [qClienteId];
      } else {
        sql = `SELECT id, clienteId, tipo, valor, descricao, data,
               registrado_por, registrado_por_id, registrado_por_nome,
               status, excluido_por, excluido_em, motivo_exclusao,
               aprovado_por, aprovado_em, cliente_confirmou
               FROM lancamentos ORDER BY id DESC LIMIT 10000`;
      }
    } else {
      // Non-admin: retorna apenas lançamentos ATIVO (exclui soft-deleted)
      if (qClienteId) {
        sql = `SELECT id, clienteId, tipo, valor, descricao, data,
               registrado_por, registrado_por_nome, status
               FROM lancamentos WHERE clienteId = ? AND (status IS NULL OR status = 'ativo') ORDER BY id DESC`;
        params = [qClienteId];
      } else {
        sql = `SELECT id, clienteId, tipo, valor, descricao, data,
               registrado_por, registrado_por_nome, status
               FROM lancamentos WHERE status IS NULL OR status = 'ativo' ORDER BY id DESC LIMIT 10000`;
      }
    }

    const [rows] = await connection.execute(sql, params);
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar lançamentos:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar lançamentos', details: error?.message });
  }
});

app.post('/api/lancamentos', async (req, res) => {
  try {
    const {
      cliente_id, clienteId, tipo, valor, descricao,
      userId, userName, userEmail,
      // Origem do lançamento: 'admin' | 'user' | 'conta_geral'
      origem = 'admin',
      adminNome, adminId,
    } = req.body;
    let id_cliente = cliente_id || clienteId;

    const connection = await pool.getConnection();

    // Se é um usuário logado (userId presente), usar o próprio userId como id_cliente
    if (userId && !id_cliente) {
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE id = ? LIMIT 1', [userId]
      ) as any;
      if (existingUser && existingUser.length > 0) {
        id_cliente = existingUser[0].id;
      } else if (userEmail) {
        const [userByEmail] = await connection.execute(
          'SELECT id FROM users WHERE email = ? LIMIT 1', [userEmail]
        ) as any;
        if (userByEmail && userByEmail.length > 0) id_cliente = userByEmail[0].id;
      }
    }

    if (!id_cliente) {
      connection.release();
      return res.status(400).json({ error: 'Cliente não especificado' });
    }

    // Determinar autoria
    let registrado_por: 'admin' | 'user' | 'conta_geral' = 'admin';
    let registrado_por_id: string | null = null;
    let registrado_por_nome: string | null = null;

    if (origem === 'conta_geral') {
      registrado_por = 'conta_geral';
      registrado_por_nome = 'Conta Geral';
    } else if (origem === 'user') {
      registrado_por = 'user';
      registrado_por_id = String(userId || id_cliente);
      // Buscar nome do usuário
      const [uRows] = await connection.execute('SELECT name FROM users WHERE id = ? LIMIT 1', [id_cliente]) as any;
      registrado_por_nome = (uRows as any[])?.[0]?.name || userName || 'Usuário';
    } else {
      // admin
      registrado_por = 'admin';
      registrado_por_id = adminId ? String(adminId) : null;
      registrado_por_nome = adminNome || 'Administrador';
    }

    // Todos os lançamentos começam como 'ativo' (fluxo de aprovação removido)
    const statusInicial = 'ativo';
    const tokenAprovacao = null;

    // Obter data/hora atual (fuso Brasília = UTC-3)
    const now = new Date();
    const dataTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');

    const valorEmCentavos = typeof valor === 'number' ? Math.round(valor) : Math.round(parseFloat(valor));

    console.log('[API] INSERT lançamento:', { id_cliente, tipo, valorEmCentavos, registrado_por, statusInicial });

    const [result] = await connection.execute(
      `INSERT INTO lancamentos
       (clienteId, estabelecimentoId, tipo, valor, descricao, data,
        registrado_por, registrado_por_id, registrado_por_nome, status, token_aprovacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, 1, tipo || 'debito', valorEmCentavos, descricao || null, dataTimestamp,
       registrado_por, registrado_por_id, registrado_por_nome, statusInicial, tokenAprovacao]
    ) as any;

    const lancamentoId = result.insertId;

    // Se for vendas, registrar crédito automático (pagamento no balcão)
    let creditoId: number | null = null;
    if (tipo === 'vendas') {
      const descricaoPagamento = `Pagamento: ${descricao || 'Venda'}`;
      const [creditResult] = await connection.execute(
        `INSERT INTO lancamentos
         (clienteId, estabelecimentoId, tipo, valor, descricao, data,
          registrado_por, registrado_por_id, registrado_por_nome, status, token_aprovacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_cliente, 1, 'pagamento', valorEmCentavos, descricaoPagamento, dataTimestamp,
         registrado_por, registrado_por_id, registrado_por_nome, statusInicial, tokenAprovacao]
      ) as any;
      creditoId = creditResult.insertId;
    }

    connection.release();

    const novoLancamento = {
      id: lancamentoId,
      clienteId: id_cliente,
      tipo: tipo || 'debito',
      valor: valor,
      descricao: descricao,
      registrado_por,
      registrado_por_nome,
      status: statusInicial,
    };

    if (statusInicial === 'ativo') {
      notifySSEClients({ type: 'lancamentos:created', data: novoLancamento });
    }

    // Se for vendas, notificar também o crédito
    if (tipo === 'vendas' && creditoId) {
      const creditoLancamento = {
        id: creditoId,
        clienteId: id_cliente,
        tipo: 'pagamento',
        valor: valor,
        descricao: `Pagamento: ${descricao || 'Venda'}`,
        registrado_por,
        registrado_por_nome,
        status: statusInicial,
      };
      notifySSEClients({ type: 'lancamentos:created', data: creditoLancamento });
      res.json({ debito: novoLancamento, pagamento: creditoLancamento });
    } else {
      res.json(novoLancamento);
    }

    // Notificações assíncronas
    setImmediate(async () => {
      try {
        const conn2 = await pool.getConnection();
        const idClienteNum = parseInt(String(id_cliente), 10);

        // Buscar dados do cliente
        const [clienteRows] = await conn2.execute(
          'SELECT name, email FROM users WHERE id = ? LIMIT 1', [idClienteNum]
        ) as any;
        const clienteNome: string = (clienteRows as any[])?.[0]?.name || 'Cliente';
        const clienteEmail: string = (clienteRows as any[])?.[0]?.email || '';

        {
          // === FLUXO NORMAL (admin, user logado ou conta_geral — todos iguais) ===
          const [adminRows] = await conn2.execute(
            "SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL AND email != ''"
          ) as any;
          const emailsAdmins: string[] = (adminRows as any[]).map((r: any) => r.email).filter(Boolean);

          if (emailsAdmins.length > 0) {
            notificarNovoLancamento(
              emailsAdmins, clienteNome,
              (tipo || 'debito') as 'debito' | 'pagamento',
              valorEmCentavos, descricao || ''
            ).catch((err: any) => console.error('[Email] Erro ao notificar admins:', err));
          }

          // Confirmação de pagamento ao cliente
          if ((tipo || 'debito') === 'pagamento' && clienteEmail && !clienteEmail.includes('@caderninho.local')) {
            notificarPagamentoCliente(clienteEmail, clienteNome, valorEmCentavos)
              .catch((err: any) => console.error('[Email] Erro ao notificar cliente sobre pagamento:', err));
          }
        }

        conn2.release();
      } catch (emailErr: any) {
        console.error('[Email] Erro nas notificações:', emailErr?.message);
      }
    });

  } catch (error: any) {
    console.error('[API] Erro ao criar lançamento:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar lançamento', details: error?.message });
  }
});

// POST /api/lancamentos/vendas — lançamento sem cliente cadastrado (apenas admin)
app.post('/api/lancamentos/vendas', async (req, res) => {
  try {
    const { tipo, valor, descricao, nomeVendas, adminNome } = req.body;

    if (!valor || !tipo) {
      return res.status(400).json({ error: 'tipo e valor são obrigatórios' });
    }

    const connection = await pool.getConnection();

    // Verificar se já existe um usuário "Avulso" genérico no sistema
    let avulsoId: number;
    const [avulsoRows] = await connection.execute(
      "SELECT id FROM users WHERE email = 'avulso@caderninho.local' LIMIT 1"
    ) as any;

    if (avulsoRows && avulsoRows.length > 0) {
      avulsoId = avulsoRows[0].id;
    } else {
      // Criar usuário genérico para lançamentos avulsos
      const [insertResult] = await connection.execute(
        `INSERT INTO users (name, email, telefone, role, createdAt)
         VALUES ('Avulso', 'avulso@caderninho.local', '', 'user', NOW())`,
      ) as any;
      avulsoId = insertResult.insertId;
    }

    const now = new Date();
    const dataTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');
    const valorEmCentavos = typeof valor === 'number' ? Math.round(valor) : Math.round(parseFloat(valor));
    const descricaoFinal = descricao || (nomeVendas ? `[Vendas: ${nomeVendas}]` : '[Vendas]');

    const [result] = await connection.execute(
      `INSERT INTO lancamentos
       (clienteId, estabelecimentoId, tipo, valor, descricao, data,
        registrado_por, registrado_por_id, registrado_por_nome, status, token_aprovacao)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', NULL, ?, 'ativo', NULL)`,
      [avulsoId, 1, tipo || 'debito', valorEmCentavos, descricaoFinal, dataTimestamp,
       adminNome || 'Administrador']
    ) as any;

    connection.release();

    const novoLancamento = {
      id: result.insertId,
      clienteId: avulsoId,
      tipo: tipo || 'debito',
      valor: valorEmCentavos,
      descricao: descricaoFinal,
      registrado_por: 'admin',
      registrado_por_nome: adminNome || 'Administrador',
      status: 'ativo',
      avulso: true,
      nomeVendas: nomeVendas || 'Vendas',
    };

    notifySSEClients({ type: 'lancamentos:created', data: novoLancamento });
    res.json(novoLancamento);
  } catch (error: any) {
    console.error('[API] Erro ao criar lançamento avulso:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar lançamento avulso', details: error?.message });
  }
});

app.put('/api/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE lancamentos SET valor = ? WHERE id = ?',
      [valor, id]
    ) as any;
    
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    notifySSEClients({ type: 'lancamentos:updated', data: { id, valor } });
    res.json({ success: true, id, valor });
  } catch (error: any) {
    console.error('[API] Erro ao atualizar lançamento:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atualizar lançamento', details: error?.message });
  }
});

app.delete('/api/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { excluido_por = 'Administrador', motivo } = req.body || {};

    const connection = await pool.getConnection();

    // SOFT DELETE: marcar como inativo em vez de deletar fisicamente
    const agora = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await connection.execute(
      `UPDATE lancamentos
       SET status = 'inativo', excluido_por = ?, excluido_em = ?, motivo_exclusao = ?
       WHERE id = ?`,
      [excluido_por, agora, motivo || null, id]
    ) as any;

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    // Notificar clientes SSE sobre a inativação
    notifySSEClients({ type: 'lancamentos:deleted', data: { id, softDelete: true } });
    res.json({ success: true, id, softDelete: true, excluido_por, excluido_em: agora });
  } catch (error: any) {
    console.error('[API] Erro ao inativar lançamento:', error?.message || error);
    res.status(500).json({ error: 'Erro ao inativar lançamento', details: error?.message });
  }
});

// Rotas de aprovação de lançamentos removidas (fluxo simplificado)

// ============================================================================
// ROTAS: CARDÁPIOS (tabela 'menus' com categories JSON)
// ============================================================================

app.get('/api/menus', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Buscar TODOS os menus (ativos e inativos) para que o admin possa gerenciar
    const [menus] = await connection.execute(
      'SELECT id, name, description, is_active FROM menus ORDER BY id DESC LIMIT 100'
    );
    
    // Para cada menu, buscar categorias e itens
    const menusComCategorias = await Promise.all(
      (menus as any[]).map(async (menu) => {
        const [categories] = await connection.execute(
          'SELECT id, name, `order` FROM menu_categories WHERE menu_id = ? ORDER BY `order` ASC',
          [menu.id]
        );
        
        // Para cada categoria, buscar itens
        const categoriesComItens = await Promise.all(
          (categories as any[]).map(async (cat) => {
            const [items] = await connection.execute(
              'SELECT id, name, price FROM menu_items WHERE category_id = ? ORDER BY `order` ASC',
              [cat.id]
            );
            return {
              id: cat.id,
              name: cat.name,
              items: items as any[]
            };
          })
        );
        
        return {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          is_active: menu.is_active,
          categories: categoriesComItens
        };
      })
    );
    
    connection.release();
    res.json({ menus: menusComCategorias });
  } catch (error: any) {
    console.error('[API] Erro ao buscar cardápios:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar cardápios', details: error?.message });
  }
});

// Ativar um menu e desativar os outros
app.put('/api/menus/:id/ativar', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    // Desativar todos os menus
    await connection.execute('UPDATE menus SET is_active = 0');
    
    // Ativar o menu selecionado
    await connection.execute(
      'UPDATE menus SET is_active = 1 WHERE id = ?',
      [id]
    );
    
    connection.release();
    res.json({ success: true, message: 'Cardápio ativado com sucesso' });
  } catch (error: any) {
    console.error('[API] Erro ao ativar cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao ativar cardápio', details: error?.message });
  }
});

// // Endpoint para deletar todos os cardápios
app.delete('/api/menus/reset', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Deletar todos os menus
    await connection.execute('DELETE FROM menus');
    
    connection.release();
    res.json({ success: true, message: 'Todos os cardápios foram deletados' });
  } catch (error: any) {
    console.error('[API] Erro ao deletar cardápios:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar cardápios', details: error?.message });
  }
});

// Endpoint para popular cardápios (seed)
app.post('/api/menus/seed', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Verificar se já existem cardápios
    const [existingMenus] = await connection.execute('SELECT COUNT(*) as count FROM menus');
    if ((existingMenus as any[])[0].count > 0) {
      connection.release();
      return res.json({ message: 'Cardápios já existem' });
    }
    
    // Criar Cardápio Adega com itens
    const adegaId = 'adega-menu-1';
    const adegaCategories = [
      {
        id: 'cat-adega-bebidas',
        name: 'Bebidas',
        items: [
          { id: 'item-adega-cerveja', name: 'Cerveja', price: 1000 },
          { id: 'item-adega-refrigerante', name: 'Refrigerante', price: 500 },
          { id: 'item-adega-agua', name: 'Água', price: 300 }
        ]
      },
      {
        id: 'cat-adega-petiscos',
        name: 'Petiscos',
        items: [
          { id: 'item-adega-batata', name: 'Batata Frita', price: 1500 },
          { id: 'item-adega-amendoim', name: 'Amendoim', price: 800 }
        ]
      }
    ];
    await connection.execute(
      'INSERT INTO menus (id, name, description, categories, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
      [adegaId, 'Cardápio Adega', 'Cardápio padrão da Adega', JSON.stringify(adegaCategories)]
    );
    
    // Criar Cardápio After com itens
    const afterId = 'after-menu-1';
    const afterCategories = [
      {
        id: 'cat-after-bebidas',
        name: 'Bebidas After',
        items: [
          { id: 'item-after-chopp', name: 'Chopp', price: 1500 },
          { id: 'item-after-drink', name: 'Drink', price: 2000 },
          { id: 'item-after-agua', name: 'Água', price: 300 },
          { id: 'item-after-refrigerante', name: 'Refrigerante', price: 500 }
        ]
      },
      {
        id: 'cat-after-petiscos',
        name: 'Petiscos After',
        items: [
          { id: 'item-after-batata', name: 'Batata Frita', price: 1500 },
          { id: 'item-after-amendoim', name: 'Amendoim', price: 800 },
          { id: 'item-after-queijo', name: 'Queijo Derretido', price: 2500 }
        ]
      }
    ];
    await connection.execute(
      'INSERT INTO menus (id, name, description, categories, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NOW(), NOW())',
      [afterId, 'Cardápio After', 'Cardápio After Hours', JSON.stringify(afterCategories)]
    );
    
    connection.release();
    res.json({ message: '✅ Cardápios populados com sucesso!' });
  } catch (error: any) {
    console.error('[API] Erro ao popular cardápios:', error?.message || error);
    res.status(500).json({ error: 'Erro ao popular cardápios', details: error?.message });
  }
});

app.post('/api/menus', async (req, res) => {
  try {
    const { name, categories } = req.body;
    const id = Date.now().toString();

    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO menus (id, name, categories, is_active) VALUES (?, ?, ?, 1)',
      [id, name, JSON.stringify(categories || [])]
    );
    connection.release();

    const menu = { id, name, categories: categories || [], is_active: 1 };
    notifySSEClients({ type: 'menus:created', data: menu });

    res.json(menu);
  } catch (error: any) {
    console.error('[API] Erro ao criar cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar cardápio', details: error?.message });
  }
});

// Criar novo cardápio em branco
app.post('/api/menus/novo', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do cardápio é obrigatório' });
    }

    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    await connection.execute(
      'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
      [id, name.trim(), description?.trim() || '', new Date(), new Date()]
    );
    connection.release();

    const menu = { 
      id, 
      name: name.trim(), 
      description: description?.trim() || '',
      is_active: 0, 
      categories: [] 
    };
    
    res.json(menu);
  } catch (error: any) {
    console.error('[API] Erro ao criar cardápio em branco:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar cardápio', details: error?.message });
  }
});

// ============================================================================
// ROTAS: GERENCIAMENTO DE ITENS DO CARDÁPIO
// ============================================================================

// Atualizar preço de um item
app.put('/api/menus/items/:itemId/price', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { price } = req.body;
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Preço é obrigatório' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE menu_items SET price = ? WHERE id = ?',
      [price, itemId]
    ) as any;
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    notifySSEClients({ type: 'menus:updated', data: { itemId, price } });
    res.json({ success: true, itemId, price });
  } catch (error: any) {
    console.error('[API] Erro ao atualizar preço:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atualizar preço', details: error?.message });
  }
});

// Atualizar nome de um item
app.put('/api/menus/items/:itemId/name', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE menu_items SET name = ? WHERE id = ?',
      [name, itemId]
    ) as any;
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    notifySSEClients({ type: 'menus:updated', data: { itemId, name } });
    res.json({ success: true, itemId, name });
  } catch (error: any) {
    console.error('[API] Erro ao atualizar nome:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atualizar nome', details: error?.message });
  }
});

// Deletar um item
app.delete('/api/menus/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'DELETE FROM menu_items WHERE id = ?',
      [itemId]
    ) as any;
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    notifySSEClients({ type: 'menus:updated', data: { deletedItemId: itemId } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar item:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar item', details: error?.message });
  }
});

// Adicionar item a uma categoria
app.post('/api/menus/categories/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, price, priceOtherMenu } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }
    const connection = await pool.getConnection();
    // Verificar se a categoria existe e obter menu_id e name
    const [cats] = await connection.execute(
      'SELECT id, menu_id, name FROM menu_categories WHERE id = ?',
      [categoryId]
    ) as any;
    if ((cats as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    const currentMenuId = (cats as any[])[0].menu_id;
    const categoryName = (cats as any[])[0].name;
    
    // Obter próxima ordem
    const [maxOrder] = await connection.execute(
      'SELECT MAX(`order`) as maxOrder FROM menu_items WHERE category_id = ?',
      [categoryId]
    ) as any;
    const nextOrder = ((maxOrder as any[])[0].maxOrder ?? -1) + 1;
    
    // Gerar ID curto
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 6);
    const itemId = `mi-${ts}-${rnd}`;
    
    // Inserir item no menu atual
    const now = Date.now();
    await connection.execute(
      'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [itemId, categoryId, name, price, nextOrder, now]
    );
    
    // Marcar como novidade no menu atual
    const notifId = `notif-${itemId}`;
    await connection.execute(
      'INSERT INTO item_notifications (id, menu_id, item_id, is_new, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [notifId, currentMenuId, itemId, 1, now, now]
    );
    
    // Se foi criado em After, criar também em Adega (e vice-versa)
    if (currentMenuId === 'after-menu-1' || currentMenuId === 'adega-menu-1') {
      const otherMenuId = currentMenuId === 'after-menu-1' ? 'adega-menu-1' : 'after-menu-1';
      const otherPrice = priceOtherMenu !== undefined ? priceOtherMenu : price;
      
      // Encontrar categoria correspondente no outro menu (buscar por nome exato)
      const [otherCats] = await connection.execute(
        'SELECT id FROM menu_categories WHERE menu_id = ? AND name = ?',
        [otherMenuId, categoryName]
      ) as any;
      
      let otherCategoryId: string;
      
      if ((otherCats as any[]).length > 0) {
        otherCategoryId = (otherCats as any[])[0].id;
        
        // Obter próxima ordem no outro menu
        const [otherMaxOrder] = await connection.execute(
          'SELECT MAX(`order`) as maxOrder FROM menu_items WHERE category_id = ?',
          [otherCategoryId]
        ) as any;
        const otherNextOrder = ((otherMaxOrder as any[])[0].maxOrder ?? -1) + 1;
        
        // Gerar novo ID
        const otherItemId = `mi-${ts}-${rnd}-2`;
        
        await connection.execute(
          'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [otherItemId, otherCategoryId, name, otherPrice, otherNextOrder, now]
        );
        
        // Marcar como novidade no outro menu
        const otherNotifId = `notif-${otherItemId}`;
        await connection.execute(
          'INSERT INTO item_notifications (id, menu_id, item_id, is_new, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [otherNotifId, otherMenuId, otherItemId, 1, now, now]
        );
      } else {
        // Se categoria não existe no outro menu, criar ela
        const otherCatId = `cat-${otherMenuId}-${Date.now().toString(36)}`;
        
        // Obter próxima ordem de categoria no outro menu
        const [maxCatOrder] = await connection.execute(
          'SELECT MAX(`order`) as maxOrder FROM menu_categories WHERE menu_id = ?',
          [otherMenuId]
        ) as any;
        const nextCatOrder = ((maxCatOrder as any[])[0].maxOrder ?? -1) + 1;
        
        await connection.execute(
          'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
          [otherCatId, otherMenuId, categoryName, nextCatOrder, Date.now()]
        );
        
        otherCategoryId = otherCatId;
        
        // Agora inserir o item na categoria recém-criada
        const otherItemId = `mi-${ts}-${rnd}-2`;
        await connection.execute(
          'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [otherItemId, otherCategoryId, name, otherPrice, 0, now]
        );
        
        // Marcar como novidade no outro menu
        const otherNotifId = `notif-${otherItemId}`;
        await connection.execute(
          'INSERT INTO item_notifications (id, menu_id, item_id, is_new, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [otherNotifId, otherMenuId, otherItemId, 1, now, now]
        );
      }
    }
    
    // Criar banner de novidade para o cliente
    const bannerTitle = 'Novidade no Cardapio!';
    const bannerMessage = `Novo item: ${name}`;
    try {
      await connection.execute(
        'INSERT INTO banners (titulo, mensagem, tipo, ativo, dataCriacao) VALUES (?, ?, ?, 1, ?)',
        [bannerTitle, bannerMessage, 'success', now]
      );
    } catch (bannerError) {
      console.error('Erro ao criar banner:', bannerError);
    }
    
    connection.release();
    const newItem = { id: itemId, category_id: categoryId, name, price, order: nextOrder };
    notifySSEClients({ type: 'menus:updated', data: { newItem, isNew: true } });
    res.json({ ...newItem, isNew: true });
  } catch (error: any) {
    console.error('[API] Erro ao adicionar item:', error?.message || error);
    res.status(500).json({ error: 'Erro ao adicionar item', details: error?.message });
  }
});

// Criar nova categoria em um cardápio
app.post('/api/menus/:menuId/categories', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    const connection = await pool.getConnection();
    // Verificar se o menu existe
    const [menus] = await connection.execute(
      'SELECT id FROM menus WHERE id = ?',
      [menuId]
    ) as any;
    if ((menus as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Cardápio não encontrado' });
    }
    // Obter próxima ordem
    const [maxOrder] = await connection.execute(
      'SELECT MAX(`order`) as maxOrder FROM menu_categories WHERE menu_id = ?',
      [menuId]
    ) as any;
    const nextOrder = ((maxOrder as any[])[0].maxOrder ?? -1) + 1;
    // Gerar ID curto
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 6);
    const catId = `cat-${ts}-${rnd}`;
    await connection.execute(
      'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
      [catId, menuId, name.trim().toUpperCase(), nextOrder, Date.now()]
    );
    connection.release();
    const newCat = { id: catId, menu_id: menuId, name: name.trim().toUpperCase(), order: nextOrder, items: [] };
    notifySSEClients({ type: 'menus:updated', data: { newCategory: newCat } });
    res.json(newCat);
  } catch (error: any) {
    console.error('[API] Erro ao criar categoria:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar categoria', details: error?.message });
  }
});

// Renomear categoria
app.put('/api/menus/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE menu_categories SET name = ? WHERE id = ?',
      [name.trim().toUpperCase(), categoryId]
    ) as any;
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    notifySSEClients({ type: 'menus:updated', data: { updatedCategory: { id: categoryId, name: name.trim().toUpperCase() } } });
    res.json({ success: true, id: categoryId, name: name.trim().toUpperCase() });
  } catch (error: any) {
    console.error('[API] Erro ao renomear categoria:', error?.message || error);
    res.status(500).json({ error: 'Erro ao renomear categoria', details: error?.message });
  }
});

// Deletar categoria (e todos os itens dela)
app.delete('/api/menus/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const connection = await pool.getConnection();
    // Deletar itens da categoria primeiro
    await connection.execute('DELETE FROM menu_items WHERE category_id = ?', [categoryId]);
    // Deletar a categoria
    const [result] = await connection.execute(
      'DELETE FROM menu_categories WHERE id = ?',
      [categoryId]
    ) as any;
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar categoria:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar categoria', details: error?.message });
  }
});

// ============================================================================
// NOVO: Obter cardapios disponiveis para um cliente
// ============================================================================
app.get('/api/clientes/:clienteId/menus-disponiveis', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const connection = await pool.getConnection();
    
    // Buscar cardapios associados a este cliente
    const [menus] = await connection.execute(
      'SELECT DISTINCT m.id, m.name, m.description, m.is_active FROM menus m JOIN menu_clients mc ON m.id = mc.menu_id WHERE mc.cliente_id = ? ORDER BY m.name ASC',
      [clienteId]
    );
    
    connection.release();
    res.json({ menus: menus || [] });
  } catch (error: any) {
    console.error('[API] Erro ao buscar cardapios do cliente:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar cardapios', details: error?.message });
  }
});

// DELETE /api/menus/categories/:categoryId - Deletar categoria
app.delete('/api/menus/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const connection = await pool.getConnection();
    
    // Deletar categoria
    await connection.execute(
      'DELETE FROM menu_categories WHERE id = ?',
      [categoryId]
    );
    
    connection.release();
    notifySSEClients({ type: 'menus:updated', data: { deletedCategory: categoryId } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar categoria:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar categoria', details: error?.message });
  }
});

// ============================================================================
// ROTA: ALL-CLIENTS (alias para /api/clientes)
// ============================================================================

app.get('/api/all-clients', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Buscar todos os usuários não-admin da tabela 'users' (fonte única de verdade)
    const [rows] = await connection.execute(
      `SELECT id, name AS nome, telefone, email, ativo FROM users WHERE role != 'admin' ORDER BY name ASC LIMIT 1000`
    );
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar clientes:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: error?.message });
  }
});

// ============================================================================
// ROTA: ITENS MAIS VENDIDOS
// ============================================================================

app.get('/api/relatorios/itens-mais-vendidos', async (req, res) => {
  try {
    const { periodo = 'mes', dataInicio: dataInicioParam, dataFim: dataFimParam } = req.query as { periodo?: string; dataInicio?: string; dataFim?: string };
    const connection = await pool.getConnection();

    // Calcular data de início e fim
    const now = new Date();
    let dataInicio: Date;
    let dataFim: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (dataInicioParam && dataFimParam) {
      // Usar datas personalizadas passadas pelo frontend
      dataInicio = new Date(dataInicioParam + 'T00:00:00');
      dataFim = new Date(dataFimParam + 'T23:59:59');
    } else if (periodo === 'dia') {
      dataInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (periodo === 'semana') {
      const diaSemana = now.getDay();
      dataInicio = new Date(now);
      dataInicio.setDate(now.getDate() - diaSemana);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'ano') {
      dataInicio = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    } else {
      // mes (padrão)
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    // Formatar datas para MySQL
    const dataInicioStr = dataInicio.toISOString().slice(0, 19).replace('T', ' ');
    const dataFimStr = dataFim.toISOString().slice(0, 19).replace('T', ' ');

    // Buscar lançamentos de débito no período, agrupados por descrição
    const [rows] = await connection.execute(
      `SELECT
         descricao,
         COUNT(*) AS quantidade,
         SUM(valor) AS total_centavos
       FROM lancamentos
       WHERE tipo = 'debito'
         AND status = 'ativo'
         AND descricao IS NOT NULL
         AND descricao != ''
         AND data >= ?
         AND data <= ?
       GROUP BY descricao
       ORDER BY quantidade DESC, total_centavos DESC
       LIMIT 10`,
      [dataInicioStr, dataFimStr]
    ) as any;

    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar itens mais vendidos:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar itens mais vendidos', details: error?.message });
  }
});

// ============================================================================
// ROTA: AUDITORIA DE LANÇAMENTOS
// ============================================================================

// GET /api/auditoria/lancamentos — lista todos os lançamentos com dados de auditoria
// Query params: status=todos|ativo|inativo, limit=200, offset=0
app.get('/api/auditoria/lancamentos', async (req, res) => {
  try {
    const {
      status: filtroStatus = 'todos',
      limit = '200',
      offset = '0',
    } = req.query as Record<string, string>;

    const limitNum = Math.max(1, Math.min(500, parseInt(limit) || 200));
    const offsetNum = Math.max(0, parseInt(offset) || 0);

    const conditions: string[] = [];
    const params: any[] = [];

    if (filtroStatus === 'ativo') {
      conditions.push("l.status = 'ativo'");
    } else if (filtroStatus === 'inativo') {
      conditions.push("l.status = 'inativo'");
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT
         l.id,
         l.clienteId,
         u.name AS cliente_nome,
         l.tipo,
         l.valor,
         l.descricao,
         l.data,
         l.status,
         l.registrado_por,
         l.registrado_por_id,
         l.registrado_por_nome,
         l.excluido_por,
         l.excluido_por_id,
         l.excluido_por_nome,
         l.excluido_em,
         l.motivo_exclusao,
         l.reativado_por_id,
         l.reativado_por_nome,
         l.reativado_em
       FROM lancamentos l
       LEFT JOIN users u ON u.id = l.clienteId
       ${whereClause}
       ORDER BY l.data DESC, l.id DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    ) as any;
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar auditoria:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar auditoria', details: error?.message });
  }
});

// GET /api/auditoria/clientes — auditoria de saldos dos clientes
app.get('/api/auditoria/clientes', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Buscar todos os clientes
    const [clientes] = await connection.execute(
      `SELECT id, name, email FROM users WHERE role = 'user' ORDER BY name`
    ) as any;

    const auditoria = [];

    for (const cliente of clientes) {
      // Buscar débitos
      const [debitos] = await connection.execute(
        `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos 
         WHERE clienteId = ? AND tipo = 'debito' AND status = 'ativo'`,
        [cliente.id]
      ) as any;

      // Buscar pagamentos
      const [pagamentos] = await connection.execute(
        `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos 
         WHERE clienteId = ? AND tipo = 'pagamento' AND status = 'ativo'`,
        [cliente.id]
      ) as any;

      const totalDebitos = debitos[0]?.total || 0;
      const totalPagamentos = pagamentos[0]?.total || 0;
      const saldoCalculado = totalDebitos - totalPagamentos;

      if (saldoCalculado !== 0) {
        auditoria.push({
          id: cliente.id,
          name: cliente.name,
          email: cliente.email,
          totalDebitos,
          totalPagamentos,
          saldoCalculado,
          status: saldoCalculado > 0 ? 'DEVENDO' : 'CRÉDITO',
        });
      }
    }

    connection.release();
    res.json(auditoria);
  } catch (error: any) {
    console.error('[API] Erro ao fazer auditoria de clientes:', error?.message || error);
    res.status(500).json({ error: 'Erro ao fazer auditoria', details: error?.message });
  }
});

// PUT /api/lancamentos/:id/reativar — reativa um lançamento inativo
app.put('/api/lancamentos/:id/reativar', async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user;
    const adminNome = adminUser?.name || adminUser?.username || 'Admin';
    const adminId = adminUser?.id ? String(adminUser.id) : null;

    const connection = await pool.getConnection();
    await connection.execute(
      `UPDATE lancamentos SET
         status = 'ativo',
         reativado_por_id = ?,
         reativado_por_nome = ?,
         reativado_em = NOW()
       WHERE id = ?`,
      [adminId, adminNome, id]
    );
    connection.release();
    res.json({ success: true, message: 'Lançamento reativado com sucesso' });
  } catch (error: any) {
    console.error('[API] Erro ao reativar lançamento:', error?.message || error);
    res.status(500).json({ error: 'Erro ao reativar lançamento', details: error?.message });
  }
});

// ============================================================================
// ROTA: HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ENDPOINTS DE NOTIFICAÇÕES DE NOVIDADE
// ============================================================================

// GET /api/menus/:menuId/new-items - Obter itens novos de um cardápio
app.get('/api/menus/:menuId/new-items', async (req, res) => {
  try {
    const { menuId } = req.params;
    const connection = await pool.getConnection();
    
    const [items] = await connection.execute(
      `SELECT mi.id, mi.name, mi.price, mc.name as category_name
       FROM item_notifications in_n
       JOIN menu_items mi ON in_n.item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE in_n.menu_id = ? AND in_n.is_new = 1
       ORDER BY in_n.created_at DESC
       LIMIT 20`,
      [menuId]
    ) as any;
    
    connection.release();
    // Converter preços de centavos para reais
    const formattedItems = (items || []).map((item: any) => ({
      ...item,
      price: item.price / 100
    }));
    res.json(formattedItems);
  } catch (error: any) {
    console.error('[API] Erro ao buscar itens novos:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar itens novos', details: error?.message });
  }
});

// GET /api/menu-items/:itemId/is-new - Verificar se item é novo
app.get('/api/menu-items/:itemId/is-new', async (req, res) => {
  try {
    const { itemId } = req.params;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'SELECT is_new FROM item_notifications WHERE item_id = ? LIMIT 1',
      [itemId]
    ) as any;
    
    connection.release();
    const isNew = (result as any[]).length > 0 && (result as any[])[0].is_new === 1;
    res.json({ isNew });
  } catch (error: any) {
    console.error('[API] Erro ao verificar novidade:', error?.message || error);
    res.status(500).json({ error: 'Erro ao verificar novidade', details: error?.message });
  }
});

// POST /api/menu-items/:itemId/mark-as-seen - Marcar item como visto
app.post('/api/menu-items/:itemId/mark-as-seen', async (req, res) => {
  try {
    const { itemId } = req.params;
    const connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE item_notifications SET is_new = 0, updated_at = ? WHERE item_id = ?',
      [Date.now(), itemId]
    );
    
    connection.release();
    res.json({ success: true, message: 'Item marcado como visto' });
  } catch (error: any) {
    console.error('[API] Erro ao marcar como visto:', error?.message || error);
    res.status(500).json({ error: 'Erro ao marcar como visto', details: error?.message });
  }
});

// POST /api/menus/:menuId/clear-new-items - Limpar todas novidades
app.post('/api/menus/:menuId/clear-new-items', async (req, res) => {
  try {
    const { menuId } = req.params;
    const connection = await pool.getConnection();
    
    const result = await connection.execute(
      'UPDATE item_notifications SET is_new = 0, updated_at = ? WHERE menu_id = ? AND is_new = 1',
      [Date.now(), menuId]
    ) as any;
    
    connection.release();
    res.json({ success: true, message: 'Todas as novidades foram limpas', affected: (result as any[])[0].affectedRows });
  } catch (error: any) {
    console.error('[API] Erro ao limpar novidades:', error?.message || error);
    res.status(500).json({ error: 'Erro ao limpar novidades', details: error?.message });
  }
});

// ============================================================================
// SERVIR FRONTEND ESTÁTICO
// ============================================================================

app.use(express.static(path.join(__dirname, '../dist/public')));

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// ============================================================================
// NOVO: Listar clientes de um cardápio
// ============================================================================
app.get('/api/menus/:menuId/clientes', async (req, res) => {
  try {
    const { menuId } = req.params;
    const connection = await pool.getConnection();
    
    // Buscar clientes associados a este cardápio
    const [clients] = await connection.execute(
      'SELECT u.id, u.name, u.email FROM menu_clients mc JOIN users u ON mc.cliente_id = u.id WHERE mc.menu_id = ? ORDER BY u.name ASC',
      [menuId]
    );
    
    connection.release();
    res.json({ clientes: clients });
  } catch (error: any) {
    console.error('[API] Erro ao listar clientes do cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao listar clientes', details: error?.message });
  }
});

// ============================================================================
// NOVO: Adicionar cliente a um cardápio
// ============================================================================
app.post('/api/menus/:menuId/clientes', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { clienteId } = req.body;
    const connection = await pool.getConnection();
    
    // Verificar se cliente já está associado
    const [existing] = await connection.execute(
      'SELECT id FROM menu_clients WHERE menu_id = ? AND cliente_id = ?',
      [menuId, clienteId]
    );
    
    if ((existing as any[]).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Cliente já associado a este cardápio' });
    }
    
    // Gerar UUID para o registro
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    // Inserir associação
    await connection.execute(
      'INSERT INTO menu_clients (id, menu_id, cliente_id, created_at) VALUES (?, ?, ?, ?)',
      [id, menuId, clienteId, Date.now()]
    );
    
    // Sincronizar: atualizar menu_fixo_id do cliente para este cardápio
    await connection.execute(
      'UPDATE users SET menu_fixo_id = ? WHERE id = ?',
      [menuId, clienteId]
    );
    
    connection.release();
    res.json({ success: true, message: 'Cliente adicionado ao cardápio' });
  } catch (error: any) {
    console.error('[API] Erro ao adicionar cliente ao cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao adicionar cliente', details: error?.message });
  }
});

// ============================================================================
// NOVO: Remover cliente de um cardápio
// ============================================================================
app.delete('/api/menus/:menuId/clientes/:clienteId', async (req, res) => {
  try {
    const { menuId, clienteId } = req.params;
    const connection = await pool.getConnection();
    
    // Deletar associação
    await connection.execute(
      'DELETE FROM menu_clients WHERE menu_id = ? AND cliente_id = ?',
      [menuId, clienteId]
    );
    
    connection.release();
    res.json({ success: true, message: 'Cliente removido do cardápio' });
  } catch (error: any) {
    console.error('[API] Erro ao remover cliente do cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao remover cliente', details: error?.message });
  }
});

// ============================================================================
// NOVO: Obter cardápios disponíveis para um cliente
// ============================================================================
app.get('/api/clientes/:clienteId/menus-disponiveis', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const connection = await pool.getConnection();
    
    // Buscar cardápios associados a este cliente
    const [menus] = await connection.execute(
      'SELECT DISTINCT m.id, m.name, m.description, m.is_active FROM menus m JOIN menu_clients mc ON m.id = mc.menu_id WHERE mc.cliente_id = ? ORDER BY m.name ASC',
      [clienteId]
    );
    
    connection.release();
    res.json({ menus: menus || [] });
  } catch (error: any) {
    console.error('[API] Erro ao buscar cardápios do cliente:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar cardápios', details: error?.message });
  }
});

// ============================================================================
// NOVO: Atribuir automaticamente cardápio After para clientes sem cardápio
// ============================================================================
app.post('/api/clientes/atribuir-after', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Buscar ID do cardápio "After"
    const [afterMenus] = await connection.execute(
      'SELECT id FROM menus WHERE name = ? LIMIT 1',
      ['After']
    );
    
    if ((afterMenus as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Cardápio After não encontrado' });
    }
    
    const afterMenuId = (afterMenus as any[])[0].id;
    
    // Buscar clientes que não têm nenhum cardápio associado
    const [clientesSemMenu] = await connection.execute(
      'SELECT DISTINCT u.id FROM users u WHERE u.id NOT IN (SELECT DISTINCT cliente_id FROM menu_clients) AND u.role = ?',
      ['user']
    );
    
    // Atribuir After a cada cliente sem cardápio
    const { v4: uuidv4 } = await import('uuid');
    let atribuidos = 0;
    
    for (const cliente of (clientesSemMenu as any[])) {
      const id = uuidv4();
      await connection.execute(
        'INSERT INTO menu_clients (id, menu_id, cliente_id, created_at) VALUES (?, ?, ?, ?)',
        [id, afterMenuId, cliente.id, Date.now()]
      );
      atribuidos++;
    }
    
    connection.release();
    res.json({ 
      success: true, 
      message: `${atribuidos} cliente(s) atribuído(s) ao cardápio After` 
    });
  } catch (error: any) {
    console.error('[API] Erro ao atribuir After:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atribuir After', details: error?.message });
  }
});



// ============================================================================
// REORDENAÇÃO DE CATEGORIAS E ITENS
// ============================================================================

// PUT /api/menus/categories/:categoryId/reorder - Reordenar categoria
app.put('/api/menus/categories/:categoryId/reorder', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number' || newOrder < 0) {
      return res.status(400).json({ error: 'newOrder deve ser um número não-negativo' });
    }

    // Validar que newOrder não é negativo
    if (newOrder < 0) {
      return res.status(400).json({ error: 'Não é possível mover para cima: categoria já está no topo' });
    }

    const connection = await pool.getConnection();

    // Obter a categoria atual
    const [categories] = await connection.execute(
      'SELECT menu_id, `order` FROM menu_categories WHERE id = ?',
      [categoryId]
    );

    if ((categories as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const category = (categories as any[])[0];
    const oldOrder = category.order;
    const menuId = category.menu_id;

    // Se a nova ordem é menor (mover para cima), deslocar categorias para baixo
    if (newOrder < oldOrder) {
      await connection.execute(
        'UPDATE menu_categories SET `order` = `order` + 1 WHERE menu_id = ? AND `order` >= ? AND `order` < ?',
        [menuId, newOrder, oldOrder]
      );
    }
    // Se a nova ordem é maior (mover para baixo), deslocar categorias para cima
    else if (newOrder > oldOrder) {
      await connection.execute(
        'UPDATE menu_categories SET `order` = `order` - 1 WHERE menu_id = ? AND `order` > ? AND `order` <= ?',
        [menuId, oldOrder, newOrder]
      );
    }

    // Atualizar a ordem da categoria
    await connection.execute(
      'UPDATE menu_categories SET `order` = ? WHERE id = ?',
      [newOrder, categoryId]
    );

    connection.release();
    res.json({ success: true, message: 'Categoria reordenada com sucesso' });
  } catch (error: any) {
    console.error('[API] Erro ao reordenar categoria:', error?.message || error);
    res.status(500).json({ error: 'Erro ao reordenar categoria', details: error?.message });
  }
});

// PUT /api/menu-items/:itemId/reorder - Reordenar item
app.put('/api/menu-items/:itemId/reorder', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number' || newOrder < 0) {
      return res.status(400).json({ error: 'newOrder deve ser um número não-negativo' });
    }

    // Validar que newOrder não é negativo
    if (newOrder < 0) {
      return res.status(400).json({ error: 'Não é possível mover para cima: item já está no topo' });
    }

    const connection = await pool.getConnection();

    // Obter o item atual
    const [items] = await connection.execute(
      'SELECT category_id, `order` FROM menu_items WHERE id = ?',
      [itemId]
    );

    if ((items as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const item = (items as any[])[0];
    const oldOrder = item.order;
    const categoryId = item.category_id;

    // Se a nova ordem é menor (mover para cima), deslocar itens para baixo
    if (newOrder < oldOrder) {
      await connection.execute(
        'UPDATE menu_items SET `order` = `order` + 1 WHERE category_id = ? AND `order` >= ? AND `order` < ?',
        [categoryId, newOrder, oldOrder]
      );
    }
    // Se a nova ordem é maior (mover para baixo), deslocar itens para cima
    else if (newOrder > oldOrder) {
      await connection.execute(
        'UPDATE menu_items SET `order` = `order` - 1 WHERE category_id = ? AND `order` > ? AND `order` <= ?',
        [categoryId, oldOrder, newOrder]
      );
    }

    // Atualizar a ordem do item
    await connection.execute(
      'UPDATE menu_items SET `order` = ? WHERE id = ?',
      [newOrder, itemId]
    );

    connection.release();
    res.json({ success: true, message: 'Item reordenado com sucesso' });
  } catch (error: any) {
    console.error('[API] Erro ao reordenar item:', error?.message || error);
    res.status(500).json({ error: 'Erro ao reordenar item', details: error?.message });
  }
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

async function start() {
  try {
    await initializeDatabase();
    await initializeBannersTable(pool);
    initializeEmailService();

    // Registrar rotas de banners
    app.use('/api/banners', bannersRouter);

    // Seed automático é chamado via endpoint POST /api/menus/seed

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log('============================================================');
      console.log('✅ SERVIDOR COM MYSQL + TiDB Cloud INICIADO');
      console.log('============================================================');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🗄️  Banco: ${cleanDatabaseUrl.replace(/:[^@]*@/, ':***@').substring(0, 80)}...`);
      console.log(`🔒 SSL: Ativado (TiDB Cloud obrigatório)`);
      console.log('============================================================');
    });
  } catch (error: any) {
    console.error('[STARTUP] ❌ Erro ao iniciar servidor:', error?.message || error);
    process.exit(1);
  }
}

start();
