'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Download, 
  AlertCircle, 
  FileText, 
  MapPin, 
  User, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { PericiaItem, PrazoAnalise } from '@/types/pericia';
import { 
  analisarProximoPrazo, 
  formatarDataBR, 
  baixarICS,
  hojeISO
} from '@/lib/prazos';

interface CalendarioPrazosProps {
  pericias: PericiaItem[];
  onSelecionarPericia: (p: PericiaItem) => void;
  onAbrirAssistente: (p: PericiaItem, tipo: string) => void;
}

interface EventoAgenda {
  id: string;
  pericia: PericiaItem;
  tipo: 'EXAME' | 'PRAZO_LAUDO' | 'PRAZO_AGENDAMENTO' | 'ESCLARECIMENTOS';
  titulo: string;
  data: string; // YYYY-MM-DD
  horario?: string;
  local?: string;
  urgenciaNivel: 'VENCIDO' | 'HOJE' | 'URGENTE' | 'ALERTA' | 'TRANQUILO';
  diasRestantes: number;
}

export function CalendarioPrazos({
  pericias,
  onSelecionarPericia,
  onAbrirAssistente,
}: CalendarioPrazosProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Coleta todos os eventos cronológicos de todas as perícias
  const eventos: EventoAgenda[] = [];

  pericias.forEach(p => {
    // 1. Data de Exame Pericial
    if (p.dataPericia) {
      const analise = analisarProximoPrazo(p);
      eventos.push({
        id: `exame-${p.id}`,
        pericia: p,
        tipo: 'EXAME',
        titulo: `Exame Pericial: ${p.autor}`,
        data: p.dataPericia,
        horario: p.horarioPericia || '14:00',
        local: p.localPericia || 'Consultório Pericial',
        urgenciaNivel: analise?.tipo === 'DATA_EXAME' ? analise.nivel : 'TRANQUILO',
        diasRestantes: analise?.tipo === 'DATA_EXAME' ? analise.diasRestantes : 0,
      });
    }

    // 2. Prazo de Entrega do Laudo
    if (p.prazoEntregaLaudo && !p.dataEntregaLaudo) {
      const analise = analisarProximoPrazo(p);
      eventos.push({
        id: `laudo-${p.id}`,
        pericia: p,
        tipo: 'PRAZO_LAUDO',
        titulo: `Prazo Fatal Laudo: ${p.autor}`,
        data: p.prazoEntregaLaudo,
        urgenciaNivel: analise?.tipo === 'ENTREGA_LAUDO' ? analise.nivel : 'TRANQUILO',
        diasRestantes: analise?.tipo === 'ENTREGA_LAUDO' ? analise.diasRestantes : 0,
      });
    }

    // 3. Prazo de Agendamento (se ainda não marcado)
    if (!p.dataPericia && p.prazoAgendamento) {
      const analise = analisarProximoPrazo(p);
      eventos.push({
        id: `agendar-${p.id}`,
        pericia: p,
        tipo: 'PRAZO_AGENDAMENTO',
        titulo: `Prazo Marcar Perícia: ${p.autor}`,
        data: p.prazoAgendamento,
        urgenciaNivel: analise?.tipo === 'AGENDAMENTO' ? analise.nivel : 'TRANQUILO',
        diasRestantes: analise?.tipo === 'AGENDAMENTO' ? analise.diasRestantes : 0,
      });
    }

    // 4. Esclarecimentos
    if (p.status === 'ESCLARECIMENTOS' && p.prazoEsclarecimentos) {
      const analise = analisarProximoPrazo(p);
      eventos.push({
        id: `esclarec-${p.id}`,
        pericia: p,
        tipo: 'ESCLARECIMENTOS',
        titulo: `Responder Esclarecimentos: ${p.autor}`,
        data: p.prazoEsclarecimentos,
        urgenciaNivel: analise?.nivel || 'URGENTE',
        diasRestantes: analise?.diasRestantes || 0,
      });
    }
  });

  // Ordena por data crescente
  eventos.sort((a, b) => a.data.localeCompare(b.data));

  const eventosFiltrados = eventos.filter(ev => {
    if (filtroTipo === 'exames') return ev.tipo === 'EXAME';
    if (filtroTipo === 'laudos') return ev.tipo === 'PRAZO_LAUDO';
    if (filtroTipo === 'agendamentos') return ev.tipo === 'PRAZO_AGENDAMENTO';
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-700" />
            Agenda Cronológica & Prazos Judiciais
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize os próximos exames periciais marcados e os prazos fatais de entrega de laudos.
          </p>
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filtroTipo === 'todos' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Todos ({eventos.length})
            </button>
            <button
              onClick={() => setFiltroTipo('exames')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filtroTipo === 'exames' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Exames Agendados
            </button>
            <button
              onClick={() => setFiltroTipo('laudos')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filtroTipo === 'laudos' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Prazos de Laudos
            </button>
          </div>
        </div>
      </div>

      {/* Linha do Tempo de Eventos */}
      <div className="mt-6 space-y-3">
        {eventosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhum evento ou prazo agendado com os critérios selecionados.
          </div>
        ) : (
          eventosFiltrados.map(ev => {
            const isExame = ev.tipo === 'EXAME';
            const isLaudo = ev.tipo === 'PRAZO_LAUDO';

            return (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Data e Badge */}
                <div className="flex items-start gap-4">
                  
                  {/* Bloco de Data Visual */}
                  <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                    isExame
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : isLaudo
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'][
                        Math.max(0, Math.min(11, (parseInt(ev.data.split('-')[1], 10) || 1) - 1))
                      ]}
                    </span>
                    <span className="text-xl font-bold font-mono leading-none">
                      {ev.data.split('-')[2]}
                    </span>
                  </div>

                  {/* Informações */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isExame 
                          ? 'bg-blue-100 text-blue-800' 
                          : isLaudo 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isExame ? 'Exame Pericial Presencial' : isLaudo ? 'Prazo Fatal para Laudo' : 'Prazo Designar Data'}
                      </span>

                      {ev.urgenciaNivel === 'VENCIDO' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          Vencido
                        </span>
                      )}
                      {ev.urgenciaNivel === 'HOJE' && (
                        <span className="text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.2 rounded animate-pulse">
                          Hoje
                        </span>
                      )}
                      {ev.urgenciaNivel === 'URGENTE' && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          Urgente
                        </span>
                      )}
                    </div>

                    <h4 
                      onClick={() => onSelecionarPericia(ev.pericia)}
                      className="text-sm font-bold text-slate-900 hover:text-teal-700 cursor-pointer mt-1"
                    >
                      {ev.titulo}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="font-mono">Proc: {ev.pericia.numeroProcesso}</span>
                      <span>·</span>
                      <span>{ev.pericia.vara}</span>
                      {ev.horario && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {ev.horario}
                          </span>
                        </>
                      )}
                    </div>

                    {ev.local && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-md">{ev.local}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => baixarICS(ev.pericia)}
                    title="Baixar para Google Agenda / Outlook (.ics)"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lembrete iCal</span>
                  </button>

                  <button
                    onClick={() => onAbrirAssistente(ev.pericia, isLaudo ? 'ESTRUTURA_LAUDO' : 'PETICAO_AGENDAMENTO')}
                    title="Gerar Minuta com IA"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Minuta</span>
                  </button>

                  <button
                    onClick={() => onSelecionarPericia(ev.pericia)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
