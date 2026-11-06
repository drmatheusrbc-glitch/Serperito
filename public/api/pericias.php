<?php
/**
 * API REST de Perícias Médicas (HostGator MySQL)
 * Sincroniza perícias, prazos e honorários em tempo real na nuvem.
 */

header('Content-Type: application/json; charset=UTF-8');

// Somente o servidor Next.js da Vercel pode acessar esta API.
$tokenEsperado = defined('SERPERITO_API_TOKEN') ? SERPERITO_API_TOKEN : '';
$tokenRecebido = $_SERVER['HTTP_X_SERPERITO_TOKEN'] ?? '';
if (!$tokenEsperado || !$tokenRecebido || !hash_equals($tokenEsperado, $tokenRecebido)) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado.']);
    exit;
}

require_once __DIR__ . '/db.php';

$conexaoInfo = obterConexaoPDO();
$pdo = $conexaoInfo['pdo'];
$erroConexao = $conexaoInfo['erro'];

$metodo = $_SERVER['REQUEST_METHOD'];

// ROTA GET: Buscar perícias do banco ou testar conexão
if ($metodo === 'GET') {
    // Teste de conexão (Ping)
    if (isset($_GET['ping'])) {
        if ($pdo) {
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM pericias");
            $total = $stmt->fetchColumn();
            echo json_encode([
                'conectado' => true,
                'mensagem' => 'Conexão com o banco de dados MySQL da HostGator estabelecida com sucesso.',
                'totalPericias' => (int)$total,
                'versaoPhp' => PHP_VERSION,
            ]);
        } else {
            echo json_encode([
                'conectado' => false,
                'mensagem' => $erroConexao,
            ]);
        }
        exit;
    }

    // Se o banco não estiver configurado, avisa o front-end para usar o modo local
    if (!$pdo) {
        echo json_encode([
            'conectado' => false,
            'modo' => 'local_fallback',
            'mensagem' => $erroConexao,
            'pericias' => []
        ]);
        exit;
    }

    try {
        $stmt = $pdo->query("SELECT dados_json FROM pericias ORDER BY atualizado_em DESC");
        $linhas = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $pericias = [];
        foreach ($linhas as $linha) {
            $item = json_decode($linha, true);
            if ($item && !empty($item['id'])) {
                $pericias[] = $item;
            }
        }

        echo json_encode([
            'conectado' => true,
            'modo' => 'nuvem_mysql',
            'pericias' => $pericias,
            'total' => count($pericias)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'conectado' => false,
            'error' => 'Erro ao consultar banco de dados: ' . $e->getMessage(),
            'pericias' => []
        ]);
    }
    exit;
}

