'use client';

import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { DIAS_SEMANA, type BloqueDisponibilidad } from '@/lib/visitas';

const BLOQUE_NUEVO: BloqueDisponibilidad = {
  diaSemana: 6,
  horaInicio: '11:00',
  horaFin: '13:00',
};

const claseCampo =
  'rounded-lg border border-tinta/15 bg-white px-2.5 py-1.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

export default function DisponibilidadPropiedad({ propiedadId }: { propiedadId: string }) {
  const [bloques, setBloques] = useState<BloqueDisponibilidad[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ bloques: BloqueDisponibilidad[] }>(`/propiedades/${propiedadId}/disponibilidad`)
      .then(({ data }) =>
        setBloques(
          data.bloques.map((b) => ({
            diaSemana: b.diaSemana,
            horaInicio: b.horaInicio.slice(0, 5),
            horaFin: b.horaFin.slice(0, 5),
          })),
        ),
      )
      .catch((e) => setError(mensajeDeError(e)));
  }, [propiedadId]);

  function cambiar(i: number, cambios: Partial<BloqueDisponibilidad>) {
    setBloques((actuales) =>
      (actuales ?? []).map((b, j) => (i === j ? { ...b, ...cambios } : b)),
    );
    setGuardado(false);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await api.put(`/propiedades/${propiedadId}/disponibilidad`, { bloques: bloques ?? [] });
      setGuardado(true);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  if (error && !bloques) return <p className="text-sm text-red-600">{error}</p>;
  if (!bloques) return <p className="text-sm text-tinta-tenue">Cargando horarios...</p>;

  return (
    <div>
      <p className="text-sm leading-relaxed text-tinta-suave">
        Declara las ventanas en que se puede mostrar la propiedad. De cada ventana salen cupos de
        45 minutos que el comprador reserva solo, y el asesor los hace seguidos para no cruzar la
        ciudad entremedio.
      </p>

      {bloques.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-tinta/20 px-4 py-6 text-center text-sm text-tinta-tenue">
          Sin ventanas declaradas. Mientras no agregues una, nadie puede agendar.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {bloques.map((bloque, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-tinta/10 bg-white p-3"
          >
            <select
              value={bloque.diaSemana}
              onChange={(e) => cambiar(i, { diaSemana: Number(e.target.value) })}
              className={claseCampo}
              aria-label="Día de la semana"
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.etiqueta}
                </option>
              ))}
            </select>

            <span className="text-sm text-tinta-tenue">de</span>
            <input
              type="time"
              value={bloque.horaInicio}
              onChange={(e) => cambiar(i, { horaInicio: e.target.value })}
              className={claseCampo}
              aria-label="Hora de inicio"
            />
            <span className="text-sm text-tinta-tenue">a</span>
            <input
              type="time"
              value={bloque.horaFin}
              onChange={(e) => cambiar(i, { horaFin: e.target.value })}
              className={claseCampo}
              aria-label="Hora de término"
            />

            <button
              type="button"
              onClick={() => {
                setBloques(bloques.filter((_, j) => j !== i));
                setGuardado(false);
              }}
              aria-label="Quitar esta ventana"
              className="ml-auto rounded-lg p-1.5 text-tinta-tenue transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setBloques([...bloques, BLOQUE_NUEVO]);
            setGuardado(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
        >
          <Plus className="h-4 w-4" />
          Agregar ventana
        </button>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="inline-flex items-center gap-1.5 rounded-xl bg-trato-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar horarios'}
        </button>

        {guardado && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cierre-600">
            <Check className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
