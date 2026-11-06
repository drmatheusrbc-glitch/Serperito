'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ArrowRight, 
  MessageCircle, 
  Sparkles,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { PericiaItem, PericiaStatus } from '@/types/pericia';
import { 
  analisarProximoPrazo, 
  formatarDataBR, 
  formatarMoedaBRL, 
  AREA_LABELS,
  gerarLinkWhatsApp
} from '@/lib/prazos';

interface KanbanPericiasProps {
  pericias: PericiaItem[];
  onSelecionarPericia: (p: PericiaItem) => void;
  onAvancarStatus: (id: string, novoStatus: PericiaStatus) => void;
  onAbrirAssistente: (p: PericiaItem, tipo: string) => void;
}

const COLUNAS: { id: PericiaStatus; titulo: string; proximo?: PericiaStatus; rotuloBotao?: string; cor: string }[] = [
  {
    id: 'NOMEADO',
    titulo: '1. Nomeação / Aceite',
    proximo: 'AGUARDANDO_AGENDAMENTO',
    rotuloBotao: 'Aceitar & Avançar',
    cor: 'border-t-slate-500',
  },
  {
    id: 'AGUARDANDO_AGENDAMENTO',
    titulo: '2. Agendar Perícia',
    proximo: 'PERICIA_AGENDADA',
    rotuloBotao: 'Definir Data Exame',
    cor: 'border-t-amber-500',
  },
  {
    id: 'PERICIA_AGENDADA',
    titulo: '3. Perícia Agendada',
    proximo: 'PERICIA_REALIZADA',
    rotuloBotao: 'Marcar como Realizada',
    cor: 'border-t-blue-500',
  },
  {
    id: 'PERICIA_REALIZADA',
    titulo: '4. Elaboração de Laudo',
    proximo: 'LAUDO_PROTOCOLADO',
    rotuloBotao: 'Protocolar Laudo',
    cor: 'border-t-indigo-500',
  },
  {
    id: 'LAUDO_PROTOCOLADO',
    titulo: '5. Laudo Entregue / Concluído',
    proximo: 'CONCLUIDA',
    rotuloBotao: 'Concluir & Liberar',
    cor: 'border-t-emerald-500',
  },
];

export function KanbanPericias({
  pericias,
  onSelecionarPericia,
  onAvancarStatus,
  onAbrirAssistente,
}: KanbanPericiasProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUNAS.map(coluna => {
        const itens = pericias.filter(p => {
          if (coluna.id === 'LAUDO_PROTOCOLADO') {
            return p.status === 'LAUDO_PROTOCOLADO' || p.status === 'ESCLARECIMENTOS' || p.status === 'CONCLUIDA';
          }
          return p.status === coluna.id;
        });

        return (
          <div
            key={coluna.id}
            className={`bg-slate-100/70 rounded-xl p-3 border border-slate-200/80 border-t-4 ${coluna.cor} flex flex-col min-h-[500px]`}
          >
            {/* Header da Coluna */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/70">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                {coluna.titulo}
              </span>
              <span className="text-[11px] font-bold font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {itens.length}
              </span>
            </div>

            {/* Lista de Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {itens.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Nenhuma perícia nesta fase
                </div>
              ) : (
                itens.map(p => {
                  const analise = analisarProximoPrazo(p);
                  const areaInfo = AREA_LABELS[p.area];

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg p-3 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                    >
                      {/* Topo do Card */}
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {areaInfo.sigla}
                          </span>
                          {analise && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              analise.nivel === 'VENCIDO'
                                ? 'bg-rose-100 text-rose-800'
                                : analise.nivel === 'HOJE'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : analise.nivel === 'URGENTE'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {analise.diasRestantes < 0
                                ? `${Math.abs(analise.diasRestantes)}d atraso`
                                : analise.diasRestantes === 0
                                ? 'Vence HOJE'
                                : `${analise.diasRestantes}d`}
                            </span>
                          )}
                        </div>

                        <div 
                          onClick={() => onSelecionarPericia(p)}
                          className="text-xs font-bold text-slate-900 hover:text-teal-700 cursor-pointer line-clamp-1"
                        >
                          {p.autor}
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 line-clamp-1 mt-0.5">
                          {p.numeroProcesso}
                        </div>

                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {p.vara}
                        </div>

                        {/* Marcos de data específicos */}
                        {p.dataPericia && (
                          <div className="mt-2 text-[10px] text-blue-700 bg-blue-50/70 p-1.5 rounded border border-blue-100 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Exame: <strong>{formatarDataBR(p.dataPericia)}</strong> às {p.horarioPericia || '14:00'}</span>
                          </div>
                        )}

                        {p.status === 'PERICIA_REALIZADA' && p.prazoEntregaLaudo && (
                          <div className="mt-2 text-[10px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded border border-indigo-100 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>Laudo até: <strong>{formatarDataBR(p.prazoEntregaLaudo)}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Ações do Card */}
                      <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          {p.telefoneContato && (
                            <a
                              href={gerarLinkWhatsApp(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Avisar Periciando via WhatsApp"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => onAbrirAssistente(p, p.status === 'PERICIA_REALIZADA' ? 'ESTRUTURA_LAUDO' : 'PETICAO_AGENDAMENTO')}
                            title="Gerar Petição com IA"
                            className="p-1 text-teal-700 hover:bg-teal-50 rounded"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {coluna.proximo && p.status !== 'CONCLUIDA' && (
                          <button
                            onClick={() => onAvancarStatus(p.id, coluna.proximo!)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors"
                          >
                            <span>Avançar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
