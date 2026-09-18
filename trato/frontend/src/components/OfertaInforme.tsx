'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, FileSearch, Landmark } from 'lucide-react';
import { api, leerToken, mensajeDeError } from '@/lib/api';
import {
  formatearPesos,
  type CatalogoInformes,
  type InformeApi,
} from '@/lib/informes';

export default function OfertaInforme({ propiedadId }: { propiedadId: string }) {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState<CatalogoInformes | null>(null);
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [pedido, setPedido] = useState<InformeApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConSesion(leerToken() !== null);
  }, []);

  useEffect(() => {
    api
      .get<CatalogoInformes>('/informes/catalogo')
      .then(({ data }) => setCatalogo(data))
      .catch((e) => setError(mensajeDeError(e)));
  }, []);

  const volver = `/ingresar?volver=/propiedades/${propiedadId}`;

  async function emitirGratis() {
    setTrabajando('antecedentes');
    setError(null);
    try {
      const { data } = await api.post<{ informe: InformeApi }>(
        `/propiedades/${propiedadId}/informes/antecedentes`,
      );
      router.push(`/informes/${data.informe.id}`);
    } catch (e) {
      setError(mensajeDeError(e));
      setTrabajando(null);
    }
  }

  async function pedirTitulos() {
    setTrabajando('titulos');
    setError(null);
    try {
      const { data } = await api.post<{ informe: InformeApi }>(
        `/propiedades/${propiedadId}/informes/titulos`,
      );
      setPedido(data.informe);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  if (!catalogo) {
    return (
      <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
        <FileSearch className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
        <h3 className="mt-3 font-semibold text-tinta">Informe del inmueble</h3>
        <p className="mt-1.5 text-sm text-tinta-tenue">
          {error ?? 'Cargando qué incluye...'}
        </p>
      </div>
    );
  }

  const { antecedentes, titulos } = catalogo.niveles;

  if (pedido) {
    return (
      <div className="rounded-2xl border border-trato-200 bg-trato-50/60 p-6">
        <Landmark className="h-6 w-6 text-trato-700" strokeWidth={1.75} />
        <h3 className="mt-3 font-semibold text-tinta">Carpeta de títulos pedida</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
          Te enviamos el link de pago por {formatearPesos(pedido.precioClp)}. En cuanto esté
          pagado pedimos los certificados al Conservador y te avisamos: son{' '}
          {titulos.plazoHabiles?.minimo} a {titulos.plazoHabiles?.maximo} días hábiles, porque
          los emite el Conservador y no nosotros.
        </p>
        <Link
          href={`/informes/${pedido.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-trato-700 hover:text-trato-800"
        >
          Ver el pedido
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <FileSearch className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
      <h3 className="mt-3 font-semibold text-tinta">Informe del inmueble</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
        Antes de ofertar, revisa qué hay detrás de esta propiedad.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <div className="rounded-xl border border-tinta/10 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold text-tinta">{antecedentes.nombre}</p>
            <span className="text-sm font-semibold text-cierre-600">Gratis</span>
          </div>
          <p className="mt-1 text-xs text-tinta-tenue">Al instante, con lo que ya tenemos.</p>

          {/* El límite va arriba y en el mismo cuerpo de texto: inducir a
              confusión por omisión se sanciona igual que afirmar algo falso. */}
          <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            No es un estudio de títulos: no lo firma un abogado y no incluye los certificados
            del Conservador.
          </p>

          {conSesion === false ? (
            <Link
              href={volver}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-tinta ring-1 ring-tinta/15 transition hover:ring-tinta/30"
            >
              Ingresa para verlo
            </Link>
          ) : (
            <button
              type="button"
              onClick={emitirGratis}
              disabled={conSesion === null || trabajando !== null}
              className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-tinta ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-50"
            >
              {trabajando === 'antecedentes' ? 'Armando...' : 'Ver gratis'}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-trato-200 bg-trato-50/40 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold text-tinta">{titulos.nombre}</p>
            <span className="text-sm font-semibold text-tinta">
              {formatearPesos(titulos.precioClp)}
            </span>
          </div>
          <p className="mt-1 text-xs text-tinta-tenue">
            {titulos.plazoHabiles?.minimo} a {titulos.plazoHabiles?.maximo} días hábiles: los
            certificados los emite el Conservador.
          </p>

          <ul className="mt-3 space-y-1.5">
            {(titulos.aportes ?? []).map((aporte) => (
              <li key={aporte} className="flex gap-2 text-xs leading-relaxed text-tinta-suave">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trato-600" />
                {aporte}
              </li>
            ))}
          </ul>

          {conSesion === false ? (
            <Link
              href={volver}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-trato-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700"
            >
              Ingresa para pedirlo
            </Link>
          ) : (
            <button
              type="button"
              onClick={pedirTitulos}
              disabled={conSesion === null || trabajando !== null}
              className="mt-4 w-full rounded-xl bg-trato-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
            >
              {trabajando === 'titulos' ? 'Pidiendo...' : 'Pedir la carpeta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
