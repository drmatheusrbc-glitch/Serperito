'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  Kanban as KanbanIcon,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { PericiaItem, PrazoAnalise } from '@/types/pericia';
import { formatarDataBR } from '@/lib/prazos';

interface NavbarProps {
  abaAtiva: 'tabela' | 'kanban' | 'calendario' | 'assistente';
  setAbaAtiva: (aba: 'tabela' | 'kanban' | 'calendario' | 'assistente') => void;
  onAbrirNovaPericia: () => void;
  prazosCriticos: { pericia: PericiaItem; analise: PrazoAnalise }[];
  somHabilitado: boolean;
  setSomHabilitado: (val: boolean) => void;
  onSelecionarPericia: (p: PericiaItem) => void;
  onTestarNotificacao: () => void;
}

export function Navbar({
  abaAtiva,
  setAbaAtiva,
  onAbrirNovaPericia,
  prazosCriticos,
  somHabilitado,
  setSomHabilitado,
  onSelecionarPericia,
  onTestarNotificacao,
}: NavbarProps) {
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const totalCriticos = prazosCriticos.length;
  const totalVencidos = prazosCriticos.filter(p => p.analise.nivel === 'VENCIDO').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm font-bold tracking-wider">
              <ShieldCheck className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">PeríciaMed</span>
                <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                  Médico Perito
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Gestão Forense & Prazos Judiciais
              </p>
            </div>
          </div>

          {/* Navigation links - Zone 2 */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/70">
            <button
              onClick={() => setAbaAtiva('tabela')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                abaAtiva === 'tabela'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Perícias & Prazos
            </button>
            <button
              onClick={() => setAbaAtiva('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                abaAtiva === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              Fases Periciais
            </button>
            <button
              onClick={() => setAbaAtiva('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                abaAtiva === 'calendario'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Agenda & Prazos
            </button>
            <button
              onClick={() => setAbaAtiva('assistente')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                abaAtiva === 'assistente'
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Minutas & IA Forense
            </button>
          </nav>

          {/* Action Zone - Zone 3 */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Audio Toggle */}
            <button
              onClick={() => setSomHabilitado(!somHabilitado)}
              title={somHabilitado ? 'Alertas sonoros ativados' : 'Alertas sonoros silenciados'}
              className={`p-2 rounded-lg border transition-colors ${
                somHabilitado 
                  ? 'text-teal-700 bg-teal-50/80 border-teal-200 hover:bg-teal-100/70' 
                  : 'text-slate-400 bg-white border-slate-200 hover:text-slate-600'
              }`}
            >
              {somHabilitado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownAberto(!dropdownAberto)}
                className={`relative p-2 rounded-lg border transition-colors ${
                  totalVencidos > 0
                    ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                    : totalCriticos > 0
                    ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                    : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                }`}
                title="Centro de Notificações de Prazos"
              >
                <Bell className="w-4 h-4" />
                {totalCriticos > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
                    totalVencidos > 0 ? 'bg-rose-600' : 'bg-amber-600'
                  }`}>
                    {totalCriticos}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {dropdownAberto && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 text-slate-800"
                  onMouseLeave={() => setDropdownAberto(false)}
                >
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Alertas Anti-Atraso
                      </span>
                    </div>
                    <button
                      onClick={onTestarNotificacao}
                      className="text-[11px] text-teal-700 hover:underline font-medium"
                    >
                      Ativar no Navegador
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {prazosCriticos.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        Nenhum prazo urgente ou vencido no momento. Parabéns!
                      </div>
                    ) : (
                      prazosCriticos.map(({ pericia, analise }) => (
                        <div
                          key={pericia.id}
                          onClick={() => {
                            onSelecionarPericia(pericia);
                            setDropdownAberto(false);
                          }}
                          className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {analise.nivel === 'VENCIDO' ? (
                                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              )}
                              <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                                {pericia.autor}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              analise.nivel === 'VENCIDO'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {analise.diasRestantes < 0
                                ? `${Math.abs(analise.diasRestantes)}d atrasado`
                                : analise.diasRestantes === 0
                                ? 'Vence HOJE'
                                : `Em ${analise.diasRestantes} dias`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                            {analise.descricao}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span>Proc: {pericia.numeroProcesso}</span>
                            <span>·</span>
                            <span>{pericia.vara}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Nova Perícia CTA */}
            <button
              onClick={onAbrirNovaPericia}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Perícia</span>
            </button>
          </div>

        </div>

        {/* Mobile Submenu tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setAbaAtiva('tabela')}
            className={`px-2 py-1 font-medium ${abaAtiva === 'tabela' ? 'text-teal-700 font-bold' : 'text-slate-600'}`}
          >
            Prazos
          </button>
          <button
            onClick={() => setAbaAtiva('kanban')}
            className={`px-2 py-1 font-medium ${abaAtiva === 'kanban' ? 'text-teal-700 font-bold' : 'text-slate-600'}`}
          >
            Fases
          </button>
          <button
            onClick={() => setAbaAtiva('calendario')}
            className={`px-2 py-1 font-medium ${abaAtiva === 'calendario' ? 'text-teal-700 font-bold' : 'text-slate-600'}`}
          >
            Agenda
          </button>
          <button
            onClick={() => setAbaAtiva('assistente')}
            className={`px-2 py-1 font-medium ${abaAtiva === 'assistente' ? 'text-teal-700 font-bold' : 'text-slate-600'}`}
          >
            Minutas IA
          </button>
        </div>

      </div>
    </header>
  );
}
