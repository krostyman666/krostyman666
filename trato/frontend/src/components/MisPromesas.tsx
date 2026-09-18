'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, mensajeDeError } from '@/lib/api';
import {
  COLOR_ESTADO_PROMESA,
  ETIQUETA_ESTADO_PROMESA,
  formatearMonto,
  type PromesaApi,
} from '@/lib/promesas';

export default function MisPromesas({ usuarioId }: { usuarioId: string }) {
  const [promesas, setPromesas] = useState<PromesaApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ promesas: PromesaApi[] }>('/promesas/mias')
      .then(({ data }) => setPromesas(data.promesas))
      .catch((e) => setError(mensajeDeError(e)));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!promesas) return <p className="text-sm text-tinta-tenue">Cargando promesas...</p>;
  if (promesas.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-tinta">Promesas de compraventa</h2>
      <ul className="mt-4 space-y-3">
        {promesas.map((p) => {
          const soyComprador = p.compradorId === usuarioId;
          const otra = soyComprador ? p.vendedor : p.comprador;
          return (
            <li key={p.id} className="rounded-xl border border-tinta/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-tinta">{p.propiedad?.titulo}</p>
                  <p className="mt-1 text-sm text-tinta-tenue">
                    {soyComprador ? 'Compras' : 'Vendes'} por{' '}
                    {formatearMonto(p.precio, p.moneda)}
                    {otra && ` · con ${otra.nombre} ${otra.apellido}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${COLOR_ESTADO_PROMESA[p.estado]}`}
                  >
                    {ETIQUETA_ESTADO_PROMESA[p.estado]}
                  </span>
                  <Link
                    href={`/promesas/${p.id}`}
                    className="text-sm font-medium text-trato-600 hover:text-trato-700"
                  >
                    {p.estado === 'negociando' ? 'Negociar' : 'Ver'}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
