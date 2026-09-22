'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, HelpCircle, Inbox, MessageCircleQuestion } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

interface MensajePendiente {
  id: string;
  pregunta: string | null;
  respuesta: string;
  destino: string | null;
  createdAt: string;
  propiedad?: { id: string; titulo: string; comuna: string };
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  } | null;
}

interface Pendientes {
  derivaciones: MensajePendiente[];
  sinEntender: MensajePendiente[];
}

interface Resumen {
  total: number;
  noEntendidas: number;
  derivadas: number;
  porAtender: number;
  tasaSinEntender: number;
}

const fecha = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function PreguntasPendientes() {
  const { usuario, estado } = useSesion();
  const [datos, setDatos] = useState<Pendientes | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [p, r] = await Promise.all([
        api.get<Pendientes>('/bot/pendientes'),
        api.get<Resumen>('/bot/resumen'),
      ]);
      setDatos(p.data);
      setResumen(r.data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado') cargar();
  }, [estado, cargar]);

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (usuario && usuario.rol !== 'admin' && usuario.rol !== 'asesor') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Las preguntas del bot las atiende el equipo.
      </p>
    );
  }

  if (error && !datos) return <p className="text-sm text-red-600">{error}</p>;
  if (!datos) return <p className="text-sm text-tinta-tenue">Cargando preguntas...</p>;

  return (
    <div>
      {resumen && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tarjeta etiqueta="Preguntas en total" valor={resumen.total} />
          <Tarjeta etiqueta="Por atender" valor={resumen.porAtender} destacar={resumen.porAtender > 0} />
          <Tarjeta etiqueta="Derivadas" valor={resumen.derivadas} />
          <Tarjeta
            etiqueta="No entendidas"
            valor={`${Math.round(resumen.tasaSinEntender * 100)}%`}
            destacar={resumen.tasaSinEntender > 0.2}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Seccion
        titulo="El bot derivó a una persona"
        descripcion="Entendió la pregunta pero no le toca contestarla —precio, estado legal, contacto del vendedor—. Ciérralas con la nota de qué se respondió."
        icono={Inbox}
        mensajes={datos.derivaciones}
        vacio="Nadie esperando. Buen momento."
        atendible
        onAtendido={cargar}
      />

      <Seccion
        titulo="El bot no supo contestar"
        descripcion="No entendió la pregunta. Respóndele al comprador y anótalo: además son los temas que al bot le faltan."
        icono={HelpCircle}
        mensajes={datos.sinEntender}
        vacio="El bot entendió todo lo que le preguntaron."
        atendible
        onAtendido={cargar}
      />
    </div>
  );
}

function Tarjeta({
  etiqueta,
  valor,
  destacar,
}: {
  etiqueta: string;
  valor: number | string;
  destacar?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        destacar ? 'border-trato-200 bg-trato-50' : 'border-tinta/10 bg-white'
      }`}
    >
      <p className="text-2xl font-bold tabular-nums text-tinta">{valor}</p>
      <p className="mt-0.5 text-xs text-tinta-tenue">{etiqueta}</p>
    </div>
  );
}

function Seccion({
  titulo,
  descripcion,
  icono: Icono,
  mensajes,
  vacio,
  atendible,
  onAtendido,
}: {
  titulo: string;
  descripcion: string;
  icono: typeof Inbox;
  mensajes: MensajePendiente[];
  vacio: string;
  atendible: boolean;
  onAtendido: () => void;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Icono className="h-5 w-5 text-trato-600" strokeWidth={1.75} />
        <h2 className="text-lg font-semibold text-tinta">{titulo}</h2>
        <span className="rounded-full bg-tinta/5 px-2 py-0.5 text-xs font-medium tabular-nums text-tinta-suave">
          {mensajes.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-tinta-tenue">{descripcion}</p>

      {mensajes.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-tinta/20 px-4 py-8 text-center text-sm text-tinta-tenue">
          {vacio}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {mensajes.map((m) => (
            <Fila key={m.id} mensaje={m} atendible={atendible} onAtendido={onAtendido} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Fila({
  mensaje,
  atendible,
  onAtendido,
}: {
  mensaje: MensajePendiente;
  atendible: boolean;
  onAtendido: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function atender() {
    if (nota.trim().length < 3) {
      setError('Deja una nota de cómo se atendió');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/bot/mensajes/${mensaje.id}/atender`, { nota: nota.trim() });
      onAtendido();
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  return (
    <li className="rounded-2xl border border-tinta/10 bg-white p-5">
      <div className="flex items-start gap-3">
        <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-tinta-tenue" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-tinta">{mensaje.pregunta}</p>
          {mensaje.propiedad && (
            <p className="mt-1 text-sm text-tinta-tenue">
              {mensaje.propiedad.titulo} · {mensaje.propiedad.comuna}
            </p>
          )}
          <p className="mt-1 text-xs text-tinta-tenue">
            {fecha.format(new Date(mensaje.createdAt))}
            {mensaje.usuario
              ? ` · ${mensaje.usuario.nombre} ${mensaje.usuario.apellido} · ${mensaje.usuario.email}${
                  mensaje.usuario.telefono ? ` · ${mensaje.usuario.telefono}` : ''
                }`
              : ' · visitante sin cuenta'}
          </p>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="mt-2 text-xs font-medium text-trato-700 hover:text-trato-800"
          >
            {abierto ? 'Ocultar lo que respondió el bot' : 'Ver lo que respondió el bot'}
          </button>
          {abierto && (
            <p className="mt-2 whitespace-pre-line rounded-xl bg-tinta/[0.03] px-3.5 py-2.5 text-sm leading-relaxed text-tinta-suave">
              {mensaje.respuesta}
            </p>
          )}
        </div>
      </div>

      {atendible && (
        <div className="mt-4 border-t border-tinta/10 pt-4">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Lo llamé, le confirmé que el estacionamiento va con rol propio."
            className="w-full rounded-xl border border-tinta/15 px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={atender}
            disabled={guardando}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-cierre-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cierre-700 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {guardando ? 'Guardando...' : 'Marcar como atendida'}
          </button>
        </div>
      )}
    </li>
  );
}
