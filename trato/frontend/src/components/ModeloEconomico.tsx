'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

interface Supuestos {
  tasaComision: number;
  ufEnPesos: number;
  precioInformeTitulos: number;
  sueldoBrutoAsesor: number;
  sueldoBrutoAbogado: number;
  factorCostoEmpresa: number;
  visitasPorAsesorAlMes: number;
  estudiosPorAbogadoAlMes: number;
  visitasPorPublicacion: number;
  tasaDeCierre: number;
  informesPorPublicacion: number;
  costoCarpetaCbr: number;
  comisionPasarela: number;
}

interface Respuesta {
  supuestos: Supuestos;
  sinFuente: string[];
  fuentes: Record<string, string>;
  alzaPrevisional: { hoy: number; desde: string; destino: number; cuando: string };
  precioVentaUf: number;
  operacion: {
    precioVentaClp: number;
    publicacionesPorVenta: number;
    ingresoComision: number;
    ingresoInformes: number;
    ingresoTotal: number;
    costoPorVisita: number;
    costoPorEstudio: number;
    costoVisitas: number;
    costoEstudios: number;
    costoInsumos: number;
    costoPasarela: number;
    costoTotal: number;
    margen: number;
    margenPorcentaje: number;
    precioDeEquilibrioClp: number;
  };
  informe: { costo: number; sugerido: number };
  capacidad: { ventasPorVisitas: number; ventasPorEstudios: number; cuelloDeBotella: string };
  equipo: { asesores: number; abogados: number };
}

const pesos = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
const clp = (n: number) => pesos.format(Math.round(n));

const entero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
/** es-CL usa coma decimal: "2,5 ventas", no "2.5". */
const decimal = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const CAMPOS: { clave: keyof Supuestos; etiqueta: string; paso?: number; sufijo?: string }[] = [
  { clave: 'sueldoBrutoAsesor', etiqueta: 'Sueldo bruto asesor', paso: 50_000 },
  { clave: 'sueldoBrutoAbogado', etiqueta: 'Sueldo bruto abogado', paso: 50_000 },
  { clave: 'factorCostoEmpresa', etiqueta: 'Factor costo empresa', paso: 0.01 },
  { clave: 'visitasPorAsesorAlMes', etiqueta: 'Visitas por asesor al mes', paso: 5 },
  { clave: 'estudiosPorAbogadoAlMes', etiqueta: 'Estudios por abogado al mes', paso: 1 },
  { clave: 'visitasPorPublicacion', etiqueta: 'Visitas por publicación', paso: 1 },
  { clave: 'tasaDeCierre', etiqueta: 'Tasa de cierre', paso: 0.05 },
  { clave: 'informesPorPublicacion', etiqueta: 'Informes vendidos por publicación', paso: 0.5 },
  { clave: 'precioInformeTitulos', etiqueta: 'Precio del informe', paso: 1_000 },
  { clave: 'costoCarpetaCbr', etiqueta: 'Carpeta del Conservador', paso: 500 },
  { clave: 'comisionPasarela', etiqueta: 'Comisión de la pasarela', paso: 0.001 },
  { clave: 'ufEnPesos', etiqueta: 'UF en pesos', paso: 100 },
];

