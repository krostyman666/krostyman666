import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Clock,
  FileText,
  Landmark,
  PenLine,
  Receipt,
  ScrollText,
  ShieldCheck,
  X,
} from 'lucide-react';
import CalculadoraAhorro from '@/components/CalculadoraAhorro';

const PAPELES = [
  {
    icon: ScrollText,
    titulo: 'Escritura de compraventa',
    detalle:
      'Redactada según tu caso y revisada por abogado, lista para firmar en notaría o de forma remota.',
  },
  {
    icon: FileText,
    titulo: 'Certificados del inmueble',
    detalle:
      'Dominio vigente, hipotecas y gravámenes, prohibiciones y no expropiación. Los pedimos nosotros.',
  },
  {
    icon: Receipt,
    titulo: 'Impuestos y contribuciones',
    detalle:
      'Avalúo fiscal, contribuciones al día y el detalle tributario de la operación ante el SII.',
  },
  {
    icon: Landmark,
    titulo: 'Conservador de Bienes Raíces',
    detalle:
      'Inscripción de la propiedad a nombre del comprador y seguimiento hasta que sale inscrita.',
  },
  {
    icon: Building2,
    titulo: 'Papeles municipales',
    detalle: 'Recepción final, permiso de edificación y gastos comunes al día si es departamento.',
  },
  {
    icon: PenLine,
    titulo: 'Firmas y alzamientos',
    detalle:
      'Firma electrónica avanzada, poderes y el alzamiento de hipoteca si la propiedad tiene crédito.',
  },
];

const PASOS = [
  {
    n: '01',
    titulo: 'Publicas o encuentras',
    detalle:
      'El dueño publica con fotos, plano y valor. El comprador busca y agenda la visita desde la misma página.',
  },
  {
    n: '02',
    titulo: 'Visita con nuestro asesor',
    detalle:
      'Un asesor en sueldo fijo muestra la propiedad. Agrupamos visitas por zona y horario, no te cobramos el viaje.',
  },
  {
    n: '03',
    titulo: 'Informe completo antes de ofertar',
    detalle:
      'Recibes en PDF todos los papeles, los costos reales de la operación y las alertas legales de esa propiedad.',
  },
  {
    n: '04',
    titulo: 'Firman y se inscribe',
    detalle:
      'Escritura, firma, pago protegido y inscripción en el Conservador. Ves cada paso en tu panel.',
  },
];

