import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import MisDatos from '@/components/MisDatos';

export const metadata: Metadata = {
  title: 'Mis datos | Trato',
  description:
    'Qué datos tuyos guarda Trato, para qué, por cuánto tiempo, y cómo corregirlos, llevártelos o borrarlos.',
};

export default function MisDatosPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Mis datos</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Lo que guardamos tuyo, para qué lo usamos y por cuánto tiempo. Puedes corregirlo,
          llevártelo o pedir que lo borremos.
        </p>

        <div className="mt-10">
          <MisDatos />
        </div>
      </div>
    </main>
  );
}
