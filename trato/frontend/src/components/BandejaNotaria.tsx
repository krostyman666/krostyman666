'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, FileText, Inbox, MessageSquareWarning } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { ETIQUETA_EMISOR, type DocumentoApi } from '@/lib/propiedades';
import { formatearRut } from '@/lib/rut';

interface Caso {
  propiedad: { id: string; titulo: string; calle: string; numero: string; comuna: string };
  vendedor: { nombre: string; apellido: string; rut: string } | null;
  totalDocumentos: number;
  porRevisar: number;
  observados: number;
  aprobados: number;
  documentos: DocumentoApi[];
}

export default function BandejaNotaria() {
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observando, setObservando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<{ casos: Caso[] }>('/notarias/bandeja');
      setCasos(data.casos);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function validar(docId: string, validacion: 'aprobado' | 'observado') {
    if (validacion === 'observado' && !motivo.trim()) return;
    setOcupado(docId);
    setError(null);
    try {
      await api.patch(`/notarias/documentos/${docId}/validacion`, {
        validacion,
        observacionNotaria: validacion === 'observado' ? motivo.trim() : undefined,
      });
      setObservando(null);
      setMotivo('');
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setOcupado(null);
    }
  }

  if (error && !casos) {
    return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }
  if (!casos) return <p className="text-tinta-tenue">Cargando tu bandeja...</p>;

  const pendientes = casos.reduce((n, c) => n + c.porRevisar, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-carta ring-1 ring-tinta/5">
        <Inbox className="h-5 w-5 text-trato-600" />
        <p className="text-sm text-tinta-suave">
          {pendientes === 0
            ? 'No tienes documentos esperando revisión.'
            : `${pendientes} ${pendientes === 1 ? 'documento espera' : 'documentos esperan'} tu revisión en ${casos.length} ${casos.length === 1 ? 'expediente' : 'expedientes'}.`}
        </p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {casos.map((caso) => (
        <section
          key={caso.propiedad.id}
          className="rounded-2xl bg-white p-6 shadow-carta ring-1 ring-tinta/5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-tinta/10 pb-4">
            <div>
              <h2 className="font-semibold text-tinta">{caso.propiedad.titulo}</h2>
              <p className="mt-1 text-sm text-tinta-tenue">
                {caso.propiedad.calle} {caso.propiedad.numero}, {caso.propiedad.comuna}
              </p>
              {caso.vendedor && (
                <p className="mt-1 text-sm text-tinta-tenue">
                  Vendedor: {caso.vendedor.nombre} {caso.vendedor.apellido} · RUT{' '}
                  {formatearRut(caso.vendedor.rut)}
                </p>
              )}
            </div>
            <div className="text-right text-xs tabular-nums text-tinta-tenue">
              <p>{caso.aprobados} aprobados</p>
              {caso.observados > 0 && (
                <p className="text-amber-700">{caso.observados} observados</p>
              )}
              <p>de {caso.totalDocumentos}</p>
            </div>
          </div>

          {caso.documentos.length === 0 ? (
            <p className="pt-4 text-sm text-tinta-tenue">Nada pendiente en este expediente.</p>
          ) : (
            <ul className="divide-y divide-tinta/5">
              {caso.documentos.map((doc) => (
                <li key={doc.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-tinta">
                        <FileText className="h-4 w-4 shrink-0 text-tinta/30" />
                        {doc.nombre}
                      </p>
                      <p className="mt-1 text-xs text-tinta-tenue">
                        {ETIQUETA_EMISOR[doc.emisor] ?? doc.emisor}
                        {doc.fechaEmision &&
                          ` · emitido ${new Date(doc.fechaEmision).toLocaleDateString('es-CL')}`}
                        {doc.diasParaVencer !== null && ` · vence en ${doc.diasParaVencer} días`}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => validar(doc.id, 'aprobado')}
                        disabled={ocupado === doc.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cierre-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cierre-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setObservando(observando === doc.id ? null : doc.id);
                          setMotivo('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 transition hover:bg-amber-50"
                      >
                        <MessageSquareWarning className="h-3.5 w-3.5" />
                        Observar
                      </button>
                    </div>
                  </div>

                  {observando === doc.id && (
                    <div className="mt-3 rounded-xl bg-amber-50 p-3">
                      <label
                        htmlFor={`motivo-${doc.id}`}
                        className="block text-xs font-medium text-amber-900"
                      >
                        ¿Qué hay que corregir?
                      </label>
                      <textarea
                        id={`motivo-${doc.id}`}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        rows={2}
                        className="mt-1.5 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                        placeholder="El rol del certificado no coincide con el de la inscripción."
                      />
                      <button
                        type="button"
                        onClick={() => validar(doc.id, 'observado')}
                        disabled={!motivo.trim() || ocupado === doc.id}
                        className="mt-2 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800 disabled:opacity-40"
                      >
                        Enviar observación
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