/** Barra de proporción: un solo tono, largo = participación. Sin paleta categórica. */
function Fila({
  etiqueta,
  monto,
  total,
  tono,
}: {
  etiqueta: string;
  monto: number;
  total: number;
  tono: string;
}) {
  const parte = total > 0 ? Math.max(0, monto / total) : 0;
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-tinta-suave">{etiqueta}</span>
        <span className="text-sm font-medium tabular-nums text-tinta">{clp(monto)}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-tinta/[0.06]">
        <div
          className={`h-full rounded-full ${tono}`}
          style={{ width: `${Math.min(100, parte * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ModeloEconomico() {
  const { usuario, estado } = useSesion();
  const [precioUf, setPrecioUf] = useState(8_400);
  const [asesores, setAsesores] = useState(1);
  const [abogados, setAbogados] = useState(1);
  const [ajustes, setAjustes] = useState<Partial<Supuestos>>({});
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calcular = useCallback(
    async (uf: number, a: number, b: number, s: Partial<Supuestos>) => {
      setError(null);
      try {
        const { data } = await api.post<Respuesta>('/economia/modelo', {
          precioVentaUf: uf,
          asesores: a,
          abogados: b,
          supuestos: s,
        });
        setDatos(data);
      } catch (e) {
        setError(mensajeDeError(e));
      }
    },
    [],
  );

  useEffect(() => {
    if (estado !== 'autenticado') return;
    const id = setTimeout(() => calcular(precioUf, asesores, abogados, ajustes), 250);
    return () => clearTimeout(id);
  }, [estado, precioUf, asesores, abogados, ajustes, calcular]);

  if (estado === 'cargando') {
    return <p className="text-sm text-tinta-tenue">Cargando...</p>;
  }

  if (usuario && usuario.rol !== 'admin') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        El modelo de costos es interno.
      </p>
    );
  }

  if (error && !datos) return <p className="text-sm text-red-600">{error}</p>;
  if (!datos) return <p className="text-sm text-tinta-tenue">Calculando...</p>;

  const { operacion: o, supuestos, informe, capacidad } = datos;
  const pierde = o.margen <= 0;
  const informeBajoCosto = supuestos.precioInformeTitulos < informe.costo;
  const equilibrioUf = Math.round(o.precioDeEquilibrioClp / supuestos.ufEnPesos);

  const claseCampo =
    'w-full rounded-lg border border-tinta/15 bg-white px-2.5 py-1.5 text-sm tabular-nums text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
            Precio de venta (UF)
          </span>
          <input
            type="number"
            min={100}
            step={100}
            value={precioUf}
            onChange={(e) => setPrecioUf(Number(e.target.value) || 0)}
            className={`${claseCampo} w-36`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Asesores</span>
          <input
            type="number"
            min={1}
            value={asesores}
            onChange={(e) => setAsesores(Number(e.target.value) || 1)}
            className={`${claseCampo} w-24`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tinta-suave">Abogados</span>
          <input
            type="number"
            min={1}
            value={abogados}
            onChange={(e) => setAbogados(Number(e.target.value) || 1)}
            className={`${claseCampo} w-24`}
          />
        </label>
        <p className="ml-auto text-sm text-tinta-tenue">
          = {clp(o.precioVentaClp)}
        </p>
      </div>

      {/* El número que manda: qué deja una venta cerrada. */}
      <section
        className={`mt-6 rounded-2xl border p-7 ${
          pierde ? 'border-red-200 bg-red-50' : 'border-cierre-100 bg-cierre-50'
        }`}
      >
        <p className="text-sm font-medium text-tinta-suave">Margen por venta cerrada</p>
        <p
          className={`mt-1 text-5xl font-bold tracking-tight tabular-nums ${
            pierde ? 'text-red-700' : 'text-cierre-700'
          }`}
        >
          {clp(o.margen)}
        </p>
        <p className="mt-2 text-sm text-tinta-suave">
          {Math.round(o.margenPorcentaje * 100)}% sobre el ingreso. Cada venta paga la atención
          de <span className="font-semibold text-tinta">{o.publicacionesPorVenta}</span>{' '}
          publicaciones, porque no todas cierran.
        </p>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta">
          <h2 className="font-semibold text-tinta">Entra</h2>
          <div className="mt-2 divide-y divide-tinta/5">
            <Fila
              etiqueta="Comisión, sin IVA"
              monto={o.ingresoComision}
              total={o.ingresoTotal}
              tono="bg-trato-500"
            />
            <Fila
              etiqueta="Informes de títulos"
              monto={o.ingresoInformes}
              total={o.ingresoTotal}
              tono="bg-trato-500"
            />
          </div>
          <p className="mt-3 border-t border-tinta/10 pt-3 text-sm font-semibold tabular-nums text-tinta">
            {clp(o.ingresoTotal)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-tinta-tenue">
            El IVA de la comisión no está: se recauda y se entera al fisco. Los aranceles de
            notaría y Conservador tampoco los pagamos nosotros.
          </p>
        </section>

        <section className="rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta">
          <h2 className="font-semibold text-tinta">Sale</h2>
          <div className="mt-2 divide-y divide-tinta/5">
            <Fila
              etiqueta="Visitas de los asesores"
              monto={o.costoVisitas}
              total={o.costoTotal}
              tono="bg-tinta/40"
            />
            <Fila
              etiqueta="Estudios de títulos"
              monto={o.costoEstudios}
              total={o.costoTotal}
              tono="bg-tinta/40"
            />
            <Fila
              etiqueta="Carpetas del Conservador"
              monto={o.costoInsumos}
              total={o.costoTotal}
              tono="bg-tinta/40"
            />
            <Fila
              etiqueta="Comisión de la pasarela"
              monto={o.costoPasarela}
              total={o.costoTotal}
              tono="bg-tinta/40"
            />
          </div>
          <p className="mt-3 border-t border-tinta/10 pt-3 text-sm font-semibold tabular-nums text-tinta">
            {clp(o.costoTotal)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-tinta-tenue">
            Una visita cuesta {clp(o.costoPorVisita)} y un estudio {clp(o.costoPorEstudio)},
            con el sueldo cargado al costo empresa.
          </p>
        </section>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex gap-3 rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-trato-600" strokeWidth={1.75} />
          <div>
            <p className="font-semibold text-tinta">
              Bajo UF {entero.format(equilibrioUf)} la operación pierde plata
            </p>
            <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
              Son {clp(o.precioDeEquilibrioClp)}. Con 1% de comisión, una propiedad barata no
              alcanza a pagar las visitas que consumió, ni las de las publicaciones que no
              cerraron. Es el piso bajo el cual conviene cobrar distinto o no tomar la operación.
            </p>
          </div>
        </div>

        {informeBajoCosto && (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={1.75} />
            <div>
              <p className="font-semibold text-tinta">El informe se vende bajo costo</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                Cuesta {clp(informe.costo)} entre el tiempo del abogado y la carpeta del
                Conservador, y se cobra {clp(supuestos.precioInformeTitulos)}. Para que no lo
                subsidie la comisión habría que cobrar {clp(informe.sugerido)}.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 rounded-2xl border border-tinta/10 bg-white p-5 shadow-carta">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-trato-600" strokeWidth={1.75} />
          <div>
            <p className="font-semibold text-tinta">
              {datos.equipo.asesores} asesor(es) y {datos.equipo.abogados} abogado(s) aguantan{' '}
              {decimal.format(
                Math.min(capacidad.ventasPorVisitas, capacidad.ventasPorEstudios),
              )}{' '}
              ventas al mes
            </p>
            <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
              Las visitas dan para {decimal.format(capacidad.ventasPorVisitas)} y los estudios
              para {decimal.format(capacidad.ventasPorEstudios)}. El cuello de botella son los{' '}
              <span className="font-semibold text-tinta">{capacidad.cuelloDeBotella}</span>: es
              el próximo cargo que hay que llenar.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={1.75} />
          <div>
            <p className="font-semibold text-tinta">El costo del equipo va a subir</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              El aporte previsional de cargo del empleador quedó en{' '}
              {(datos.alzaPrevisional.hoy * 100).toFixed(1)}% desde {datos.alzaPrevisional.desde}{' '}
              y sube por gradualidad hasta {(datos.alzaPrevisional.destino * 100).toFixed(1)}% en{' '}
              {datos.alzaPrevisional.cuando}. Un modelo de sueldos fijos tiene que mirar esa
              curva, no sólo el número de hoy.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-tinta">Supuestos</h2>
        <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
          Los marcados con un punto no tienen fuente pública en Chile: son estimaciones puestas a
          mano y son las que más mueven el resultado. Hay que reemplazarlas con datos propios
          apenas existan.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS.map(({ clave, etiqueta, paso }) => {
            const esSupuesto = datos.sinFuente.includes(clave);
            return (
              <label key={clave} className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-tinta-suave">
                  {esSupuesto && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                    />
                  )}
                  {etiqueta}
                  {esSupuesto && <span className="sr-only">(sin fuente)</span>}
                </span>
                <input
                  type="number"
                  step={paso}
                  value={supuestos[clave]}
                  onChange={(e) =>
                    setAjustes((a) => ({ ...a, [clave]: Number(e.target.value) || 0 }))
                  }
                  className={claseCampo}
                />
                {datos.fuentes[clave] && (
                  <span className="mt-1 block text-[11px] leading-snug text-tinta-tenue">
                    {datos.fuentes[clave]}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
