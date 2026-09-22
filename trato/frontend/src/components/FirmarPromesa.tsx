'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, FileSignature, Lock, ShieldCheck } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import type { EstadoFirmaApi } from '@/lib/promesas';

const fechaHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'long',
  timeStyle: 'short',
});

/**
 * La firma de la promesa, por las dos partes.
 *
 * Muestra el contrato completo antes de firmar, no un resumen: nadie puede
 * consentir lo que no leyó, y lo que se firma es exactamente ese texto. El hash
 * va a la vista porque es la huella de lo firmado — si una cláusula cambiara,
 * dejaría de calzar y se vería.
 */
export default function FirmarPromesa({
  promesaId,
  onFirmada,
}: {
  promesaId: string;
  onFirmada: () => void;
}) {
  const [firma, setFirma] = useState<EstadoFirmaApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firmando, setFirmando] = useState(false);
  const [leido, setLeido] = useState(false);
  const [verTexto, setVerTexto] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<EstadoFirmaApi>(`/promesas/${promesaId}/firma`);
      setFirma(data);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [promesaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function firmar() {
    setFirmando(true);
    setError(null);
    try {
      const { data } = await api.patch<EstadoFirmaApi>(`/promesas/${promesaId}/firmar`);
      setFirma(data);
      if (data.estaFirmada) onFirmada();
    } catch (e) {
      setError(mensajeDeError(e));
      await cargar();
    } finally {
      setFirmando(false);
    }
  }

  if (!firma) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    ) : null;
  }

  const alterada = firma.firmas.some((f) => !f.integra);

  return (
    <section className="mt-10 rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <div className="flex items-center gap-2">
        <FileSignature className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
        <h2 className="font-semibold text-tinta">
          {firma.estaFirmada ? 'Promesa firmada' : 'Firma de la promesa'}
        </h2>
      </div>

      {firma.estaFirmada ? (
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
          Firmada por ambas partes. La compraventa definitiva va por escritura pública ante
          notario: eso no se firma electrónicamente.
        </p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
          Firman las dos partes. La promesa queda firmada cuando ambas firman el mismo texto.
        </p>
      )}

      {/* Quién firmó */}
      <ul className="mt-5 space-y-2">
        {(['comprador', 'vendedor'] as const).map((rol) => {
          const f = firma.firmas.find((x) => x.rol === rol);
          return (
            <li
              key={rol}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm ${
                f ? 'bg-cierre-50' : 'bg-tinta/[0.03]'
              }`}
            >
              <span className="font-medium text-tinta first-letter:uppercase">
                {f ? `${rol}: ${f.nombre}` : rol}
              </span>
              {f ? (
                <span className="flex items-center gap-1.5 text-xs text-cierre-700">
                  <Check className="h-4 w-4" />
                  Firmó el {fechaHora.format(new Date(f.firmadoEn))}
                </span>
              ) : (
                <span className="text-xs text-tinta-tenue">Sin firmar</span>
              )}
            </li>
          );
        })}
      </ul>

      {alterada && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El registro de una firma no calza con su propia huella. No sigas: avísanos para
            revisarlo.
          </span>
        </p>
      )}

      {/* El contrato */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setVerTexto((v) => !v)}
          className="text-sm font-medium text-trato-700 hover:text-trato-800"
        >
          {verTexto ? 'Ocultar el contrato' : 'Leer el contrato completo'}
        </button>
        {verTexto && (
          <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-tinta/[0.03] p-4 font-sans text-sm leading-relaxed text-tinta-suave">
            {firma.texto}
          </pre>
        )}
        <p className="mt-2 break-all text-[11px] text-tinta-tenue">
          Huella del documento (SHA-256): <code>{firma.hash}</code>
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {firma.bloqueo && !firma.estaFirmada && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-tinta/[0.03] px-4 py-3 text-sm text-tinta-suave">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-tinta-tenue" />
          {firma.bloqueo}
        </p>
      )}

      {firma.yaFirmaste && !firma.estaFirmada && (
        <p className="mt-5 rounded-xl bg-trato-50 px-4 py-3 text-sm text-trato-800">
          Ya firmaste. Falta la otra parte; te avisamos cuando firme.
        </p>
      )}

      {firma.puedesFirmar && (
        <div className="mt-5 border-t border-tinta/10 pt-5">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-tinta-suave">
            <input
              type="checkbox"
              checked={leido}
              onChange={(e) => setLeido(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-tinta/30 text-trato-600 focus:ring-trato-500"
            />
            <span>
              Leí el contrato completo y estoy de acuerdo en firmarlo electrónicamente.
            </span>
          </label>

          <button
            type="button"
            onClick={firmar}
            disabled={!leido || firmando}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-trato-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
          >
            <FileSignature className="h-4 w-4" />
            {firmando ? 'Firmando...' : 'Firmar la promesa'}
          </button>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-tinta-tenue">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {firma.proveedor === 'simple'
            ? 'Firma electrónica simple (Ley 19.799): válida para una promesa. Queda registrada la fecha, la IP y la huella del documento firmado. La compraventa definitiva va por escritura pública ante notario.'
            : 'Firma a través del proveedor configurado. La compraventa definitiva va por escritura pública ante notario.'}
        </span>
      </p>
    </section>
  );
}
