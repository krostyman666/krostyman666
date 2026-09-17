'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { direccionCorta, formatearPrecio, type PropiedadApi } from '@/lib/propiedades';

interface ConDocumentos extends PropiedadApi {
  documentos?: { estado: string }[];
}

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicada: 'Publicada',
  reservada: 'Reservada',
  vendida: 'Vendida',
  retirada: 'Retirada',
};

export default function MisPropiedades() {
  const [propiedades, setPropiedades] = useState<ConDocumentos[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ propiedades: ConDocumentos[] }>('/propiedades/mias')
      .then(({ data }) => setPropiedades(data.propiedades))
      .catch((e) => setError(mensajeDeError(e)));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!propiedades) return <p className="text-sm text-tinta-tenue">Cargando tus propiedades...</p>;

  if (propiedades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-tinta/20 p-8 text-center">
        <p className="text-tinta-suave">Todavía no publicas ninguna propiedad.</p>
        <Link
          href="/propiedades/nueva"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-trato-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700"
        >
          <Plus className="h-4 w-4" />
          Publicar la primera
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {propiedades.map((p) => {
        const docs = p.documentos ?? [];
        const listos = docs.filter((d) => d.estado === 'recibido').length;
        return (
          <li key={p.id} className="rounded-xl border border-tinta/10 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-tinta">{p.titulo}</p>
                <p className="mt-1 text-sm text-tinta-tenue">{direccionCorta(p)}</p>
                <p className="mt-2 text-sm font-semibold text-tinta">
                  {formatearPrecio(p.precio, p.moneda)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-tinta/5 px-2.5 py-1 text-xs font-medium text-tinta-suave">
                  {ETIQUETA_ESTADO[p.estado] ?? p.estado}
                </span>
                <span className="text-xs tabular-nums text-tinta-tenue">
                  {listos}/{docs.length} trámites
                </span>
                <div className="flex gap-3">
                  <Link
                    href={`/propiedades/${p.id}/visitas`}
                    className="text-sm font-medium text-trato-600 hover:text-trato-700"
                  >
                    Visitas
                  </Link>
                  <Link
                    href={`/propiedades/${p.id}/documentos`}
                    className="text-sm font-medium text-trato-600 hover:text-trato-700"
                  >
                    Ver trámites
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
