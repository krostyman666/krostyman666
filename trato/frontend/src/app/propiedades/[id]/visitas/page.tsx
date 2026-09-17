import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import DisponibilidadPropiedad from '@/components/DisponibilidadPropiedad';
import VisitasDePropiedad from '@/components/VisitasDePropiedad';

export const metadata: Metadata = {
  title: 'Visitas de la propiedad | Trato',
};

export default async function VisitasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Visitas</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Define cuándo se puede mostrar tu propiedad y revisa quién viene.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-tinta">Cuándo se puede visitar</h2>
          <div className="mt-3">
            <DisponibilidadPropiedad propiedadId={id} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-tinta">Visitas agendadas</h2>
          <div className="mt-3">
            <VisitasDePropiedad propiedadId={id} />
          </div>
        </section>
      </div>
    </main>
  );
}
