'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, Phone, Route, Users } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { formatearDia, formatearHora, formatearRango, type VisitaApi } from '@/lib/visitas';
import { useSesion } from '@/hooks/useSesion';

interface Agenda {
  dia: string;
  total: number;
  comunas: string[];
  saltosDeComuna: number;
  visitas: VisitaApi[];
}

interface Grupo {
  comuna: string;
  dia: string;
  visitas: VisitaApi[];
}

function hoyEnChile(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function direccion(v: VisitaApi): string {
  const p = v.propiedad;
  if (!p) return '—';
  const depto = p.depto ? ` depto ${p.depto}` : '';
  return `${p.calle} ${p.numero}${depto}`;
}

export default function AgendaAsesor() {
  const { usuario, estado } = useSesion();
  const [dia, setDia] = useState(hoyEnChile());
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);

  const cargar = useCallback(async (fecha: string) => {
    setError(null);
    try {
      const [respAgenda, respGrupos] = await Promise.all([
        api.get<Agenda>('/visitas/agenda', { params: { dia: fecha } }),
        api.get<{ grupos: Grupo[] }>('/visitas/por-asignar'),
      ]);
      setAgenda(respAgenda.data);
      setGrupos(respGrupos.data.grupos);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado') cargar(dia);
  }, [dia, cargar, estado]);

  async function tomar(visitaId: string) {
    if (!usuario) return;
    setAsignando(visitaId);
    try {
      await api.patch(`/visitas/${visitaId}/asesor`, { asesorId: usuario.id });
      await cargar(dia);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setAsignando(null);
    }
  }

  if (estado === 'cargando') {
    return <p className="text-sm text-tinta-tenue">Cargando tu agenda...</p>;
  }

  if (usuario && usuario.rol !== 'asesor' && usuario.rol !== 'admin') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Esta agenda es para los asesores que muestran las propiedades.
      </p>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Día</span>
        <input
          type="date"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="rounded-xl border border-tinta/15 bg-white px-3 py-2 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
        />
      </label>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {agenda && (
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold text-tinta first-letter:uppercase">
              {formatearDia(agenda.dia)}
            </h2>
            <p className="text-sm text-tinta-tenue">
              {agenda.total} {agenda.total === 1 ? 'visita' : 'visitas'}
              {agenda.comunas.length > 0 && ` · ${agenda.comunas.length} comuna(s)`}
            </p>
          </div>

          {agenda.total === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-tinta/20 px-4 py-8 text-center text-sm text-tinta-tenue">
              No tienes visitas ese día.
            </p>
          ) : (
            <>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-tinta-tenue">
                <Route className="h-3.5 w-3.5" />
                {agenda.saltosDeComuna === 0
                  ? 'Todo el día en la misma comuna: cero traslados entre zonas.'
                  : `${agenda.saltosDeComuna} ${
                      agenda.saltosDeComuna === 1 ? 'cambio' : 'cambios'
                    } de comuna en el día.`}
              </p>
              <ol className="mt-4 space-y-2">
                {agenda.visitas.map((v, i) => (
                  <li
                    key={v.id}
                    className="flex gap-4 rounded-xl border border-tinta/10 bg-white p-4"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-trato-50 text-xs font-bold tabular-nums text-trato-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold tabular-nums text-tinta">
                        {formatearHora(v.inicio)}
                        <span className="ml-2 text-sm font-normal text-tinta-tenue">
                          {formatearRango(v.inicio, v.fin)}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-suave">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-tinta-tenue" />
                        {direccion(v)}, {v.propiedad?.comuna}
                      </p>
                      {v.comprador && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-tenue">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {v.comprador.nombre} {v.comprador.apellido}
                          {v.comprador.telefono && ` · ${v.comprador.telefono}`}
                        </p>
                      )}
                      {v.mensaje && (
                        <p className="mt-2 rounded-lg bg-tinta/[0.03] px-3 py-2 text-sm text-tinta-suave">
                          {v.mensaje}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-tinta">Por asignar</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-tenue">
          <Users className="h-3.5 w-3.5" />
          Los grupos más grandes primero: son los que hacen rendir el viaje.
        </p>

        {grupos.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-tinta/20 px-4 py-8 text-center text-sm text-tinta-tenue">
            No hay visitas esperando asesor.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {grupos.map((g) => (
              <li
                key={`${g.dia}|${g.comuna}`}
                className="rounded-2xl border border-tinta/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-tinta">{g.comuna}</p>
                  <p className="text-sm text-tinta-tenue first-letter:uppercase">
                    {formatearDia(g.dia)} · {g.visitas.length}{' '}
                    {g.visitas.length === 1 ? 'visita' : 'visitas'}
                  </p>
                </div>
                <ul className="mt-3 space-y-2">
                  {g.visitas.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-tinta/[0.02] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular-nums text-tinta">
                          {formatearHora(v.inicio)}
                        </p>
                        <p className="text-sm text-tinta-tenue">{direccion(v)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => tomar(v.id)}
                        disabled={asignando === v.id}
                        className="rounded-lg bg-trato-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
                      >
                        {asignando === v.id ? 'Tomando...' : 'Tomarla'}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
