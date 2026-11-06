-- =============================================================================
-- Estrutura de Banco de Dados MySQL para o PeríciaMed (HostGator cPanel)
-- =============================================================================
-- DICA: Você NÃO precisa rodar este script manualmente! 
-- O sistema cria a tabela automaticamente assim que você preencher o api/config.php.
-- Este arquivo serve como referência ou para importação manual no phpMyAdmin.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `pericias` (
  `id` VARCHAR(64) NOT NULL,
  `numero_processo` VARCHAR(100) NOT NULL,
  `autor` VARCHAR(255) NOT NULL,
  `reu` VARCHAR(255) DEFAULT '',
  `vara` VARCHAR(150) DEFAULT '',
  `tribunal` VARCHAR(50) DEFAULT '',
  `cidade_uf` VARCHAR(100) DEFAULT '',
  `area` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) NOT NULL,
  `data_nomeacao` VARCHAR(30) DEFAULT '',
  `prazo_manifestacao` VARCHAR(30) DEFAULT '',
  `data_limite_agendamento` VARCHAR(30) DEFAULT '',
  `data_pericia` VARCHAR(30) DEFAULT '',
  `horario_pericia` VARCHAR(20) DEFAULT '',
  `data_limite_laudo` VARCHAR(30) DEFAULT '',
  `data_entrega_laudo` VARCHAR(30) DEFAULT '',
  `honorarios_propostos` DECIMAL(12,2) DEFAULT '0.00',
  `honorarios_fixados` DECIMAL(12,2) DEFAULT '0.00',
  `honorarios_recebidos` DECIMAL(12,2) DEFAULT '0.00',
  `dados_json` LONGTEXT NOT NULL,
  `criado_em` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_data_laudo` (`data_limite_laudo`),
  INDEX `idx_data_pericia` (`data_pericia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
