'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, FileCheck2, Landmark, ListChecks } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import type { EstadoEscrituraApi } from '@/lib/promesas';
import { ETIQUETA_EMISOR } from '@/lib/propiedades';

const fechaLarga = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'long',
});

/**
 * Cómo va el cierre, después de la firma de la promesa.
 *
 * Es de sólo lectura: nadie firma ni aprueba nada acá. La escritura va ante
 * notario y la inscripción la hace el Conservador -- lo que esta sección
 * muestra es el expediente y los dos documentos que registran que eso ya
 * ocurrió, que es justo lo que la notaría valida en su bandeja.
 */
export default function SeguimientoEscritura({ promesaId }: { promesaId: string }) {
  const [datos, setDatos] = useState<EstadoEscrituraApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<EstadoEscrituraApi>(`/promesas/${promesaId}/escritura`);
      setDatos(data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [promesaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!datos) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    ) : null;
  }

  const { expediente, escritura, inscripcion, propiedadVendida } = datos;

  return (
    <section className="mt-10 rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <div className="flex items-center gap-2">
        <Landmark className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
        <h2 className="font-semibold text-tinta">Escritura e inscripción</h2>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
        Esto va ante notario y ante el Conservador, no en la plataforma. Acá se ve en qué va,
        a medida que la notaría aprueba cada documento del expediente.
      </p>

      {propiedadVendida ? (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-cierre-50 px-4 py-3.5 text-sm text-cierre-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Venta inscrita. El dominio ya está inscrito a nombre del comprador en el
            Conservador.
          </span>
        </div>
      ) : !expediente.listo ? (
        <div className="mt-5 rounded-xl bg-tinta/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-tinta">
            <ListChecks className="h-4 w-4 text-tinta-tenue" />
            El expediente todavía no está listo para escriturar
          </p>
          <p className="mt-1 text-sm text-tinta-tenue">
            Falta que la notaría apruebe {expediente.faltan.length === 1 ? 'este certificado' : 'estos certificados'}:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-tinta-suave">
            {expediente.faltan.map((d) => (
              <li key={d.codigo}>
                · {d.codigo} {d.vencido && '(vencido)'}
                {d.observacionNotaria && ` — ${d.observacionNotaria}`}
              </li>
            ))}
          </ul>
        </div>
      ) : escritura?.conforme ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-cierre-50 px-4 py-3.5 text-sm text-cierre-800">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              Escritura otorgada
              {datos.promesa.cumplidaEn &&
                ` el ${fechaLarga.format(new Date(datos.promesa.cumplidaEn))}`}
              . Falta la inscripción en el Conservador de Bienes Raíces.
            </span>
          </div>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-tinta-tenue">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            El Conservador tiene hasta 20 días hábiles para inscribir, más si observa algo. El
            dominio se transfiere recién con la inscripción, no antes.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-trato-50 px-4 py-3.5 text-sm text-trato-800">
          El expediente está listo. Corresponde coordinar la firma de la escritura con la{' '}
          {ETIQUETA_EMISOR.notaria.toLowerCase()} asignada, y subir el documento firmado en el
          expediente para que lo valide.
        </div>
      )}

      {inscripcion?.observacionNotaria && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La notaría observó la inscripción: {inscripcion.observacionNotaria}
        </p>
      )}
    </section>
  );
}
