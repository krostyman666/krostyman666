'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Handshake } from 'lucide-react';
import { api, leerToken, mensajeDeError } from '@/lib/api';
import { formatearMonto, type PromesaApi } from '@/lib/promesas';

interface Props {
  propiedadId: string;
  precio: number;
  moneda: 'clp' | 'uf';
}

/** Días típicos: 60 con fondos propios, 90 a 120 si depende de crédito. */
const DIAS_SUGERIDOS = 105;

function enFecha(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default function AbrirPromesa({ propiedadId, precio, moneda }: Props) {
  const router = useRouter();
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [oferta, setOferta] = useState(String(Math.round(precio)));
  const [pie, setPie] = useState(String(Math.round(precio * 0.1)));
  const [fecha, setFecha] = useState(enFecha(DIAS_SUGERIDOS));
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConSesion(leerToken() !== null);
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTrabajando(true);
    setError(null);
    try {
      const { data } = await api.post<{ promesa: PromesaApi }>(
        `/promesas/propiedad/${propiedadId}`,
        {
          precio: Number(oferta),
          pie: pie ? Number(pie) : null,
          fechaEscritura: fecha || null,
        },
      );
      router.push(`/promesas/${data.promesa.id}`);
    } catch (err) {
      setError(mensajeDeError(err));
      setTrabajando(false);
    }
  }

  const claseCampo =
    'w-full rounded-xl border border-tinta/15 bg-white px-3 py-2.5 text-sm tabular-nums text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

  return (
    <div className="rounded-2xl border border-tinta/10 bg-white p-6 shadow-carta">
      <Handshake className="h-6 w-6 text-trato-600" strokeWidth={1.75} />
      <h3 className="mt-3 font-semibold text-tinta">Hacer una oferta</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-tinta-tenue">
        Abre la promesa de compraventa con tu oferta. El vendedor puede aceptarla o
        contraproponer, y negocian las cláusulas acá mismo.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {conSesion === false ? (
        <Link
          href={`/ingresar?volver=/propiedades/${propiedadId}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-tinta ring-1 ring-tinta/15 transition hover:ring-tinta/30"
        >
          Ingresa para ofertar
        </Link>
      ) : abierto ? (
        <form onSubmit={enviar} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
              Tu oferta ({moneda === 'uf' ? 'UF' : 'pesos'})
            </span>
            <input
              type="number"
              min={1}
              value={oferta}
              onChange={(e) => setOferta(e.target.value)}
              className={claseCampo}
              required
            />
            <span className="mt-1 block text-xs text-tinta-tenue">
              Publicado en {formatearMonto(precio, moneda)}
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
              Pie al firmar la promesa
            </span>
            <input
              type="number"
              min={0}
              value={pie}
              onChange={(e) => setPie(e.target.value)}
              className={claseCampo}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-suave">
              Escriturar a más tardar
            </span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={claseCampo}
            />
            <span className="mt-1 block text-xs leading-relaxed text-tinta-tenue">
              Con crédito hipotecario se usan 90 a 120 días; con fondos propios, 60.
            </span>
          </label>

          <button
            type="submit"
            disabled={trabajando || conSesion === null}
            className="w-full rounded-xl bg-trato-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
          >
            {trabajando ? 'Abriendo...' : 'Abrir la promesa'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          disabled={conSesion === null}
          className="mt-4 w-full rounded-xl bg-trato-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
        >
          Ofertar por esta propiedad
        </button>
      )}
    </div>
  );
}
