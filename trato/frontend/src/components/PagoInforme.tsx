'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Check, Copy, CreditCard } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { formatearPesos } from '@/lib/informes';

interface MedioDisponible {
  medio: 'transferencia' | 'webpay';
  nombre: string;
  confirmacion: string;
  nota: string;
  recomendado: boolean;
}

interface Transferencia {
  banco: string;
  tipoCuenta: string;
  numero: string;
  titular: string;
  rut: string;
  email: string;
}

interface PagoApi {
  id: string;
  monto: number;
  medio: string;
  estado: 'pendiente' | 'pagado' | 'anulado' | 'reembolsado';
  referencia: string;
  reportadoEn: string | null;
}

interface Respuesta {
  monto: number;
  medios: MedioDisponible[];
  transferencia: Transferencia | null;
  pagos: PagoApi[];
}

export default function PagoInforme({
  informeId,
  onPagado,
}: {
  informeId: string;
  onPagado?: () => void;
}) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<Respuesta>(`/pagos/informe/${informeId}`);
      setDatos(data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [informeId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function elegir(medio: string) {
    setTrabajando(true);
    setError(null);
    try {
      await api.post(`/pagos/informe/${informeId}`, { medio });
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  async function avisar(pagoId: string) {
    setTrabajando(true);
    setError(null);
    try {
      await api.patch(`/pagos/${pagoId}/reportar`, {});
      await cargar();
      onPagado?.();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  if (error && !datos) return <p className="text-sm text-red-600">{error}</p>;
  if (!datos) return <p className="text-sm text-tinta-tenue">Cargando medios de pago...</p>;

  const pendiente = datos.pagos.find((p) => p.estado === 'pendiente');

  if (datos.medios.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-tinta">Todavía no se puede pagar en línea</p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
          Escríbenos y coordinamos el pago de {formatearPesos(datos.monto)} por fuera.
        </p>
      </div>
    );
  }

  if (pendiente && pendiente.medio === 'transferencia' && datos.transferencia) {
    const t = datos.transferencia;
    return (
      <div className="rounded-2xl border border-trato-200 bg-trato-50/60 p-6">
        <Building2 className="h-6 w-6 text-trato-700" strokeWidth={1.75} />
        <h3 className="mt-3 font-semibold text-tinta">
          Transfiere {formatearPesos(pendiente.monto)}
        </h3>

        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ['Banco', t.banco],
            ['Tipo de cuenta', t.tipoCuenta],
            ['Número', t.numero],
            ['Titular', t.titular],
            ['RUT', t.rut],
            ['Correo', t.email],
          ]
            .filter(([, valor]) => valor)
            .map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt className="text-xs text-tinta-tenue">{etiqueta}</dt>
                <dd className="mt-0.5 font-medium text-tinta">{valor}</dd>
              </div>
            ))}
        </dl>

        {/* La referencia es lo que permite calzar la transferencia en la
            cartola. Sin ella hay que adivinar de quién es el abono. */}
        <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-trato-200">
          <p className="text-xs text-tinta-tenue">
            Pon esto en el mensaje de la transferencia
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <code className="text-lg font-bold tracking-wide text-tinta">
              {pendiente.referencia}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(pendiente.referencia);
                setCopiado(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-tinta-suave ring-1 ring-tinta/15 transition hover:ring-tinta/30"
            >
              {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-tinta-tenue">
            Sin este código no podemos saber cuál abono es tuyo.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {pendiente.reportadoEn ? (
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-cierre-700">
            <Check className="h-4 w-4" />
            Nos avisaste. Revisamos la cartola y te confirmamos dentro de un día hábil.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => avisar(pendiente.id)}
            disabled={trabajando}
            className="mt-5 w-full rounded-xl bg-trato-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
          >
            {trabajando ? 'Avisando...' : 'Ya transferí'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <CreditCard className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
      <h3 className="mt-3 font-semibold text-tinta">
        Cómo quieres pagar {formatearPesos(datos.monto)}
      </h3>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {datos.medios.map((m) => (
          <button
            key={m.medio}
            type="button"
            onClick={() => elegir(m.medio)}
            disabled={trabajando}
            className={`block w-full rounded-xl border p-4 text-left transition disabled:opacity-60 ${
              m.recomendado
                ? 'border-trato-300 bg-trato-50/40 hover:border-trato-400'
                : 'border-tinta/10 hover:border-tinta/25'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-tinta">{m.nombre}</span>
              {m.recomendado && (
                <span className="rounded-full bg-cierre-50 px-2.5 py-0.5 text-xs font-medium text-cierre-700">
                  Recomendado
                </span>
              )}
            </div>
            <span className="mt-1 block text-sm text-tinta-tenue">{m.confirmacion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
