'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  Handshake,
  Pencil,
  Plus,
  Scale,
  Trash2,
  X,
} from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';
import FirmarPromesa from '@/components/FirmarPromesa';
import {
  COLOR_ESTADO_PROMESA,
  ETIQUETA_ESTADO_PROMESA,
  formatearMonto,
  marcadoresPendientes,
  type ClausulaApi,
  type DefinicionClausulaApi,
  type RespuestaPromesa,
} from '@/lib/promesas';

const fechaLarga = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'long',
});

export default function NegociarPromesa({ promesaId }: { promesaId: string }) {
  const { usuario, estado } = useSesion();
  const [datos, setDatos] = useState<RespuestaPromesa | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState('');
  const [comentario, setComentario] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<RespuestaPromesa>(`/promesas/${promesaId}`);
      setDatos(data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [promesaId]);

  useEffect(() => {
    if (estado === 'autenticado') cargar();
  }, [estado, cargar]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setTrabajando(true);
    setError(null);
    try {
      await accion();
      await cargar();
      setEditando(null);
      setAgregando(false);
      setComentario('');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;
  if (error && !datos) return <p className="text-sm text-red-600">{error}</p>;
  if (!datos || !usuario) return <p className="text-sm text-tinta-tenue">Cargando promesa...</p>;

  const { promesa, negociacion, catalogo } = datos;
  const clausulas = [...(promesa.clausulas ?? [])].sort((a, b) => a.orden - b.orden);
  const soyComprador = promesa.compradorId === usuario.id;
  const otraParte = soyComprador ? promesa.vendedor : promesa.comprador;
  const enNegociacion = promesa.estado === 'negociando';

  const definicion = (codigo: string): DefinicionClausulaApi | undefined =>
    catalogo.find((c) => c.codigo === codigo);

  const disponibles = catalogo.filter(
    (c) => c.tipo === 'negociable' && !clausulas.some((x) => x.codigo === c.codigo),
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-tinta">
            Promesa de compraventa
          </h1>
          {promesa.propiedad && (
            <p className="mt-2 text-tinta-suave">
              <Link
                href={`/propiedades/${promesa.propiedad.id}`}
                className="font-medium text-trato-700 hover:text-trato-800"
              >
                {promesa.propiedad.titulo}
              </Link>
              {' · '}
              {promesa.propiedad.comuna}
            </p>
          )}
          <p className="mt-1 text-sm text-tinta-tenue">
            {soyComprador ? 'Compras' : 'Vendes'} por{' '}
            <span className="font-semibold text-tinta">
              {formatearMonto(promesa.precio, promesa.moneda)}
            </span>
            {promesa.pie !== null && ` · pie de ${formatearMonto(promesa.pie, promesa.moneda)}`}
            {otraParte && ` · con ${otraParte.nombre} ${otraParte.apellido}`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${COLOR_ESTADO_PROMESA[promesa.estado]}`}
        >
          {ETIQUETA_ESTADO_PROMESA[promesa.estado]}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* El 1554 va arriba y completo: es lo que decide si esto vale algo. */}
      <section className="mt-8 rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
        <div className="flex items-start gap-3">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-trato-600" strokeWidth={1.75} />
          <div>
            <h2 className="font-semibold text-tinta">Requisitos del artículo 1554</h2>
            <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">
              El Código Civil dice que una promesa no obliga a nada salvo que concurran estos
              cuatro. Si falta uno, la promesa es nula y no hay contrato que exigir.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {negociacion.requisitos.map((r) => (
            <li key={r.codigo} className="flex gap-3">
              {r.cumplido ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cierre-600" strokeWidth={2.5} />
              ) : (
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  strokeWidth={2}
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-tinta">
                  <span className="text-tinta-tenue">{r.numeral}</span> · {r.exige}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-tinta-tenue">{r.porQue}</p>
                {r.falta && (
                  <p className="mt-1 text-sm font-medium text-amber-800">{r.falta}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-tinta">Cláusulas</h2>
          {negociacion.clausulasPendientes.length > 0 && (
            <p className="text-sm text-tinta-tenue">
              {negociacion.clausulasPendientes.length} por aceptar
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-4">
          {clausulas.map((c) => (
            <Clausula
              key={c.id}
              clausula={c}
              definicion={definicion(c.codigo)}
              miId={usuario.id}
              enNegociacion={enNegociacion}
              editando={editando === c.id}
              borrador={borrador}
              comentario={comentario}
              trabajando={trabajando}
              onEditar={() => {
                setEditando(c.id);
                setBorrador(c.texto);
                setComentario('');
              }}
              onCancelar={() => setEditando(null)}
              onBorrador={setBorrador}
              onComentario={setComentario}
              onGuardar={() =>
                ejecutar(() =>
                  api.put(`/promesas/${promesa.id}/clausulas/${c.codigo}`, {
                    texto: borrador,
                    comentario: comentario || undefined,
                  }),
                )
              }
              onAceptar={() =>
                ejecutar(() => api.patch(`/promesas/clausulas/${c.id}/aceptar`))
              }
              onQuitar={() => ejecutar(() => api.delete(`/promesas/clausulas/${c.id}`))}
            />
          ))}
        </ul>

        {enNegociacion && disponibles.length > 0 && (
          <div className="mt-4">
            {agregando ? (
              <div className="rounded-2xl border border-tinta/10 bg-white p-5">
                <p className="font-semibold text-tinta">Agregar una cláusula</p>
                <ul className="mt-3 space-y-2">
                  {disponibles.map((def) => (
                    <li key={def.codigo}>
                      <button
                        type="button"
                        disabled={trabajando}
                        onClick={() =>
                          ejecutar(() =>
                            api.put(`/promesas/${promesa.id}/clausulas/${def.codigo}`, {
                              texto: def.plantilla,
                            }),
                          )
                        }
                        className="block w-full rounded-xl border border-tinta/10 p-4 text-left transition hover:border-trato-300 disabled:opacity-60"
                      >
                        <span className="font-medium text-tinta">{def.titulo}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-tinta-tenue">
                          {def.porQueImporta}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setAgregando(false)}
                  className="mt-3 text-sm font-medium text-tinta-suave hover:text-tinta"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAgregando(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
              >
                <Plus className="h-4 w-4" />
                Agregar cláusula
              </button>
            )}
          </div>
        )}
      </section>

      {enNegociacion && (
        <section className="mt-10 rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
          <Handshake className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
          <h2 className="mt-3 font-semibold text-tinta">Cerrar el acuerdo</h2>
          {negociacion.puedeAcordarse ? (
            <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
              Están las dos partes de acuerdo en todas las cláusulas y se cumplen los cuatro
              requisitos. Al acordar, la promesa pasa a revisión de abogado antes de la firma.
            </p>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
              Todavía no.{' '}
              {!negociacion.cumpleElArticulo && 'Faltan requisitos del 1554. '}
              {negociacion.clausulasPendientes.length > 0 &&
                `Por aceptar: ${negociacion.clausulasPendientes.join(', ')}.`}
            </p>
          )}
          <button
            type="button"
            disabled={!negociacion.puedeAcordarse || trabajando}
            onClick={() => ejecutar(() => api.patch(`/promesas/${promesa.id}/acordar`))}
            className="mt-4 rounded-xl bg-trato-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
          >
            {trabajando ? 'Guardando...' : 'Acordar la promesa'}
          </button>
        </section>
      )}

      {promesa.estado === 'acordada' && (
        <section className="mt-10 rounded-2xl border border-cierre-100 bg-cierre-50 p-6">
          <Check className="h-6 w-6 text-cierre-600" />
          <h2 className="mt-3 font-semibold text-tinta">Promesa acordada</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
            {promesa.revisadaEn
              ? `Revisada por abogado el ${fechaLarga.format(new Date(promesa.revisadaEn))}. Queda lista para firma.`
              : 'Va a revisión de abogado antes de la firma. Te avisamos cuando esté.'}
          </p>
          <button
            type="button"
            disabled={trabajando}
            onClick={() => ejecutar(() => api.patch(`/promesas/${promesa.id}/reabrir`))}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-60"
          >
            Reabrir la negociación
          </button>
        </section>
      )}

      {(promesa.estado === 'acordada' ||
        promesa.estado === 'firmada' ||
        promesa.estado === 'cumplida') && (
        <FirmarPromesa promesaId={promesa.id} onFirmada={cargar} />
      )}

      <p className="mt-10 text-xs leading-relaxed text-tinta-tenue">
        Los textos son plantillas para negociar, no un contrato listo para firmar. La promesa
        acordada la revisa un abogado antes de la firma. La compraventa definitiva va por
        escritura pública ante notario.
      </p>
    </div>
  );
}

function Clausula({
  clausula,
  definicion,
  miId,
  enNegociacion,
  editando,
  borrador,
  comentario,
  trabajando,
  onEditar,
  onCancelar,
  onBorrador,
  onComentario,
  onGuardar,
  onAceptar,
  onQuitar,
}: {
  clausula: ClausulaApi;
  definicion?: DefinicionClausulaApi;
  miId: string;
  enNegociacion: boolean;
  editando: boolean;
  borrador: string;
  comentario: string;
  trabajando: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onBorrador: (v: string) => void;
  onComentario: (v: string) => void;
  onGuardar: () => void;
  onAceptar: () => void;
  onQuitar: () => void;
}) {
  const laPropusseYo = clausula.propuestaPorId === miId;
  const acordada = clausula.aceptadaPorId !== null;
  const huecos = marcadoresPendientes(clausula.texto);

  return (
    <li className="rounded-2xl border border-tinta/10 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-semibold text-tinta">{definicion?.titulo ?? clausula.codigo}</h3>
        <div className="flex items-center gap-2">
          {definicion?.tipo === 'obligatoria' && (
            <span className="rounded-full bg-tinta/5 px-2.5 py-0.5 text-xs font-medium text-tinta-suave">
              Obligatoria
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              acordada ? 'bg-cierre-50 text-cierre-700' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {acordada ? 'Acordada' : laPropusseYo ? 'Esperando a la otra parte' : 'Por revisar'}
          </span>
        </div>
      </div>

      {definicion && (
        <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">{definicion.queDice}</p>
      )}

      {editando ? (
        <div className="mt-4">
          <textarea
            value={borrador}
            onChange={(e) => onBorrador(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-tinta/15 px-3 py-2.5 text-sm leading-relaxed text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
          />
          <input
            value={comentario}
            onChange={(e) => onComentario(e.target.value)}
            placeholder="Por qué lo cambias (opcional)"
            className="mt-2 w-full rounded-xl border border-tinta/15 px-3 py-2 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={onGuardar}
              disabled={trabajando}
              className="rounded-xl bg-trato-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
            >
              Proponer este texto
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-line rounded-xl bg-tinta/[0.02] px-4 py-3 text-sm leading-relaxed text-tinta-suave">
            {clausula.texto}
          </p>

          {huecos.length > 0 && (
            <p className="mt-2 flex gap-2 text-xs leading-relaxed text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Falta completar: {huecos.join(', ')}. Una promesa con datos sin llenar no se puede
              firmar.
            </p>
          )}

          {clausula.comentario && (
            <p className="mt-2 text-sm italic leading-relaxed text-tinta-tenue">
              “{clausula.comentario}”
            </p>
          )}

          {enNegociacion && (
            <div className="mt-4 flex flex-wrap gap-3">
              {!acordada && !laPropusseYo && (
                <button
                  type="button"
                  onClick={onAceptar}
                  disabled={trabajando || huecos.length > 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cierre-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cierre-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Aceptar
                </button>
              )}
              <button
                type="button"
                onClick={onEditar}
                disabled={trabajando}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30 disabled:opacity-60"
              >
                <Pencil className="h-3.5 w-3.5" />
                {acordada ? 'Cambiar' : 'Proponer otro texto'}
              </button>
              {definicion?.tipo === 'negociable' && (
                <button
                  type="button"
                  onClick={onQuitar}
                  disabled={trabajando}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-tinta-tenue transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              )}
            </div>
          )}

          {acordada && enNegociacion && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-tinta-tenue">
              <X className="h-3 w-3" />
              Si alguien cambia el texto, esta aceptación se anula.
            </p>
          )}
        </>
      )}
    </li>
  );
}
