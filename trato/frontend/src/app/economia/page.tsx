import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import ModeloEconomico from '@/components/ModeloEconomico';

export const metadata: Metadata = {
  title: 'Modelo económico | Trato',
};

export default function EconomiaPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Modelo económico</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Qué deja una venta cerrada con el equipo en sueldo fijo. Todo se calcula por venta y no
          por publicación: las que no cierran igual consumieron visitas y sueldo.
        </p>

        <div className="mt-8">
          <ModeloEconomico />
        </div>
      </div>
    </main>
  );
}
