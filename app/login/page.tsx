'use client';
import { useState } from 'react';
export default function LoginPage() {
  const [password,setPassword]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  async function entrar(e:React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||'Não foi possível entrar.');
      window.location.assign('/');
    } catch(err) {setError(err instanceof Error?err.message:'Falha ao entrar.');} finally {setLoading(false);}
  }
  return <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4"><form onSubmit={entrar} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
    <h1 className="text-2xl font-bold text-slate-900">SerPerito</h1><p className="mt-2 mb-6 text-sm text-slate-600">Acesso restrito. Informe sua senha para continuar.</p>
    <label htmlFor="password" className="mb-2 block text-sm font-medium">Senha de acesso</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-teal-600"/>
    {error&&<p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading?'Entrando…':'Entrar'}</button>
  </form></main>;
}
