import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import InformeDocumentos from '@/components/InformeDocumentos';

export const metadata: Metadata = {
  title: 'Trámites de la propiedad | Trato',
};

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Trámites de tu propiedad</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Todos los papeles que necesita esta compraventa, en el orden en que se piden. Los que dicen
          Trato los gestionamos nosotros.
        </p>

        <div className="mt-8">
          <InformeDocumentos propiedadId={id} />
        </div>
      </div>
    </main>
  );
}
