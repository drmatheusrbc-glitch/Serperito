'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  ExternalLink,
  MessageCircle,
  MoreVertical,
  Download,
  Sparkles,
  Edit,
  Trash2,
  ChevronRight,
  Filter,
  Plus
} from 'lucide-react';
import { PericiaItem, PericiaStatus, UrgenciaNivel } from '@/types/pericia';
import { 
  analisarProximoPrazo, 
  formatarDataBR, 
  formatarMoedaBRL, 
  AREA_LABELS, 
  STATUS_LABELS,
  gerarLinkWhatsApp,
  baixarICS
} from '@/lib/prazos';

interface TabelaPericiasProps {
  pericias: PericiaItem[];
  onSelecionarPericia: (p: PericiaItem) => void;
  onEditarPericia: (p: PericiaItem) => void;
  onExcluirPericia: (id: string) => void;
  onAbrirAssistente: (p: PericiaItem, tipo: string) => void;
  filtroRapido: string;
  setFiltroRapido: (f: string) => void;
  onAbrirNovaPericia?: () => void;
}

export function TabelaPericias({
  pericias,
  onSelecionarPericia,
  onEditarPericia,
  onExcluirPericia,
  onAbrirAssistente,
  filtroRapido,
  setFiltroRapido,
  onAbrirNovaPericia,
}: TabelaPericiasProps) {
  const [busca, setBusca] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('todas');

  if (pericias.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-12 text-center">
        <div className="w-14 h-14 bg-teal-50 border border-teal-200/80 text-teal-800 rounded-xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-teal-700" />
        </div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Nenhuma perícia cadastrada no momento
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          As perícias modelo foram removidas com sucesso. O sistema está limpo e pronto para o cadastro das suas nomeações reais e controle automático de prazos.
        </p>
        {onAbrirNovaPericia && (
          <button
            onClick={onAbrirNovaPericia}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Perícia</span>
          </button>
        )}
      </div>
    );
  }

  const periciasFiltradas = pericias.filter(p => {
    // 1. Busca por texto
    const termo = busca.toLowerCase().trim();
    if (termo) {
      const match = 
        p.numeroProcesso.toLowerCase().includes(termo) ||
        p.autor.toLowerCase().includes(termo) ||
        p.reu.toLowerCase().includes(termo) ||
        p.vara.toLowerCase().includes(termo) ||
        p.tribunal.toLowerCase().includes(termo);
      if (!match) return false;
    }

    // 2. Filtro por área
    if (filtroArea !== 'todas' && p.area !== filtroArea) {
      return false;
    }

    // 3. Filtro rápido
    const analise = analisarProximoPrazo(p);
    if (filtroRapido === 'criticos') {
      return analise && (analise.nivel === 'VENCIDO' || analise.nivel === 'HOJE' || analise.nivel === 'URGENTE');
    }
    if (filtroRapido === 'ativas') {
      return p.status !== 'CONCLUIDA';
    }
    if (filtroRapido === 'marcar') {
      return p.status === 'AGUARDANDO_AGENDAMENTO' || (p.status === 'NOMEADO' && !p.dataPericia);
    }
    if (filtroRapido === 'laudos') {
      return p.status === 'PERICIA_REALIZADA';
    }
    if (filtroRapido === 'concluidas') {
      return p.status === 'CONCLUIDA';
    }

    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      
      {/* Barra de Filtros e Busca */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Input de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por processo, periciando, réu ou vara..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Controles de Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Segmented status filter */}
          <div className="flex items-center p-0.5 bg-slate-200/60 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setFiltroRapido('todos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filtroRapido === 'todos' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({pericias.length})
            </button>
            <button
              onClick={() => setFiltroRapido('criticos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filtroRapido === 'criticos' ? 'bg-white text-rose-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Urgentes
            </button>
            <button
              onClick={() => setFiltroRapido('marcar')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filtroRapido === 'marcar' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Marcar Data
            </button>
            <button
              onClick={() => setFiltroRapido('laudos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filtroRapido === 'laudos' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entregar Laudo
            </button>
            <button
              onClick={() => setFiltroRapido('concluidas')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filtroRapido === 'concluidas' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluídas
            </button>
          </div>

          {/* Select de Área Médica */}
          <select
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="todas">Todas as Especialidades</option>
            {Object.entries(AREA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Tabela de Dados de Alta Densidade */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <th className="py-3 px-4">Processo / Juízo</th>
              <th className="py-3 px-4">Periciando & Réu</th>
              <th className="py-3 px-4">Especialidade</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Próximo Prazo / Alerta</th>
              <th className="py-3 px-4 text-right">Honorários</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periciasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Nenhuma perícia encontrada com os filtros atuais.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tente limpar a busca ou selecionar outro filtro.</p>
                  </div>
                </td>
              </tr>
            ) : (
              periciasFiltradas.map(p => {
                const analise = analisarProximoPrazo(p);
                const statusInfo = STATUS_LABELS[p.status];
                const areaInfo = AREA_LABELS[p.area];

                return (
                  <tr 
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Processo & Vara */}
                    <td className="py-3.5 px-4 align-top">
                      <div 
                        onClick={() => onSelecionarPericia(p)}
                        className="font-mono font-semibold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
                      >
                        {p.numeroProcesso}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.vara} · <span className="font-semibold text-slate-700">{p.tribunal}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.cidadeUf}
                      </div>
                    </td>

                    {/* Partes */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-medium text-slate-900">
                        {p.autor}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>vs.</span>
                        <span className="truncate max-w-[180px]" title={p.reu}>{p.reu}</span>
                      </div>
                      {p.telefoneContato && (
                        <div className="text-[10px] text-teal-700 mt-0.5">
                          Tel: {p.telefoneContato}
                        </div>
                      )}
                    </td>

                    {/* Especialidade */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="text-slate-800 font-medium">
                        {areaInfo.sigla}
                      </span>
                      <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[150px]">
                        {areaInfo.label}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {statusInfo.label}
                      </span>
                      {p.dataPericia && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Exame: {formatarDataBR(p.dataPericia)} {p.horarioPericia || ''}</span>
                        </div>
                      )}
                    </td>

                    {/* Próximo Prazo & Alerta Anti-Atraso */}
                    <td className="py-3.5 px-4 align-top">
                      {analise ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            {analise.nivel === 'VENCIDO' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                🚨 VENCIDO ({Math.abs(analise.diasRestantes)}d)
                              </span>
                            )}
                            {analise.nivel === 'HOJE' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                                ⚠️ VENCE HOJE
                              </span>
                            )}
                            {analise.nivel === 'URGENTE' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Em {analise.diasRestantes} dias
                              </span>
                            )}
                            {analise.nivel === 'ALERTA' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Em {analise.diasRestantes} dias
                              </span>
                            )}
                            {analise.nivel === 'TRANQUILO' && (
                              <span className="text-[11px] font-medium text-emerald-700">
                                Em {analise.diasRestantes} dias
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-medium text-slate-800 mt-1">
                            {analise.tituloCurto}: <span className="font-mono tabular-nums">{formatarDataBR(analise.dataAlvo)}</span>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {analise.descricao}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          {p.status === 'CONCLUIDA' ? 'Processo encerrado' : 'Sem prazos pendentes'}
                        </span>
                      )}
                    </td>

                    {/* Honorários */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatarMoedaBRL(p.honorariosFixados || p.honorariosPropostos || 0)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.justicaGratuita ? 'Justiça Gratuita' : 'Partes pagantes'}
                      </div>
                      {p.honorariosRecebidos > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Recebido: {formatarMoedaBRL(p.honorariosRecebidos)}
                        </div>
                      )}
                    </td>

                    {/* Ações Rápidas */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* Ver Detalhes */}
                        <button
                          onClick={() => onSelecionarPericia(p)}
                          title="Visualizar Caso e Linha do Tempo"
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Lembrete */}
                        {p.telefoneContato && (
                          <a
                            href={gerarLinkWhatsApp(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar Notificação ao Periciando pelo WhatsApp"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Exportar .ICS */}
                        <button
                          onClick={() => baixarICS(p)}
                          title="Baixar Lembrete de Agenda (.ICS para Google/Outlook)"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* IA Minuta */}
                        <button
                          onClick={() => onAbrirAssistente(p, p.status === 'PERICIA_REALIZADA' ? 'ESTRUTURA_LAUDO' : 'PETICAO_AGENDAMENTO')}
                          title="Gerar Petição ou Minuta de Laudo com IA"
                          className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onEditarPericia(p)}
                          title="Editar Cadastro da Perícia"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => onExcluirPericia(p.id)}
                          title="Excluir Perícia"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé da Tabela */}
      <div className="py-2.5 px-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
        <div>
          Mostrando <strong className="text-slate-700">{periciasFiltradas.length}</strong> de <strong className="text-slate-700">{pericias.length}</strong> perícias
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600" /> Vencido / Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Urgente (até 3d)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> No prazo
          </span>
        </div>
      </div>

    </div>
  );
}
