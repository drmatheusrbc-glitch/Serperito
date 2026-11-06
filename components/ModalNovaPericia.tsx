'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, User, Building, FileText, Check } from 'lucide-react';
import { PericiaItem, PericiaArea, PericiaStatus } from '@/types/pericia';
import { hojeISO, adicionarDias, AREA_LABELS, STATUS_LABELS } from '@/lib/prazos';

interface ModalNovaPericiaProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (pericia: PericiaItem) => void;
  periciaEdicao?: PericiaItem | null;
}

export function ModalNovaPericia({
  aberto,
  onFechar,
  onSalvar,
  periciaEdicao,
}: ModalNovaPericiaProps) {
  if (!aberto) return null;

  return (
    <ModalNovaPericiaForm
      key={periciaEdicao ? periciaEdicao.id : 'nova'}
      onFechar={onFechar}
      onSalvar={onSalvar}
      periciaEdicao={periciaEdicao}
    />
  );
}

function ModalNovaPericiaForm({
  onFechar,
  onSalvar,
  periciaEdicao,
}: {
  onFechar: () => void;
  onSalvar: (pericia: PericiaItem) => void;
  periciaEdicao?: PericiaItem | null;
}) {
  const hoje = hojeISO();

  const [numeroProcesso, setNumeroProcesso] = useState(periciaEdicao?.numeroProcesso || '');
  const [tribunal, setTribunal] = useState(periciaEdicao?.tribunal || 'TJSP');
  const [vara, setVara] = useState(periciaEdicao?.vara || '');
  const [cidadeUf, setCidadeUf] = useState(periciaEdicao?.cidadeUf || 'São Paulo/SP');
  const [autor, setAutor] = useState(periciaEdicao?.autor || '');
  const [cpfAutor, setCpfAutor] = useState(periciaEdicao?.cpfAutor || '');
  const [telefoneContato, setTelefoneContato] = useState(periciaEdicao?.telefoneContato || '');
  const [reu, setReu] = useState(periciaEdicao?.reu || '');
  const [area, setArea] = useState<PericiaArea>(periciaEdicao?.area || 'TRABALHISTA_DOENCA');
  const [status, setStatus] = useState<PericiaStatus>(periciaEdicao?.status || 'NOMEADO');
  
  // Prazos
  const [dataNomeacao, setDataNomeacao] = useState(periciaEdicao?.dataNomeacao || hoje);
  const [prazoAceiteHonorarios, setPrazoAceiteHonorarios] = useState(periciaEdicao?.prazoAceiteHonorarios || adicionarDias(hoje, 5));
  const [prazoAgendamento, setPrazoAgendamento] = useState(periciaEdicao?.prazoAgendamento || adicionarDias(hoje, 15));
  const [dataPericia, setDataPericia] = useState(periciaEdicao?.dataPericia || '');
  const [horarioPericia, setHorarioPericia] = useState(periciaEdicao?.horarioPericia || '14:00');
  const [localPericia, setLocalPericia] = useState(periciaEdicao?.localPericia || 'Consultório Médico Pericial');
  const [prazoEntregaLaudo, setPrazoEntregaLaudo] = useState(periciaEdicao?.prazoEntregaLaudo || adicionarDias(hoje, 30));
  const [dataEntregaLaudo, setDataEntregaLaudo] = useState(periciaEdicao?.dataEntregaLaudo || '');
  const [prazoEsclarecimentos, setPrazoEsclarecimentos] = useState(periciaEdicao?.prazoEsclarecimentos || '');
  
  // Financeiro
  const [honorariosPropostos, setHonorariosPropostos] = useState(String(periciaEdicao?.honorariosPropostos || 4500));
  const [honorariosFixados, setHonorariosFixados] = useState(String(periciaEdicao?.honorariosFixados || 0));
  const [honorariosRecebidos, setHonorariosRecebidos] = useState(String(periciaEdicao?.honorariosRecebidos || 0));
  const [justicaGratuita, setJusticaGratuita] = useState(Boolean(periciaEdicao?.justicaGratuita));
  
  // Extras
  const [assistenteTecnicoAutor, setAssistenteTecnicoAutor] = useState(periciaEdicao?.assistenteTecnicoAutor || '');
  const [assistenteTecnicoReu, setAssistenteTecnicoReu] = useState(periciaEdicao?.assistenteTecnicoReu || '');
  const [observacoesClinicas, setObservacoesClinicas] = useState(periciaEdicao?.observacoesClinicas || '');
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroProcesso.trim() || !autor.trim() || !vara.trim()) {
      setErroValidacao('Por favor, preencha obrigatoriamente o número do processo, o nome do periciando e a vara judicial.');
      return;
    }
    setErroValidacao(null);

    const item: PericiaItem = {
      id: periciaEdicao ? periciaEdicao.id : `pericia-${Date.now()}`,
      numeroProcesso: numeroProcesso.trim(),
      tribunal: tribunal.trim(),
      vara: vara.trim(),
      cidadeUf: cidadeUf.trim(),
      autor: autor.trim(),
      cpfAutor: cpfAutor.trim(),
      telefoneContato: telefoneContato.trim(),
      reu: reu.trim() || 'A Apurar / Réu',
      area,
      status,
      dataNomeacao,
      prazoAceiteHonorarios: prazoAceiteHonorarios || undefined,
      prazoAgendamento: prazoAgendamento || adicionarDias(dataNomeacao, 15),
      dataPericia: dataPericia || undefined,
      horarioPericia: horarioPericia || undefined,
      localPericia: localPericia || undefined,
      prazoEntregaLaudo: prazoEntregaLaudo || adicionarDias(dataNomeacao, 30),
      dataEntregaLaudo: dataEntregaLaudo || undefined,
      prazoEsclarecimentos: prazoEsclarecimentos || undefined,
      honorariosPropostos: parseFloat(honorariosPropostos) || 0,
      honorariosFixados: parseFloat(honorariosFixados) || 0,
      honorariosRecebidos: parseFloat(honorariosRecebidos) || 0,
      justicaGratuita,
      assistenteTecnicoAutor: assistenteTecnicoAutor.trim() || undefined,
      assistenteTecnicoReu: assistenteTecnicoReu.trim() || undefined,
      observacoesClinicas: observacoesClinicas.trim() || undefined,
      quesitos: periciaEdicao?.quesitos || [],
      createdAt: periciaEdicao ? periciaEdicao.createdAt : hoje,
      updatedAt: hoje,
    };

    onSalvar(item);
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {periciaEdicao ? 'Editar Perícia Médico-Legal' : 'Cadastrar Nova Nomeação Pericial'}
            </h3>
            <p className="text-xs text-slate-500">
              Registre os dados processuais e estabeleça o controle estrito de prazos para agendamento e laudo.
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Seção 1: Dados Processuais */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-700" />
              1. Dados do Processo & Juízo
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Processo (CNJ) *
                </label>
                <input
                  type="text"
                  required
                  value={numeroProcesso}
                  onChange={e => setNumeroProcesso(e.target.value)}
                  placeholder="0000000-00.2024.8.26.0000"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tribunal
                </label>
                <input
                  type="text"
                  value={tribunal}
                  onChange={e => setTribunal(e.target.value)}
                  placeholder="Ex: TJSP, TRT-15, TRF-3"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vara Judicial *
                </label>
                <input
                  type="text"
                  required
                  value={vara}
                  onChange={e => setVara(e.target.value)}
                  placeholder="Ex: 2ª Vara do Trabalho de Campinas / 5ª Vara Cível"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Comarca / Cidade
                </label>
                <input
                  type="text"
                  value={cidadeUf}
                  onChange={e => setCidadeUf(e.target.value)}
                  placeholder="Campinas/SP"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Partes e Especialidade */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-700" />
              2. Partes & Especialidade Médico-Legal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periciando(a) / Autor *
                </label>
                <input
                  type="text"
                  required
                  value={autor}
                  onChange={e => setAutor(e.target.value)}
                  placeholder="Nome completo do paciente/autor"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF do Periciando
                </label>
                <input
                  type="text"
                  value={cpfAutor}
                  onChange={e => setCpfAutor(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp / Telefone para Aviso
                </label>
                <input
                  type="text"
                  value={telefoneContato}
                  onChange={e => setTelefoneContato(e.target.value)}
                  placeholder="DDD + Telefone (ex: 11987654321)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parte Ré (Empresa, Hospital, INSS, Seguradora)
                </label>
                <input
                  type="text"
                  value={reu}
                  onChange={e => setReu(e.target.value)}
                  placeholder="Razão social da empresa reclamada ou réu"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especialidade Pericial
                </label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value as PericiaArea)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  {Object.entries(AREA_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fase Atual da Perícia
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as PericiaStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assistentes Técnicos Nomeados (Opcional)
                </label>
                <input
                  type="text"
                  value={assistenteTecnicoAutor || assistenteTecnicoReu ? `${assistenteTecnicoAutor ? 'Aut: ' + assistenteTecnicoAutor : ''} ${assistenteTecnicoReu ? 'Réu: ' + assistenteTecnicoReu : ''}` : ''}
                  onChange={e => setAssistenteTecnicoAutor(e.target.value)}
                  placeholder="Ex: Dra. Mariana (Autor) / Dr. Marcos (Réu)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Controle Rigoroso de Prazos (Anti-Atraso) */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                3. Prazos Judiciais e Notificações Anti-Atraso
              </span>
              <span className="text-[10px] font-normal text-amber-700">
                Prazos alimentam os alarmes automáticos
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Data da Nomeação */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data da Intimação / Nomeação
                </label>
                <input
                  type="date"
                  value={dataNomeacao}
                  onChange={e => setDataNomeacao(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              {/* Prazo para Aceite e Honorários (CPC 465) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Prazo para Aceite / Honorários
                  </label>
                  <button
                    type="button"
                    onClick={() => setPrazoAceiteHonorarios(adicionarDias(dataNomeacao, 5))}
                    className="text-[10px] text-teal-700 font-medium hover:underline"
                  >
                    +5d (CPC 465)
                  </button>
                </div>
                <input
                  type="date"
                  value={prazoAceiteHonorarios}
                  onChange={e => setPrazoAceiteHonorarios(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              {/* Prazo para Marcar Perícia */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Prazo para Indicar Data da Perícia *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrazoAgendamento(adicionarDias(dataNomeacao, 15))}
                      className="text-[10px] text-teal-700 font-medium hover:underline"
                    >
                      +15d
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrazoAgendamento(adicionarDias(dataNomeacao, 20))}
                      className="text-[10px] text-teal-700 font-medium hover:underline"
                    >
                      +20d
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={prazoAgendamento}
                  onChange={e => setPrazoAgendamento(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              {/* Data e Hora Marcada do Exame */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Marcada para o Exame Pericial
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dataPericia}
                    onChange={e => {
                      setDataPericia(e.target.value);
                      if (e.target.value && status === 'AGUARDANDO_AGENDAMENTO') {
                        setStatus('PERICIA_AGENDADA');
                      }
                      if (e.target.value) {
                        setPrazoEntregaLaudo(adicionarDias(e.target.value, 20));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="time"
                    value={horarioPericia}
                    onChange={e => setHorarioPericia(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Local do Exame */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local Designado para o Exame
                </label>
                <input
                  type="text"
                  value={localPericia}
                  onChange={e => setLocalPericia(e.target.value)}
                  placeholder="Ex: Consultório Pericial - Av. Paulista, 1000, Sl. 42 / Sede da Reclamada"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              {/* Prazo Fatal de Entrega do Laudo */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Prazo Fatal para Entrega do Laudo Médico-Legal *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrazoEntregaLaudo(adicionarDias(dataPericia || hoje, 20))}
                      className="text-[10px] text-teal-700 font-medium hover:underline"
                    >
                      +20d após exame
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrazoEntregaLaudo(adicionarDias(dataPericia || hoje, 30))}
                      className="text-[10px] text-teal-700 font-medium hover:underline"
                    >
                      +30d
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={prazoEntregaLaudo}
                  onChange={e => setPrazoEntregaLaudo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-indigo-950"
                />
              </div>

            </div>
          </div>

          {/* Seção 4: Honorários Periciais */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-teal-700" />
              4. Honorários Periciais
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Proposto (R$)
                </label>
                <input
                  type="number"
                  step="100"
                  value={honorariosPropostos}
                  onChange={e => setHonorariosPropostos(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Fixado Juízo (R$)
                </label>
                <input
                  type="number"
                  step="100"
                  value={honorariosFixados}
                  onChange={e => setHonorariosFixados(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Já Levantado (R$)
                </label>
                <input
                  type="number"
                  step="100"
                  value={honorariosRecebidos}
                  onChange={e => setHonorariosRecebidos(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="justicaGratuita"
                  checked={justicaGratuita}
                  onChange={e => setJusticaGratuita(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="justicaGratuita" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Benefício da Justiça Gratuita (AJG)
                </label>
              </div>
            </div>
          </div>

          {/* Seção 5: Resumo Clínico e Quesitos */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              5. Resumo Clínico & Anotações Preliminares
            </h4>
            <textarea
              rows={3}
              value={observacoesClinicas}
              onChange={e => setObservacoesClinicas(e.target.value)}
              placeholder="Descreva o alegado na petição inicial (ex: queda em altura com fratura de calcâneo, LER/DORT, erro pós-cirúrgico, nexo com função laboral, exames pendentes)..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Banner de Erro de Validação */}
          {erroValidacao && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
              {erroValidacao}
            </div>
          )}

          {/* Footer do Form */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{periciaEdicao ? 'Salvar Alterações' : 'Cadastrar Nomeação'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
