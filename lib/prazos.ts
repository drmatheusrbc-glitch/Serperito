import { PericiaItem, PericiaStatus, PericiaArea, PrazoAnalise, UrgenciaNivel } from '@/types/pericia';

/**
 * Retorna a data no formato YYYY-MM-DD ajustada pelo fuso horário local
 */
export function hojeISO(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Calcula a diferença em dias corridos inteiros entre a data de referência (hoje) e a data alvo.
 * Valores negativos indicam prazo vencido.
 */
export function calcularDiasRestantes(dataAlvo: string): number {
  if (!dataAlvo) return 999;
  
  const [ano, mes, dia] = dataAlvo.split('-').map(Number);
  if (!ano || !mes || !dia) return 999;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const alvo = new Date(ano, mes - 1, dia);
  alvo.setHours(0, 0, 0, 0);
  
  const diffTime = alvo.getTime() - hoje.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Adiciona X dias corridos a uma data base no formato YYYY-MM-DD
 */
export function adicionarDias(dataBase: string, dias: number): string {
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Determina o nível de urgência com base nos dias restantes
 */
export function calcularUrgencia(diasRestantes: number): UrgenciaNivel {
  if (diasRestantes < 0) return 'VENCIDO';
  if (diasRestantes === 0) return 'HOJE';
  if (diasRestantes <= 3) return 'URGENTE';
  if (diasRestantes <= 7) return 'ALERTA';
  return 'TRANQUILO';
}

/**
 * Analisa qual é o próximo prazo crítico ativo de uma perícia, considerando seu status atual.
 */
export function analisarProximoPrazo(p: PericiaItem): PrazoAnalise | null {
  if (p.status === 'CONCLUIDA') return null;

  // 1. Se recém nomeado, avaliar aceite ou prazo de honorários se configurado
  if (p.status === 'NOMEADO' && p.prazoAceiteHonorarios) {
    const dias = calcularDiasRestantes(p.prazoAceiteHonorarios);
    return {
      tipo: 'ACEITE_HONORARIOS',
      dataAlvo: p.prazoAceiteHonorarios,
      diasRestantes: dias,
      nivel: calcularUrgencia(dias),
      tituloCurto: 'Aceite / Honorários',
      descricao: `Prazo para peticionar aceite ou proposta de honorários: ${formatarDataBR(p.prazoAceiteHonorarios)}`,
    };
  }

  // 2. Se aguarda agendamento, o prazo principal é o prazo para agendar a perícia
  if (p.status === 'AGUARDANDO_AGENDAMENTO' || (p.status === 'NOMEADO' && !p.dataPericia)) {
    const dias = calcularDiasRestantes(p.prazoAgendamento);
    return {
      tipo: 'AGENDAMENTO',
      dataAlvo: p.prazoAgendamento,
      diasRestantes: dias,
      nivel: calcularUrgencia(dias),
      tituloCurto: 'Marcar Perícia',
      descricao: `Prazo do juízo para informar data do exame: ${formatarDataBR(p.prazoAgendamento)}`,
    };
  }

  // 3. Se a perícia já está agendada, o próximo evento é a própria data do exame pericial
  if (p.status === 'PERICIA_AGENDADA' && p.dataPericia) {
    const dias = calcularDiasRestantes(p.dataPericia);
    return {
      tipo: 'DATA_EXAME',
      dataAlvo: p.dataPericia,
      diasRestantes: dias,
      nivel: calcularUrgencia(dias),
      tituloCurto: 'Data do Exame',
      descricao: `Exame pericial agendado para ${formatarDataBR(p.dataPericia)} às ${p.horarioPericia || 'horário a definir'}`,
    };
  }

  // 4. Se a perícia foi realizada, o prazo crítico vital é a entrega do laudo pericial
  if (p.status === 'PERICIA_REALIZADA' || (p.dataPericia && !p.dataEntregaLaudo)) {
    const dias = calcularDiasRestantes(p.prazoEntregaLaudo);
    return {
      tipo: 'ENTREGA_LAUDO',
      dataAlvo: p.prazoEntregaLaudo,
      diasRestantes: dias,
      nivel: calcularUrgencia(dias),
      tituloCurto: 'Entrega do Laudo',
      descricao: `Prazo fatal para juntada do laudo pericial: ${formatarDataBR(p.prazoEntregaLaudo)}`,
    };
  }

  // 5. Se há esclarecimentos/impugnação abertos
  if (p.status === 'ESCLARECIMENTOS' && p.prazoEsclarecimentos) {
    const dias = calcularDiasRestantes(p.prazoEsclarecimentos);
    return {
      tipo: 'ESCLARECIMENTOS',
      dataAlvo: p.prazoEsclarecimentos,
      diasRestantes: dias,
      nivel: calcularUrgencia(dias),
      tituloCurto: 'Esclarecimentos',
      descricao: `Prazo para responder aos quesitos suplementares: ${formatarDataBR(p.prazoEsclarecimentos)}`,
    };
  }

  // Fallback para prazo de entrega de laudo se não concluído
  if (p.prazoEntregaLaudo && !p.dataEntregaLaudo) {
    const dias = calcularDiasRestantes(p.prazoEntregaLaudo);
    return {
      tipo: 'ENTREGA_LAUDO',
      dataAlvo: p.prazoEntregaLaudo,
      diasRestantes: dias,
      nivel: calcularUrgencia(dias),
      tituloCurto: 'Entrega do Laudo',
      descricao: `Prazo para protocolar laudo: ${formatarDataBR(p.prazoEntregaLaudo)}`,
    };
  }

  return null;
}

export function formatarDataBR(dataIso?: string): string {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarMoedaBRL(valor: number): string {
  if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
  const partes = valor.toFixed(2).split('.');
  const inteira = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimal = partes[1];
  return `R$ ${inteira},${decimal}`;
}

export const AREA_LABELS: Record<PericiaArea, { label: string; sigla: string }> = {
  TRABALHISTA_DOENCA: { label: 'Doença Ocupacional (LER/DORT/Burnout)', sigla: 'Trabalhista' },
  TRABALHISTA_ACIDENTE: { label: 'Acidente de Trabalho Típico', sigla: 'Acidente' },
  TRABALHISTA_INSALUBRIDADE: { label: 'Insalubridade / Periculosidade', sigla: 'Insalubridade' },
  CIVIL_ERRO_MEDICO: { label: 'Responsabilidade Civil / Erro Médico', sigla: 'Erro Médico' },
  CIVIL_DANO_CORPORAL: { label: 'Avaliação de Dano Corporal / Sequelas', sigla: 'Dano Corporal' },
  CIVIL_INTERDICAO: { label: 'Capacidade Civil / Curatela / Psiquiatria', sigla: 'Interdição' },
  PREVIDENCIARIA: { label: 'Previdenciária / Auxílio / Aposentadoria', sigla: 'Previdenciária' },
  SECURITARIA: { label: 'Securitária / DPVAT / Seguro Privado', sigla: 'Seguro' },
  OUTRA: { label: 'Outra Especialidade Médico-Legal', sigla: 'Outra' },
};

export const STATUS_LABELS: Record<PericiaStatus, { label: string; cor: string; ordem: number }> = {
  NOMEADO: { label: 'Nomeado / Aguardando Aceite', cor: 'slate', ordem: 1 },
  AGUARDANDO_AGENDAMENTO: { label: 'Aguardando Agendamento', cor: 'amber', ordem: 2 },
  PERICIA_AGENDADA: { label: 'Perícia Agendada', cor: 'blue', ordem: 3 },
  PERICIA_REALIZADA: { label: 'Exame Realizado (Laudo Pendente)', cor: 'indigo', ordem: 4 },
  LAUDO_PROTOCOLADO: { label: 'Laudo Protocolado', cor: 'teal', ordem: 5 },
  ESCLARECIMENTOS: { label: 'Esclarecimentos Solicitados', cor: 'purple', ordem: 6 },
  CONCLUIDA: { label: 'Concluída / Pago', cor: 'emerald', ordem: 7 },
};

/**
 * Toca um bipe sonoro de alerta usando a Web Audio API (sem arquivos de áudio externos)
 */
export function tocarAlertaSonoro(urgente: boolean = false) {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = urgente ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(urgente ? 880 : 587.33, ctx.currentTime); // A5 ou D5
    if (urgente) {
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (urgente ? 0.35 : 0.2));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (urgente ? 0.4 : 0.25));
  } catch (err) {
    console.warn('Erro ao emitir som:', err);
  }
}

/**
 * Envia notificação nativa do navegador se permissão estiver concedida
 */
export async function enviarNotificacaoNavegador(titulo: string, corpo: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    new Notification(titulo, {
      body: corpo,
      icon: '/favicon.ico',
    });
    return true;
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(titulo, {
        body: corpo,
        icon: '/favicon.ico',
      });
      return true;
    }
  }
  return false;
}

