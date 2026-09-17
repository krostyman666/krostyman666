import Link from 'next/link';
import type { Metadata } from 'next';
import PanelUsuario from '@/components/PanelUsuario';

export const metadata: Metadata = {
  title: 'Mi panel | Trato',
};

export default function PanelPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <header className="border-b border-tinta/5 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
            Trato<span className="text-trato-600">.</span>
          </Link>
        </div>
      </header>

      <PanelUsuario />
    </main>
  );
}
