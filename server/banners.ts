/**
 * Banners API - Gerenciar banners de notícias
 * Endpoints para listar e gerenciar banners
 * Usa banco de dados MySQL via express
 */

import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

export const bannersRouter = Router();

// Função auxiliar para conectar ao banco
async function getConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'caderninho',
  });
  return connection;
}

// GET /api/banners - Listar banners ativos
bannersRouter.get('/', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await getConnection();
    const [banners] = await connection.query(
      `SELECT id, titulo, mensagem, tipo, ativo, dataCriacao, dataExpiracao
       FROM banners
       WHERE ativo = 1
       ORDER BY dataCriacao DESC`
    );
    res.json(banners);
  } catch (error) {
    console.error('Erro ao listar banners:', error);
    res.status(500).json({ error: 'Erro ao listar banners' });
  } finally {
    if (connection) await connection.end();
  }
});

// POST /api/banners - Criar novo banner (admin only)
bannersRouter.post('/', async (req: Request, res: Response) => {
  let connection;
  try {
    const { titulo, mensagem, tipo, dataExpiracao } = req.body;

    if (!titulo || !mensagem || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    connection = await getConnection();
    const [result] = await connection.query(
      `INSERT INTO banners (titulo, mensagem, tipo, ativo, dataCriacao, dataExpiracao)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [titulo, mensagem, tipo, Date.now(), dataExpiracao || null]
    );

    res.json({
      id: (result as any).insertId,
      titulo,
      mensagem,
      tipo,
      ativo: 1,
      dataCriacao: Date.now(),
      dataExpiracao: dataExpiracao || null,
    });
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    res.status(500).json({ error: 'Erro ao criar banner' });
  } finally {
    if (connection) await connection.end();
  }
});

// PUT /api/banners/:id - Atualizar banner (admin only)
bannersRouter.put('/:id', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params;
    const { titulo, mensagem, tipo, ativo, dataExpiracao } = req.body;

    connection = await getConnection();
    await connection.query(
      `UPDATE banners
       SET titulo = ?, mensagem = ?, tipo = ?, ativo = ?, dataExpiracao = ?
       WHERE id = ?`,
      [titulo, mensagem, tipo, ativo ? 1 : 0, dataExpiracao || null, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    res.status(500).json({ error: 'Erro ao atualizar banner' });
  } finally {
    if (connection) await connection.end();
  }
});

// DELETE /api/banners/:id - Deletar banner (admin only)
bannersRouter.delete('/:id', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    await connection.query('DELETE FROM banners WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar banner:', error);
    res.status(500).json({ error: 'Erro ao deletar banner' });
  } finally {
    if (connection) await connection.end();
  }
});
