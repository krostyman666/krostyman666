'use client';

import { useCallback, useEffect, useState } from 'react';
import { PenLine } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

type Tipo = 'avaluo_fiscal' | 'contribuciones';

interface PropiedadPendiente {
  id: string;
  rolAvaluo: string;
  titulo: string;
  comuna: string;
}

interface CuotaForm {
  periodo: string;
  monto: string;
  vencimiento: string;
  estado: 'pagada' | 'pendiente' | 'atrasada';
}

const CUOTA_VACIA: CuotaForm = { periodo: '', monto: '', vencimiento: '', estado: 'pendiente' };

const INPUT =
  'w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

/**
 * Carga manual de avalúo fiscal y contribuciones, para cuando el flujo de n8n
 * no puede consultarlas -- portal bloqueado, flujo todavía sin correr, lo que
 * sea. Mismo destino que usa n8n (`Propiedad.avaluoFiscalCache` /
 * `contribucionesCache`): el informe no distingue cómo llegó el dato, sólo
 * guarda `fuente: 'manual'` para trazabilidad.
 */
export default function DatosExternosPendientes() {
  const { usuario, estado } = useSesion();
  const [tipo, setTipo] = useState<Tipo>('avaluo_fiscal');
  const [propiedades, setPropiedades] = useState<PropiedadPendiente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async (t: Tipo) => {
    setError(null);
    setPropiedades(null);
    try {
      const { data } = await api.get<{ propiedades: PropiedadPendiente[] }>(
        `/propiedades/pendientes-datos-externos?tipo=${t}`,
      );
      setPropiedades(data.propiedades);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado') cargar(tipo);
  }, [estado, tipo, cargar]);

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (usuario && usuario.rol !== 'admin' && usuario.rol !== 'asesor') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Esto es interno: avalúo fiscal y contribuciones.
      </p>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        {(['avaluo_fiscal', 'contribuciones'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tipo === t ? 'bg-trato-600 text-white' : 'bg-tinta/5 text-tinta-suave hover:bg-tinta/10'
            }`}
          >
            {t === 'avaluo_fiscal' ? 'Avalúo fiscal' : 'Contribuciones'}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!propiedades && !error && (
        <p className="mt-4 text-sm text-tinta-tenue">Cargando propiedades...</p>
      )}

      {propiedades && propiedades.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-tinta/20 px-4 py-8 text-center text-sm text-tinta-tenue">
          No hay propiedades pendientes de {tipo === 'avaluo_fiscal' ? 'avalúo fiscal' : 'contribuciones'}.
        </p>
      )}

      {propiedades && propiedades.length > 0 && (
        <ul className="mt-4 space-y-3">
          {propiedades.map((p) => (
            <li key={p.id} className="rounded-xl border border-tinta/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-tinta">{p.titulo}</p>
                  <p className="text-xs text-tinta-tenue">
                    {p.comuna} · rol {p.rolAvaluo}
                  </p>
                </div>
                {abierta !== p.id && (
                  <button
                    type="button"
                    onClick={() => setAbierta(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-trato-50 px-3 py-1.5 text-sm font-medium text-trato-700 hover:bg-trato-100"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Llenar a mano
                  </button>
                )}
              </div>

              {abierta === p.id && tipo === 'avaluo_fiscal' && (
                <FormAvaluoFiscal
                  propiedadId={p.id}
                  onListo={() => {
                    setAbierta(null);
                    cargar(tipo);
                  }}
                  onCancelar={() => setAbierta(null)}
                  onError={setError}
                />
              )}
              {abierta === p.id && tipo === 'contribuciones' && (
                <FormContribuciones
                  propiedadId={p.id}
                  onListo={() => {
                    setAbierta(null);
                    cargar(tipo);
                  }}
                  onCancelar={() => setAbierta(null)}
                  onError={setError}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormAvaluoFiscal({
  propiedadId,
  onListo,
  onCancelar,
  onError,
}: {
  propiedadId: string;
  onListo: () => void;
  onCancelar: () => void;
  onError: (m: string) => void;
}) {
  const [avaluoTotal, setAvaluoTotal] = useState('');
  const [avaluoExento, setAvaluoExento] = useState('');
  const [avaluoAfecto, setAvaluoAfecto] = useState('');
  const [vigencia, setVigencia] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    onError('');
    try {
      await api.patch(`/propiedades/${propiedadId}/avaluo-fiscal`, {
        avaluoTotal: Number(avaluoTotal),
        avaluoExento: Number(avaluoExento),
        avaluoAfecto: Number(avaluoAfecto),
        vigencia,
      });
      onListo();
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  const completo = avaluoTotal && avaluoExento && avaluoAfecto && vigencia;

  return (
    <div className="mt-4 rounded-lg bg-tinta/[0.03] p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Campo etiqueta="Avalúo total (CLP)">
          <input
            inputMode="numeric"
            value={avaluoTotal}
            onChange={(e) => setAvaluoTotal(e.target.value)}
            className={INPUT}
          />
        </Campo>
        <Campo etiqueta="Exento (CLP)">
          <input
            inputMode="numeric"
            value={avaluoExento}
            onChange={(e) => setAvaluoExento(e.target.value)}
            className={INPUT}
          />
        </Campo>
        <Campo etiqueta="Afecto (CLP)">
          <input
            inputMode="numeric"
            value={avaluoAfecto}
            onChange={(e) => setAvaluoAfecto(e.target.value)}
            className={INPUT}
          />
        </Campo>
        <Campo etiqueta="Vigencia">
          <input
            placeholder="2026-2"
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
            className={INPUT}
          />
        </Campo>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!completo || enviando}
          onClick={enviar}
          className="rounded-lg bg-trato-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {enviando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-tinta-tenue hover:bg-tinta/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function FormContribuciones({
  propiedadId,
  onListo,
  onCancelar,
  onError,
}: {
  propiedadId: string;
  onListo: () => void;
  onCancelar: () => void;
  onError: (m: string) => void;
}) {
  const [cuotas, setCuotas] = useState<CuotaForm[]>([{ ...CUOTA_VACIA }]);
  const [totalAdeudadoClp, setTotalAdeudadoClp] = useState('0');
  const [alDia, setAlDia] = useState(true);
  const [enviando, setEnviando] = useState(false);

  function actualizarCuota(i: number, cambio: Partial<CuotaForm>) {
    setCuotas((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...cambio } : c)));
  }

  async function enviar() {
    setEnviando(true);
    onError('');
    try {
      await api.patch(`/propiedades/${propiedadId}/contribuciones`, {
        cuotas: cuotas.map((c) => ({
          periodo: c.periodo,
          monto: Number(c.monto),
          vencimiento: c.vencimiento || null,
          estado: c.estado,
        })),
        totalAdeudadoClp: Number(totalAdeudadoClp),
        alDia,
      });
      onListo();
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  const completo = cuotas.every((c) => c.periodo && c.monto);

  return (
    <div className="mt-4 rounded-lg bg-tinta/[0.03] p-3">
      <p className="text-xs font-medium text-tinta-suave">Cuotas</p>
      <div className="mt-2 space-y-2">
        {cuotas.map((c, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-tinta/10 p-2 sm:grid-cols-4">
            <Campo etiqueta="Período">
              <input
                placeholder="2026-4"
                value={c.periodo}
                onChange={(e) => actualizarCuota(i, { periodo: e.target.value })}
                className={INPUT}
              />
            </Campo>
            <Campo etiqueta="Monto (CLP)">
              <input
                inputMode="numeric"
                value={c.monto}
                onChange={(e) => actualizarCuota(i, { monto: e.target.value })}
                className={INPUT}
              />
            </Campo>
            <Campo etiqueta="Vencimiento">
              <input
                type="date"
                value={c.vencimiento}
                onChange={(e) => actualizarCuota(i, { vencimiento: e.target.value })}
                className={INPUT}
              />
            </Campo>
            <Campo etiqueta="Estado">
              <select
                value={c.estado}
                onChange={(e) => actualizarCuota(i, { estado: e.target.value as CuotaForm['estado'] })}
                className={INPUT}
              >
                <option value="pagada">Pagada</option>
                <option value="pendiente">Pendiente</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </Campo>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setCuotas((prev) => [...prev, { ...CUOTA_VACIA }])}
        className="mt-2 text-xs font-medium text-trato-700 hover:text-trato-800"
      >
        + Agregar cuota
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Campo etiqueta="Total adeudado (CLP)">
          <input
            inputMode="numeric"
            value={totalAdeudadoClp}
            onChange={(e) => setTotalAdeudadoClp(e.target.value)}
            className={INPUT}
          />
        </Campo>
        <label className="flex items-end gap-2 pb-2 text-sm text-tinta-suave">
          <input type="checkbox" checked={alDia} onChange={(e) => setAlDia(e.target.checked)} />
          ¿Al día?
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!completo || enviando}
          onClick={enviar}
          className="rounded-lg bg-trato-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {enviando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-tinta-tenue hover:bg-tinta/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-tinta-tenue">{etiqueta}</span>
      {children}
    </label>
  );
}
