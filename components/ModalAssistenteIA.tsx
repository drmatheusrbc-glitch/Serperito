'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Loader2, 
  RefreshCw
} from 'lucide-react';
import { PericiaItem } from '@/types/pericia';

interface ModalAssistenteIAProps {
  aberto: boolean;
  onFechar: () => void;
  periciaInicial: PericiaItem | null;
  tipoInicial: string;
}

export function ModalAssistenteIA({
  aberto,
  onFechar,
  periciaInicial,
  tipoInicial = 'PETICAO_AGENDAMENTO',
}: ModalAssistenteIAProps) {
  if (!aberto || !periciaInicial) return null;

  return (
    <ModalAssistenteIAConteudo
      key={`${periciaInicial.id}-${tipoInicial}`}
      pericia={periciaInicial}
      tipoInicial={tipoInicial}
      onFechar={onFechar}
    />
  );
}

function ModalAssistenteIAConteudo({
  pericia,
  tipoInicial,
  onFechar,
}: {
  pericia: PericiaItem;
  tipoInicial: string;
  onFechar: () => void;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [carregando, setCarregando] = useState(true);
  const [textoGerado, setTextoGerado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [quesitosTexto] = useState(() => {
    if (pericia.quesitos && pericia.quesitos.length > 0) {
      return pericia.quesitos.map(q => `[${q.parte}] ${q.texto}`).join('\n\n');
    }
    return '';
  });

  const gerarDocumento = useCallback(async (tipoDoc: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoDoc,
          pericia,
          quesitosTexto: quesitosTexto || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao gerar documento com IA.');
      }

      setTextoGerado(data.texto || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao conectar ao assistente de IA.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }, [pericia, quesitosTexto]);

  useEffect(() => {
    let cancelado = false;
    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: tipoInicial,
        pericia,
        quesitosTexto: quesitosTexto || undefined,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelado) {
          if (data.error) {
            setErro(data.error);
          } else {
            setTextoGerado(data.texto || '');
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          const msg = err instanceof Error ? err.message : 'Erro de conexão';
          setErro(msg);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [pericia, quesitosTexto, tipoInicial]);

  const copiarTexto = () => {
    if (!textoGerado) return;
    navigator.clipboard.writeText(textoGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const imprimirDocumento = () => {
    const janela = window.open('', '_blank');
    if (!janela) return;
    janela.document.write(`
      <html>
        <head>
          <title>${pericia.autor} - ${tipo}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; padding: 40px; color: #000; }
            h1, h2, h3 { text-align: center; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${textoGerado}</pre>
        </body>
      </html>
    `);
    janela.document.close();
    janela.print();
  };

  const baixarTexto = () => {
    const blob = new Blob([textoGerado], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minuta_${tipo.toLowerCase()}_proc_${pericia.numeroProcesso.replace(/\D/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
              <Sparkles className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assistente de Minutas & Laudos Forenses
              </h3>
              <p className="text-xs text-slate-500">
                Geração inteligente de petições processuais e estrutura médico-forense padronizada pelo CPC/CFM.
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Seleção de Modelo */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-100/50 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700 mr-1">Modelo:</span>
          
          <button
            onClick={() => {
              setTipo('PETICAO_AGENDAMENTO');
              gerarDocumento('PETICAO_AGENDAMENTO');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tipo === 'PETICAO_AGENDAMENTO'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Petição de Agendamento da Perícia
          </button>

          <button
            onClick={() => {
              setTipo('PETICAO_ENTREGA_LAUDO');
              gerarDocumento('PETICAO_ENTREGA_LAUDO');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tipo === 'PETICAO_ENTREGA_LAUDO'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Petição Entrega Laudo & Honorários
          </button>

          <button
            onClick={() => {
              setTipo('ESTRUTURA_LAUDO');
              gerarDocumento('ESTRUTURA_LAUDO');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tipo === 'ESTRUTURA_LAUDO'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Estrutura Completa de Laudo Médico
          </button>

          <button
            onClick={() => {
              setTipo('PETICAO_ACEITE_HONORARIOS');
              gerarDocumento('PETICAO_ACEITE_HONORARIOS');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tipo === 'PETICAO_ACEITE_HONORARIOS'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Aceite & Honorários (Art. 465 CPC)
          </button>

          <button
            onClick={() => {
              setTipo('ANALISAR_QUESITOS');
              gerarDocumento('ANALISAR_QUESITOS');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tipo === 'ANALISAR_QUESITOS'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Resposta a Quesitos
          </button>
        </div>

        {/* Área Principal de Edição e Visualização */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
          
          {/* Informações Básicas do Caso em Análise */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800">Processo:</span> {pericia.numeroProcesso} ·{' '}
              <span className="font-semibold text-slate-800">Periciando:</span> {pericia.autor} vs. {pericia.reu}
            </div>
            <div className="text-slate-500">
              Vara: {pericia.vara} ({pericia.tribunal})
            </div>
          </div>

          {/* Erro se houver */}
          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{erro}</span>
              <button
                onClick={() => gerarDocumento(tipo)}
                className="font-bold underline ml-2"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Área de Texto da Minuta */}
          <div className="relative flex-1 min-h-[350px] flex flex-col">
            {carregando ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center rounded-xl border border-slate-200 z-10">
                <Loader2 className="w-8 h-8 text-teal-700 animate-spin mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  Elaborando minuta médico-forense com IA Gemini...
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Adequando normas processuais do CPC e resoluções do CFM.
                </p>
              </div>
            ) : null}

            <textarea
              value={textoGerado}
              onChange={e => setTextoGerado(e.target.value)}
              placeholder="O documento gerado aparecerá aqui. Você pode editá-lo diretamente antes de copiar ou imprimir."
              className="flex-1 w-full min-h-[400px] p-4 text-xs font-serif leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none resize-y"
            />
          </div>

        </div>

        {/* Footer com Ações */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => gerarDocumento(tipo)}
            disabled={carregando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            <span>Regenerar Minuta</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={baixarTexto}
              disabled={!textoGerado || carregando}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar (.txt)</span>
            </button>

            <button
              onClick={imprimirDocumento}
              disabled={!textoGerado || carregando}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={copiarTexto}
              disabled={!textoGerado || carregando}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado para Área de Transferência!' : 'Copiar Texto Completo'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
