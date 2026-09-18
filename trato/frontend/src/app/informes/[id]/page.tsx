import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import VistaInforme from '@/components/VistaInforme';

export const metadata: Metadata = {
  title: 'Informe del inmueble | Trato',
};

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <VistaInforme informeId={id} />
      </div>
    </main>
  );
}
