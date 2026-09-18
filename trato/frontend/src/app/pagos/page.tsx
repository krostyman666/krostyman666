import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import ConciliarPagos from '@/components/ConciliarPagos';

export const metadata: Metadata = {
  title: 'Conciliar pagos | Trato',
};

export default function PagosPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Conciliar pagos</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Transferencias esperando que alguien las calce contra la cartola. Los que avisaron que
          pagaron van primero. Al conciliar, el informe entra en preparación.
        </p>

        <div className="mt-8">
          <ConciliarPagos />
        </div>
      </div>
    </main>
  );
}
