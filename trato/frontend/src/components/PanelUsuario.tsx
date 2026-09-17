'use client';

import Link from 'next/link';
import { ArrowRight, Circle, LogOut } from 'lucide-react';
import { useSesion } from '@/hooks/useSesion';

const ETAPAS_VENDEDOR = [
  'Publicar la propiedad con fotos y valor',
  'Reunir certificados del inmueble',
  'Revisar contribuciones e impuestos',
  'Agendar visitas con el asesor',
  'Recibir y aceptar una oferta',
  'Firmar escritura e inscribir en el Conservador',
];

const ETAPAS_COMPRADOR = [
  'Definir presupuesto y zona',
  'Agendar visitas a propiedades',
  'Pedir el informe legal de la propiedad',
  'Hacer una oferta',
  'Confirmar financiamiento',
  'Firmar escritura e inscribir a tu nombre',
];

export default function PanelUsuario() {
  const { usuario, estado, salir } = useSesion();

  if (estado === 'cargando') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <p className="text-tinta-tenue">Cargando tu panel...</p>
      </div>
    );
  }

  if (!usuario) return null;

  const esVendedor = usuario.rol === 'vendedor';
  const etapas = esVendedor ? ETAPAS_VENDEDOR : ETAPAS_COMPRADOR;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-tinta">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-1 text-tinta-suave">
            Cuenta de {usuario.rol} · {usuario.email}
          </p>
        </div>
        <button
          type="button"
          onClick={salir}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-tinta-suave transition hover:bg-tinta/5 hover:text-tinta"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>

      <div className="mt-8 rounded-2xl bg-trato-600 p-6 text-white shadow-carta sm:p-8">
        <h2 className="text-xl font-semibold">
          {esVendedor ? 'Publica tu propiedad' : 'Encuentra tu propiedad'}
        </h2>
        <p className="mt-2 max-w-lg text-white/80">
          {esVendedor
            ? 'Súbela con fotos y valor. Nosotros nos encargamos de los papeles y de mostrarla.'
            : 'Busca por zona y precio. Antes de ofertar te entregamos el informe legal completo.'}
        </p>
        <Link
          href={esVendedor ? '/propiedades/nueva' : '/propiedades'}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-trato-700 transition hover:bg-white/90"
        >
          {esVendedor ? 'Publicar propiedad' : 'Ver propiedades'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-tinta">Tu compraventa, paso a paso</h2>
        <p className="mt-1 text-sm text-tinta-tenue">
          Cada etapa se marca sola a medida que avanzas. Ninguna empezada todavía.
        </p>

        <ol className="mt-6 space-y-3">
          {etapas.map((etapa, i) => (
            <li
              key={etapa}
              className="flex items-start gap-3 rounded-xl border border-tinta/10 bg-white p-4"
            >
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-tinta/20" strokeWidth={1.5} />
              <span className="flex-1 text-sm text-tinta-suave">{etapa}</span>
              <span className="text-xs tabular-nums text-tinta-tenue">{i + 1}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
