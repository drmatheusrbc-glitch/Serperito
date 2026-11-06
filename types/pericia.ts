export type PericiaStatus =
  | 'NOMEADO'
  | 'AGUARDANDO_AGENDAMENTO'
  | 'PERICIA_AGENDADA'
  | 'PERICIA_REALIZADA'
  | 'LAUDO_PROTOCOLADO'
  | 'ESCLARECIMENTOS'
  | 'CONCLUIDA';

export type PericiaArea =
  | 'TRABALHISTA_DOENCA'
  | 'TRABALHISTA_ACIDENTE'
  | 'TRABALHISTA_INSALUBRIDADE'
  | 'CIVIL_ERRO_MEDICO'
  | 'CIVIL_DANO_CORPORAL'
  | 'CIVIL_INTERDICAO'
  | 'PREVIDENCIARIA'
  | 'SECURITARIA'
  | 'OUTRA';

export interface QuesitoItem {
  id: string;
  parte: 'JUIZ' | 'AUTOR' | 'REU';
  texto: string;
  respondido: boolean;
  rascunhoResposta?: string;
}

export interface PericiaItem {
  id: string;
  numeroProcesso: string;
  tribunal: string; // Ex: TRT-2, TJSP, TRF-3, TJMG
  vara: string; // Ex: 4ª Vara do Trabalho de São Paulo
  cidadeUf: string; // Ex: São Paulo/SP
  autor: string; // Nome do periciando/autor
  cpfAutor?: string;
  dataNascimentoAutor?: string;
  telefoneContato?: string;
  reu: string; // Empresa ré, INSS, hospital
  area: PericiaArea;
  status: PericiaStatus;
  
  // Datas e Prazos Cruciais
  dataNomeacao: string; // YYYY-MM-DD
  prazoAceiteHonorarios?: string; // YYYY-MM-DD
  prazoAgendamento: string; // YYYY-MM-DD - Prazo para marcar a perícia
  dataPericia?: string; // YYYY-MM-DD - Data marcada para o exame
  horarioPericia?: string; // HH:mm
  localPericia?: string; // Consultório, empresa, clínica conveniada
  prazoEntregaLaudo: string; // YYYY-MM-DD - Prazo fatal do laudo
  dataEntregaLaudo?: string; // YYYY-MM-DD - Data em que foi protocolado
  prazoEsclarecimentos?: string; // YYYY-MM-DD - Prazo para responder impugnações
  
  // Aspectos Financeiros
  honorariosPropostos: number;
  honorariosFixados: number;
  honorariosRecebidos: number;
  justicaGratuita: boolean;
  
  // Assistentes Técnicos e Notas
  assistenteTecnicoAutor?: string;
  assistenteTecnicoReu?: string;
  observacoesClinicas?: string;
  quesitos?: QuesitoItem[];
  
  createdAt: string;
  updatedAt: string;
}

export type UrgenciaNivel = 'VENCIDO' | 'HOJE' | 'URGENTE' | 'ALERTA' | 'TRANQUILO';

export interface PrazoAnalise {
  tipo: 'AGENDAMENTO' | 'ENTREGA_LAUDO' | 'ACEITE_HONORARIOS' | 'DATA_EXAME' | 'ESCLARECIMENTOS';
  dataAlvo: string;
  diasRestantes: number;
  nivel: UrgenciaNivel;
  descricao: string;
  tituloCurto: string;
}
