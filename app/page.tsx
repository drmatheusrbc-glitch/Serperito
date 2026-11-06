'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Navbar } from '@/components/Navbar';
import { KpiBar } from '@/components/KpiBar';
import { AlertaBanner } from '@/components/AlertaBanner';
import { TabelaPericias } from '@/components/TabelaPericias';
import { KanbanPericias } from '@/components/KanbanPericias';
import { CalendarioPrazos } from '@/components/CalendarioPrazos';
import { ModalNovaPericia } from '@/components/ModalNovaPericia';
import { ModalDetalhesPericia } from '@/components/ModalDetalhesPericia';
import { ModalAssistenteIA } from '@/components/ModalAssistenteIA';
import { ModalConexaoNuvem } from '@/components/ModalConexaoNuvem';
import { 
  buscarPericiasNuvem, 
  salvarPericiaNuvem, 
  excluirPericiaNuvem 
} from '@/lib/api-sync';

import { PericiaItem, PericiaStatus, PrazoAnalise } from '@/types/pericia';
import { 
  analisarProximoPrazo, 
  tocarAlertaSonoro, 
  enviarNotificacaoNavegador 
} from '@/lib/prazos';
import { 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  Trash2
} from 'lucide-react';

const STORAGE_KEY = 'periciamed_pericias_v2';
const SOUND_KEY = 'periciamed_som_habilitado';

const periciasSubscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('periciamed_update', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('periciamed_update', callback);
  };
};

const getPericiasSnapshot = () => {
  return localStorage.getItem(STORAGE_KEY) || '[]';
};

const getPericiasServerSnapshot = () => {
  return '[]';
};

const somSubscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('periciamed_sound_update', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('periciamed_sound_update', callback);
  };
};

const getSomSnapshot = () => {
  return localStorage.getItem(SOUND_KEY) ?? 'true';
};

const getSomServerSnapshot = () => {
  return 'true';
};

