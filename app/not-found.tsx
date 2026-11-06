import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-xl">
        <h2 className="text-3xl font-bold text-amber-400 mb-2">404</h2>
        <h3 className="text-xl font-semibold mb-4">Página Não Encontrada</h3>
        <p className="text-sm text-slate-300 mb-6">
          A rota solicitada não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Voltar ao Painel de Perícias
        </Link>
      </div>
    </div>
  );
}
