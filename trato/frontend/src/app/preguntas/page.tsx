import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import PreguntasPendientes from '@/components/PreguntasPendientes';

export const metadata: Metadata = {
  title: 'Preguntas del bot | Trato',
};

export default function PreguntasPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Preguntas del bot</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Lo que el bot derivó a una persona y lo que no supo contestar. Lo primero es una cola de
          trabajo; lo segundo, la hoja de ruta de lo que le falta.
        </p>

        <div className="mt-8">
          <PreguntasPendientes />
        </div>
      </div>
    </main>
  );
}
