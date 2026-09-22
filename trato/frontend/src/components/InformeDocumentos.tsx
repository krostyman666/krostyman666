'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Clock, Eye, FileText, Upload } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import {
  ETIQUETA_EMISOR,
  ETIQUETA_ESTADO_DOC,
  ETIQUETA_ETAPA,
  type DocumentoApi,
  type InformeApi,
} from '@/lib/propiedades';
import {
  ACCEPT_ARCHIVOS,
  LIMITE_MB,
  abrirArchivo,
  subirArchivo,
  tipoAceptado,
} from '@/lib/documentos';

function textoBadge(doc: DocumentoApi): string {
  if (doc.vencido) return 'Vencido';
  if (doc.validacion === 'observado') return 'Observado';
  if (doc.conforme) return 'Aprobado';
  if (doc.estado === 'recibido') return 'En revisión';
  return ETIQUETA_ESTADO_DOC[doc.estado] ?? doc.estado;
}

function claseBadge(doc: DocumentoApi): string {
  if (doc.vencido || doc.validacion === 'observado') return 'bg-amber-100 text-amber-800';
  if (doc.conforme) return 'bg-cierre-100 text-cierre-700';
  if (doc.estado === 'recibido') return 'bg-trato-50 text-trato-700';
  return 'bg-tinta/5 text-tinta-tenue';
}

