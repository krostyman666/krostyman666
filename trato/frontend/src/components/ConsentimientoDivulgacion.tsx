'use client';

import { useEffect, useState } from 'react';
import { Check, ShieldCheck, ShieldOff } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';

interface Respuesta {
  consentimiento: { textoVersion: string; otorgadoEn: string } | null;
  textoVigente: string;
  versionVigente: string;
}

export default function ConsentimientoDivulgacion({
  propiedadId,
}: {
  propiedadId: string;
}) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = () =>
    api
      .get<Respuesta>(`/propiedades/${propiedadId}/consentimiento`)
      .then(({ data }) => setDatos(data))
      .catch((e) => setError(mensajeDeError(e)));

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propiedadId]);

  async function cambiar(autorizar: boolean) {
    setTrabajando(true);
    setError(null);
    try {
      if (autorizar) await api.put(`/propiedades/${propiedadId}/consentimiento`);
      else await api.delete(`/propiedades/${propiedadId}/consentimiento`);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  if (error && !datos) return <p className="text-sm text-red-600">{error}</p>;
  if (!datos) return <p className="text-sm text-tinta-tenue">Cargando autorización...</p>;

  const autorizado = datos.consentimiento !== null;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        autorizado ? 'border-cierre-100 bg-cierre-50' : 'border-tinta/10 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {autorizado ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cierre-600" strokeWidth={1.75} />
        ) : (
          <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-tinta-tenue" strokeWidth={1.75} />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-tinta">
            {autorizado
              ? 'Autorizaste mostrar los antecedentes'
              : 'Los compradores no ven tus antecedentes'}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
            {datos.textoVigente}
          </p>

          {autorizado && datos.consentimiento && (
            <p className="mt-2 text-xs text-tinta-tenue">
              Autorizado el{' '}
              {new Intl.DateTimeFormat('es-CL', {
                timeZone: 'America/Santiago',
                dateStyle: 'long',
                timeStyle: 'short',
              }).format(new Date(datos.consentimiento.otorgadoEn))}
              , versión {datos.consentimiento.textoVersion}.
            </p>
          )}

          {!autorizado && (
            <p className="mt-2 text-xs leading-relaxed text-tinta-tenue">
              Sin tu autorización el informe que ve el comprador sale incompleto, y eso frena la
              venta: es lo que él revisa antes de ofertar.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => cambiar(!autorizado)}
          disabled={trabajando}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${
            autorizado
              ? 'text-tinta-suave ring-1 ring-tinta/15 hover:ring-tinta/30'
              : 'bg-trato-600 text-white hover:bg-trato-700'
          }`}
        >
          {trabajando
            ? 'Guardando...'
            : autorizado
              ? 'Revocar autorización'
              : 'Autorizar'}
        </button>
        {autorizado && !trabajando && (
          <span className="inline-flex items-center gap-1.5 text-sm text-cierre-700">
            <Check className="h-4 w-4" />
            Puedes revocarla cuando quieras
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
