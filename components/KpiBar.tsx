'use client';

import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  CalendarCheck, 
  FileCheck2, 
  Coins,
  CheckCircle2
} from 'lucide-react';
import { PericiaItem, PrazoAnalise } from '@/types/pericia';
import { formatarMoedaBRL } from '@/lib/prazos';

interface KpiBarProps {
  pericias: PericiaItem[];
  prazosCriticos: { pericia: PericiaItem; analise: PrazoAnalise }[];
  filtroRapido: string;
  setFiltroRapido: (f: string) => void;
}

export function KpiBar({
  pericias,
  prazosCriticos,
  filtroRapido,
  setFiltroRapido,
}: KpiBarProps) {
  const ativas = pericias.filter(p => p.status !== 'CONCLUIDA');
  const aguardandoAgendamento = pericias.filter(p => p.status === 'AGUARDANDO_AGENDAMENTO');
  const laudosPendentes = pericias.filter(p => p.status === 'PERICIA_REALIZADA');
  
  const totalFixados = pericias.reduce((acc, p) => acc + (p.honorariosFixados || p.honorariosPropostos || 0), 0);
  const totalRecebidos = pericias.reduce((acc, p) => acc + (p.honorariosRecebidos || 0), 0);
  const totalAReceber = Math.max(0, totalFixados - totalRecebidos);

  const totalVencidos = prazosCriticos.filter(p => p.analise.nivel === 'VENCIDO').length;
  const totalUrgentes = prazosCriticos.filter(p => p.analise.nivel === 'HOJE' || p.analise.nivel === 'URGENTE').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Ativas */}
      <div 
        onClick={() => setFiltroRapido(filtroRapido === 'ativas' ? 'todos' : 'ativas')}
        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer ${
          filtroRapido === 'ativas' 
            ? 'border-teal-500 shadow-sm ring-1 ring-teal-500/20' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Perícias Ativas</span>
          <FileCheck2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {ativas.length}
          </span>
          <span className="text-[11px] text-slate-500">
            de {pericias.length} nomeações
          </span>
        </div>
      </div>

      {/* 2. Prazos Críticos (< 3 dias) */}
      <div 
        onClick={() => setFiltroRapido(filtroRapido === 'criticos' ? 'todos' : 'criticos')}
        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer ${
          filtroRapido === 'criticos' 
            ? 'border-rose-500 shadow-sm ring-1 ring-rose-500/20' 
            : totalVencidos > 0 
            ? 'border-rose-200 bg-rose-50/20' 
            : totalUrgentes > 0 
            ? 'border-amber-200 bg-amber-50/20' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Prazos Críticos</span>
          <AlertCircle className={`w-4 h-4 ${totalVencidos > 0 ? 'text-rose-600' : 'text-amber-500'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono tabular-nums ${
            totalVencidos > 0 ? 'text-rose-700' : totalUrgentes > 0 ? 'text-amber-600' : 'text-slate-900'
          }`}>
            {prazosCriticos.length}
          </span>
          <span className="text-[11px] text-slate-500">
            {totalVencidos > 0 ? `${totalVencidos} vencido(s)` : 'em até 3 dias'}
          </span>
        </div>
      </div>

      {/* 3. Agendar Exame */}
      <div 
        onClick={() => setFiltroRapido(filtroRapido === 'marcar' ? 'todos' : 'marcar')}
        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer ${
          filtroRapido === 'marcar' 
            ? 'border-teal-500 shadow-sm ring-1 ring-teal-500/20' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Marcar Data Perícia</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {aguardandoAgendamento.length}
          </span>
          <span className="text-[11px] text-slate-500">
            pendentes de data
          </span>
        </div>
      </div>

      {/* 4. Laudos em Elaboração */}
      <div 
        onClick={() => setFiltroRapido(filtroRapido === 'laudos' ? 'todos' : 'laudos')}
        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer ${
          filtroRapido === 'laudos' 
            ? 'border-teal-500 shadow-sm ring-1 ring-teal-500/20' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Laudos Pendentes</span>
          <CalendarCheck className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {laudosPendentes.length}
          </span>
          <span className="text-[11px] text-slate-500">
            exame já realizado
          </span>
        </div>
      </div>

      {/* 5. Honorários a Receber */}
      <div className="col-span-2 md:col-span-1 bg-white rounded-xl p-3.5 border border-slate-200/80">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Saldo de Honorários</span>
          <Coins className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatarMoedaBRL(totalAReceber)}
          </span>
          <span className="text-[10px] text-slate-400">
            Recebido: {formatarMoedaBRL(totalRecebidos)}
          </span>
        </div>
      </div>
    </div>
  );
}
