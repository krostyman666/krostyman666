import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import NegociarPromesa from '@/components/NegociarPromesa';

export const metadata: Metadata = {
  title: 'Promesa de compraventa | Trato',
};

export default async function PromesaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <NegociarPromesa promesaId={id} />
      </div>
    </main>
  );
}
