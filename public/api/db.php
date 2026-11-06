<?php
/**
 * Conexão com Banco de Dados MySQL da HostGator (PDO)
 * Sistema de Gestão de Perícias Médico-Legais
 */

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

function obterConexaoPDO() {
    // Verificar se as constantes foram preenchidas no config.php
    $dbHost = defined('DB_HOST') ? DB_HOST : 'localhost';
    $dbName = defined('DB_NAME') ? DB_NAME : '';
    $dbUser = defined('DB_USER') ? DB_USER : '';
    $dbPass = defined('DB_PASS') ? DB_PASS : '';

    // Se ainda estiver com os valores padrão de exemplo, não tenta conectar
    if (empty($dbName) || $dbName === 'SUA_CONTA_periciamed' || empty($dbUser) || $dbUser === 'SUA_CONTA_periciauser') {
        return [
            'pdo' => null,
            'erro' => 'Banco de dados MySQL ainda não configurado no arquivo api/config.php.'
        ];
    }

    try {
        $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        $pdo = new PDO($dsn, $dbUser, $dbPass, $options);

        // Criar a tabela automaticamente na primeira execução se ainda não existir
        criarTabelaSeNaoExistir($pdo);

        return [
            'pdo' => $pdo,
            'erro' => null
        ];
    } catch (PDOException $e) {
        return [
            'pdo' => null,
            'erro' => 'Falha na conexão com o MySQL da HostGator: ' . $e->getMessage()
        ];
    }
}

function criarTabelaSeNaoExistir(PDO $pdo) {
    $sql = "
    CREATE TABLE IF NOT EXISTS pericias (
        id VARCHAR(64) PRIMARY KEY,
        numero_processo VARCHAR(100) NOT NULL,
        autor VARCHAR(255) NOT NULL,
        reu VARCHAR(255) DEFAULT '',
        vara VARCHAR(150) DEFAULT '',
        tribunal VARCHAR(50) DEFAULT '',
        cidade_uf VARCHAR(100) DEFAULT '',
        area VARCHAR(100) DEFAULT '',
        status VARCHAR(50) NOT NULL,
        data_nomeacao VARCHAR(30) DEFAULT '',
        prazo_manifestacao VARCHAR(30) DEFAULT '',
        data_limite_agendamento VARCHAR(30) DEFAULT '',
        data_pericia VARCHAR(30) DEFAULT '',
        horario_pericia VARCHAR(20) DEFAULT '',
        data_limite_laudo VARCHAR(30) DEFAULT '',
        data_entrega_laudo VARCHAR(30) DEFAULT '',
        honorarios_propostos DECIMAL(12,2) DEFAULT 0,
        honorarios_fixados DECIMAL(12,2) DEFAULT 0,
        honorarios_recebidos DECIMAL(12,2) DEFAULT 0,
        dados_json LONGTEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_data_laudo (data_limite_laudo),
        INDEX idx_data_pericia (data_pericia)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($sql);
}
