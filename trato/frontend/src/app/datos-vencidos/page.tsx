import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import DatosVencidos from '@/components/DatosVencidos';

export const metadata: Metadata = {
  title: 'Datos vencidos | Trato',
};

export default function DatosVencidosPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">
          Datos vencidos
        </h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Lo que pasó su plazo de conservación, y el registro de cada purga ejecutada.
        </p>

        <div className="mt-8">
          <DatosVencidos />
        </div>
      </div>
    </main>
  );
}
