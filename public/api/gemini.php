<?php
/**
 * Backend PHP do Assistente Médico-Pericial (HostGator / Apache)
 * Comunica com a Google Generative Language API (Gemini) via cURL nativo do PHP.
 */

// Headers de segurança e CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Tratar requisição OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Utilize POST.']);
    exit;
}

// Carregar configuração da chave
$configFile = __DIR__ . '/config.php';
$apiKey = '';
$model = 'gemini-2.5-flash';

if (file_exists($configFile)) {
    require_once $configFile;
    if (defined('GEMINI_API_KEY') && GEMINI_API_KEY !== 'COLE_SUA_CHAVE_AQUI' && !empty(GEMINI_API_KEY)) {
        $apiKey = GEMINI_API_KEY;
    }
    if (defined('GEMINI_MODEL') && !empty(GEMINI_MODEL)) {
        $model = GEMINI_MODEL;
    }
}

// Fallback para variáveis de ambiente (se configuradas no Apache/cPanel)
if (empty($apiKey)) {
    $apiKey = getenv('GEMINI_API_KEY') ?: (getenv('GEMINI_LIVE_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_SERVER['GEMINI_API_KEY'] ?? '')));
}

if (empty($apiKey) || $apiKey === 'COLE_SUA_CHAVE_AQUI') {
    http_response_code(500);
    echo json_encode([
        'error' => 'Chave da API do Gemini não configurada. Abra o arquivo public_html/api/config.php no Gerenciador de Arquivos do cPanel e cole sua chave API gratuita obtida em https://aistudio.google.com/app/apikey'
    ]);
    exit;
}

// Obter dados da requisição
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true);

if (!$body || empty($body['tipo'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Requisição inválida ou tipo de minuta não especificado.']);
    exit;
}

$tipo = $body['tipo'] ?? '';
$pericia = $body['pericia'] ?? [];
$promptCustomizado = $body['promptCustomizado'] ?? '';
$quesitosTexto = $body['quesitosTexto'] ?? '';

if (empty($pericia) || empty($pericia['numeroProcesso'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados da perícia incompletos para elaboração da minuta.']);
    exit;
}

// Instrução de Sistema
$systemInstruction = "Você é um Médico Perito Judicial experiente, especialista em Medicina Legal e Perícias Médicas, com profundo conhecimento do Código de Processo Civil brasileiro (CPC - Lei 13.105/2015), resoluções do Conselho Federal de Medicina (CFM, ex: Resolução CFM nº 2.056/2013 e 2.183/2018) e normas do CNJ.
Você redige documentos forenses e minutas com linguagem culta, estritamente técnica, elegante, impessoal e formal própria do foro judicial brasileiro.
Nunca invente falsidades ou termos leigos. Utilize a formatação correta de petições ao MM. Juízo ou estrutura oficial de Laudo Pericial Médico.";

$numeroProcesso = $pericia['numeroProcesso'] ?? '[Nº PROCESSO]';
$vara = $pericia['vara'] ?? '[VARA]';
$tribunal = $pericia['tribunal'] ?? '[TRIBUNAL]';
$cidadeUf = $pericia['cidadeUf'] ?? '[CIDADE/UF]';
$autor = $pericia['autor'] ?? '[AUTOR]';
$reu = $pericia['reu'] ?? '[RÉU]';
$area = $pericia['area'] ?? '[ÁREA MÉDICA]';
$dataPericia = !empty($pericia['dataPericia']) ? $pericia['dataPericia'] : '[DATA A DEFINIR]';
$horarioPericia = !empty($pericia['horarioPericia']) ? $pericia['horarioPericia'] : '[HORÁRIO]';
$localPericia = !empty($pericia['localPericia']) ? $pericia['localPericia'] : '[ENDEREÇO DO CONSULTÓRIO / CLÍNICA]';
$obsClinicas = $pericia['observacoesClinicas'] ?? 'Nenhuma';
$cpfAutor = $pericia['cpfAutor'] ?? 'xxx.xxx.xxx-xx';
$honorarios = $pericia['honorariosFixados'] ?? ($pericia['honorariosPropostos'] ?? 0);
$justicaGratuita = !empty($pericia['justicaGratuita']) ? 'Sim (AJG)' : 'Não';

// Construção do prompt conforme a modalidade
if ($tipo === 'PETICAO_AGENDAMENTO') {
    $prompt = "Elabore uma minuta completa e formal de PETIÇÃO DE DESIGNAÇÃO DE DATA E LOCAL PARA REALIZAÇÃO DA PERÍCIA MÉDICA JUDICIAL para o médico perito apresentar ao Juízo.

DADOS DA PERÍCIA:
- Processo nº: {$numeroProcesso}
- Vara/Juízo: {$vara} ({$tribunal})
- Comarca/Cidade: {$cidadeUf}
- Autor(a)/Periciando(a): {$autor}
- Réu: {$reu}
- Especialidade/Objeto: {$area}
- Data Agendada para o Exame: {$dataPericia}
- Horário: {$horarioPericia}
- Local da Realização: {$localPericia}
- Observações adicionais: {$obsClinicas}

REQUISITOS DA PETIÇÃO:
1. Endereçamento ao Excelentíssimo Senhor Doutor Juiz de Direito da respectiva Vara;
2. Qualificação formal do Médico Perito do Juízo (com espaço para CRM e RQE);
3. Comunicação clara e inequívoca da data, horário e local designados para a realização do exame clínico pericial;
4. Intimação das partes e do(a) periciando(a) com antecedência legal (art. 466, § 2º do CPC e art. 474 do CPC);
5. Solicitação expressa para que o(a) periciando(a) compareça portando documento oficial original com foto, Carteira de Trabalho (CTPS) e TODOS os exames complementares de imagem, laboratoriais, laudos e prontuários médicos originais pertinentes;
6. Franquear aos Assistentes Técnicos das partes o acompanhamento do ato pericial, nos moldes legais;
7. Finalização formal com data, espaço para assinatura e CRM.";
} elseif ($tipo === 'PETICAO_ENTREGA_LAUDO') {
    $prompt = "Elabore uma minuta formal de PETIÇÃO DE JUNTADA / ENTREGA DO LAUDO PERICIAL MÉDICO E LEVANTAMENTO DOS HONORÁRIOS PERICIAIS.

DADOS DA PERÍCIA:
- Processo nº: {$numeroProcesso}
- Vara: {$vara} ({$tribunal})
- Autor(a): {$autor}
- Réu: {$reu}
- Especialidade: {$area}
- Honorários Fixados: R$ {$honorarios}
- Justiça Gratuita: {$justicaGratuita}

REQUISITOS:
1. Endereçamento ao MM. Juízo;
2. Comunicação formal do cumprimento do encargo com a juntada do laudo médico pericial em anexo;
3. Resposta aos quesitos judiciais e das partes de forma fundamentada;
4. Se houver honorários depositados em conta judicial, requerimento de expedição de Mandado de Levantamento Eletrônico (MLE) ou Alvará Judicial em favor do perito;
5. Fechamento formal.";
} elseif ($tipo === 'PETICAO_ACEITE_HONORARIOS') {
    $prompt = "Elabore uma minuta formal de PETIÇÃO DE ACEITAÇÃO DO ENCARGO DE PERITO DO JUÍZO E ESTIMATIVA FUNDAMENTADA DE HONORÁRIOS PERICIAIS (Art. 465, § 2º, I do CPC).

DADOS:
- Processo nº: {$numeroProcesso}
- Vara: {$vara} ({$tribunal})
- Autor(a): {$autor}
- Réu: {$reu}
- Objeto da Perícia: {$area}
- Valor Proposto de Honorários: R$ {$honorarios}
- Resumo do caso: {$obsClinicas}

REQUISITOS:
1. Aceitação solene do honroso encargo pericial;
2. Apresentação de currículo resumido e comprovação de especialidade médica;
3. Proposta fundamentada de honorários periciais discriminando horas estimadas (estudo de autos, exame físico pericial, análise de exames complementares, elaboração do laudo e respostas aos quesitos);
4. Pedido de intimação da parte responsável pelo adiantamento legal de 50% dos honorários (Art. 465, § 4º do CPC) quando aplicável.";
} elseif ($tipo === 'ESTRUTURA_LAUDO') {
    $prompt = "Elabore um modelo completo e estruturado de LAUDO PERICIAL MÉDICO-LEGAL pronto para edição e preenchimento pelo perito.

DADOS DO CASO:
- Processo: {$numeroProcesso}
- Vara: {$vara}
- Periciando(a): {$autor} | CPF: {$cpfAutor}
- Réu/Empregador/Hospital: {$reu}
- Especialidade: {$area}
- Resumo clínico / Queixas: {$obsClinicas}

ESTRUTURA OBRIGATÓRIA (Normas CFM e Art. 473 do CPC):
I. CABEÇALHO E IDENTIFICAÇÃO FORMAL
II. PREÂMBULO E OBJETO DA PERÍCIA
III. HISTÓRICO DA DOENÇA ATUAL (HDA) / ANAMNESE OCUPACIONAL E CLÍNICA
IV. ANTECEDENTES PESSOAIS E CIRÚRGICOS
V. EXAME FÍSICO GERAL E EXAME FÍSICO DIRIGIDO / ESPECIALIZADO
VI. ANÁLISE DE DOCUMENTOS MÉDICOS E EXAMES COMPLEMENTARES
VII. DISCUSSÃO MÉDICO-LEGAL (Análise científica, Nexo Causal e Concausalidade, Incapacidade: Total/Parcial, Temporária/Permanente, CIF e Danos Corporais)
VIII. CONCLUSÃO MÉDICO-LEGAL OBJETIVA
IX. RESPOSTA AOS QUESITOS (Modelo formatado para Quesitos do Juízo, do Autor e do Réu)
X. ENCERRAMENTO E ASSINATURA DO PERITO.";
} elseif ($tipo === 'ANALISAR_QUESITOS') {
    $conteudoQuesitos = !empty($quesitosTexto) ? $quesitosTexto : $obsClinicas;
    $prompt = "Auxilie o médico perito na elaboração de respostas técnicas, científicas, imparciais e claras para os seguintes quesitos formulados nos autos do processo nº {$numeroProcesso} ({$area}):

QUESITOS APRESENTADOS:
{$conteudoQuesitos}

INSTRUÇÕES:
- Forneça respostas diretas, técnicas e objetivas, evitando respostas evasivas como 'prejudicado' sem justificativa;
- Cite embasamento médico-legal e referências bibliográficas aceitas quando pertinente;
- Deixe campos claramente marcados entre colchetes [como este] para dados que dependem da conferência física dos exames do paciente.";
} else {
    $custom = !empty($promptCustomizado) ? $promptCustomizado : 'Como conduzir os prazos e procedimentos desta perícia?';
    $prompt = "Com base nas informações da perícia médica a seguir, atue como assistente forense e responda: {$custom}
Perícia: Processo {$numeroProcesso}, Área: {$area}, Autor: {$autor}, Réu: {$reu}, Status: " . ($pericia['status'] ?? '');
}

// Preparar chamada cURL para a Google Gemini REST API v1beta
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

$payload = [
    'systemInstruction' => [
        'parts' => [
            ['text' => $systemInstruction]
        ]
    ],
    'contents' => [
        [
            'role' => 'user',
            'parts' => [
                ['text' => $prompt]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.3
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: periciamed-hostgator-php'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha de conexão com a API do Google Gemini: ' . $curlError]);
    exit;
}

$resData = json_decode($response, true);

if ($httpCode !== 200 || !empty($resData['error'])) {
    $errorMsg = $resData['error']['message'] ?? ('Erro retornado pela API do Gemini (HTTP ' . $httpCode . ')');
    http_response_code($httpCode ?: 500);
    echo json_encode(['error' => $errorMsg]);
    exit;
}

$texto = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';

if (empty($texto)) {
    http_response_code(500);
    echo json_encode(['error' => 'A IA não retornou conteúdo para este pedido.']);
    exit;
}

echo json_encode(['texto' => $texto]);
