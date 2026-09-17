import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import BandejaNotaria from '@/components/BandejaNotaria';

export const metadata: Metadata = {
  title: 'Bandeja de la notaría | Trato',
};

export default function NotariaPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Expedientes por revisar</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Los documentos llegan revisados y completos. Apruebas u observas, y el vendedor ve la
          respuesta al instante.
        </p>

        <div className="mt-8">
          <BandejaNotaria />
        </div>
      </div>
    </main>
  );
}
