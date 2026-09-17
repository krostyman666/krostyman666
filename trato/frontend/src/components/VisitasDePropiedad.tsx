'use client';

import { useEffect, useState } from 'react';
import { api, mensajeDeError } from '@/lib/api';
import {
  ETIQUETA_ESTADO_VISITA,
  formatearDiaDeInstante,
  formatearRango,
  type VisitaApi,
} from '@/lib/visitas';

const COLOR_ESTADO: Record<string, string> = {
  solicitada: 'bg-trato-50 text-trato-700',
  confirmada: 'bg-cierre-50 text-cierre-700',
  realizada: 'bg-tinta/5 text-tinta-suave',
  cancelada: 'bg-red-50 text-red-700',
  no_asistio: 'bg-amber-50 text-amber-700',
};

interface Bloque {
  inicio: string;
  fin: string;
  visitas: VisitaApi[];
}

/**
 * En open house varias visitas comparten la hora, así que se muestran como un
 * bloque: repetir la fecha y la hora en cada tarjeta era ilegible en cuanto el
 * vendedor recibía cuatro personas por cupo.
 */
function agrupar(visitas: VisitaApi[]): Bloque[] {
  const bloques = new Map<string, Bloque>();
  for (const visita of visitas) {
    const bloque = bloques.get(visita.inicio) ?? {
      inicio: visita.inicio,
      fin: visita.fin,
      visitas: [],
    };
    bloque.visitas.push(visita);
    bloques.set(visita.inicio, bloque);
  }
  return [...bloques.values()].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export default function VisitasDePropiedad({ propiedadId }: { propiedadId: string }) {
  const [visitas, setVisitas] = useState<VisitaApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ visitas: VisitaApi[] }>(`/propiedades/${propiedadId}/visitas`)
      .then(({ data }) => setVisitas(data.visitas))
      .catch((e) => setError(mensajeDeError(e)));
  }, [propiedadId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!visitas) return <p className="text-sm text-tinta-tenue">Cargando visitas...</p>;

  if (visitas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-tinta/20 px-4 py-6 text-center text-sm text-tinta-tenue">
        Todavía nadie agendó una visita.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {agrupar(visitas).map((bloque) => (
        <li key={bloque.inicio} className="rounded-xl border border-tinta/10 bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-medium text-tinta first-letter:uppercase">
              {formatearDiaDeInstante(bloque.inicio)}
              <span className="ml-2 text-sm font-normal tabular-nums text-tinta-tenue">
                {formatearRango(bloque.inicio, bloque.fin)}
              </span>
            </p>
            {bloque.visitas.length > 1 && (
              <span className="text-sm text-tinta-tenue">
                {bloque.visitas.length} personas
              </span>
            )}
          </div>

          <ul className="mt-3 space-y-2">
            {bloque.visitas.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-tinta/[0.02] px-3 py-2.5"
              >
                <div className="min-w-0">
                  {v.comprador && (
                    <p className="text-sm font-medium text-tinta">
                      {v.comprador.nombre} {v.comprador.apellido}
                    </p>
                  )}
                  {v.mensaje && (
                    <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{v.mensaje}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    COLOR_ESTADO[v.estado] ?? 'bg-tinta/5 text-tinta-suave'
                  }`}
                >
                  {ETIQUETA_ESTADO_VISITA[v.estado] ?? v.estado}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
