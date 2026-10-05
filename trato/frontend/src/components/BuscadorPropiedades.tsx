'use client';

import { useCallback, useEffect, useState } from 'react';
import { List, MapIcon, Search, SlidersHorizontal } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { TIPOS_PROPIEDAD, type PropiedadApi } from '@/lib/propiedades';
import TarjetaPropiedad from './TarjetaPropiedad';
import MapaResultados, { type BoundsMapa } from './MapaResultados';

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
  superficieMin: string;
  estacionamientosMin: string;
  conBodega: boolean;
  ordenar: 'recientes' | 'precio_asc' | 'precio_desc';
}

const FILTROS_VACIOS: Filtros = {
  comuna: '',
  tipo: '',
  moneda: 'uf',
  precioMin: '',
  precioMax: '',
  dormitoriosMin: '',
  superficieMin: '',
  estacionamientosMin: '',
  conBodega: false,
  ordenar: 'recientes',
};

const claseCampo =
  'w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

export default function BuscadorPropiedades() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destacada, setDestacada] = useState<string | null>(null);
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'mapa'>('lista');
  const [zonaDelMapa, setZonaDelMapa] = useState<BoundsMapa | null>(null);
  // La zona que de verdad está filtrando los resultados (distinta de
  // `zonaDelMapa`, que es la zona pendiente mientras no se apriete el botón).
  // Sin guardarla, pasar de página perdía el filtro y volvía a traer todo Chile.
  const [bboxActivo, setBboxActivo] = useState<BoundsMapa | null>(null);

  const buscar = useCallback(async (f: Filtros, p: number, bbox?: BoundsMapa | null) => {
    setCargando(true);
    setError(null);

    const params: Record<string, string | number> = { pagina: p };
    if (f.comuna.trim()) params.comuna = f.comuna.trim();
    if (f.tipo) params.tipo = f.tipo;
    if (f.dormitoriosMin) params.dormitoriosMin = f.dormitoriosMin;
    if (f.superficieMin) params.superficieMin = f.superficieMin;
    if (f.estacionamientosMin) params.estacionamientosMin = f.estacionamientosMin;
    if (f.conBodega) params.conBodega = 'true';
    if (f.ordenar !== 'recientes') params.ordenar = f.ordenar;
    if (f.precioMin || f.precioMax) {
      params.moneda = f.moneda;
      if (f.precioMin) params.precioMin = f.precioMin;
      if (f.precioMax) params.precioMax = f.precioMax;
    }
    if (bbox) {
      params.bboxNorte = bbox.norte;
      params.bboxSur = bbox.sur;
      params.bboxEste = bbox.este;
      params.bboxOeste = bbox.oeste;
    }

    try {
      const { data } = await api.get<Respuesta>('/propiedades', { params });
      setDatos(data);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    buscar(filtros, pagina, bboxActivo);
    // Los filtros se aplican al enviar el formulario, no en cada tecla; el
    // bbox activo cambia sólo al apretar "Buscar en esta zona" o al limpiar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscar]);

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    setZonaDelMapa(null);
    setBboxActivo(null);
    if (pagina === 1) buscar(filtros, 1, null);
    else setPagina(1);
  };

  const buscarEnEstaZona = () => {
    if (!zonaDelMapa) return;
    setBboxActivo(zonaDelMapa);
    setPagina(1);
    buscar(filtros, 1, zonaDelMapa);
    // El botón desaparece hasta que el mapa vuelva a moverse; si siguiera
    // mostrándose después de apretarlo, parecería que no hizo nada.
    setZonaDelMapa(null);
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
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
              Estacionamientos (mínimo)
            </span>
            <select
              value={filtros.estacionamientosMin}
              onChange={(e) => setFiltros({ ...filtros, estacionamientosMin: e.target.value })}
              className={claseCampo}
            >
              <option value="">Cualquiera</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
              Superficie construida (m² mínimo)
            </span>
            <input
              type="number"
              min={0}
              value={filtros.superficieMin}
              onChange={(e) => setFiltros({ ...filtros, superficieMin: e.target.value })}
              placeholder="60"
              className={claseCampo}
            />
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Ordenar por</span>
            <select
              value={filtros.ordenar}
              onChange={(e) =>
                setFiltros({ ...filtros, ordenar: e.target.value as Filtros['ordenar'] })
              }
              className={claseCampo}
            >
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Precio: de menor a mayor</option>
              <option value="precio_desc">Precio: de mayor a menor</option>
            </select>
          </label>

          <label className="flex items-center gap-2 self-end pb-2.5">
            <input
              type="checkbox"
              checked={filtros.conBodega}
              onChange={(e) => setFiltros({ ...filtros, conBodega: e.target.checked })}
              className="h-4 w-4 rounded border-tinta/25 text-trato-600 focus:ring-trato-200"
            />
            <span className="text-sm text-tinta-suave">Con bodega</span>
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
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
                setZonaDelMapa(null);
                setBboxActivo(null);
                if (pagina === 1) buscar(FILTROS_VACIOS, 1, null);
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

      {/* Tabs sólo en mobile/tablet: en pantallas grandes la lista y el mapa van lado a lado. */}
      <div className="mt-6 flex gap-1 rounded-xl bg-tinta/5 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setVistaMovil('lista')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
            vistaMovil === 'lista' ? 'bg-white text-tinta shadow-sm' : 'text-tinta-tenue'
          }`}
        >
          <List className="h-4 w-4" />
          Lista
        </button>
        <button
          type="button"
          onClick={() => setVistaMovil('mapa')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
            vistaMovil === 'mapa' ? 'bg-white text-tinta shadow-sm' : 'text-tinta-tenue'
          }`}
        >
          <MapIcon className="h-4 w-4" />
          Mapa
        </button>
      </div>

      <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        <div className={vistaMovil === 'mapa' ? 'hidden lg:block' : 'lg:h-[72vh] lg:overflow-y-auto lg:pr-1'}>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {cargando && !error && <p className="text-sm text-tinta-tenue">Buscando propiedades...</p>}

          {!cargando && !error && datos && datos.propiedades.length === 0 && (
            <div className="rounded-2xl border border-dashed border-tinta/20 p-10 text-center">
              <p className="font-medium text-tinta">No hay publicaciones con esos filtros.</p>
              <p className="mt-1.5 text-sm text-tinta-tenue">
                {bboxActivo
                  ? 'No hay propiedades en esta zona del mapa. Aléjate un poco o prueba otro sector.'
                  : 'Prueba con otra comuna o amplía el rango de precio.'}
              </p>
            </div>
          )}

          {!cargando && !error && datos && datos.propiedades.length > 0 && (
            <>
              <p className="mb-4 text-sm text-tinta-tenue">
                <span className="font-semibold text-tinta">{datos.total}</span>{' '}
                {datos.total === 1 ? 'propiedad' : 'propiedades'}
                {bboxActivo && ' en esta zona del mapa'}
              </p>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {datos.propiedades.map((p) => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setDestacada(p.id)}
                    onMouseLeave={() => setDestacada((actual) => (actual === p.id ? null : actual))}
                  >
                    <TarjetaPropiedad propiedad={p} />
                  </div>
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

        <div
          className={`relative mt-4 h-[60vh] lg:mt-0 lg:h-[72vh] ${
            vistaMovil === 'lista' ? 'hidden lg:block' : ''
          }`}
        >
          <MapaResultados
            propiedades={datos?.propiedades ?? []}
            destacada={destacada}
            onBoundsChange={setZonaDelMapa}
          />
          {zonaDelMapa && (
            <div className="absolute left-1/2 top-3 -translate-x-1/2">
              <button
                type="button"
                onClick={buscarEnEstaZona}
                className="rounded-full bg-tinta px-4 py-2 text-xs font-semibold text-white shadow-alta transition hover:bg-tinta-suave"
              >
                Buscar en esta zona del mapa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
