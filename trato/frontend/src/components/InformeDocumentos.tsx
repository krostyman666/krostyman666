'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Clock, FileText } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import {
  ETIQUETA_EMISOR,
  ETIQUETA_ESTADO_DOC,
  ETIQUETA_ETAPA,
  type DocumentoApi,
  type InformeApi,
} from '@/lib/propiedades';

export default function InformeDocumentos({ propiedadId }: { propiedadId: string }) {
  const [informe, setInforme] = useState<InformeApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

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

  async function marcarRecibido(doc: DocumentoApi) {
    setGuardando(doc.id);
    setError(null);
    try {
      await api.patch(`/propiedades/documentos/${doc.id}`, {
        estado: 'recibido',
        fechaEmision: new Date().toISOString(),
      });
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(null);
    }
  }

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
                      {doc.estado === 'recibido' && !doc.vencido ? (
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
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        doc.vencido
                          ? 'bg-amber-100 text-amber-800'
                          : doc.estado === 'recibido'
                            ? 'bg-cierre-100 text-cierre-700'
                            : 'bg-tinta/5 text-tinta-tenue'
                      }`}
                    >
                      {doc.vencido ? 'Vencido' : (ETIQUETA_ESTADO_DOC[doc.estado] ?? doc.estado)}
                    </span>

                    {doc.estado === 'recibido' &&
                      !doc.vencido &&
                      doc.diasParaVencer !== null && (
                        <span className="flex items-center gap-1 text-xs text-tinta-tenue">
                          <Clock className="h-3 w-3" />
                          vence en {doc.diasParaVencer} días
                        </span>
                      )}

                    {doc.estado !== 'recibido' || doc.vencido ? (
                      <button
                        type="button"
                        onClick={() => marcarRecibido(doc)}
                        disabled={guardando === doc.id}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-trato-700 transition hover:bg-trato-50 disabled:opacity-50"
                      >
                        {guardando === doc.id ? 'Guardando...' : 'Ya lo tengo'}
                      </button>
                    ) : null}
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
