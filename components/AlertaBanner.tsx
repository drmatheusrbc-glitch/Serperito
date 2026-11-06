'use client';

import React from 'react';
import { AlertTriangle, Clock, ArrowRight, X } from 'lucide-react';
import { PericiaItem, PrazoAnalise } from '@/types/pericia';
import { formatarDataBR } from '@/lib/prazos';

interface AlertaBannerProps {
  prazosCriticos: { pericia: PericiaItem; analise: PrazoAnalise }[];
  onSelecionarPericia: (p: PericiaItem) => void;
  onFiltrarCriticos: () => void;
}

export function AlertaBanner({
  prazosCriticos,
  onSelecionarPericia,
  onFiltrarCriticos,
}: AlertaBannerProps) {
  if (prazosCriticos.length === 0) return null;

  const temVencidos = prazosCriticos.some(p => p.analise.nivel === 'VENCIDO');
  const proximo = prazosCriticos[0];

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      temVencidos
        ? 'bg-rose-50/80 border-rose-200 text-rose-950'
        : 'bg-amber-50/80 border-amber-200 text-amber-950'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 sm:mt-0 ${
            temVencidos ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight">
              {temVencidos 
                ? 'Atenção Imediata: Você possui prazos judiciais com risco de preclusão ou atraso!' 
                : 'Monitoramento Anti-Atraso: Prazos próximos exigindo providências'}
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">
              Próximo marco: <strong className="font-semibold">{proximo.pericia.autor}</strong> ({proximo.pericia.numeroProcesso}) — {proximo.analise.descricao}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => onSelecionarPericia(proximo.pericia)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              temVencidos
                ? 'bg-rose-700 hover:bg-rose-800 text-white'
                : 'bg-amber-700 hover:bg-amber-800 text-white'
            }`}
          >
            Ver Caso
          </button>
          <button
            onClick={onFiltrarCriticos}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300/80 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Ver Todos ({prazosCriticos.length})
          </button>
        </div>
      </div>
    </div>
  );
}
