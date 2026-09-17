import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import AgendaAsesor from '@/components/AgendaAsesor';

export const metadata: Metadata = {
  title: 'Agenda del asesor | Trato',
};

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Tu agenda</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Las visitas del día en orden de recorrido, y las que están esperando asesor agrupadas
          por comuna.
        </p>

        <div className="mt-8">
          <AgendaAsesor />
        </div>
      </div>
    </main>
  );
}
