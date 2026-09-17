import type { Metadata } from 'next';
import Link from 'next/link';
import BuscadorPropiedades from '@/components/BuscadorPropiedades';

export const metadata: Metadata = {
  title: 'Propiedades en venta de trato directo | Trato',
  description:
    'Casas y departamentos que se venden sin corredor. Agenda la visita y recibe el informe legal de la propiedad antes de ofertar.',
};

export default function PropiedadesPage() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-tinta/5 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
            Trato<span className="text-trato-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/ingresar"
              className="hidden text-sm font-medium text-tinta-suave hover:text-tinta sm:block"
            >
              Ingresar
            </Link>
            <Link
              href="/registro?tipo=vendedor"
              className="rounded-lg bg-tinta px-4 py-2 text-sm font-semibold text-white transition hover:bg-tinta-suave"
            >
              Publicar propiedad
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-tinta sm:text-4xl">
          Propiedades de trato directo
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-tinta-suave">
          Todas se venden sin corredor. Agendas la visita acá mismo y, antes de ofertar, puedes
          pedir el informe con los antecedentes legales del inmueble.
        </p>

        <div className="mt-8">
          <BuscadorPropiedades />
        </div>
      </main>
    </>
  );
}
