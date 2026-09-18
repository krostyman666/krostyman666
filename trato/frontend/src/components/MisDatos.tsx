'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Download, Trash2 } from 'lucide-react';
import { api, borrarToken, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

interface Actividad {
  codigo: string;
  categoria: string;
  finalidad: string;
  base: string;
  conservacionMeses: number | null;
  supresion: 'suprimible' | 'anonimizable' | 'retener_por_ley';
  nota: string;
}

interface Registro {
  registro: Actividad[];
  derechos: { codigo: string; nombre: string; que: string }[];
}

interface Evaluacion {
  puedeSuprimir: boolean;
  bloqueos: { motivo: string; detalle: string }[];
  seAnonimiza: string[];
  seRetiene: { categoria: string; meses: number | null; porque: string }[];
}

const ETIQUETA_BASE: Record<string, string> = {
  consentimiento: 'Tu autorización',
  contrato: 'Necesario para la operación',
  obligacion_legal: 'Obligación legal',
  interes_legitimo: 'Interés legítimo',
};

const ETIQUETA_SUPRESION: Record<string, string> = {
  suprimible: 'Se borra',
  anonimizable: 'Se anonimiza',
  retener_por_ley: 'Se conserva por ley',
};

function conservacion(meses: number | null): string {
  if (meses === null) return 'Mientras tengas cuenta';
  if (meses % 12 === 0) return `${meses / 12} ${meses === 12 ? 'año' : 'años'}`;
  return `${meses} meses`;
}

export default function MisDatos() {
  // Sin exigir sesión: el registro de qué guardamos tiene que poder leerse
  // antes de crearse una cuenta. Ejercer los derechos sí requiere entrar.
  const { usuario, estado } = useSesion(false);
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '' });
  const [guardado, setGuardado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [suprimido, setSuprimido] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (conSesion: boolean) => {
    try {
      const reg = await api.get<Registro>('/mis-datos/registro');
      setRegistro(reg.data);
      if (conSesion) {
        const ev = await api.get<Evaluacion>('/mis-datos/supresion');
        setEvaluacion(ev.data);
      }
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado !== 'cargando') cargar(estado === 'autenticado');
  }, [estado, cargar]);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono ?? '',
        email: usuario.email,
      });
    }
  }, [usuario]);

  async function descargar() {
    setTrabajando('exportar');
    setError(null);
    try {
      const { data } = await api.get('/mis-datos/exportar');
      // El navegador no puede seguir un link con el token en la cabecera, así
      // que el archivo se arma acá con lo que devolvió la API.
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mis-datos-trato.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setTrabajando('rectificar');
    setError(null);
    setGuardado(false);
    try {
      await api.patch('/mis-datos', {
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono || null,
        email: form.email,
      });
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setTrabajando(null);
    }
  }

  async function suprimir() {
    setTrabajando('suprimir');
    setError(null);
    try {
      await api.delete('/mis-datos');
      setSuprimido(true);
      borrarToken();
    } catch (e) {
      setError(mensajeDeError(e));
      setConfirmando(false);
    } finally {
      setTrabajando(null);
    }
  }

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (suprimido) {
    return (
      <div className="rounded-2xl border border-cierre-100 bg-cierre-50 p-6">
        <Check className="h-6 w-6 text-cierre-600" />
        <h2 className="mt-3 font-semibold text-tinta">Listo</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
          Tus datos quedaron anonimizados y tu cuenta ya no puede entrar. Lo que la ley obliga a
          conservar sigue guardado por el plazo que te mostramos, sin quedar asociado a tu
          nombre.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-trato-700">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const autenticado = estado === 'autenticado';

  const claseCampo =
    'w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

  return (
    <div className="space-y-12">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section>
        <h2 className="text-xl font-bold tracking-tight text-tinta">Tus derechos</h2>
        <ul className="mt-4 space-y-3">
          {(registro?.derechos ?? []).map((d) => (
            <li key={d.codigo} className="flex gap-3">
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trato-600"
              />
              <p className="text-sm leading-relaxed text-tinta-suave">
                <span className="font-semibold text-tinta">{d.nombre}.</span> {d.que}
              </p>
            </li>
          ))}
        </ul>

        {!autenticado && (
          <p className="mt-5 rounded-xl bg-tinta/[0.03] px-4 py-3 text-sm leading-relaxed text-tinta-suave">
            Para ejercerlos necesitas{' '}
            <Link
              href="/ingresar?volver=/mis-datos"
              className="font-medium text-trato-700 hover:text-trato-800"
            >
              entrar a tu cuenta
            </Link>
            . Lo que guardamos y por cuánto tiempo está más abajo y no necesita sesión.
          </p>
        )}
      </section>

      {autenticado && (
      <section>
        <h2 className="text-xl font-bold tracking-tight text-tinta">Corregir tus datos</h2>
        <form onSubmit={guardar} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Nombre</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={claseCampo}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Apellido</span>
            <input
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              className={claseCampo}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Correo</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={claseCampo}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Teléfono</span>
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={claseCampo}
            />
          </label>

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={trabajando !== null}
              className="rounded-xl bg-trato-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
            >
              {trabajando === 'rectificar' ? 'Guardando...' : 'Guardar'}
            </button>
            {guardado && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cierre-600">
                <Check className="h-4 w-4" />
                Guardado
              </span>
            )}
          </div>
        </form>
        <p className="mt-3 text-xs leading-relaxed text-tinta-tenue">
          El RUT no se edita acá: identifica a las partes en la escritura, así que su cambio pasa
          por revisión.
        </p>
      </section>
      )}

      {autenticado && (
      <section>
        <h2 className="text-xl font-bold tracking-tight text-tinta">Llevarte tus datos</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
          Un archivo JSON con todo lo que tenemos tuyo, que otro sistema puede leer.
        </p>
        <button
          type="button"
          onClick={descargar}
          disabled={trabajando !== null}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-tinta ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {trabajando === 'exportar' ? 'Preparando...' : 'Descargar mis datos'}
        </button>
      </section>
      )}

      <section>
        <h2 className="text-xl font-bold tracking-tight text-tinta">Qué guardamos y por qué</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-tinta/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-tinta/10 bg-tinta/[0.02] text-xs text-tinta-tenue">
                <th scope="col" className="px-4 py-3 font-medium">Dato</th>
                <th scope="col" className="px-4 py-3 font-medium">Para qué</th>
                <th scope="col" className="px-4 py-3 font-medium">Cuánto</th>
                <th scope="col" className="px-4 py-3 font-medium">Si lo borras</th>
              </tr>
            </thead>
            <tbody>
              {(registro?.registro ?? []).map((a) => (
                <tr key={a.codigo} className="border-b border-tinta/5 align-top last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium text-tinta">
                    {a.categoria}
                    <span className="mt-0.5 block text-xs font-normal text-tinta-tenue">
                      {ETIQUETA_BASE[a.base] ?? a.base}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-tinta-suave">{a.finalidad}</td>
                  <td className="px-4 py-3 text-tinta-suave">
                    {conservacion(a.conservacionMeses)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        a.supresion === 'retener_por_ley'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-cierre-50 text-cierre-700'
                      }`}
                    >
                      {ETIQUETA_SUPRESION[a.supresion]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {autenticado && (
      <section>
        <h2 className="text-xl font-bold tracking-tight text-tinta">Borrar tus datos</h2>

        {evaluacion && !evaluacion.puedeSuprimir && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <AlertTriangle className="h-5 w-5 text-amber-700" strokeWidth={1.75} />
            <p className="mt-2 font-semibold text-tinta">Todavía no se puede</p>
            <ul className="mt-2 space-y-2">
              {evaluacion.bloqueos.map((b) => (
                <li key={b.motivo} className="text-sm leading-relaxed text-amber-900">
                  <span className="font-medium">{b.motivo}.</span> {b.detalle}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluacion?.puedeSuprimir && (
          <div className="mt-4">
            {evaluacion.seRetiene.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-tinta">Esto no se borra, y te decimos por qué</p>
                <ul className="mt-2 space-y-2">
                  {evaluacion.seRetiene.map((r) => (
                    <li key={r.categoria} className="text-sm leading-relaxed text-amber-900">
                      <span className="font-medium">{r.categoria}</span>
                      {r.meses !== null && ` — ${conservacion(r.meses)}`}. {r.porque}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {confirmando ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-tinta">
                  Vamos a anonimizar tu cuenta. No se puede deshacer.
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-red-900">
                  Tu nombre, correo, RUT y teléfono se reemplazan por un marcador, y no vas a
                  poder volver a entrar con esta cuenta.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={suprimir}
                    disabled={trabajando !== null}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {trabajando === 'suprimir' ? 'Anonimizando...' : 'Sí, borrar mis datos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
                  >
                    Mejor no
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Borrar mis datos
              </button>
            )}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
