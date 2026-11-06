import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'PeríciaMed - Gestão de Perícias Médico-Legais',
  description: 'Software especializado para médicos peritos judiciais com cadastro de nomeações, controle rigoroso de prazos de agendamento e entrega de laudos, e notificações automáticas anti-atraso.',
  openGraph: {
    title: 'PeríciaMed - Gestão de Perícias Médico-Legais',
    description: 'Software especializado para médicos peritos judiciais com controle de prazos e laudos.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PeríciaMed - Gestão de Perícias Médico-Legais',
    description: 'Software especializado para médicos peritos judiciais com controle de prazos e laudos.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
