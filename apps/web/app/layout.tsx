import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Life — MMORPG Idle',
  description: 'Um MMORPG idle de navegador com 3 profissões: Policial, Ladrão e Médico.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
