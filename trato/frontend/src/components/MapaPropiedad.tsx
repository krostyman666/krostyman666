import { MapPin } from 'lucide-react';

interface Props {
  latitud: number | null;
  longitud: number | null;
  comuna: string;
  /**
   * La dirección exacta se muestra recién cuando hay visita confirmada. Antes
   * de eso el mapa marca el sector: si el punto exacto va en la página pública,
   * cualquiera puede llegar al vendedor por fuera y la plataforma no cumple su
   * parte de la operación.
   */
  exacta?: boolean;
}

export default function MapaPropiedad({ latitud, longitud, comuna, exacta = false }: Props) {
  if (latitud === null || longitud === null) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-tinta/20 p-6">
        <MapPin className="h-5 w-5 shrink-0 text-tinta-tenue" />
        <p className="text-sm text-tinta-tenue">
          Esta publicación todavía no tiene ubicación en el mapa. Está en {comuna}.
        </p>
      </div>
    );
  }

  const margen = exacta ? 0.003 : 0.008;
  const bbox = [
    longitud - margen,
    latitud - margen,
    longitud + margen,
    latitud + margen,
  ].join(',');

  const marcador = exacta ? `&marker=${latitud},${longitud}` : '';
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marcador}`;

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-tinta/10">
        <iframe
          src={src}
          title={`Ubicación de la propiedad en ${comuna}`}
          loading="lazy"
          className="h-full w-full border-0"
        />
        {!exacta && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="aspect-square h-[45%] rounded-full border-2 border-trato-600 bg-trato-500/20" />
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-tinta-tenue">
        {exacta
          ? 'Ubicación exacta de la propiedad.'
          : 'Sector aproximado. La dirección exacta te llega cuando confirmamos la visita.'}
      </p>
    </div>
  );
}