// ROTA POST: Salvar, Excluir ou Sincronizar em Lote
if ($metodo === 'POST') {
    if (!$pdo) {
        echo json_encode([
            'conectado' => false,
            'modo' => 'local_fallback',
            'mensagem' => $erroConexao,
            'salvo' => false
        ]);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);

    if (!$body) {
        http_response_code(400);
        echo json_encode(['error' => 'Corpo da requisição inválido.']);
        exit;
    }

    $acao = $body['acao'] ?? 'salvar';

    // AÇÃO 1: SALVAR / ATUALIZAR UMA PERÍCIA
    if ($acao === 'salvar') {
        $p = $body['pericia'] ?? null;
        if (!$p || empty($p['id']) || empty($p['numeroProcesso'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados da perícia incompletos para salvamento.']);
            exit;
        }

        try {
            $sql = "
            INSERT INTO pericias (
                id, numero_processo, autor, reu, vara, tribunal, cidade_uf, area, status,
                data_nomeacao, prazo_manifestacao, data_limite_agendamento, data_pericia,
                horario_pericia, data_limite_laudo, data_entrega_laudo, honorarios_propostos,
                honorarios_fixados, honorarios_recebidos, dados_json, atualizado_em
            ) VALUES (
                :id, :numero_processo, :autor, :reu, :vara, :tribunal, :cidade_uf, :area, :status,
                :data_nomeacao, :prazo_manifestacao, :data_limite_agendamento, :data_pericia,
                :horario_pericia, :data_limite_laudo, :data_entrega_laudo, :honorarios_propostos,
                :honorarios_fixados, :honorarios_recebidos, :dados_json, NOW()
            ) ON DUPLICATE KEY UPDATE
                numero_processo = VALUES(numero_processo),
                autor = VALUES(autor),
                reu = VALUES(reu),
                vara = VALUES(vara),
                tribunal = VALUES(tribunal),
                cidade_uf = VALUES(cidade_uf),
                area = VALUES(area),
                status = VALUES(status),
                data_nomeacao = VALUES(data_nomeacao),
                prazo_manifestacao = VALUES(prazo_manifestacao),
                data_limite_agendamento = VALUES(data_limite_agendamento),
                data_pericia = VALUES(data_pericia),
                horario_pericia = VALUES(horario_pericia),
                data_limite_laudo = VALUES(data_limite_laudo),
                data_entrega_laudo = VALUES(data_entrega_laudo),
                honorarios_propostos = VALUES(honorarios_propostos),
                honorarios_fixados = VALUES(honorarios_fixados),
                honorarios_recebidos = VALUES(honorarios_recebidos),
                dados_json = VALUES(dados_json),
                atualizado_em = NOW();
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $p['id'],
                ':numero_processo' => $p['numeroProcesso'],
                ':autor' => $p['autor'] ?? '',
                ':reu' => $p['reu'] ?? '',
                ':vara' => $p['vara'] ?? '',
                ':tribunal' => $p['tribunal'] ?? '',
                ':cidade_uf' => $p['cidadeUf'] ?? '',
                ':area' => $p['area'] ?? '',
                ':status' => $p['status'] ?? 'NOMEACAO_RECEBIDA',
                ':data_nomeacao' => $p['dataNomeacao'] ?? '',
                ':prazo_manifestacao' => $p['prazoManifestacao'] ?? '',
                ':data_limite_agendamento' => $p['dataLimiteAgendamento'] ?? '',
                ':data_pericia' => $p['dataPericia'] ?? '',
                ':horario_pericia' => $p['horarioPericia'] ?? '',
                ':data_limite_laudo' => $p['dataLimiteLaudo'] ?? '',
                ':data_entrega_laudo' => $p['dataEntregaLaudo'] ?? '',
                ':honorarios_propostos' => (float)($p['honorariosPropostos'] ?? 0),
                ':honorarios_fixados' => (float)($p['honorariosFixados'] ?? 0),
                ':honorarios_recebidos' => (float)($p['honorariosRecebidos'] ?? 0),
                ':dados_json' => json_encode($p, JSON_UNESCAPED_UNICODE)
            ]);

            echo json_encode([
                'conectado' => true,
                'sucesso' => true,
                'mensagem' => 'Perícia salva no banco de dados da HostGator com sucesso.',
                'id' => $p['id']
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar perícia: ' . $e->getMessage()]);
        }
        exit;
    }

    // AÇÃO 2: EXCLUIR PERÍCIA
    if ($acao === 'excluir') {
        $id = $body['id'] ?? '';
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não informado para exclusão.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM pericias WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'conectado' => true,
                'sucesso' => true,
                'mensagem' => 'Perícia excluída do banco de dados da HostGator.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao excluir perícia: ' . $e->getMessage()]);
        }
        exit;
    }

    // AÇÃO 3: SINCRONIZAÇÃO EM LOTE (migrar do localStorage para a nuvem)
    if ($acao === 'sync_batch') {
        $periciasLocais = $body['pericias'] ?? [];
        $inseridos = 0;

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO pericias (id, numero_processo, autor, reu, status, dados_json, atualizado_em)
                VALUES (:id, :numero_processo, :autor, :reu, :status, :dados_json, NOW())
                ON DUPLICATE KEY UPDATE dados_json = VALUES(dados_json), atualizado_em = NOW()
            ");

            foreach ($periciasLocais as $p) {
                if (!empty($p['id']) && !empty($p['numeroProcesso'])) {
                    $stmt->execute([
                        ':id' => $p['id'],
                        ':numero_processo' => $p['numeroProcesso'],
                        ':autor' => $p['autor'] ?? '',
                        ':reu' => $p['reu'] ?? '',
                        ':status' => $p['status'] ?? 'NOMEACAO_RECEBIDA',
                        ':dados_json' => json_encode($p, JSON_UNESCAPED_UNICODE)
                    ]);
                    $inseridos++;
                }
            }
            $pdo->commit();

            echo json_encode([
                'conectado' => true,
                'sucesso' => true,
                'mensagem' => "{$inseridos} perícias sincronizadas na nuvem com sucesso.",
                'totalSincronizado' => $inseridos
            ]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Falha na sincronização em lote: ' . $e->getMessage()]);
        }
        exit;
    }
}

// ROTA DELETE DIRETA
if ($metodo === 'DELETE') {
    if (!$pdo) {
        echo json_encode(['conectado' => false, 'modo' => 'local_fallback']);
        exit;
    }
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'ID não informado.']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM pericias WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(['conectado' => true, 'sucesso' => true]);
    exit;
}
