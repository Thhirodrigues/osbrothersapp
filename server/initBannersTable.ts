/**
 * Inicializar tabela de banners
 * Cria a tabela se não existir
 */

import mysql from 'mysql2/promise';

export async function initializeBannersTable(pool: mysql.Pool) {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        tipo ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
        ativo TINYINT(1) NOT NULL DEFAULT 1,
        dataCriacao BIGINT NOT NULL,
        dataExpiracao BIGINT,
        criadoPor INT,
        INDEX idx_ativo (ativo),
        INDEX idx_dataCriacao (dataCriacao),
        INDEX idx_dataExpiracao (dataExpiracao)
      )
    `);
    
    console.log('✅ Tabela de banners inicializada');
    connection.release();
  } catch (error) {
    console.error('❌ Erro ao inicializar tabela de banners:', error);
    throw error;
  }
}