export default function InformeDocumentos({ propiedadId }: { propiedadId: string }) {
  const [informe, setInforme] = useState<InformeApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<InformeApi>(`/propiedades/${propiedadId}/informe`);
      setInforme(data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [propiedadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error && !informe) {
    return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }
  if (!informe) return <p className="text-tinta-tenue">Cargando tus trámites...</p>;

  const etapas = informe.porEtapa.map((e) => ({
    ...e,
    docs: informe.documentos.filter((d) => d.etapa === e.etapa),
  }));

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-carta ring-1 ring-tinta/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-tinta">Avance de tus trámites</h2>
          <span className="text-sm tabular-nums text-tinta-tenue">
            {informe.recibidos} de {informe.totalDocumentos} listos
          </span>
        </div>

        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-tinta/10"
          role="progressbar"
          aria-valuenow={informe.avance}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance de documentos"
        >
          <div
            className="h-full rounded-full bg-cierre-500 transition-all"
            style={{ width: `${informe.avance}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-tinta-tenue">
          {informe.aprobados} {informe.aprobados === 1 ? 'aprobado' : 'aprobados'} por la notaría.
          Tener el papel no basta: la notaría lo revisa antes de la escritura.
        </p>

        {informe.observados > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              La notaría observó {informe.observados}{' '}
              {informe.observados === 1 ? 'documento' : 'documentos'}. Mira el detalle más abajo:
              hasta corregirlo no se puede escriturar.
            </span>
          </p>
        )}

        {informe.vencidos > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {informe.vencidos === 1
                ? 'Un certificado ya venció y hay que pedirlo de nuevo.'
                : `${informe.vencidos} certificados vencieron y hay que pedirlos de nuevo.`}{' '}
              Los certificados del Conservador tienen vigencia corta: si la operación se alarga,
              caducan antes de la firma.
            </span>
          </p>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {etapas.map((etapa) => (
        <section key={etapa.etapa}>
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-tinta">
              {ETIQUETA_ETAPA[etapa.etapa] ?? etapa.etapa}
            </h3>
            <span className="text-xs tabular-nums text-tinta-tenue">
              {etapa.recibidos}/{etapa.total}
            </span>
          </div>

          <ul className="mt-3 space-y-2">
            {etapa.docs.map((doc) => (
              <li
                key={doc.id}
                className={`rounded-xl border bg-white p-4 ${
                  doc.vencido ? 'border-amber-300 bg-amber-50/40' : 'border-tinta/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium text-tinta">
                      {doc.conforme ? (
                        <Check className="h-4 w-4 shrink-0 text-cierre-600" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-tinta/30" />
                      )}
                      {doc.nombre}
                    </p>
                    <p className="mt-1 text-xs text-tinta-tenue">
                      Lo emite {ETIQUETA_EMISOR[doc.emisor] ?? doc.emisor} · lo gestiona{' '}
                      {doc.responsable === 'plataforma' ? 'Trato' : doc.responsable}
                    </p>
                    {doc.comoSeObtiene && (
                      <p className="mt-2 text-xs leading-relaxed text-tinta-tenue">
                        {doc.comoSeObtiene}
                      </p>
                    )}
                    {doc.validacion === 'observado' && doc.observacionNotaria && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                        <span className="font-medium">La notaría observó: </span>
                        {doc.observacionNotaria}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${claseBadge(doc)}`}>
                      {textoBadge(doc)}
                    </span>

                    {doc.estado === 'recibido' &&
                      !doc.vencido &&
                      doc.diasParaVencer !== null && (
                        <span className="flex items-center gap-1 text-xs text-tinta-tenue">
                          <Clock className="h-3 w-3" />
                          vence en {doc.diasParaVencer} días
                        </span>
                      )}

                    <ArchivoDoc doc={doc} onHecho={cargar} onError={setError} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Fecha de hoy en YYYY-MM-DD, hora de pared local. Sirve de valor por defecto
 * para la fecha de emisión al subir. */
function hoyISO(): string {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * Subir, ver y reemplazar el archivo de un documento.
 *
 * Subir un archivo es marcarlo recibido: por eso pide la fecha de emisión, que
 * es la que fija la vigencia. Reemplazarlo manda la notaría a revisarlo de
 * nuevo, así que se avisa. El archivo no se abre con un enlace directo —no es
 * público— sino que se baja con la sesión y se abre en una pestaña.
 */
function ArchivoDoc({
  doc,
  onHecho,
  onError,
}: {
  doc: DocumentoApi;
  onHecho: () => void;
  onError: (m: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [subiendo, setSubiendo] = useState(false);
  const [viendo, setViendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!tipoAceptado(file)) {
      onError('El archivo tiene que ser PDF, JPG o PNG.');
      return;
    }
    if (file.size > LIMITE_MB * 1024 * 1024) {
      onError(`El archivo no puede pesar más de ${LIMITE_MB} MB.`);
      return;
    }
    setSubiendo(true);
    onError('');
    try {
      await subirArchivo(doc.id, file, fecha);
      setAbierto(false);
      onHecho();
    } catch (err) {
      onError(mensajeDeError(err));
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function ver() {
    setViendo(true);
    onError('');
    try {
      await abrirArchivo(doc.id);
    } catch (err) {
      onError(mensajeDeError(err));
    } finally {
      setViendo(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {doc.tieneArchivo && (
        <button
          type="button"
          onClick={ver}
          disabled={viendo}
          className="inline-flex items-center gap-1 text-xs font-medium text-trato-700 transition hover:text-trato-800 disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          {viendo ? 'Abriendo...' : 'Ver archivo'}
        </button>
      )}

      {!abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-trato-700 transition hover:bg-trato-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {doc.tieneArchivo ? 'Reemplazar' : 'Subir archivo'}
        </button>
      ) : (
        <div className="flex flex-col items-end gap-1.5 rounded-lg bg-tinta/[0.03] p-2.5">
          <label className="text-[11px] text-tinta-tenue">
            Fecha de emisión del documento
            <input
              type="date"
              value={fecha}
              max={hoyISO()}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 block rounded-md border border-tinta/15 px-2 py-1 text-xs text-tinta outline-none focus:border-trato-500"
            />
          </label>
          {/* El input va oculto: el botón nativo trae su texto del navegador
              ("Choose File") y en una app en español eso se lee como un error. */}
          <label
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md bg-trato-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-trato-700 ${
              subiendo || !fecha ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            {subiendo ? 'Subiendo...' : 'Elegir archivo'}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ARCHIVOS}
              onChange={alElegir}
              disabled={subiendo || !fecha}
              className="sr-only"
            />
          </label>
          <p className="text-[11px] text-tinta-tenue">PDF, JPG o PNG · hasta {LIMITE_MB} MB</p>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="text-[11px] font-medium text-tinta-tenue hover:text-tinta"
          >
            Cancelar
          </button>
          {doc.tieneArchivo && (
            <p className="max-w-[12rem] text-right text-[11px] leading-tight text-tinta-tenue">
              Reemplazarlo hace que la notaría lo revise de nuevo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
