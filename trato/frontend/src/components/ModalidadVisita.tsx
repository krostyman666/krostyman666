'use client';

import { useEffect, useState } from 'react';
import { Check, User, Users } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';

const MAXIMO = 10;

export default function ModalidadVisita({ propiedadId }: { propiedadId: string }) {
  const [porCupo, setPorCupo] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ propiedad: { visitantesPorCupo: number } }>(`/propiedades/${propiedadId}`)
      .then(({ data }) => setPorCupo(data.propiedad.visitantesPorCupo ?? 1))
      .catch((e) => setError(mensajeDeError(e)));
  }, [propiedadId]);

  async function guardar(valor: number) {
    setPorCupo(valor);
    setGuardando(true);
    setGuardado(false);
    setError(null);
    try {
      await api.patch(`/propiedades/${propiedadId}`, { visitantesPorCupo: valor });
      setGuardado(true);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  if (error && porCupo === null) return <p className="text-sm text-red-600">{error}</p>;
  if (porCupo === null) return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  const grupal = porCupo > 1;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => guardar(1)}
          aria-pressed={!grupal}
          className={`rounded-xl border p-4 text-left transition ${
            grupal
              ? 'border-tinta/10 bg-white hover:border-tinta/25'
              : 'border-trato-300 bg-trato-50/60 ring-1 ring-trato-200'
          }`}
        >
          <User className="h-5 w-5 text-trato-600" strokeWidth={1.75} />
          <p className="mt-2 font-semibold text-tinta">Una visita a la vez</p>
          <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">
            Cada comprador ve la propiedad solo con el asesor. Más cómodo, y nadie se cruza en tu
            casa.
          </p>
        </button>

        <button
          type="button"
          onClick={() => guardar(grupal ? porCupo : 4)}
          aria-pressed={grupal}
          className={`rounded-xl border p-4 text-left transition ${
            grupal
              ? 'border-trato-300 bg-trato-50/60 ring-1 ring-trato-200'
              : 'border-tinta/10 bg-white hover:border-tinta/25'
          }`}
        >
          <Users className="h-5 w-5 text-trato-600" strokeWidth={1.75} />
          <p className="mt-2 font-semibold text-tinta">Visita guiada en grupo</p>
          <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">
            Varios interesados en el mismo bloque. Abres la casa menos veces y se vende más
            rápido.
          </p>
        </button>
      </div>

      {grupal && (
        <label className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-tinta-suave">Personas por bloque</span>
          <select
            value={porCupo}
            onChange={(e) => guardar(Number(e.target.value))}
            className="rounded-lg border border-tinta/15 bg-white px-2.5 py-1.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
          >
            {Array.from({ length: MAXIMO - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-3 flex items-center gap-3 text-sm">
        {guardando && <span className="text-tinta-tenue">Guardando...</span>}
        {guardado && !guardando && (
          <span className="inline-flex items-center gap-1.5 font-medium text-cierre-600">
            <Check className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
