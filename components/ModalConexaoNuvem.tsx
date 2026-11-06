'use client';

import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  Check, 
  Copy, 
  UploadCloud, 
  Server, 
  KeyRound, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { testarConexaoNuvem, sincronizarLoteNuvem } from '@/lib/api-sync';
import { PericiaItem } from '@/types/pericia';

interface ModalConexaoNuvemProps {
  aberto: boolean;
  onFechar: () => void;
  conectado: boolean;
  periciasLocais: PericiaItem[];
  onSincronizacaoConcluida: (pericias: PericiaItem[]) => void;
}

export function ModalConexaoNuvem({
  aberto,
  onFechar,
  conectado,
  periciasLocais,
  onSincronizacaoConcluida
}: ModalConexaoNuvemProps) {
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    executado: boolean;
    conectado: boolean;
    mensagem: string;
    totalPericias?: number;
  }>({
    executado: false,
    conectado,
    mensagem: conectado ? 'Conectado ao MySQL da HostGator' : 'Banco de dados ainda não configurado'
  });

  const [sincronizando, setSincronizando] = useState(false);
  const [msgSincronizacao, setMsgSincronizacao] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!aberto) return null;

  const handleTestar = async () => {
    setTestando(true);
    setMsgSincronizacao(null);
    try {
      const res = await testarConexaoNuvem();
      setResultadoTeste({
        executado: true,
        conectado: res.conectado,
        mensagem: res.mensagem,
        totalPericias: res.totalPericias
      });
    } catch {
      setResultadoTeste({
        executado: true,
        conectado: false,
        mensagem: 'Não foi possível se comunicar com a API do servidor.'
      });
    } finally {
      setTestando(false);
    }
  };

  const handleSincronizarTudo = async () => {
    if (periciasLocais.length === 0) {
      setMsgSincronizacao('Nenhuma perícia local encontrada para sincronizar.');
      return;
    }

    setSincronizando(true);
    setMsgSincronizacao(null);
    try {
      const res = await sincronizarLoteNuvem(periciasLocais);
      if (res.sucesso) {
        setMsgSincronizacao(`✅ Sucesso! ${periciasLocais.length} perícias foram enviadas para o banco MySQL da HostGator.`);
        onSincronizacaoConcluida(periciasLocais);
      } else {
        setMsgSincronizacao(`❌ Falha: ${res.mensagem || 'Verifique as credenciais no config.php'}`);
      }
    } catch {
      setMsgSincronizacao('❌ Erro de conexão durante a sincronização.');
    } finally {
      setSincronizando(false);
    }
  };

  const copiarTrechoConfig = () => {
    const trecho = `define('DB_HOST', 'localhost');\ndefine('DB_NAME', 'SUA_CONTA_periciamed');\ndefine('DB_USER', 'SUA_CONTA_periciauser');\ndefine('DB_PASS', 'SUA_SENHA_AQUI');`;
    navigator.clipboard.writeText(trecho);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${conectado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Sincronização em Nuvem (MySQL HostGator)
              </h3>
              <p className="text-xs text-slate-500">
                Acesse suas perícias de qualquer computador, tablet ou celular
              </p>
            </div>
          </div>
          <button 
            onClick={onFechar}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
          
          {/* Card de Status Atual */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            conectado 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="mt-0.5">
              {conectado ? (
                <CloudCheck className="w-6 h-6 text-emerald-600" />
              ) : (
                <CloudOff className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {conectado ? 'Nuvem Conectada e Ativa' : 'Modo Offline / Local'}
                </span>
                <button
                  onClick={handleTestar}
                  disabled={testando}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testando ? 'animate-spin' : ''}`} />
                  <span>{testando ? 'Testando...' : 'Testar Conexão'}</span>
                </button>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {resultadoTeste.executado 
                  ? resultadoTeste.mensagem 
                  : (conectado 
                      ? 'Todas as alterações são salvas automaticamente no banco de dados da sua hospedagem HostGator.' 
                      : 'As perícias estão salvas apenas neste navegador. Para acessar de qualquer computador ou celular, configure o banco MySQL no cPanel.')}
              </p>
              {typeof resultadoTeste.totalPericias === 'number' && (
                <p className="text-xs font-semibold mt-1">
                  Total de perícias na nuvem: {resultadoTeste.totalPericias}
                </p>
              )}
            </div>
          </div>

          {/* Sincronização em Lote */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800 text-xs">Enviar Perícias Deste Computador para a Nuvem</span>
              </div>
              <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                {periciasLocais.length} {periciasLocais.length === 1 ? 'perícia' : 'perícias'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Se você cadastrou perícias enquanto estava offline, clique abaixo para subir todos os dados deste computador para o banco de dados da HostGator.
            </p>
            <button
              onClick={handleSincronizarTudo}
              disabled={sincronizando || periciasLocais.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className={`w-4 h-4 ${sincronizando ? 'animate-bounce' : ''}`} />
              <span>{sincronizando ? 'Sincronizando...' : 'Subir Perícias para a Nuvem'}</span>
            </button>
            {msgSincronizacao && (
              <p className="text-xs font-medium mt-2.5 text-slate-700 bg-white p-2 rounded border border-slate-200">
                {msgSincronizacao}
              </p>
            )}
          </div>

          {/* Passo a Passo Didático para Configurar no cPanel */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-600" />
              <span>Como ativar o Banco MySQL no cPanel (Leva 2 minutos)</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  <strong className="text-slate-800">Criar o Banco no cPanel:</strong>
                  <p className="mt-0.5 text-slate-500">
                    Acesse o cPanel da HostGator ➔ clique em <strong>Assistente de Banco de Dados MySQL</strong> ➔ digite um nome (ex: <code>periciamed</code>) e crie um usuário com senha. Marque a caixa <em>&quot;Todos os Privilégios&quot;</em>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div>
                  <strong className="text-slate-800">Colocar os dados no arquivo config.php:</strong>
                  <p className="mt-0.5 text-slate-500">
                    No Gerenciador de Arquivos do cPanel, entre na pasta <code>public_html/api/</code> e edite o arquivo <strong>config.php</strong> preenchendo o nome do banco, usuário e senha.
                  </p>
                  <div className="mt-2 flex items-center justify-between bg-slate-800 text-slate-200 px-3 py-1.5 rounded-md font-mono text-[11px]">
                    <span>api/config.php (Seção MySQL)</span>
                    <button
                      onClick={copiarTrechoConfig}
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  <strong className="text-slate-800">Criação Automática das Tabelas:</strong>
                  <p className="mt-0.5 text-slate-500">
                    Você <strong>não precisa criar tabelas nem rodar comandos no phpMyAdmin</strong>! O sistema cria todas as colunas e índices automaticamente na primeira conexão.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" />
            Dados criptografados e protegidos por .htaccess
          </span>
          <button
            onClick={onFechar}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
