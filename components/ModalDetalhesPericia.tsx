'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  FileText, 
  User, 
  Building, 
  MessageCircle, 
  Download, 
  Sparkles, 
  Edit, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Check,
  ChevronRight
} from 'lucide-react';
import { PericiaItem, QuesitoItem } from '@/types/pericia';
import { 
  analisarProximoPrazo, 
  formatarDataBR, 
  formatarMoedaBRL, 
  AREA_LABELS, 
  STATUS_LABELS,
  gerarLinkWhatsApp,
  baixarICS
} from '@/lib/prazos';

interface ModalDetalhesPericiaProps {
  pericia: PericiaItem | null;
  onFechar: () => void;
  onEditar: (p: PericiaItem) => void;
  onAbrirAssistente: (p: PericiaItem, tipo: string) => void;
  onAtualizarPericia: (p: PericiaItem) => void;
}

export function ModalDetalhesPericia({
  pericia,
  onFechar,
  onEditar,
  onAbrirAssistente,
  onAtualizarPericia,
}: ModalDetalhesPericiaProps) {
  const [novoQuesitoTexto, setNovoQuesitoTexto] = useState('');
  const [novoQuesitoParte, setNovoQuesitoParte] = useState<'JUIZ' | 'AUTOR' | 'REU'>('AUTOR');

  if (!pericia) return null;

  const analise = analisarProximoPrazo(pericia);
  const areaInfo = AREA_LABELS[pericia.area];
  const statusInfo = STATUS_LABELS[pericia.status];

  const adicionarQuesito = () => {
    if (!novoQuesitoTexto.trim()) return;
    const novo: QuesitoItem = {
      id: `q-${Date.now()}`,
      parte: novoQuesitoParte,
      texto: novoQuesitoTexto.trim(),
      respondido: false,
    };
    const atualizado: PericiaItem = {
      ...pericia,
      quesitos: [...(pericia.quesitos || []), novo],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onAtualizarPericia(atualizado);
    setNovoQuesitoTexto('');
  };

  const alternarQuesito = (qid: string) => {
    const atualizado: PericiaItem = {
      ...pericia,
      quesitos: (pericia.quesitos || []).map(q => 
        q.id === qid ? { ...q, respondido: !q.respondido } : q
      ),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onAtualizarPericia(atualizado);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                {pericia.numeroProcesso}
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                {pericia.vara} ({pericia.tribunal})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {pericia.cidadeUf}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {pericia.autor} <span className="text-sm font-normal text-slate-500">vs.</span> {pericia.reu}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onEditar(pericia)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/50 transition-colors"
              title="Editar Perícia"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onFechar}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Card de Prazo Crítico & Urgência */}
          {analise ? (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              analise.nivel === 'VENCIDO'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : analise.nivel === 'HOJE'
                ? 'bg-rose-600 text-white border-rose-700'
                : analise.nivel === 'URGENTE'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-teal-50/70 border-teal-200 text-teal-950'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  analise.nivel === 'HOJE' ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-2xs'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                    Próximo Marco Processual: {analise.tituloCurto}
                  </div>
                  <div className="text-sm font-bold mt-0.5">
                    Data Limite: {formatarDataBR(analise.dataAlvo)}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">
                    {analise.descricao}
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                  analise.nivel === 'HOJE' 
                    ? 'bg-white text-rose-700' 
                    : analise.nivel === 'VENCIDO' 
                    ? 'bg-rose-700 text-white' 
                    : 'bg-white text-slate-900 border border-slate-300/80 shadow-2xs'
                }`}>
                  {analise.diasRestantes < 0
                    ? `${Math.abs(analise.diasRestantes)} dias em atraso`
                    : analise.diasRestantes === 0
                    ? 'VENCE HOJE'
                    : `Faltam ${analise.diasRestantes} dias`}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Esta perícia está concluída ou sem prazos judiciais pendentes no momento.</span>
            </div>
          )}

          {/* Barra de Ações Rápidas de Alta Relevância */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-600 mr-1">
              Ações Rápidas:
            </span>

            {/* Gerar Petição de Agendamento */}
            <button
              onClick={() => onAbrirAssistente(pericia, 'PETICAO_AGENDAMENTO')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Minuta Petição Agendamento</span>
            </button>

            {/* Gerar Petição de Entrega de Laudo */}
            <button
              onClick={() => onAbrirAssistente(pericia, 'PETICAO_ENTREGA_LAUDO')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Minuta Entrega de Laudo</span>
            </button>

            {/* Estrutura de Laudo Médico Forense */}
            <button
              onClick={() => onAbrirAssistente(pericia, 'ESTRUTURA_LAUDO')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300/80 rounded-lg shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>Estruturar Laudo Completo</span>
            </button>

            {/* WhatsApp */}
            {pericia.telefoneContato && (
              <a
                href={gerarLinkWhatsApp(pericia)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Notificar via WhatsApp</span>
              </a>
            )}

            {/* Baixar iCal */}
            <button
              onClick={() => baixarICS(pericia)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300/80 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar para Google/Outlook (.ics)</span>
            </button>
          </div>

          {/* Grid de 2 Colunas: Dados Clínicos + Linha do Tempo e Prazos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda: Detalhes do Caso & Honorários */}
            <div className="space-y-4">
              
              {/* Informações Médicas e Partes */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Dados Médico-Legais
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Especialidade</span>
                    <span className="font-semibold text-slate-800">{areaInfo.label}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fase Processual</span>
                    <span className="font-semibold text-slate-800">{statusInfo.label}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CPF do Autor</span>
                    <span className="font-mono text-slate-700">{pericia.cpfAutor || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Telefone de Contato</span>
                    <span className="font-mono text-slate-700">{pericia.telefoneContato || 'Não informado'}</span>
                  </div>
                </div>

                {pericia.assistenteTecnicoAutor || pericia.assistenteTecnicoReu ? (
                  <div className="text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px] mb-1">Assistentes Técnicos Indicados</span>
                    {pericia.assistenteTecnicoAutor && (
                      <p className="text-slate-700"><strong>Autor:</strong> {pericia.assistenteTecnicoAutor}</p>
                    )}
                    {pericia.assistenteTecnicoReu && (
                      <p className="text-slate-700"><strong>Réu:</strong> {pericia.assistenteTecnicoReu}</p>
                    )}
                  </div>
                ) : null}

                {pericia.observacoesClinicas && (
                  <div className="text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px] mb-1">Anotações / Resumo Clínico do Caso</span>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg leading-relaxed whitespace-pre-wrap">
                      {pericia.observacoesClinicas}
                    </p>
                  </div>
                )}
              </div>

              {/* Informações Financeiras */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  Honorários Periciais
                </h4>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Propostos</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatarMoedaBRL(pericia.honorariosPropostos || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fixados pelo Juiz</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatarMoedaBRL(pericia.honorariosFixados || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Já Levantado</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {formatarMoedaBRL(pericia.honorariosRecebidos || 0)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {pericia.justicaGratuita ? 'Beneficiário de Justiça Gratuita (AJG)' : 'Pagamento pelas partes'}
                  </span>
                  <span className="font-bold text-teal-800">
                    Saldo Restante: {formatarMoedaBRL(Math.max(0, (pericia.honorariosFixados || pericia.honorariosPropostos) - pericia.honorariosRecebidos))}
                  </span>
                </div>
              </div>

            </div>

            {/* Coluna Direita: Linha do Tempo de Prazos do Juízo */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  Linha do Tempo & Prazos Processuais
                </h4>

                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  
                  {/* Marco 1: Nomeação */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10">
                      1
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Intimação da Nomeação
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Data: {formatarDataBR(pericia.dataNomeacao)}
                      </div>
                    </div>
                  </div>

                  {/* Marco 2: Aceite / Honorários */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 z-10">
                      2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Prazo Aceite & Honorários (Art. 465 CPC)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Prazo: {formatarDataBR(pericia.prazoAceiteHonorarios)}
                      </div>
                    </div>
                  </div>

                  {/* Marco 3: Prazo Agendamento */}
                  <div className="flex items-start gap-3 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                      pericia.dataPericia ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      3
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Indicação de Data do Exame
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Prazo fatal do juízo: <strong>{formatarDataBR(pericia.prazoAgendamento)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Marco 4: Data do Exame Pericial */}
                  <div className="flex items-start gap-3 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                      pericia.dataPericia ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      4
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Realização do Exame Pericial Clínico
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium">
                        {pericia.dataPericia ? (
                          <>
                            Data: <strong>{formatarDataBR(pericia.dataPericia)}</strong> às {pericia.horarioPericia || '14:00'}
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              Local: {pericia.localPericia || 'Consultório'}
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-700 font-semibold">Data ainda não designada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Marco 5: Prazo de Entrega do Laudo */}
                  <div className="flex items-start gap-3 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                      pericia.dataEntregaLaudo ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      5
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Entrega / Protocolo do Laudo
                      </div>
                      <div className="text-[11px] text-slate-700">
                        Prazo Fatal: <strong className="text-indigo-900">{formatarDataBR(pericia.prazoEntregaLaudo)}</strong>
                        {pericia.dataEntregaLaudo && (
                          <span className="block text-[10px] text-emerald-700 font-semibold">
                            Protocolado em: {formatarDataBR(pericia.dataEntregaLaudo)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Marco 6: Esclarecimentos se houver */}
                  {pericia.prazoEsclarecimentos && (
                    <div className="flex items-start gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10">
                        6
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Manifestação / Esclarecimentos
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prazo: {formatarDataBR(pericia.prazoEsclarecimentos)}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Checklist de Quesitos */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Quesitos Cadastrados ({pericia.quesitos?.length || 0})
                  </h4>
                  <button
                    onClick={() => onAbrirAssistente(pericia, 'ANALISAR_QUESITOS')}
                    className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auxílio Respostas (IA)</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(!pericia.quesitos || pericia.quesitos.length === 0) ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      Nenhum quesito registrado ainda. Adicione abaixo para controlar as respostas no laudo.
                    </p>
                  ) : (
                    pericia.quesitos.map(q => (
                      <div
                        key={q.id}
                        onClick={() => alternarQuesito(q.id)}
                        className={`p-2 rounded-lg border text-xs flex items-start gap-2 cursor-pointer transition-colors ${
                          q.respondido ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                          q.respondido ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'
                        }`}>
                          {q.respondido && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                            [{q.parte}]:
                          </span>
                          <span>{q.texto}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Adicionar Quesito Rápido */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <select
                    value={novoQuesitoParte}
                    onChange={e => setNovoQuesitoParte(e.target.value as 'JUIZ' | 'AUTOR' | 'REU')}
                    className="text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700"
                  >
                    <option value="JUIZ">Juiz</option>
                    <option value="AUTOR">Autor</option>
                    <option value="REU">Réu</option>
                  </select>
                  <input
                    type="text"
                    value={novoQuesitoTexto}
                    onChange={e => setNovoQuesitoTexto(e.target.value)}
                    placeholder="Adicionar quesito para checklist do laudo..."
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarQuesito();
                      }
                    }}
                  />
                  <button
                    onClick={adicionarQuesito}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
