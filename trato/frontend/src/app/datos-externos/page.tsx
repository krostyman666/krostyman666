import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import DatosExternosPendientes from '@/components/DatosExternosPendientes';

export const metadata: Metadata = {
  title: 'Avalúo fiscal y contribuciones | Trato',
};

export default function DatosExternosPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">
          Avalúo fiscal y contribuciones
        </h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Propiedades con rol de avalúo pero sin dato fresco. El flujo automático (n8n) las va
          llenando solo; si el portal del SII o de Tesorería lo bloqueó, llénalas a mano acá.
        </p>

        <div className="mt-8">
          <DatosExternosPendientes />
        </div>
      </div>
    </main>
  );
}
