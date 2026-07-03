-- Criar tabela de banners para notícias e atualizações
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
);
