'use client';

import { useMemo, useState } from 'react';
import {
  IVA,
  TASA_TRATO,
  UF_FALLBACK_CLP,
  aPesos,
  calcularComision,
  formatearCLP,
  type Moneda,
} from '@/lib/comision';

const VALOR_INICIAL: Record<Moneda, number> = { clp: 350_000_000, uf: 9000 };

const miles = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

export default function CalculadoraAhorro() {
  const [moneda, setMoneda] = useState<Moneda>('clp');
  const [valor, setValor] = useState<number>(VALOR_INICIAL.clp);
  const [tasaCorredor, setTasaCorredor] = useState<number>(0.02);

  const valorEnPesos = aPesos(valor, moneda, UF_FALLBACK_CLP);
  const d = useMemo(
    () => calcularComision(valorEnPesos, tasaCorredor, TASA_TRATO),
    [valorEnPesos, tasaCorredor],
  );

  function cambiarMoneda(siguiente: Moneda) {
    if (siguiente === moneda) return;
    setMoneda(siguiente);
    setValor(VALOR_INICIAL[siguiente]);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-alta ring-1 ring-tinta/5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-tinta">¿Cuánto te ahorras?</h3>
          <p className="mt-1 text-sm text-tinta-tenue">
            Pon el valor de tu propiedad y compara la comisión.
          </p>
        </div>
        <div
          role="group"
          aria-label="Moneda"
          className="flex shrink-0 rounded-lg bg-trato-50 p-1 text-sm font-medium"
        >
          {(['clp', 'uf'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => cambiarMoneda(m)}
              aria-pressed={moneda === m}
              className={
                moneda === m
                  ? 'rounded-md bg-white px-3 py-1.5 text-trato-700 shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-tinta-tenue hover:text-tinta'
              }
            >
              {m === 'clp' ? 'Pesos' : 'UF'}
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="valor" className="block text-sm font-medium text-tinta-suave">
        Valor de la propiedad
      </label>
      <div className="mt-2 flex items-center rounded-xl border border-tinta/10 bg-white px-4 py-3 focus-within:border-trato-500 focus-within:ring-2 focus-within:ring-trato-100">
        <span className="mr-2 select-none text-lg font-medium text-tinta-tenue">
          {moneda === 'clp' ? '$' : 'UF'}
        </span>
        <input
          id="valor"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={miles.format(valor)}
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, '').slice(0, 15);
            setValor(digitos ? Number(digitos) : 0);
          }}
          className="w-full bg-transparent text-2xl font-semibold tabular-nums text-tinta outline-none"
        />
      </div>
      {moneda === 'uf' && (
        <p className="mt-2 text-xs text-tinta-tenue">
          Equivale a {formatearCLP(valorEnPesos)} · UF referencial {formatearCLP(UF_FALLBACK_CLP)}
        </p>
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="tasa" className="text-sm font-medium text-tinta-suave">
            Comisión que te cobra el corredor
          </label>
          <span className="text-sm font-semibold tabular-nums text-tinta">
            {(tasaCorredor * 100).toFixed(1)}% + IVA
          </span>
        </div>
        <input
          id="tasa"
          type="range"
          min={0.01}
          max={0.05}
          step={0.005}
          value={tasaCorredor}
          onChange={(e) => setTasaCorredor(Number(e.target.value))}
          className="mt-3 w-full accent-trato-600"
        />
        <p className="mt-2 text-xs text-tinta-tenue">
          En Chile lo habitual es 2% + IVA por lado. En propiedades grandes se negocia.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-tinta/10 bg-tinta/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-tenue">
            Con corredor
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-tinta">
            {formatearCLP(d.corredorTotal)}
          </p>
          <p className="mt-1 text-xs text-tinta-tenue">
            {formatearCLP(d.corredorNeto)} + IVA {formatearCLP(d.corredorIva)}
          </p>
        </div>
        <div className="rounded-xl border border-trato-200 bg-trato-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-trato-700">Con Trato</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-trato-800">
            {formatearCLP(d.tratoTotal)}
          </p>
          <p className="mt-1 text-xs text-trato-700/80">
            {(TASA_TRATO * 100).toFixed(0)}% + IVA {formatearCLP(d.tratoIva)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-cierre-50 p-5 ring-1 ring-cierre-400/30">
        <p className="text-sm font-medium text-cierre-700">Te quedas con</p>
        <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-cierre-700 sm:text-5xl">
          {formatearCLP(d.ahorro)}
        </p>
        <p className="mt-2 text-sm text-cierre-700/80">
          {Math.round(d.ahorroPorcentaje * 100)}% menos que la comisión tradicional.
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-tenue">
        Estimación sobre la comisión de corretaje, con IVA de {Math.round(IVA * 100)}%. Aparte van
        los costos de notaría, Conservador de Bienes Raíces y, si aplica, tu crédito hipotecario:
        esos los pagas igual, con o sin corredor, y te los detallamos antes de firmar.
      </p>
    </div>
  );
}
