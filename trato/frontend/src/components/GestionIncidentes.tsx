'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

interface Categoria {
  codigo: string;
  categoria: string;
}

interface Incidente {
  id: string;
  titulo: string;
  descripcion: string;
  categoriasAfectadas: string[];
  cantidadAfectadaEstimada: number | null;
  detectadoEn: string;
  notificadaAgenciaEn: string | null;
  notificadaTitularesEn: string | null;
  medidasAdoptadas: string | null;
  cerradoEn: string | null;
  declaradoPor: { nombre: string; apellido: string } | null;
  venceAgenciaEn: string;
  plazoAgenciaVencido: boolean;
  requiereNotificarTitulares: boolean;
  motivoParaNoCerrar: string | null;
}

const fechaHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'medium',
  timeStyle: 'short',
});

const claseCampo =
  'w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

/**
 * Declarar y gestionar vulneraciones de seguridad (Ley 21.719, art. 14
 * sexies): notificación a la Agencia dentro de 72 horas desde que se toma
 * conocimiento, y a los titulares si las categorías afectadas implican
 * riesgo alto. Ver `dominio/brechas.ts` en el backend.
 */
export default function GestionIncidentes() {
  const { usuario, estado } = useSesion();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [incidentes, setIncidentes] = useState<Incidente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [reg, inc] = await Promise.all([
        api.get<{ registro: Categoria[] }>('/mis-datos/registro'),
        api.get<{ incidentes: Incidente[] }>('/incidentes'),
      ]);
      setCategorias(reg.data.registro);
      setIncidentes(inc.data.incidentes);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado' && usuario?.rol === 'admin') cargar();
  }, [estado, usuario, cargar]);

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (usuario && usuario.rol !== 'admin') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Esto es interno: gestión de incidentes de seguridad.
      </p>
    );
  }

  const abiertos = (incidentes ?? []).filter((i) => !i.cerradoEn);
  const cerrados = (incidentes ?? []).filter((i) => i.cerradoEn);

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-tinta">Incidentes abiertos</h2>
        <button
          type="button"
          onClick={() => setMostrarFormulario((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-trato-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-trato-700"
        >
          <Plus className="h-4 w-4" />
          Declarar incidente
        </button>
      </div>

      {mostrarFormulario && (
        <FormularioIncidente
          categorias={categorias}
          onCreado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      {incidentes === null ? (
        <p className="text-sm text-tinta-tenue">Cargando...</p>
      ) : abiertos.length === 0 ? (
        <p className="text-sm text-tinta-tenue">Ningún incidente abierto.</p>
      ) : (
        <ul className="space-y-4">
          {abiertos.map((i) => (
            <TarjetaIncidente key={i.id} incidente={i} categorias={categorias} onCambio={cargar} />
          ))}
        </ul>
      )}

      {cerrados.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-tinta">Cerrados</h2>
          <ul className="mt-4 space-y-4">
            {cerrados.map((i) => (
              <TarjetaIncidente key={i.id} incidente={i} categorias={categorias} onCambio={cargar} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FormularioIncidente({
  categorias,
  onCreado,
}: {
  categorias: Categoria[];
  onCreado: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (seleccionadas.length === 0) {
      setError('Marca al menos una categoría de datos afectada.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await api.post('/incidentes', {
        titulo,
        descripcion,
        categoriasAfectadas: seleccionadas,
        cantidadAfectadaEstimada: cantidad ? Number(cantidad) : null,
      });
      onCreado();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="space-y-4 rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta"
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
          Qué pasó, en una línea
        </span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          minLength={5}
          placeholder="Acceso no autorizado a la base de datos de producción"
          className={claseCampo}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
          Descripción del incidente
        </span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          minLength={10}
          rows={4}
          placeholder="Cómo se detectó, qué se cree que pasó, desde cuándo pudo estar expuesto"
          className={claseCampo}
        />
      </label>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
          Categorías de datos afectadas
        </span>
        <div className="grid gap-2 sm:grid-cols-2">
          {categorias.map((c) => (
            <label
              key={c.codigo}
              className="flex items-center gap-2 rounded-xl border border-tinta/10 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={seleccionadas.includes(c.codigo)}
                onChange={(e) =>
                  setSeleccionadas((actual) =>
                    e.target.checked
                      ? [...actual, c.codigo]
                      : actual.filter((codigo) => codigo !== c.codigo),
                  )
                }
                className="h-4 w-4 rounded border-tinta/25 text-trato-600 focus:ring-trato-200"
              />
              <span className="text-tinta-suave">{c.categoria}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="block max-w-xs">
        <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
          Personas afectadas, estimado (opcional)
        </span>
        <input
          type="number"
          min={0}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={claseCampo}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center gap-2 rounded-xl bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta-suave disabled:opacity-60"
      >
        {enviando ? 'Declarando...' : 'Declarar incidente'}
      </button>
      <p className="text-xs text-tinta-tenue">
        El plazo de 72 horas hacia la Agencia empieza a correr desde ahora, no desde que ocurrió
        el incidente.
      </p>
    </form>
  );
}

function TarjetaIncidente({
  incidente,
  categorias,
  onCambio,
}: {
  incidente: Incidente;
  categorias: Categoria[];
  onCambio: () => void;
}) {
  const [accionando, setAccionando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medidas, setMedidas] = useState('');
  const [cerrando, setCerrando] = useState(false);

  const etiquetaCategoria = (codigo: string) =>
    categorias.find((c) => c.codigo === codigo)?.categoria ?? codigo;

  async function accion(ruta: string, cuerpo?: Record<string, unknown>) {
    setAccionando(true);
    setError(null);
    try {
      await api.patch(`/incidentes/${incidente.id}/${ruta}`, cuerpo);
      onCambio();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setAccionando(false);
    }
  }

  return (
    <li className="rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-tinta">{incidente.titulo}</h3>
          <p className="mt-1 text-sm text-tinta-tenue">
            Detectado el {fechaHora.format(new Date(incidente.detectadoEn))}
            {incidente.declaradoPor &&
              ` · ${incidente.declaradoPor.nombre} ${incidente.declaradoPor.apellido}`}
          </p>
        </div>
        {incidente.cerradoEn ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cierre-50 px-3 py-1 text-xs font-semibold text-cierre-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cerrado
          </span>
        ) : incidente.plazoAgenciaVencido ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Plazo de 72h vencido
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            <Clock className="h-3.5 w-3.5" />
            Vence el {fechaHora.format(new Date(incidente.venceAgenciaEn))}
          </span>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-tinta-suave">{incidente.descripcion}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {incidente.categoriasAfectadas.map((c) => (
          <span
            key={c}
            className="rounded-full bg-tinta/5 px-2.5 py-1 text-xs text-tinta-suave"
          >
            {etiquetaCategoria(c)}
          </span>
        ))}
        {incidente.cantidadAfectadaEstimada !== null && (
          <span className="rounded-full bg-tinta/5 px-2.5 py-1 text-xs text-tinta-suave">
            ~{incidente.cantidadAfectadaEstimada} personas
          </span>
        )}
      </div>

      {incidente.requiereNotificarTitulares && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-800">
          <ShieldAlert className="h-3.5 w-3.5" />
          Riesgo alto: también hay que notificar a los titulares afectados.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {incidente.notificadaAgenciaEn ? (
          <span className="text-xs text-tinta-tenue">
            Agencia notificada el {fechaHora.format(new Date(incidente.notificadaAgenciaEn))}
          </span>
        ) : (
          <button
            type="button"
            disabled={accionando}
            onClick={() => accion('notificar-agencia')}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white bg-tinta transition hover:bg-tinta-suave disabled:opacity-60"
          >
            Marcar notificado a la Agencia
          </button>
        )}

        {incidente.requiereNotificarTitulares &&
          (incidente.notificadaTitularesEn ? (
            <span className="text-xs text-tinta-tenue">
              Titulares notificados el{' '}
              {fechaHora.format(new Date(incidente.notificadaTitularesEn))}
            </span>
          ) : (
            <button
              type="button"
              disabled={accionando}
              onClick={() => accion('notificar-titulares')}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white bg-tinta transition hover:bg-tinta-suave disabled:opacity-60"
            >
              Marcar notificados los titulares
            </button>
          ))}
      </div>

      {!incidente.cerradoEn &&
        (cerrando ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={medidas}
              onChange={(e) => setMedidas(e.target.value)}
              rows={3}
              placeholder="Qué medidas se adoptaron (contención, aviso al proveedor, cambio de credenciales, etc.)"
              className={claseCampo}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={accionando || medidas.trim().length < 10}
                onClick={() => accion('cerrar', { medidasAdoptadas: medidas })}
                className="rounded-xl bg-cierre-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cierre-700 disabled:opacity-60"
              >
                Confirmar cierre
              </button>
              <button
                type="button"
                onClick={() => setCerrando(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={Boolean(incidente.motivoParaNoCerrar)}
            title={incidente.motivoParaNoCerrar ?? undefined}
            onClick={() => setCerrando(true)}
            className="mt-4 rounded-xl px-3 py-1.5 text-xs font-semibold text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cerrar incidente
          </button>
        ))}

      {incidente.cerradoEn && incidente.medidasAdoptadas && (
        <p className="mt-4 rounded-xl bg-tinta/[0.03] px-4 py-3 text-xs leading-relaxed text-tinta-tenue">
          <strong className="text-tinta-suave">Medidas adoptadas:</strong>{' '}
          {incidente.medidasAdoptadas}
        </p>
      )}
    </li>
  );
}
