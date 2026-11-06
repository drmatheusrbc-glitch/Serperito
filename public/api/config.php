<?php
/**
 * ==============================================================================
 * Configuração da API e Banco de Dados MySQL para Hospedagem HostGator
 * Sistema de Perícias Médico-Legais
 * ==============================================================================
 * 
 * INSTRUÇÕES:
 * 1. Obtenha sua chave da IA gratuita em: https://aistudio.google.com/app/apikey
 * 2. Crie um banco de dados e usuário no cPanel da HostGator (Menu "Bancos de Dados MySQL")
 * 3. Preencha os campos abaixo e salve este arquivo.
 */

// ------------------------------------------------------------------------------
// 1. Chave da API do Google Gemini (Assistente de Laudos e Petições)
// ------------------------------------------------------------------------------
define('GEMINI_API_KEY', 'COLE_SUA_CHAVE_AQUI');
define('GEMINI_MODEL', 'gemini-2.5-flash');

// ------------------------------------------------------------------------------
// 2. Conexão com o Banco de Dados MySQL da HostGator
// (Permite que você acesse suas perícias de qualquer computador, tablet ou celular)
// ------------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'SUA_CONTA_periciamed');   // Nome do banco criado no cPanel
define('DB_USER', 'SUA_CONTA_periciauser');  // Usuário MySQL criado no cPanel
define('DB_PASS', 'SUA_SENHA_AQUI');          // Senha do usuário criada no cPanel

// ------------------------------------------------------------------------------
// 3. PIN de Acesso Opcional
// (Deixe vazio '' para acesso livre, ou digite uma senha/PIN ex: '1234' para proteger)
// ------------------------------------------------------------------------------
define('APP_PIN', '');
