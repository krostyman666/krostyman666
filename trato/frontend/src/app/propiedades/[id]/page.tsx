import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  FileSearch,
  Landmark,
  Maximize,
  PenLine,
  Package,
  Ruler,
  ShieldCheck,
} from 'lucide-react';
import GaleriaFotos from '@/components/GaleriaFotos';
import MapaPropiedad from '@/components/MapaPropiedad';
import AbrirPromesa from '@/components/AbrirPromesa';
import OfertaInforme from '@/components/OfertaInforme';
import SolicitarVisita from '@/components/SolicitarVisita';
import {
  ETIQUETA_TIPO,
  formatearPrecio,
  formatearSuperficie,
  type PropiedadDetalle,
} from '@/lib/propiedades';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function obtenerPropiedad(id: string): Promise<PropiedadDetalle | null> {
  try {
    const res = await fetch(`${API}/api/v1/propiedades/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const { propiedad } = (await res.json()) as { propiedad: PropiedadDetalle };
    return propiedad;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const propiedad = await obtenerPropiedad(id);
  if (!propiedad) return { title: 'Propiedad no encontrada | Trato' };

  const tipo = ETIQUETA_TIPO[propiedad.tipo] ?? propiedad.tipo;
  return {
    title: `${propiedad.titulo} — ${propiedad.comuna} | Trato`,
    description:
      propiedad.descripcion?.slice(0, 160) ??
      `${tipo} en ${propiedad.comuna} por ${formatearPrecio(propiedad.precio, propiedad.moneda)}, de trato directo y sin corredor.`,
  };
}

const PASOS_COMPRA = [
  {
    icon: Calendar,
    titulo: 'Visitas con un asesor nuestro',
    detalle:
      'Agendas acá arriba. El asesor tiene sueldo fijo y agrupamos las visitas por comuna, así que mostrar no te cuesta nada.',
  },
  {
    icon: FileSearch,
    titulo: 'Pides el informe del inmueble',
    detalle:
      'Antes de ofertar: avalúo fiscal, inscripción de dominio, hipotecas, gravámenes y prohibiciones de esta propiedad, en un solo documento.',
  },
  {
    icon: PenLine,
    titulo: 'Promesa y compraventa',
    detalle:
      'Redactamos la promesa con las cláusulas que acuerden las partes. Ambos revisan y comentan antes de firmar.',
  },
  {
    icon: Landmark,
    titulo: 'Escritura e inscripción',
    detalle:
      'La escritura pública va ante notario, como manda la ley. Nosotros la coordinamos y seguimos la inscripción en el Conservador.',
  },
];

export default async function PropiedadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const propiedad = await obtenerPropiedad(id);
  if (!propiedad) notFound();

  const tipo = ETIQUETA_TIPO[propiedad.tipo] ?? propiedad.tipo;

  const fichas = [
    { icon: BedDouble, etiqueta: 'Dormitorios', valor: propiedad.dormitorios },
    { icon: Bath, etiqueta: 'Baños', valor: propiedad.banos },
    {
      icon: Ruler,
      etiqueta: 'Construidos',
      valor: formatearSuperficie(propiedad.superficieConstruida),
    },
    { icon: Maximize, etiqueta: 'Terreno', valor: formatearSuperficie(propiedad.superficieTotal) },
    { icon: Car, etiqueta: 'Estacionamientos', valor: propiedad.estacionamientos || null },
    { icon: Package, etiqueta: 'Bodegas', valor: propiedad.bodegas || null },
    { icon: Building2, etiqueta: 'Año', valor: propiedad.anoConstruccion },
  ].filter((f) => f.valor !== null && f.valor !== undefined);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-tinta/5 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
            Trato<span className="text-trato-600">.</span>
          </Link>
          <Link
            href="/propiedades"
            className="text-sm font-medium text-tinta-suave hover:text-tinta"
          >
            Ver todas
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <GaleriaFotos fotos={propiedad.fotos ?? []} titulo={propiedad.titulo} />

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-trato-50 px-3 py-1 text-xs font-semibold text-trato-700 ring-1 ring-trato-200">
                  {tipo}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cierre-50 px-3 py-1 text-xs font-semibold text-cierre-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Sin corredor
                </span>
                {propiedad.estado === 'reservada' && (
                  <span className="rounded-full bg-tinta/5 px-3 py-1 text-xs font-semibold text-tinta-suave">
                    Reservada
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-tinta sm:text-4xl">
                {propiedad.titulo}
              </h1>
              <p className="mt-2 text-lg text-tinta-suave">
                {propiedad.comuna}, {propiedad.region}
              </p>
              <p className="mt-5 text-3xl font-bold tracking-tight text-tinta">
                {formatearPrecio(propiedad.precio, propiedad.moneda)}
              </p>
            </div>

            {fichas.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-tinta/10 py-7 sm:grid-cols-4">
                {fichas.map(({ icon: Icon, etiqueta, valor }) => (
                  <div key={etiqueta}>
                    <Icon className="h-5 w-5 text-trato-600" strokeWidth={1.75} />
                    <dt className="mt-2 text-xs text-tinta-tenue">{etiqueta}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-tinta">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}

            {propiedad.descripcion && (
              <section className="mt-8">
                <h2 className="text-xl font-bold tracking-tight text-tinta">La propiedad</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-tinta-suave">
                  {propiedad.descripcion}
                </p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl font-bold tracking-tight text-tinta">Dónde está</h2>
              <div className="mt-4">
                <MapaPropiedad
                  latitud={propiedad.latitud}
                  longitud={propiedad.longitud}
                  comuna={propiedad.comuna}
                />
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-bold tracking-tight text-tinta">
                Cómo sigue si te interesa
              </h2>
              <ol className="mt-5 space-y-5">
                {PASOS_COMPRA.map(({ icon: Icon, titulo, detalle }, i) => (
                  <li key={titulo} className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-trato-50 ring-1 ring-trato-100">
                      <Icon className="h-4.5 w-4.5 text-trato-600" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-tinta">
                        <span className="mr-2 text-sm tabular-nums text-trato-600">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {titulo}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">{detalle}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 rounded-xl bg-tinta/[0.03] px-4 py-3 text-xs leading-relaxed text-tinta-tenue">
                Los antecedentes legales del inmueble se entregan en el informe, no en esta
                página: son datos del vendedor y del Conservador que verificamos antes de
                publicarlos.
              </p>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <SolicitarVisita propiedadId={propiedad.id} comuna={propiedad.comuna} />
            <OfertaInforme propiedadId={propiedad.id} />
            <AbrirPromesa
              propiedadId={propiedad.id}
              precio={propiedad.precio}
              moneda={propiedad.moneda}
            />
          </aside>
        </div>
      </main>

      <footer className="mt-16 border-t border-tinta/10 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs leading-relaxed text-tinta-tenue">
            Publicación de trato directo gestionada por Trato. Los valores y superficies los
            declara el vendedor y se verifican contra los antecedentes del inmueble antes de la
            promesa. Esta página no constituye asesoría legal ni tributaria.
          </p>
        </div>
      </footer>
    </>
  );
}