export default function Home() {
  const periciasJson = useSyncExternalStore(
    periciasSubscribe,
    getPericiasSnapshot,
    getPericiasServerSnapshot
  );

  const pericias: PericiaItem[] = useMemo(() => {
    try {
      const parsed = JSON.parse(periciasJson);
      return Array.isArray(parsed)
        ? parsed.filter((p: PericiaItem) => !p.id.startsWith('pericia-0'))
        : [];
    } catch {
      return [];
    }
  }, [periciasJson]);

  const somRaw = useSyncExternalStore(
    somSubscribe,
    getSomSnapshot,
    getSomServerSnapshot
  );
  const somHabilitado = somRaw === 'true';

  const [abaAtiva, setAbaAtiva] = useState<'tabela' | 'kanban' | 'calendario' | 'assistente'>('tabela');
  const [filtroRapido, setFiltroRapido] = useState<string>('todos');
  
  // Modais
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [periciaEdicao, setPericiaEdicao] = useState<PericiaItem | null>(null);
  const [periciaDetalhes, setPericiaDetalhes] = useState<PericiaItem | null>(null);
  const [modalAssistenteAberto, setModalAssistenteAberto] = useState(false);
  const [assistenteTipo, setAssistenteTipo] = useState<string>('PETICAO_AGENDAMENTO');
  const [assistentePericiaSelecionada, setAssistentePericiaSelecionada] = useState<PericiaItem | null>(null);

  // Diálogo de confirmação in-app e toast (evita window.alert/window.confirm)
  const [confirmacaoDialog, setConfirmacaoDialog] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    onConfirmar: () => void;
  }>({
    aberto: false,
    titulo: '',
    mensagem: '',
    onConfirmar: () => {},
  });

  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => {
      setToastMensagem(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  // Nuvem HostGator MySQL
  const [nuvemConectada, setNuvemConectada] = useState(false);
  const [sincronizandoNuvem, setSincronizandoNuvem] = useState(false);
  const [modalNuvemAberto, setModalNuvemAberto] = useState(false);

  // Salva no localStorage e dispara evento para sincronização reativa
  const salvarPericias = (novasPericias: PericiaItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasPericias));
      window.dispatchEvent(new Event('periciamed_update'));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  };

  // Limpa chaves legadas e carrega dados do banco MySQL se conectado
  useEffect(() => {
    try {
      localStorage.removeItem('periciamed_pericias_v1');
    } catch {}

    let ativo = true;
    buscarPericiasNuvem().then(res => {
      if (!ativo) return;
      if (res.conectado) {
        setNuvemConectada(true);
        if (res.pericias && res.pericias.length > 0) {
          salvarPericias(res.pericias);
        }
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  const handleToggleSom = (val: boolean) => {
    try {
      localStorage.setItem(SOUND_KEY, String(val));
      window.dispatchEvent(new Event('periciamed_sound_update'));
    } catch {}
    if (val) {
      tocarAlertaSonoro(false);
    }
  };

  // Calcula prazos críticos
  const prazosCriticos: { pericia: PericiaItem; analise: PrazoAnalise }[] = pericias
    .map(p => ({ pericia: p, analise: analisarProximoPrazo(p)! }))
    .filter(item => item.analise && (
      item.analise.nivel === 'VENCIDO' ||
      item.analise.nivel === 'HOJE' ||
      item.analise.nivel === 'URGENTE'
    ))
    .sort((a, b) => a.analise.diasRestantes - b.analise.diasRestantes);

  // Manipulação de Perícias
  const handleCriarOuAtualizar = (item: PericiaItem) => {
    const existe = pericias.some(p => p.id === item.id);
    let novas: PericiaItem[];
    if (existe) {
      novas = pericias.map(p => (p.id === item.id ? item : p));
    } else {
      novas = [item, ...pericias];
    }
    salvarPericias(novas);

    // Se estiver detalhando a mesma perícia, atualiza estado do modal
    if (periciaDetalhes && periciaDetalhes.id === item.id) {
      setPericiaDetalhes(item);
    }

    if (somHabilitado) {
      tocarAlertaSonoro(false);
    }

    // Sincronizar com o banco MySQL da HostGator em segundo plano
    setSincronizandoNuvem(true);
    salvarPericiaNuvem(item).then(res => {
      if (res.conectado) {
        setNuvemConectada(true);
      }
    }).finally(() => {
      setSincronizandoNuvem(false);
    });
  };

  const handleExcluir = (id: string) => {
    setConfirmacaoDialog({
      aberto: true,
      titulo: 'Remover Perícia',
      mensagem: 'Tem certeza que deseja remover esta perícia? Os prazos associados deixarão de ser monitorados.',
      onConfirmar: () => {
        const novas = pericias.filter(p => p.id !== id);
        salvarPericias(novas);
        if (periciaDetalhes && periciaDetalhes.id === id) {
          setPericiaDetalhes(null);
        }
        setConfirmacaoDialog(prev => ({ ...prev, aberto: false }));
        exibirToast('Perícia removida com sucesso.');

        // Exclui também do banco MySQL
        setSincronizandoNuvem(true);
        excluirPericiaNuvem(id).finally(() => setSincronizandoNuvem(false));
      },
    });
  };

  const handleAvancarStatus = (id: string, novoStatus: PericiaStatus) => {
    let itemAtualizado: PericiaItem | null = null;
    const novas = pericias.map(p => {
      if (p.id === id) {
        itemAtualizado = {
          ...p,
          status: novoStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        return itemAtualizado;
      }
      return p;
    });
    salvarPericias(novas);
    if (somHabilitado) {
      tocarAlertaSonoro(false);
    }
    exibirToast('Fase pericial atualizada.');

    if (itemAtualizado) {
      setSincronizandoNuvem(true);
      salvarPericiaNuvem(itemAtualizado).finally(() => setSincronizandoNuvem(false));
    }
  };

  const handleAbrirAssistente = (p: PericiaItem, tipo: string) => {
    setAssistentePericiaSelecionada(p);
    setAssistenteTipo(tipo);
    setModalAssistenteAberto(true);
  };

  const handleTestarNotificacao = async () => {
    const sucesso = await enviarNotificacaoNavegador(
      'PeríciaMed: Notificações Ativadas',
      'Você receberá lembretes automáticos de prazos fatais e agendamento de perícias.'
    );
    if (sucesso) {
      exibirToast('Notificações de navegador autorizadas com sucesso!');
    } else {
      exibirToast('Permissão de notificações não concedida no navegador.');
    }
  };

  const handleLimparTudo = () => {
    setConfirmacaoDialog({
      aberto: true,
      titulo: 'Limpar Todas as Perícias',
      mensagem: 'Tem certeza que deseja apagar todas as perícias cadastradas? Esta ação não pode ser desfeita.',
      onConfirmar: () => {
        salvarPericias([]);
        setConfirmacaoDialog(prev => ({ ...prev, aberto: false }));
        exibirToast('Todas as perícias foram apagadas.');
      },
    });
  };

  const handleExportarBackup = () => {
    const jsonStr = JSON.stringify(pericias, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_periciamed_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* 1. Navbar */}
      <Navbar
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        onAbrirNovaPericia={() => {
          setPericiaEdicao(null);
          setModalNovaAberto(true);
        }}
        prazosCriticos={prazosCriticos}
        somHabilitado={somHabilitado}
        setSomHabilitado={handleToggleSom}
        onSelecionarPericia={p => setPericiaDetalhes(p)}
        onTestarNotificacao={handleTestarNotificacao}
        nuvemConectada={nuvemConectada}
        sincronizandoNuvem={sincronizandoNuvem}
        onAbrirModalNuvem={() => setModalNuvemAberto(true)}
      />

      {/* 2. Hero Section */}
      <section className="bg-white border-b border-slate-200/80 pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-semibold text-teal-800">Painel do Perito Judicial</span>
                <span aria-hidden="true">·</span>
                <span>Controle de Prazos do CPC</span>
                <span aria-hidden="true">·</span>
                <span>Notificações Ativas</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance">
                Gestão de Nomeações e Prazos Médico-Legais
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Controle rigoroso dos prazos judiciais para indicação de data de perícia e entrega de laudos, com avisos automáticos anti-atraso e minutas forenses com IA.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setPericiaEdicao(null);
                  setModalNovaAberto(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Nomeação</span>
              </button>
            </div>
          </div>

          {/* Barra de KPIs */}
          <div className="mt-6">
            <KpiBar
              pericias={pericias}
              prazosCriticos={prazosCriticos}
              filtroRapido={filtroRapido}
              setFiltroRapido={setFiltroRapido}
            />
          </div>
        </div>
      </section>

      {/* 3. Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner de Alerta Crítico */}
        <AlertaBanner
          prazosCriticos={prazosCriticos}
          onSelecionarPericia={p => setPericiaDetalhes(p)}
          onFiltrarCriticos={() => {
            setFiltroRapido('criticos');
            setAbaAtiva('tabela');
          }}
        />

        {/* Visualização de acordo com a aba ativa */}
        {abaAtiva === 'tabela' && (
          <TabelaPericias
            pericias={pericias}
            onSelecionarPericia={p => setPericiaDetalhes(p)}
            onEditarPericia={p => {
              setPericiaEdicao(p);
              setModalNovaAberto(true);
            }}
            onExcluirPericia={handleExcluir}
            onAbrirAssistente={handleAbrirAssistente}
            filtroRapido={filtroRapido}
            setFiltroRapido={setFiltroRapido}
            onAbrirNovaPericia={() => {
              setPericiaEdicao(null);
              setModalNovaAberto(true);
            }}
          />
        )}

        {abaAtiva === 'kanban' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Quadro de Fluxo Pericial
                </h3>
                <p className="text-xs text-slate-500">
                  Arraste ou avance as nomeações pelas fases procedimentais até a conclusão dos honorários.
                </p>
              </div>
            </div>
            <KanbanPericias
              pericias={pericias}
              onSelecionarPericia={p => setPericiaDetalhes(p)}
              onAvancarStatus={handleAvancarStatus}
              onAbrirAssistente={handleAbrirAssistente}
            />
          </div>
        )}

        {abaAtiva === 'calendario' && (
          <CalendarioPrazos
            pericias={pericias}
            onSelecionarPericia={p => setPericiaDetalhes(p)}
            onAbrirAssistente={handleAbrirAssistente}
          />
        )}

        {abaAtiva === 'assistente' && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6">
            <div className="max-w-2xl mb-6">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-700" />
                Central de Minutas & Inteligência Médico-Forense
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Selecione uma perícia ativa para gerar automaticamente minutas de petições de agendamento, juntada de laudos, propostas de honorários e respostas a quesitos técnicos fundamentadas nas resoluções do CFM e do CPC.
              </p>
            </div>

            {pericias.filter(p => p.status !== 'CONCLUIDA').length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-700">Nenhuma perícia ativa cadastrada</p>
                <p className="mt-1 text-slate-500">Cadastre uma nomeação para gerar minutas de petições e modelos de laudo pericial com a IA.</p>
                <button
                  onClick={() => {
                    setPericiaEdicao(null);
                    setModalNovaAberto(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Nomeação</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pericias.filter(p => p.status !== 'CONCLUIDA').map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-500/60 hover:bg-slate-50/70 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="font-mono font-semibold text-teal-800">{p.numeroProcesso}</span>
                        <span>{p.vara}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {p.autor} vs. {p.reu}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {p.observacoesClinicas || 'Avaliação médica pericial'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAbrirAssistente(p, 'PETICAO_AGENDAMENTO')}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Petição Agendamento
                      </button>
                      <button
                        onClick={() => handleAbrirAssistente(p, 'ESTRUTURA_LAUDO')}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Estruturar Laudo
                      </button>
                      <button
                        onClick={() => handleAbrirAssistente(p, 'PETICAO_ENTREGA_LAUDO')}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Entrega Laudo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-slate-800">PeríciaMed</span>
            <span>—</span>
            <span>Sistema Médico-Forense do Perito Judicial</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={handleExportarBackup}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup (.json)</span>
            </button>
            {pericias.length > 0 && (
              <button
                onClick={handleLimparTudo}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Todas as Perícias</span>
              </button>
            )}
            <span className="text-slate-400">·</span>
            <span>Conforme Art. 465 a 477 do CPC</span>
          </div>
        </div>
      </footer>

      {/* Modais */}
      <ModalNovaPericia
        aberto={modalNovaAberto}
        onFechar={() => {
          setModalNovaAberto(false);
          setPericiaEdicao(null);
        }}
        onSalvar={handleCriarOuAtualizar}
        periciaEdicao={periciaEdicao}
      />

      <ModalDetalhesPericia
        pericia={periciaDetalhes}
        onFechar={() => setPericiaDetalhes(null)}
        onEditar={p => {
          setPericiaEdicao(p);
          setModalNovaAberto(true);
        }}
        onAbrirAssistente={handleAbrirAssistente}
        onAtualizarPericia={handleCriarOuAtualizar}
      />

      <ModalAssistenteIA
        aberto={modalAssistenteAberto}
        onFechar={() => setModalAssistenteAberto(false)}
        periciaInicial={assistentePericiaSelecionada}
        tipoInicial={assistenteTipo}
      />

      <ModalConexaoNuvem
        aberto={modalNuvemAberto}
        onFechar={() => setModalNuvemAberto(false)}
        conectado={nuvemConectada}
        periciasLocais={pericias}
        onSincronizacaoConcluida={(sincronizadas) => {
          setNuvemConectada(true);
          salvarPericias(sincronizadas);
          exibirToast('Perícias sincronizadas com o banco de dados da HostGator.');
        }}
      />

      {/* Toast Notification */}
      {toastMensagem && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMensagem}</span>
          <button 
            onClick={() => setToastMensagem(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* In-App Confirmation Dialog */}
      {confirmacaoDialog.aberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              {confirmacaoDialog.titulo}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {confirmacaoDialog.mensagem}
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmacaoDialog(prev => ({ ...prev, aberto: false }))}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmacaoDialog.onConfirmar}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
