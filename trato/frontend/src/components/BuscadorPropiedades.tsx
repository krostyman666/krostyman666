'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { TIPOS_PROPIEDAD, type PropiedadApi } from '@/lib/propiedades';
import TarjetaPropiedad from './TarjetaPropiedad';

interface Respuesta {
  propiedades: PropiedadApi[];
  total: number;
  pagina: number;
  porPagina: number;
}

interface Filtros {
  comuna: string;
  tipo: string;
  moneda: 'uf' | 'clp';
  precioMin: string;
  precioMax: string;
  dormitoriosMin: string;
}

const FILTROS_VACIOS: Filtros = {
  comuna: '',
  tipo: '',
  moneda: 'uf',
  precioMin: '',
  precioMax: '',
  dormitoriosMin: '',
};

const claseCampo =
  'w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

export default function BuscadorPropiedades() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(
    async (f: Filtros, p: number) => {
      setCargando(true);
      setError(null);

      const params: Record<string, string | number> = { pagina: p };
      if (f.comuna.trim()) params.comuna = f.comuna.trim();
      if (f.tipo) params.tipo = f.tipo;
      if (f.dormitoriosMin) params.dormitoriosMin = f.dormitoriosMin;
      if (f.precioMin || f.precioMax) {
        params.moneda = f.moneda;
        if (f.precioMin) params.precioMin = f.precioMin;
        if (f.precioMax) params.precioMax = f.precioMax;
      }

      try {
        const { data } = await api.get<Respuesta>('/propiedades', { params });
        setDatos(data);
      } catch (e) {
        setError(mensajeDeError(e));
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    buscar(filtros, pagina);
    // Los filtros se aplican al enviar el formulario, no en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscar]);

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (pagina === 1) buscar(filtros, 1);
    else setPagina(1);
  };

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;

  return (
    <div>
      <form
        onSubmit={aplicar}
        className="rounded-2xl border border-tinta/10 bg-white p-4 shadow-carta sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Comuna</span>
            <input
              value={filtros.comuna}
              onChange={(e) => setFiltros({ ...filtros, comuna: e.target.value })}
              placeholder="Ñuñoa"
              className={claseCampo}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Tipo</span>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className={claseCampo}
            >
              <option value="">Cualquiera</option>
              {TIPOS_PROPIEDAD.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
              Dormitorios (mínimo)
            </span>
            <select
              value={filtros.dormitoriosMin}
              onChange={(e) => setFiltros({ ...filtros, dormitoriosMin: e.target.value })}
              className={claseCampo}
            >
              <option value="">Cualquiera</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Moneda</span>
            <select
              value={filtros.moneda}
              onChange={(e) =>
                setFiltros({ ...filtros, moneda: e.target.value as 'uf' | 'clp' })
              }
              className={claseCampo}
            >
              <option value="uf">UF</option>
              <option value="clp">Pesos</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Desde</span>
            <input
              type="number"
              min={0}
              value={filtros.precioMin}
              onChange={(e) => setFiltros({ ...filtros, precioMin: e.target.value })}
              placeholder={filtros.moneda === 'uf' ? '3.000' : '100.000.000'}
              className={claseCampo}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Hasta</span>
            <input
              type="number"
              min={0}
              value={filtros.precioMax}
              onChange={(e) => setFiltros({ ...filtros, precioMax: e.target.value })}
              placeholder={filtros.moneda === 'uf' ? '9.000' : '350.000.000'}
              className={claseCampo}
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-trato-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltros(FILTROS_VACIOS);
                if (pagina === 1) buscar(FILTROS_VACIOS, 1);
                else setPagina(1);
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
            >
              Limpiar
            </button>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-tinta-tenue">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          El rango de precio se aplica sobre la moneda elegida.
        </p>
      </form>

      <div className="mt-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {cargando && !error && <p className="text-sm text-tinta-tenue">Buscando propiedades...</p>}

        {!cargando && !error && datos && datos.propiedades.length === 0 && (
          <div className="rounded-2xl border border-dashed border-tinta/20 p-10 text-center">
            <p className="font-medium text-tinta">No hay publicaciones con esos filtros.</p>
            <p className="mt-1.5 text-sm text-tinta-tenue">
              Prueba con otra comuna o amplía el rango de precio.
            </p>
          </div>
        )}

        {!cargando && !error && datos && datos.propiedades.length > 0 && (
          <>
            <p className="mb-4 text-sm text-tinta-tenue">
              <span className="font-semibold text-tinta">{datos.total}</span>{' '}
              {datos.total === 1 ? 'propiedad' : 'propiedades'}
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {datos.propiedades.map((p) => (
                <TarjetaPropiedad key={p.id} propiedad={p} />
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm tabular-nums text-tinta-tenue">
                  {pagina} de {totalPaginas}
                </span>
                <button
                  type="button"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
