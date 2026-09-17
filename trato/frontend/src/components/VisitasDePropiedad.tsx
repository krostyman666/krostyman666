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
    <ul className="space-y-2">
      {visitas.map((v) => (
        <li key={v.id} className="rounded-xl border border-tinta/10 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-tinta first-letter:uppercase">
                {formatearDiaDeInstante(v.inicio)}
              </p>
              <p className="mt-0.5 text-sm tabular-nums text-tinta-tenue">
                {formatearRango(v.inicio, v.fin)}
              </p>
              {v.comprador && (
                <p className="mt-1.5 text-sm text-tinta-suave">
                  {v.comprador.nombre} {v.comprador.apellido}
                </p>
              )}
              {v.mensaje && (
                <p className="mt-2 rounded-lg bg-tinta/[0.03] px-3 py-2 text-sm text-tinta-suave">
                  {v.mensaje}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                COLOR_ESTADO[v.estado] ?? 'bg-tinta/5 text-tinta-suave'
              }`}
            >
              {ETIQUETA_ESTADO_VISITA[v.estado] ?? v.estado}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
