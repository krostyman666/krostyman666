import type { Metadata } from 'next';
import Cabecera from '@/components/Cabecera';
import FormularioPropiedad from '@/components/FormularioPropiedad';

export const metadata: Metadata = {
  title: 'Publicar propiedad | Trato',
};

export default function NuevaPropiedadPage() {
  return (
    <main className="min-h-screen bg-tinta/[0.02]">
      <Cabecera volverA="/panel" volverTexto="Volver al panel" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Publica tu propiedad</h1>
        <p className="mt-2 max-w-xl text-tinta-suave">
          Con estos datos armamos tu lista de trámites: qué certificado hay que pedir, a quién y en
          qué orden.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-carta ring-1 ring-tinta/5 sm:p-8">
          <FormularioPropiedad />
        </div>
      </div>
    </main>
  );
}
