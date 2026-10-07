'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Mail, ShieldCheck } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { useSesion } from '@/hooks/useSesion';

interface DocumentoPorVencer {
  documentoId: string;
  codigo: string;
  nombre: string;
  diasParaVencer: number;
  vencido: boolean;
}

interface PropiedadPorAvisar {
  propiedadId: string;
  propiedadTitulo: string;
  vendedorEmail: string;
  vendedorNombre: string;
  documentos: DocumentoPorVencer[];
}

interface Resumen {
  propiedadesAvisadas: number;
  documentosAvisados: number;
  correosEnviados: number;
  correosFallidos: number;
}

/**
 * Certificados por vencer en todo el expediente, y el botón que manda el
 * correo. Un certificado ya avisado no vuelve a aparecer acá hasta que se
 * reemplace por uno nuevo (ver el hook de `Documento` en el backend) -- así
 * que una lista vacía puede ser "nada por vencer" o "ya se avisó de todo".
 */
export default function AvisosVencimiento() {
  const { usuario, estado } = useSesion();
  const [propiedades, setPropiedades] = useState<PropiedadPorAvisar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get<{ propiedades: PropiedadPorAvisar[] }>('/avisos-vencimiento');
      setPropiedades(data.propiedades);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    if (estado === 'autenticado') cargar();
  }, [estado, cargar]);

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      const { data } = await api.post<Resumen>('/avisos-vencimiento');
      setResumen(data);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  if (estado === 'cargando') return <p className="text-sm text-tinta-tenue">Cargando...</p>;

  if (usuario && usuario.rol !== 'admin' && usuario.rol !== 'asesor') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Esto es interno: avisos de certificados por vencer.
      </p>
    );
  }

  const totalDocumentos = (propiedades ?? []).reduce((n, p) => n + p.documentos.length, 0);

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-tinta">Por vencer o vencidos</h2>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || totalDocumentos === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-trato-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-trato-700 disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {enviando ? 'Enviando...' : 'Avisar ahora'}
          </button>
        </div>

        {propiedades === null ? (
          <p className="mt-2 text-sm text-tinta-tenue">Cargando...</p>
        ) : propiedades.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-tenue">
            Nada por vencer dentro de 7 días, o ya se avisó de todo lo que había.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {propiedades.map((p) => (
              <li key={p.propiedadId} className="rounded-xl border border-tinta/10 bg-white px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-tinta">{p.propiedadTitulo}</span>
                  <span className="text-xs text-tinta-tenue">
                    {p.vendedorNombre} · {p.vendedorEmail}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {p.documentos.map((d) => (
                    <li key={d.documentoId} className="flex items-center gap-1.5 text-tinta-tenue">
                      {d.vencido ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {d.nombre} —{' '}
                      {d.vencido
                        ? `venció hace ${Math.abs(d.diasParaVencer)} día(s)`
                        : `vence en ${d.diasParaVencer} día(s)`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {resumen && (
        <div
          className={
            resumen.correosFallidos > 0
              ? 'flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800'
              : 'flex items-start gap-2 rounded-xl bg-cierre-50 px-4 py-3 text-sm text-cierre-800'
          }
        >
          {resumen.correosFallidos > 0 ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {resumen.correosEnviados === 0 && resumen.correosFallidos === 0
            ? 'Listo. No había nada que avisar.'
            : resumen.correosFallidos > 0 && resumen.correosEnviados === 0
              ? `No se pudo enviar ningún correo (${resumen.correosFallidos} fallaron). ¿Hay un servidor SMTP configurado?`
              : `${resumen.correosEnviados} correo(s) enviados a ${resumen.propiedadesAvisadas} propiedad(es)` +
                (resumen.correosFallidos > 0 ? ` · ${resumen.correosFallidos} fallaron` : '')}
        </div>
      )}
    </div>
  );
}