const COMPARACION: { fila: string; corredor: string; trato: string }[] = [
  { fila: 'Comisión sobre el valor', corredor: '2% a 5% + IVA', trato: '1% + IVA' },
  { fila: 'Quién muestra la propiedad', corredor: 'Corredor a comisión', trato: 'Asesor en sueldo fijo' },
  { fila: 'Papeles y certificados', corredor: 'Los juntas tú', trato: 'Los gestionamos nosotros' },
  { fila: 'Informe legal previo', corredor: 'Rara vez', trato: 'Siempre, antes de ofertar' },
  { fila: 'Costos de la operación', corredor: 'Te enteras al final', trato: 'A la vista desde el día uno' },
  { fila: 'Plazo habitual', corredor: '45 a 60 días', trato: '15 a 20 días' },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-tinta/5 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
            Trato<span className="text-trato-600">.</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-tinta-suave md:flex">
            <a href="#como-funciona" className="hover:text-tinta">
              Cómo funciona
            </a>
            <a href="#papeles" className="hover:text-tinta">
              Qué incluye
            </a>
            <a href="#comparacion" className="hover:text-tinta">
              Precio
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ingresar"
              className="hidden text-sm font-medium text-tinta-suave hover:text-tinta sm:block"
            >
              Ingresar
            </Link>
            <Link
              href="/registro?tipo=vendedor"
              className="rounded-lg bg-tinta px-4 py-2 text-sm font-semibold text-white transition hover:bg-tinta-suave"
            >
              Publicar propiedad
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-tinta/5 bg-gradient-to-b from-trato-50/70 to-white">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-trato-700 shadow-carta ring-1 ring-trato-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Operación legal, sin corredor
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-tinta sm:text-5xl lg:text-6xl">
                Vende y compra
                <br />
                <span className="text-trato-600">de trato directo.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-tinta-suave">
                Te entregamos todos los papeles, escrituras, impuestos y firmas que necesita tu
                compraventa, con asesores que muestran la propiedad por ti. Pagas 1% + IVA en vez de
                la comisión del corredor.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/registro?tipo=vendedor"
                  className="inline-flex items-center gap-2 rounded-xl bg-trato-600 px-6 py-3.5 font-semibold text-white shadow-carta transition hover:bg-trato-700"
                >
                  Quiero vender
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/propiedades"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-tinta ring-1 ring-tinta/15 transition hover:ring-tinta/30"
                >
                  Quiero comprar
                </Link>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-tinta/10 pt-8">
                {[
                  { k: '1% + IVA', v: 'Nuestra comisión' },
                  { k: '15 días', v: 'Plazo objetivo' },
                  { k: '100%', v: 'Papeles incluidos' },
                ].map(({ k, v }) => (
                  <div key={v}>
                    <dt className="text-2xl font-bold tracking-tight text-tinta">{k}</dt>
                    <dd className="mt-1 text-xs leading-snug text-tinta-tenue">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:pt-4">
              <CalculadoraAhorro />
            </div>
          </div>
        </section>

        <section id="papeles" className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-tinta sm:text-4xl">
              Todo el papeleo, resuelto y explicado
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-tinta-suave">
              La razón por la que la gente contrata corredor es el miedo a los papeles. Eso es lo
              que automatizamos: cada certificado, cada impuesto y cada firma, con el costo a la
              vista antes de que te comprometas.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PAPELES.map(({ icon: Icon, titulo, detalle }) => (
              <div
                key={titulo}
                className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta transition hover:border-trato-200 hover:shadow-alta"
              >
                <Icon className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
                <h3 className="mt-4 font-semibold text-tinta">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tinta-tenue">{detalle}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="border-y border-tinta/5 bg-tinta/[0.02] py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-tinta sm:text-4xl">
              Cuatro pasos, sin vueltas
            </h2>

            <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {PASOS.map(({ n, titulo, detalle }) => (
                <li key={n} className="relative">
                  <span className="text-sm font-bold tabular-nums text-trato-600">{n}</span>
                  <h3 className="mt-3 font-semibold text-tinta">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tinta-tenue">{detalle}</p>
                </li>
              ))}
            </ol>

            <div className="mt-14 flex items-start gap-4 rounded-2xl bg-white p-6 shadow-carta ring-1 ring-tinta/5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-cierre-600" strokeWidth={2} />
              <p className="text-sm leading-relaxed text-tinta-suave">
                <span className="font-semibold text-tinta">
                  Por qué nos sale más barato que un corredor:
                </span>{' '}
                nuestros asesores tienen sueldo fijo y agrupamos las visitas por zona y horario, así
                que el costo de mostrar tu propiedad no depende del precio de venta. La comisión
                millonaria existe porque se cobra como porcentaje, no porque el trabajo cueste eso.
              </p>
            </div>
          </div>
        </section>

        <section id="comparacion" className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-tinta sm:text-4xl">
            Trato y corredor, lado a lado
          </h2>

          <div className="mt-10 overflow-hidden rounded-2xl border border-tinta/10 shadow-carta">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tinta/10 bg-tinta/[0.02]">
                  <th scope="col" className="px-5 py-4 font-semibold text-tinta">
                    &nbsp;
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold text-tinta-tenue">
                    Corredor tradicional
                  </th>
                  <th scope="col" className="bg-trato-50 px-5 py-4 font-semibold text-trato-800">
                    Trato
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARACION.map(({ fila, corredor, trato }) => (
                  <tr key={fila} className="border-b border-tinta/5 last:border-0">
                    <th scope="row" className="px-5 py-4 font-medium text-tinta">
                      {fila}
                    </th>
                    <td className="px-5 py-4 text-tinta-tenue">
                      <span className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-tinta-tenue/60" />
                        {corredor}
                      </span>
                    </td>
                    <td className="bg-trato-50/60 px-5 py-4 font-medium text-trato-900">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cierre-600" />
                        {trato}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-tinta/5 bg-tinta py-20 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-trato-300" strokeWidth={1.5} />
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Empieza por el informe. Es gratis.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/70">
              Dinos qué propiedad quieres vender o comprar y te mandamos el detalle de los papeles,
              impuestos y costos reales de esa operación. Recién después decides si sigues con
              nosotros.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/registro?tipo=vendedor"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-tinta transition hover:bg-white/90"
              >
                Pedir mi informe
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/propiedades"
                className="inline-flex items-center rounded-xl px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:ring-white/50"
              >
                Ver propiedades
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-tinta/10 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold tracking-tight text-tinta">
              Trato<span className="text-trato-600">.</span>
            </p>
            <p className="mt-1 text-sm text-tinta-tenue">
              Compraventa de propiedades de trato directo, en Chile.
            </p>
          </div>
          <div className="sm:text-right">
            <Link
              href="/mis-datos"
              className="text-sm font-medium text-tinta-suave hover:text-tinta"
            >
              Qué datos guardamos
            </Link>
            <p className="mt-2 text-xs text-tinta-tenue">
              © {new Date().getFullYear()} Trato. Los valores mostrados son estimaciones y no
              constituyen asesoría legal ni tributaria.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
