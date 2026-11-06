'use client';

import { PericiaItem } from '@/types/pericia';

export interface StatusNuvem {
  conectado: boolean;
  carregando: boolean;
  mensagem: string;
  totalNuvem?: number;
}

// O navegador conversa somente com a API autenticada da própria aplicação.
// Credenciais da HostGator ficam exclusivamente no servidor Next.js.
async function requisicaoApi(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, credentials: 'same-origin' });
}

/**
 * Busca todas as perícias salvas no banco de dados da HostGator
 */
export async function buscarPericiasNuvem(): Promise<{
  conectado: boolean;
  pericias: PericiaItem[];
  mensagem?: string;
}> {
  try {
    const res = await requisicaoApi('/api/pericias', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { conectado: false, pericias: [], mensagem: 'Servidor indisponível' };
    }

    const data = await res.json();
    return {
      conectado: Boolean(data.conectado),
      pericias: Array.isArray(data.pericias) ? data.pericias : [],
      mensagem: data.mensagem
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na conexão';
    return { conectado: false, pericias: [], mensagem: msg };
  }
}

/**
 * Salva ou atualiza uma perícia no banco de dados MySQL
 */
export async function salvarPericiaNuvem(pericia: PericiaItem): Promise<{
  sucesso: boolean;
  conectado: boolean;
  mensagem?: string;
}> {
  try {
    const res = await requisicaoApi('/api/pericias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'salvar', pericia })
    });

    const data = await res.json();
    return {
      sucesso: Boolean(data.sucesso),
      conectado: Boolean(data.conectado),
      mensagem: data.mensagem || data.error
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro de rede';
    return { sucesso: false, conectado: false, mensagem: msg };
  }
}

/**
 * Exclui uma perícia do banco de dados MySQL
 */
export async function excluirPericiaNuvem(id: string): Promise<{
  sucesso: boolean;
  conectado: boolean;
}> {
  try {
    const res = await requisicaoApi('/api/pericias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'excluir', id })
    });

    const data = await res.json();
    return {
      sucesso: Boolean(data.sucesso),
      conectado: Boolean(data.conectado)
    };
  } catch {
    return { sucesso: false, conectado: false };
  }
}

/**
 * Envia todas as perícias locais para a nuvem de uma só vez (migração/sincronização)
 */
export async function sincronizarLoteNuvem(pericias: PericiaItem[]): Promise<{
  sucesso: boolean;
  conectado: boolean;
  totalSincronizado?: number;
  mensagem?: string;
}> {
  try {
    const res = await requisicaoApi('/api/pericias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'sync_batch', pericias })
    });

    const data = await res.json();
    return {
      sucesso: Boolean(data.sucesso),
      conectado: Boolean(data.conectado),
      totalSincronizado: data.totalSincronizado,
      mensagem: data.mensagem || data.error
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na sincronização';
    return { sucesso: false, conectado: false, mensagem: msg };
  }
}

/**
 * Testa a conexão com o banco MySQL e retorna diagnóstico
 */
export async function testarConexaoNuvem(): Promise<{
  conectado: boolean;
  mensagem: string;
  totalPericias?: number;
}> {
  try {
    const res = await requisicaoApi('/api/pericias?ping=1', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    const data = await res.json();
    return {
      conectado: Boolean(data.conectado),
      mensagem: data.mensagem || (data.conectado ? 'Conectado com sucesso' : 'Não conectado'),
      totalPericias: data.totalPericias
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Não foi possível contatar a API';
    return { conectado: false, mensagem: msg };
  }
}