/**
 * Gera arquivo iCalendar (.ics) para exportação de prazos e compromissos
 */
export function gerarArquivoICS(pericia: PericiaItem): string {
  const agora = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dataExame = pericia.dataPericia ? pericia.dataPericia.replace(/-/g, '') : '';
  const prazoLaudo = pericia.prazoEntregaLaudo ? pericia.prazoEntregaLaudo.replace(/-/g, '') : '';

  let vevents = '';

  if (pericia.dataPericia) {
    const dtstart = `${dataExame}T${(pericia.horarioPericia || '14:00').replace(':', '')}00`;
    vevents += `
BEGIN:VEVENT
UID:pericia-${pericia.id}-exame@periciamed.app
DTSTAMP:${agora}
DTSTART:${dtstart}
SUMMARY:Exame Pericial: ${pericia.autor} vs ${pericia.reu}
DESCRIPTION:Processo: ${pericia.numeroProcesso}\\nVara: ${pericia.vara} (${pericia.tribunal})\\nPericiando: ${pericia.autor}\\nLocal: ${pericia.localPericia || 'A definir'}
LOCATION:${pericia.localPericia || 'Consultório'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Lembrete: Exame pericial amanhã (${pericia.autor})
END:VALARM
END:VEVENT`;
  }

  if (pericia.prazoEntregaLaudo) {
    const dtstart = `${prazoLaudo}T180000`;
    vevents += `
BEGIN:VEVENT
UID:pericia-${pericia.id}-laudo@periciamed.app
DTSTAMP:${agora}
DTSTART:${dtstart}
SUMMARY:PRAZO FATAL LAUDO: ${pericia.autor} (Proc. ${pericia.numeroProcesso})
DESCRIPTION:Prazo final para juntada do Laudo Médico-Legal\\nProcesso: ${pericia.numeroProcesso}\\nVara: ${pericia.vara}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P3D
ACTION:DISPLAY
DESCRIPTION:Urgente: Faltam 3 dias para entrega do laudo (${pericia.autor})
END:VALARM
END:VEVENT`;
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PeríciaMed//Gestão de Perícias Médico-Legais//PT-BR
CALSCALE:GREGORIAN
METHOD:PUBLISH
${vevents}
END:VCALENDAR`.trim();
}

/**
 * Dispara download do arquivo .ics no navegador do usuário
 */
export function baixarICS(pericia: PericiaItem) {
  const content = gerarArquivoICS(pericia);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pericia_${pericia.autor.replace(/\s+/g, '_')}_prazos.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera mensagem formatada para WhatsApp de convocação/aviso da perícia médica
 */
export function gerarLinkWhatsApp(pericia: PericiaItem): string {
  const fone = pericia.telefoneContato ? pericia.telefoneContato.replace(/\D/g, '') : '';
  const dataFormatada = formatarDataBR(pericia.dataPericia);
  const horario = pericia.horarioPericia || 'a confirmar';
  const local = pericia.localPericia || 'Consultório Médico Pericial';

  const texto = encodeURIComponent(
    `Prezado(a) ${pericia.autor},\n\n` +
    `Informamos a designação da sua PERÍCIA MÉDICA JUDICIAL no processo nº ${pericia.numeroProcesso} (${pericia.vara}):\n\n` +
    `📅 Data: ${dataFormatada}\n` +
    `⏰ Horário: ${horario}\n` +
    `📍 Local: ${local}\n\n` +
    `⚠️ RECOMENDAÇÕES IMPORTANTES:\n` +
    `1. Comparecer com 15 minutos de antecedência;\n` +
    `2. Apresentar documento oficial original com foto (RG ou CNH);\n` +
    `3. Levar Carteira de Trabalho (CTPS) física ou digital;\n` +
    `4. Levar todos os exames originais (raio-x, ressonâncias, laudos médicos, receitas e atestados).\n\n` +
    `Em caso de dúvidas, favor entrar em contato com seu advogado(a).\n` +
    `Dr(a). Médico(a) Perito(a) Judicial`
  );

  return fone ? `https://wa.me/55${fone}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
