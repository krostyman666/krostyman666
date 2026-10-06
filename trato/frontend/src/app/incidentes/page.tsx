import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import GestionIncidentes from '@/components/GestionIncidentes';

export const metadata: Metadata = {
  title: 'Incidentes de seguridad | Trato',
};

export default function IncidentesPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">
          Incidentes de seguridad
        </h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Vulneraciones de seguridad declaradas, con el plazo de 72 horas hacia la Agencia de
          Protección de Datos Personales y, cuando corresponde, hacia los titulares afectados.
        </p>

        <div className="mt-8">
          <GestionIncidentes />
        </div>
      </div>
    </main>
  );
}
