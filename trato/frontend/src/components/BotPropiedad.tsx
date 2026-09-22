'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Send, Sparkles } from 'lucide-react';
import { mensajeDeError } from '@/lib/api';
import {
  enlaceDestino,
  obtenerHistorial,
  obtenerSesion,
  obtenerSugeridas,
  preguntar,
  type Contestacion,
  type RespuestaBot,
  type Sugerida,
} from '@/lib/bot';

interface Props {
  propiedadId: string;
}

interface Turno {
  pregunta: string;
  contestacion: Contestacion;
}

/**
 * El bot de la ficha. Responde la publicación y el proceso; todo lo legal, el
 * valor real y el contacto del vendedor los deriva. Las respuestas las arma el
 * backend a partir de un catálogo cerrado —acá no se genera texto— así que este
 * componente sólo muestra lo que llega y ofrece el paso al que deriva.
 */
export default function BotPropiedad({ propiedadId }: Props) {
  const [sesion, setSesion] = useState<string | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [sugeridas, setSugeridas] = useState<Sugerida[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finRef = useRef<HTMLDivElement>(null);

  // La sesión y el historial dependen de localStorage: sólo en el cliente.
  useEffect(() => {
    const s = obtenerSesion();
    setSesion(s);

    obtenerSugeridas()
      .then(setSugeridas)
      .catch(() => setSugeridas([]));

    obtenerHistorial(propiedadId, s)
      .then((mensajes) => {
        setTurnos(
          mensajes
            .filter((m) => m.pregunta)
            .map((m) => ({
              pregunta: m.pregunta ?? '',
              contestacion: {
                id: m.id,
                pregunta: m.pregunta ?? '',
                // El historial guarda el texto plano; al recargar se muestra
                // como un solo bloque sin la etiqueta de fuente, que sólo
                // importa en la respuesta fresca.
                respuestas: [
                  {
                    texto: m.respuesta,
                    fuente: 'plataforma',
                    etiquetaFuente: '',
                    origen: 'historial',
                    destino: m.destino ?? undefined,
                  },
                ],
                entendido: true,
                destino: m.destino,
                etiquetaDestino: null,
                derivada: false,
              },
            })),
        );
      })
      .catch(() => setTurnos([]));
  }, [propiedadId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turnos]);

  async function enviar(preguntaTexto: string) {
    const limpia = preguntaTexto.trim();
    if (!limpia || !sesion || enviando) return;

    setEnviando(true);
    setError(null);
    setTexto('');

    try {
      const contestacion = await preguntar(propiedadId, limpia, sesion);
      setTurnos((previos) => [...previos, { pregunta: limpia, contestacion }]);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  const yaHayConversacion = turnos.length > 0;

  return (
    <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
        <h3 className="font-semibold text-tinta">Pregúntale a Trato</h3>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
        Te respondo sobre la propiedad y el proceso. Lo legal —títulos, deudas, gravámenes— va en
        el informe, y ahí no te lo adivino.
      </p>

      {yaHayConversacion && (
        <div className="mt-5 max-h-96 space-y-4 overflow-y-auto pr-1">
          {turnos.map((t, i) => (
            <div key={t.contestacion.id + i} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-trato-600 px-3.5 py-2 text-sm text-white">
                {t.pregunta}
              </p>
              {t.contestacion.respuestas.map((r, j) => (
                <Burbuja key={j} respuesta={r} propiedadId={propiedadId} />
              ))}
            </div>
          ))}
          <div ref={finRef} />
        </div>
      )}

      {!yaHayConversacion && sugeridas.length > 0 && (
        <div className="mt-5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-tinta-suave">
            <Sparkles className="h-3.5 w-3.5 text-trato-500" />
            Lo que más preguntan
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {sugeridas.map((s) => (
              <button
                key={s.codigo}
                type="button"
                disabled={enviando || !sesion}
                onClick={() => enviar(s.pregunta)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:bg-tinta/5 hover:text-tinta disabled:opacity-50"
              >
                {s.pregunta}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="mt-5 flex items-end gap-2"
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar(texto);
            }
          }}
          rows={1}
          maxLength={500}
          placeholder="Escribe tu pregunta…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-tinta/15 px-3.5 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviando || !sesion}
          aria-label="Enviar pregunta"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-trato-600 text-white transition hover:bg-trato-700 disabled:opacity-50"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-tinta-tenue">
        Respuestas informativas, no asesoría legal. Lo del estado legal lo verificamos en el
        informe del inmueble.
      </p>
    </div>
  );
}

function Burbuja({ respuesta, propiedadId }: { respuesta: RespuestaBot; propiedadId: string }) {
  const enlace = respuesta.destino ? enlaceDestino(respuesta.destino, propiedadId) : null;

  return (
    <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-tinta/[0.04] px-3.5 py-2.5">
      <p className="whitespace-pre-line text-sm leading-relaxed text-tinta-suave">
        {respuesta.texto}
      </p>
      {respuesta.etiquetaFuente && (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-tinta-tenue">
          {respuesta.etiquetaFuente}
        </p>
      )}
      {enlace && (
        <Link
          href={enlace}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-trato-700 hover:text-trato-800"
        >
          {respuesta.destino === 'informe' ? 'Ver el informe' : 'Agendar visita'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
