'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, Check, Wallet } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';
import { formatearPesos } from '@/lib/informes';

interface PagoPorConciliar {
  id: string;
  monto: number;
  medio: string;
  referencia: string;
  reportadoEn: string | null;
  createdAt: string;
  comprador?: { nombre: string; apellido: string; email: string };
  informe?: { id: string; propiedad?: { titulo: string; comuna: string } };
}

const fecha = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function ConciliarPagos() {
  const { usuario, estado } = useSesion();
  const [pagos, setPagos] = useState<PagoPorConciliar[] | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get<{ pagos: PagoPorConciliar[] }>('/pagos/por-conciliar');
      setPagos(data.pagos);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado') cargar();
  }, [estado, cargar]);

  async function actuar(pagoId: string, accion: 'conciliar' | 'anular') {
    setTrabajando(pagoId);
    setError(null);
    try {
      if (accion === 'conciliar') {
        await api.patch(`/pagos/${pagoId}/conciliar`, {});
      } else {
        await api.patch(`/pagos/${pagoId}/anular`, {
          motivo: 'Anulado desde la bandeja de conciliación.',
        });
      }
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (usuario && usuario.rol !== 'admin') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        La conciliación de pagos es interna.
      </p>
    );
  }

  if (error && !pagos) return <p className="text-sm text-red-600">{error}</p>;
  if (!pagos) return <p className="text-sm text-tinta-tenue">Cargando pagos...</p>;

  if (pagos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-tinta/20 px-4 py-8 text-center text-sm text-tinta-tenue">
        No hay pagos esperando revisión.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {pagos.map((p) => (
          <li key={p.id} className="rounded-2xl border border-tinta/10 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-base font-bold tracking-wide text-tinta">
                    {p.referencia}
                  </code>
                  {p.reportadoEn && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-trato-50 px-2.5 py-0.5 text-xs font-medium text-trato-700">
                      <BellRing className="h-3 w-3" />
                      Avisó que pagó
                    </span>
                  )}
                </div>

                {p.comprador && (
                  <p className="mt-1.5 text-sm text-tinta-suave">
                    {p.comprador.nombre} {p.comprador.apellido} · {p.comprador.email}
                  </p>
                )}
                {p.informe?.propiedad && (
                  <p className="mt-0.5 text-sm text-tinta-tenue">
                    {p.informe.propiedad.titulo} · {p.informe.propiedad.comuna}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-tinta-tenue">
                  Pedido el {fecha.format(new Date(p.createdAt))}
                  {p.reportadoEn && ` · avisó el ${fecha.format(new Date(p.reportadoEn))}`}
                </p>
              </div>

              <div className="text-right">
                <p className="flex items-center gap-1.5 font-semibold tabular-nums text-tinta">
                  <Wallet className="h-4 w-4 text-tinta-tenue" />
                  {formatearPesos(p.monto)}
                </p>
                <p className="mt-0.5 text-xs text-tinta-tenue">{p.medio}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => actuar(p.id, 'conciliar')}
                disabled={trabajando !== null}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cierre-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cierre-700 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {trabajando === p.id ? 'Guardando...' : 'Está en la cartola'}
              </button>
              <button
                type="button"
                onClick={() => actuar(p.id, 'anular')}
                disabled={trabajando !== null}
                className="rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-60"
              >
                Anular
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
