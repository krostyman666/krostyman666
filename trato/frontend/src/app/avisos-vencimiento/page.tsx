import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import AvisosVencimiento from '@/components/AvisosVencimiento';

export const metadata: Metadata = {
  title: 'Avisos de vencimiento | Trato',
};

export default function AvisosVencimientoPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">
          Avisos de vencimiento
        </h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Certificados del expediente que están por vencer o ya vencieron, y el correo que se le
          manda al vendedor.
        </p>

        <div className="mt-8">
          <AvisosVencimiento />
        </div>
      </div>
    </main>
  );
}
