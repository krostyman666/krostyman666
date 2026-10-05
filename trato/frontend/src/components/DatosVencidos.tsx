'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, History, ShieldCheck, Trash2 } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

interface Vencido {
  actividad: string;
  categoria: string;
  cuantos: number;
  desde: string;
}

interface AccionPurga {
  actividad: string;
  categoria: string;
  cuantos: number;
  accion: 'anonimizado';
}

interface Corrida {
  id: string;
  acciones: AccionPurga[];
  createdAt: string;
  ejecutadaPor: { id: string; nombre: string; apellido: string } | null;
}

const fechaHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Lo que pasó su plazo de conservación, y el botón que ejecuta la purga.
 *
 * Sólo `visitas` tiene una acción automática: el resto (informes,
 * consentimientos) es evidencia que no se toca a ciegas -- se explica por
 * qué, no se esconde. Ver `purgarVencidos` en el backend.
 */
export default function DatosVencidos() {
  const { usuario, estado } = useSesion();
  const [vencidos, setVencidos] = useState<Vencido[] | null>(null);
  const [historial, setHistorial] = useState<Corrida[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [purgando, setPurgando] = useState(false);
  const [resultado, setResultado] = useState<AccionPurga[] | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get<{ vencidos: Vencido[]; historial: Corrida[] }>(
        '/mis-datos/vencidos',
      );
      setVencidos(data.vencidos);
      setHistorial(data.historial);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado') cargar();
  }, [estado, cargar]);

  async function purgar() {
    setPurgando(true);
    setError(null);
    try {
      const { data } = await api.post<{ acciones: AccionPurga[] }>('/mis-datos/vencidos/purgar');
      setResultado(data.acciones);
      setConfirmando(false);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setPurgando(false);
    }
  }

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (usuario && usuario.rol !== 'admin') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Esto es interno: purga de datos vencidos.
      </p>
    );
  }

  const tocaVisitas = (vencidos ?? []).some((v) => v.actividad === 'visitas');

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-tinta">Pasaron su plazo de conservación</h2>
        {vencidos === null ? (
          <p className="mt-2 text-sm text-tinta-tenue">Cargando...</p>
        ) : vencidos.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-tenue">Nada vencido por ahora.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {vencidos.map((v) => (
              <li
                key={v.actividad}
                className="flex items-center justify-between rounded-xl border border-tinta/10 bg-white px-4 py-3 text-sm"
              >
                <span className="text-tinta">{v.categoria}</span>
                <span className="text-tinta-tenue">
                  {v.cuantos} {v.cuantos === 1 ? 'fila' : 'filas'} · vencido desde{' '}
                  {new Date(v.desde).toLocaleDateString('es-CL')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-tinta/10 bg-white p-6">
        <h2 className="text-lg font-semibold text-tinta">Qué hace la purga</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
          Sólo anonimiza <strong>visitas</strong> vencidas: borra el mensaje libre que escribió el
          comprador, lo mismo que ya hace una supresión a pedido. Lo demás no se toca acá:
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-tinta-tenue">
          <li>
            <strong className="text-tinta-suave">Informes</strong> — es la prueba de qué se le
            entregó al comprador y cuándo; si lleva firma de abogado, respalda su
            responsabilidad profesional. Decidir qué anonimizar de su contenido es cosa de un
            abogado, no de un botón.
          </li>
          <li>
            <strong className="text-tinta-suave">Consentimientos</strong> — nunca se editan ni se
            borran, por diseño: revocar deja el historial intacto porque esa fila es justo la
            prueba de que el tratamiento estuvo autorizado.
          </li>
        </ul>

        {confirmando ? (
          <div className="mt-5 rounded-xl bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">
              {tocaVisitas
                ? 'Se van a borrar los mensajes de las visitas vencidas. No se puede deshacer.'
                : 'No hay nada que tocar ahora mismo, pero igual queda registrada la corrida.'}
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={purgar}
                disabled={purgando}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {purgando ? 'Purgando...' : 'Sí, purgar ahora'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
              >
                Mejor no
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-trato-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700"
          >
            <Trash2 className="h-4 w-4" />
            Purgar lo vencido
          </button>
        )}

        {resultado && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-cierre-50 px-4 py-3 text-sm text-cierre-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            {resultado.length === 0
              ? 'Listo. No había nada que anonimizar.'
              : resultado.map((a) => `${a.categoria}: ${a.cuantos} anonimizadas`).join(' · ')}
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-tinta">
          <History className="h-5 w-5 text-tinta-tenue" />
          Corridas anteriores
        </h2>
        {historial === null || historial.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-tenue">Todavía no se ha ejecutado.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {historial.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-tinta/10 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-tinta">
                    {h.ejecutadaPor ? `${h.ejecutadaPor.nombre} ${h.ejecutadaPor.apellido}` : 'Equipo'}
                  </span>
                  <span className="text-xs text-tinta-tenue">{fechaHora.format(new Date(h.createdAt))}</span>
                </div>
                <p className="mt-1 text-tinta-tenue">
                  {h.acciones.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      No tocó nada
                    </span>
                  ) : (
                    h.acciones.map((a) => `${a.categoria}: ${a.cuantos} anonimizadas`).join(' · ')
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
