'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Calculator, FileText } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import type { MinutaApi } from '@/lib/promesas';
import { calcularTimbres } from '@trato/shared';

const formatearClp = (n: number) => `$${new Intl.NumberFormat('es-CL').format(n)}`;

/**
 * Borrador de la escritura: lo que `generarMinuta` arma con los datos que el
 * sistema ya tiene (promesa, inmueble, expediente conforme). No reemplaza al
 * abogado -- cada sección trae marcadores "[PENDIENTE: ...]" donde falta un
 * dato que el sistema no sistematiza, igual que las plantillas de cláusulas
 * de la promesa. Ver dominio/minuta.ts.
 */
export default function MinutaEscritura({ promesaId }: { promesaId: string }) {
  const [datos, setDatos] = useState<MinutaApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<MinutaApi>(`/promesas/${promesaId}/minuta`);
      setDatos(data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [promesaId]);

  useEffect(() => {
    if (mostrar && !datos) cargar();
  }, [mostrar, datos, cargar]);

  return (
    <section className="mt-6 rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <button
        type="button"
        onClick={() => setMostrar((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-tinta">
          <FileText className="h-5 w-5 text-trato-600" strokeWidth={1.75} />
          Borrador de la escritura
        </span>
        <span className="text-sm text-trato-600">{mostrar ? 'Ocultar' : 'Ver borrador'}</span>
      </button>

      {mostrar && (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-tinta-tenue">
            Es un borrador para que el abogado lo revise y complete antes de llevarlo a la
            notaría, armado con lo que ya está en el expediente. No es la escritura final.
          </p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {!datos && !error && <p className="mt-3 text-sm text-tinta-tenue">Cargando...</p>}

          {datos && (
            <>
              <div className="mt-5 space-y-5">
                {datos.secciones.map((s) => (
                  <div key={s.titulo}>
                    <h3 className="text-sm font-semibold text-tinta">{s.titulo}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-tinta-suave">
                      {s.texto}
                    </p>
                  </div>
                ))}
              </div>

              {datos.advertencias.length > 0 && (
                <div className="mt-6 rounded-xl bg-amber-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    Antes de llevar esto a la notaría
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-800">
                    {datos.advertencias.map((a) => (
                      <li key={a}>· {a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {datos.hayCredito && <CalculadoraTimbres />}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function CalculadoraTimbres() {
  const [monto, setMonto] = useState('');
  const [meses, setMeses] = useState('240');

  const montoNum = Number(monto.replace(/\D/g, ''));
  const mesesNum = Number(meses);
  const resultado =
    montoNum > 0 && mesesNum > 0 ? calcularTimbres(montoNum, mesesNum) : null;

  return (
    <div className="mt-6 rounded-xl border border-tinta/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
        <Calculator className="h-4 w-4 text-trato-600" />
        Impuesto de timbres y estampillas
      </p>
      <p className="mt-1 text-xs leading-relaxed text-tinta-tenue">
        0,066% del crédito por cada mes o fracción hasta el vencimiento, con tope de 0,8% (DL
        3.475). Calcula con el monto y plazo que informe el banco una vez aprobado.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
            Monto del crédito (CLP)
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="100.000.000"
            className="w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
            Plazo del crédito (meses)
          </span>
          <input
            type="number"
            min={1}
            value={meses}
            onChange={(e) => setMeses(e.target.value)}
            className="w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100"
          />
        </label>
      </div>

      {resultado && (
        <p className="mt-3 text-sm text-tinta">
          Tasa: <strong>{(resultado.tasa * 100).toFixed(3)}%</strong> · Impuesto:{' '}
          <strong>{formatearClp(resultado.montoClp)}</strong>
        </p>
      )}
    </div>
  );
}
