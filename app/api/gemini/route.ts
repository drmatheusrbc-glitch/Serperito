import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Suporta GEMINI_API_KEY, GEMINI_LIVE_API_KEY ou API_KEY na HostGator ou AI Studio
    const apiKey = 
      process.env.GEMINI_API_KEY || 
      process.env.GEMINI_LIVE_API_KEY || 
      process.env.API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Chave da API Gemini não encontrada no servidor. Configure a variável de ambiente GEMINI_API_KEY (ou GEMINI_LIVE_API_KEY) no painel da HostGator (Setup Node.js App > Environment variables).' 
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': process.env.APP_URL ? 'periciamed-hostgator' : 'aistudio-build',
        },
      },
    });

    const body = await req.json().catch(() => null);
    if (!body || !body.tipo) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido ou tipo de minuta não especificado.' },
        { status: 400 }
      );
    }

    const { tipo, pericia, promptCustomizado, quesitosTexto } = body;

    if (!pericia || !pericia.numeroProcesso) {
      return NextResponse.json(
        { error: 'Dados da perícia incompletos para elaboração da minuta.' },
        { status: 400 }
      );
    }

    let systemInstruction = `Você é um Médico Perito Judicial experiente, especialista em Medicina Legal e Perícias Médicas, com profundo conhecimento do Código de Processo Civil brasileiro (CPC - Lei 13.105/2015), resoluções do Conselho Federal de Medicina (CFM, ex: Resolução CFM nº 2.056/2013 e 2.183/2018) e normas do CNJ.
Você redige documentos forenses e minutas com linguagem culta, estritamente técnica, elegante, impessoal e formal própria do foro judicial brasileiro.
Nunca invente falsidades ou termos leigos. Utilize a formatação correta de petições ao MM. Juízo ou estrutura oficial de Laudo Pericial Médico.`;

    let prompt = '';

    if (tipo === 'PETICAO_AGENDAMENTO') {
      prompt = `Elabore uma minuta completa e formal de PETIÇÃO DE DESIGNAÇÃO DE DATA E LOCAL PARA REALIZAÇÃO DA PERÍCIA MÉDICA JUDICIAL para o médico perito apresentar ao Juízo.

DADOS DA PERÍCIA:
- Processo nº: ${pericia.numeroProcesso}
- Vara/Juízo: ${pericia.vara} (${pericia.tribunal})
- Comarca/Cidade: ${pericia.cidadeUf}
- Autor(a)/Periciando(a): ${pericia.autor}
- Réu: ${pericia.reu}
- Especialidade/Objeto: ${pericia.area}
- Data Agendada para o Exame: ${pericia.dataPericia || '[DATA A DEFINIR]'}
- Horário: ${pericia.horarioPericia || '[HORÁRIO]'}
- Local da Realização: ${pericia.localPericia || '[ENDEREÇO DO CONSULTÓRIO / CLÍNICA]'}
- Observações adicionais: ${pericia.observacoesClinicas || 'Nenhuma'}

REQUISITOS DA PETIÇÃO:
1. Endereçamento ao Excelentíssimo Senhor Doutor Juiz de Direito da respectiva Vara;
2. Qualificação formal do Médico Perito do Juízo (com espaço para CRM e RQE);
3. Comunicação clara e inequívoca da data, horário e local designados para a realização do exame clínico pericial;
4. Intimação das partes e do(a) periciando(a) com antecedência legal (art. 466, § 2º do CPC e art. 474 do CPC);
5. Solicitação expressa para que o(a) periciando(a) compareça portando documento oficial original com foto, Carteira de Trabalho (CTPS) e TODOS os exames complementares de imagem, laboratoriais, laudos e prontuários médicos originais pertinentes;
6. Franquear aos Assistentes Técnicos das partes o acompanhamento do ato pericial, nos moldes legais;
7. Finalização formal com data, espaço para assinatura e CRM.`;
    } else if (tipo === 'PETICAO_ENTREGA_LAUDO') {
      prompt = `Elabore uma minuta formal de PETIÇÃO DE JUNTADA / ENTREGA DO LAUDO PERICIAL MÉDICO E LEVANTAMENTO DOS HONORÁRIOS PERICIAIS.

DADOS DA PERÍCIA:
- Processo nº: ${pericia.numeroProcesso}
- Vara: ${pericia.vara} (${pericia.tribunal})
- Autor(a): ${pericia.autor}
- Réu: ${pericia.reu}
- Especialidade: ${pericia.area}
- Honorários Fixados: R$ ${pericia.honorariosFixados || pericia.honorariosPropostos || 0}
- Justiça Gratuita: ${pericia.justicaGratuita ? 'Sim (AJG)' : 'Não'}

REQUISITOS:
1. Endereçamento ao MM. Juízo;
2. Comunicação formal do cumprimento do encargo com a juntada do laudo médico pericial em anexo;
3. Resposta aos quesitos judiciais e das partes de forma fundamentada;
4. Se houver honorários depositados em conta judicial, requerimento de expedição de Mandado de Levantamento Eletrônico (MLE) ou Alvará Judicial em favor do perito;
5. Fechamento formal.`;
    } else if (tipo === 'PETICAO_ACEITE_HONORARIOS') {
      prompt = `Elabore uma minuta formal de PETIÇÃO DE ACEITAÇÃO DO ENCARGO DE PERITO DO JUÍZO E ESTIMATIVA FUNDAMENTADA DE HONORÁRIOS PERICIAIS (Art. 465, § 2º, I do CPC).

DADOS:
- Processo nº: ${pericia.numeroProcesso}
- Vara: ${pericia.vara} (${pericia.tribunal})
- Autor(a): ${pericia.autor}
- Réu: ${pericia.reu}
- Objeto da Perícia: ${pericia.area}
- Valor Proposto de Honorários: R$ ${pericia.honorariosPropostos || 4500}
- Resumo do caso: ${pericia.observacoesClinicas || ''}

REQUISITOS:
1. Aceitação solene do honroso encargo pericial;
2. Apresentação de currículo resumido e comprovação de especialidade médica;
3. Proposta fundamentada de honorários periciais discriminando horas estimadas (estudo de autos, exame físico pericial, análise de exames complementares, elaboração do laudo e respostas aos quesitos);
4. Pedido de intimação da parte responsável pelo adiantamento legal de 50% dos honorários (Art. 465, § 4º do CPC) quando aplicável.`;
    } else if (tipo === 'ESTRUTURA_LAUDO') {
      prompt = `Elabore um modelo completo e estruturado de LAUDO PERICIAL MÉDICO-LEGAL pronto para edição e preenchimento pelo perito.

DADOS DO CASO:
- Processo: ${pericia.numeroProcesso}
- Vara: ${pericia.vara}
- Periciando(a): ${pericia.autor} | CPF: ${pericia.cpfAutor || 'xxx.xxx.xxx-xx'}
- Réu/Empregador/Hospital: ${pericia.reu}
- Especialidade: ${pericia.area}
- Resumo clínico / Queixas: ${pericia.observacoesClinicas || 'Avaliação médica pericial'}

ESTRUTURA OBRIGATÓRIA (Normas CFM e Art. 473 do CPC):
I. CABEÇALHO E IDENTIFICAÇÃO FORMAL
II. PREÂMBULO E OBJETO DA PERÍCIA
III. HISTÓRICO DA DOENÇA ATUAL (HDA) / ANAMNESE OCUPACIONAL E CLÍNICA
IV. ANTECEDENTES PESSOAIS E CIRÚRGICOS
V. EXAME FÍSICO GERAL E EXAME FÍSICO DIRIGIDO / ESPECIALIZADO (incluindo testes e manobras clínicas semiológicas pertinentes ao caso)
VI. ANÁLISE DE DOCUMENTOS MÉDICOS E EXAMES COMPLEMENTARES
VII. DISCUSSÃO MÉDICO-LEGAL (Análise científica, verificação de Nexo Causal e Concausalidade pelos Critérios de Penteado/França, Enquadramento de Incapacidade: Total/Parcial, Permanente/Temporária, CIF e tabela SUSEP/Danos Corporais)
VIII. CONCLUSÃO MÉDICO-LEGAL OBJETIVA
IX. RESPOSTA AOS QUESITOS (Modelo formatado para Quesitos do Juízo, do Autor e do Réu)
X. ENCERRAMENTO E ASSINATURA DO PERITO.`;
    } else if (tipo === 'ANALISAR_QUESITOS') {
      prompt = `Auxilie o médico perito na elaboração de respostas técnicas, científicas, imparciais e claras para os seguintes quesitos formulados nos autos do processo nº ${pericia.numeroProcesso} (${pericia.area}):

QUESITOS APRESENTADOS:
${quesitosTexto || pericia.observacoesClinicas || 'Analise a incapacidade laborativa e nexo causal'}

INSTRUÇÕES:
- Forneça respostas diretas, técnicas e objetivas, evitando respostas evasivas como "prejudicado" sem justificativa;
- Cite embasamento médico-legal e referências bibliográficas aceitas quando pertinente;
- Deixe campos claramente marcados entre colchetes [como este] para dados que dependem da conferência física dos exames do paciente.`;
    } else {
      prompt = `Com base nas informações da perícia médica a seguir, atue como assistente forense e responda: ${promptCustomizado || 'Como conduzir os prazos e procedimentos desta perícia?'}
Perícia: Processo ${pericia.numeroProcesso}, Área: ${pericia.area}, Autor: ${pericia.autor}, Réu: ${pericia.reu}, Status: ${pericia.status}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return NextResponse.json({
      texto: response.text || 'Nenhum texto gerado pelo modelo.',
    });
  } catch (error: unknown) {
    console.error('Erro na rota Gemini:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno ao processar requisição com Gemini';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
