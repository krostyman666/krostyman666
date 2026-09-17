'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, CalendarX, Check, Clock } from 'lucide-react';
import { api, leerToken, mensajeDeError } from '@/lib/api';
import {
  formatearDiaCompacto,
  formatearDiaDeInstante,
  formatearHora,
  formatearRango,
  type DiaConCupos,
} from '@/lib/visitas';

interface Props {
  propiedadId: string;
  comuna: string;
}

export default function SolicitarVisita({ propiedadId, comuna }: Props) {
  const [dias, setDias] = useState<DiaConCupos[] | null>(null);
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  const [cupoElegido, setCupoElegido] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<{ inicio: string; fin: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El token vive en localStorage, que no existe al renderizar en el servidor.
  // Si se leyera durante el render, el servidor pintaría "ingresa" y el cliente
  // el selector de horas, y React descartaría el HTML por no coincidir.
  const [conSesion, setConSesion] = useState<boolean | null>(null);

  useEffect(() => {
    setConSesion(leerToken() !== null);
  }, []);

  useEffect(() => {
    api
      .get<{ dias: DiaConCupos[] }>(`/propiedades/${propiedadId}/cupos`)
      .then(({ data }) => {
        setDias(data.dias);
        setDiaElegido(data.dias[0]?.dia ?? null);
      })
      .catch((e) => setError(mensajeDeError(e)));
  }, [propiedadId]);

  async function enviar() {
    if (!cupoElegido) return;
    setEnviando(true);
    setError(null);

    const cupo = dias
      ?.find((d) => d.dia === diaElegido)
      ?.cupos.find((c) => c.inicio === cupoElegido);

    try {
      await api.post(`/propiedades/${propiedadId}/visitas`, {
        inicio: cupoElegido,
        mensaje: mensaje.trim() || undefined,
      });
      setListo({ inicio: cupoElegido, fin: cupo?.fin ?? cupoElegido });
    } catch (e) {
      setError(mensajeDeError(e));
      // El cupo pudo caer entre que se cargó la lista y el envío.
      const { data } = await api.get<{ dias: DiaConCupos[] }>(
        `/propiedades/${propiedadId}/cupos`,
      );
      setDias(data.dias);
      setCupoElegido(null);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="rounded-2xl border border-cierre-100 bg-cierre-50 p-6">
        <Check className="h-6 w-6 text-cierre-600" />
        <h3 className="mt-3 font-semibold text-tinta">Visita pedida</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
          {formatearDiaDeInstante(listo.inicio)}, {formatearRango(listo.inicio, listo.fin)}.
          Te confirmamos por correo en cuanto asignemos al asesor que muestra en {comuna}, y ahí
          te llega la dirección exacta.
        </p>
        <Link
          href="/panel"
          className="mt-4 inline-block text-sm font-medium text-trato-700 hover:text-trato-800"
        >
          Ver mis visitas
        </Link>
      </div>
    );
  }

  if (conSesion === null) {
    return (
      <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
        <CalendarCheck className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
        <h3 className="mt-3 font-semibold text-tinta">Agenda una visita</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
          Un asesor en sueldo fijo te muestra la propiedad, sin costo.
        </p>
      </div>
    );
  }

  if (!conSesion) {
    return (
      <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
        <CalendarCheck className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
        <h3 className="mt-3 font-semibold text-tinta">Agenda una visita</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
          Un asesor en sueldo fijo te muestra la propiedad. Sin costo y sin comisión por mostrar.
        </p>
        <Link
          href={`/ingresar?volver=/propiedades/${propiedadId}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-trato-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-trato-700"
        >
          Ingresa para agendar
        </Link>
        <p className="mt-3 text-center text-xs text-tinta-tenue">
          ¿No tienes cuenta?{' '}
          <Link href="/registro?tipo=comprador" className="font-medium text-trato-700">
            Créala en un minuto
          </Link>
        </p>
      </div>
    );
  }

  if (error && !dias) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!dias) {
    return (
      <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
        <p className="text-sm text-tinta-tenue">Buscando horarios...</p>
      </div>
    );
  }

  if (dias.length === 0) {
    return (
      <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
        <CalendarX className="h-6 w-6 text-tinta-tenue" strokeWidth={1.75} />
        <h3 className="mt-3 font-semibold text-tinta">Sin horarios publicados</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
          El vendedor todavía no define cuándo se puede visitar. Escríbenos y lo coordinamos.
        </p>
      </div>
    );
  }

  const cupos = dias.find((d) => d.dia === diaElegido)?.cupos ?? [];
  const grupal = dias.some((d) => d.cupos.some((c) => c.lugares > 1));

  return (
    <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <CalendarCheck className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
      <h3 className="mt-3 font-semibold text-tinta">Agenda una visita</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
        Elige el día y la hora. Te muestra un asesor nuestro, sin costo.
      </p>

      <div className="mt-5">
        <span className="mb-2 block text-xs font-medium text-tinta-suave">Día</span>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dias.map((d) => (
            <button
              key={d.dia}
              type="button"
              onClick={() => {
                setDiaElegido(d.dia);
                setCupoElegido(null);
              }}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition first-letter:uppercase ${
                d.dia === diaElegido
                  ? 'bg-trato-600 text-white'
                  : 'text-tinta-suave ring-1 ring-tinta/15 hover:ring-tinta/30'
              }`}
            >
              {formatearDiaCompacto(d.dia)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-xs font-medium text-tinta-suave">Hora</span>
        <div className="grid grid-cols-3 gap-2">
          {cupos.map((c) => (
            <button
              key={c.inicio}
              type="button"
              onClick={() => setCupoElegido(c.inicio)}
              className={`rounded-xl py-2 text-sm font-medium tabular-nums transition ${
                c.inicio === cupoElegido
                  ? 'bg-trato-600 text-white'
                  : 'text-tinta-suave ring-1 ring-tinta/15 hover:ring-tinta/30'
              }`}
            >
              {formatearHora(c.inicio)}
              {c.lugares > 1 && (
                <span className="mt-0.5 block text-[11px] font-normal opacity-75">
                  {c.lugares - c.ocupados} de {c.lugares}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-tinta-tenue">
          <Clock className="h-3.5 w-3.5" />
          {grupal
            ? 'Visita guiada de 45 minutos, con otros interesados.'
            : 'Cada visita dura 45 minutos.'}
        </p>
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
          Algo que quieras avisar (opcional)
        </span>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Voy con mi pareja, nos interesa ver el estacionamiento."
          className="w-full rounded-xl border border-tinta/15 px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={!cupoElegido || enviando}
        className="mt-4 w-full rounded-xl bg-trato-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
      >
        {enviando ? 'Pidiendo la visita...' : 'Pedir esta visita'}
      </button>
    </div>
  );
}
