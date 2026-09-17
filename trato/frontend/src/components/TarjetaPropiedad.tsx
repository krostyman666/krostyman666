import Link from 'next/link';
import { Bath, BedDouble, Camera, Ruler } from 'lucide-react';
import {
  direccionCorta,
  formatearPrecio,
  formatearSuperficie,
  ETIQUETA_TIPO,
  type PropiedadApi,
} from '@/lib/propiedades';

export default function TarjetaPropiedad({ propiedad }: { propiedad: PropiedadApi }) {
  const portada = propiedad.fotos?.[0];

  return (
    <Link
      href={`/propiedades/${propiedad.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-tinta/10 bg-white shadow-carta transition hover:border-trato-200 hover:shadow-alta"
    >
      <div className="aspect-[16/10] overflow-hidden bg-tinta/5">
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portada}
            alt={propiedad.titulo}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Camera className="h-7 w-7 text-tinta-tenue/50" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-trato-700">
          {ETIQUETA_TIPO[propiedad.tipo] ?? propiedad.tipo}
        </p>
        <p className="mt-1.5 font-semibold leading-snug text-tinta">{propiedad.titulo}</p>
        <p className="mt-1 text-sm text-tinta-tenue">{direccionCorta(propiedad)}</p>

        <p className="mt-3 text-lg font-bold tracking-tight text-tinta">
          {formatearPrecio(propiedad.precio, propiedad.moneda)}
        </p>

        <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm text-tinta-suave">
          {propiedad.dormitorios !== null && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-tinta-tenue" strokeWidth={1.75} />
              <dt className="sr-only">Dormitorios</dt>
              <dd className="tabular-nums">{propiedad.dormitorios}</dd>
            </div>
          )}
          {propiedad.banos !== null && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-tinta-tenue" strokeWidth={1.75} />
              <dt className="sr-only">Baños</dt>
              <dd className="tabular-nums">{propiedad.banos}</dd>
            </div>
          )}
          {formatearSuperficie(propiedad.superficieConstruida) && (
            <div className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-tinta-tenue" strokeWidth={1.75} />
              <dt className="sr-only">Superficie construida</dt>
              <dd className="tabular-nums">
                {formatearSuperficie(propiedad.superficieConstruida)}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </Link>
  );
}
