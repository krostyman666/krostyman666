'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, FileSignature, Info, Landmark } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { formatearRut } from '@/lib/rut';
import {
  ETIQUETA_ESTADO_INFORME,
  ETIQUETA_FUENTE,
  formatearPesos,
  type InformeApi,
  type SeccionInforme,
} from '@/lib/informes';

const ETIQUETA_CAMPO: Record<string, string> = {
  tipo: 'Tipo',
  comuna: 'Comuna',
  region: 'Región',
  rolAvaluo: 'Rol de avalúo',
  superficieConstruida: 'Superficie construida',
  superficieTotal: 'Superficie de terreno',
  faltaRolAvaluo: 'Falta el rol de avalúo',
  total: 'Documentos de la operación',
  conformes: 'Conformes',
  avance: 'Avance',
  tieneHipoteca: 'Hipoteca declarada',
  esDepartamento: 'En condominio',
  anoConstruccion: 'Año de construcción',
  advertencia: 'Advertencia',
  comisionTrato: 'Comisión de Trato',
  precio: 'Precio publicado',
  moneda: 'Moneda',
  noEstimados: 'No estimamos',
};

const numero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

const CAMPOS_SUPERFICIE = ['superficieConstruida', 'superficieTotal'];
/** Los años no llevan separador de miles: 1998, no 1.998. */
const CAMPOS_ANO = ['anoConstruccion'];

const ETIQUETA_VALOR: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  oficina: 'Oficina',
  terreno: 'Terreno',
  bodega: 'Bodega',
  estacionamiento: 'Estacionamiento',
  parcela: 'Parcela',
  uf: 'UF',
  clp: 'Pesos',
};

/**
 * Renderiza un valor del informe.
 *
 * Tiene que aguantar formas que ya no emitimos: `contenido` es una foto
 * inmutable, así que un informe emitido hace meses sigue teniendo la estructura
 * de entonces. De ahí el caso de objeto anidado en vez de dejar que caiga en un
 * String() que imprime "[object Object]".
 */
function Valor({ campo, valor }: { campo: string; valor: unknown }) {
  if (valor === null || valor === undefined || valor === '') {
    return <span className="text-tinta-tenue">—</span>;
  }

  if (typeof valor === 'boolean') return <>{valor ? 'Sí' : 'No'}</>;

  if (Array.isArray(valor)) {
    return (
      <ul className="space-y-0.5">
        {valor.map((v) => (
          <li key={String(v)}>{String(v)}</li>
        ))}
      </ul>
    );
  }

  if (typeof valor === 'object') {
    return (
      <ul className="space-y-0.5">
        {Object.entries(valor as Record<string, unknown>).map(([k, v]) => (
          <li key={k}>
            <span className="text-tinta-tenue">{ETIQUETA_CAMPO[k] ?? k}: </span>
            <Valor campo={k} valor={v} />
          </li>
        ))}
      </ul>
    );
  }

  // Las superficies y los precios llegan como DECIMAL de Postgres ("148.00"),
  // así que el número puede venir en un string.
  const comoNumero = typeof valor === 'number' ? valor : Number(valor);
  const esNumerico = valor !== '' && Number.isFinite(comoNumero);

  if (esNumerico) {
    if (campo === 'avance') return <>{Math.round(comoNumero * 100)}%</>;
    if (CAMPOS_ANO.includes(campo)) return <>{comoNumero}</>;
    if (CAMPOS_SUPERFICIE.includes(campo)) return <>{numero.format(comoNumero)} m²</>;
    return <>{numero.format(comoNumero)}</>;
  }

  const texto = String(valor);
  return <>{ETIQUETA_VALOR[texto] ?? texto}</>;
}

function Seccion({ seccion }: { seccion: SeccionInforme }) {
  return (
    <section className="border-t border-tinta/10 py-6 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold text-tinta">{seccion.titulo}</h3>
        <span className="text-xs text-tinta-tenue">
          {ETIQUETA_FUENTE[seccion.fuente] ?? seccion.fuente}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">{seccion.queResponde}</p>

      {seccion.datos === null ? (
        <p className="mt-3 flex gap-2 rounded-xl bg-tinta/[0.03] px-4 py-3 text-sm leading-relaxed text-tinta-suave">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-tinta-tenue" />
          {seccion.sinDatos}
        </p>
      ) : (
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {Object.entries(seccion.datos).map(([campo, valor]) => (
            <div key={campo}>
              <dt className="text-xs text-tinta-tenue">{ETIQUETA_CAMPO[campo] ?? campo}</dt>
              <dd className="mt-0.5 text-sm font-medium text-tinta">
                <Valor campo={campo} valor={valor} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default function VistaInforme({ informeId }: { informeId: string }) {
  const [informe, setInforme] = useState<InformeApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ informe: InformeApi }>(`/informes/${informeId}`)
      .then(({ data }) => setInforme(data.informe))
      .catch((e) => setError(mensajeDeError(e)));
  }, [informeId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!informe) return <p className="text-sm text-tinta-tenue">Cargando el informe...</p>;

  const { contenido } = informe;
  const secciones = contenido.secciones ?? [];
  const esperandoPago = informe.estado === 'esperando_pago';
  // Si el abogado ya concluyó, decirle al comprador que seguimos pidiendo
  // certificados se contradice con lo que está leyendo más arriba.
  const enPreparacion = informe.estado === 'en_preparacion' && informe.firmadoEn === null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">{contenido.nombre}</h1>
        <span className="rounded-full bg-tinta/5 px-3 py-1 text-xs font-medium text-tinta-suave">
          {ETIQUETA_ESTADO_INFORME[informe.estado]}
        </span>
      </div>

      {informe.propiedad && (
        <p className="mt-2 text-tinta-suave">
          <Link
            href={`/propiedades/${informe.propiedad.id}`}
            className="font-medium text-trato-700 hover:text-trato-800"
          >
            {informe.propiedad.titulo}
          </Link>
          {' · '}
          {informe.propiedad.comuna}
        </p>
      )}

      {informe.emitidoEn && (
        <p className="mt-1 text-sm text-tinta-tenue">
          Emitido el{' '}
          {new Intl.DateTimeFormat('es-CL', {
            timeZone: 'America/Santiago',
            dateStyle: 'long',
            timeStyle: 'short',
          }).format(new Date(informe.emitidoEn))}
          . Es una foto de ese momento: los certificados del Conservador vencen a los 30 días
          en la práctica bancaria.
        </p>
      )}

      {/* Firma del abogado: lo único que convierte la carpeta en estudio de títulos. */}
      {informe.firmadoEn && contenido.firmadoPor && (
        <section className="mt-8 rounded-2xl border border-cierre-100 bg-cierre-50 p-6">
          <FileSignature className="h-6 w-6 text-cierre-700" strokeWidth={1.75} />
          <h2 className="mt-3 font-semibold text-tinta">Conclusión del abogado</h2>
          <p className="mt-2 leading-relaxed text-tinta-suave">{informe.conclusion}</p>

          {informe.defectos.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold text-tinta">Defectos detectados</h3>
              <ul className="mt-2 space-y-1.5">
                {informe.defectos.map((d) => (
                  <li key={d} className="flex gap-2 text-sm leading-relaxed text-tinta-suave">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-5 border-t border-cierre-100 pt-4 text-xs text-tinta-tenue">
            Firmado por {contenido.firmadoPor.nombre}, RUT{' '}
            {formatearRut(contenido.firmadoPor.rut)}, el{' '}
            {new Intl.DateTimeFormat('es-CL', {
              timeZone: 'America/Santiago',
              dateStyle: 'long',
            }).format(new Date(informe.firmadoEn))}
            . Responde por esta conclusión.
          </p>
        </section>
      )}

      {esperandoPago && (
        <section className="mt-8 rounded-2xl border border-trato-200 bg-trato-50/60 p-6">
          <Clock className="h-6 w-6 text-trato-700" strokeWidth={1.75} />
          <h2 className="mt-3 font-semibold text-tinta">Esperando el pago</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
            Son {formatearPesos(informe.precioClp)}. Te enviamos el link de pago. Cuando esté
            pagado pedimos los certificados al Conservador, que tarda{' '}
            {contenido.plazoHabiles?.minimo} a {contenido.plazoHabiles?.maximo} días hábiles.
          </p>
        </section>
      )}

      {enPreparacion && (
        <section className="mt-8 rounded-2xl border border-trato-200 bg-trato-50/60 p-6">
          <Landmark className="h-6 w-6 text-trato-700" strokeWidth={1.75} />
          <h2 className="mt-3 font-semibold text-tinta">Pedimos los certificados</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
            Están solicitados al Conservador del territorio. Te avisamos en cuanto lleguen.
          </p>
        </section>
      )}

      {secciones.length > 0 && (
        <div className="mt-10">
          {secciones.map((s) => (
            <Seccion key={s.codigo} seccion={s} />
          ))}
        </div>
      )}

      {(contenido.seccionesPrometidas ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight text-tinta">Qué va a incluir</h2>
          <ul className="mt-4 space-y-4">
            {(contenido.seccionesPrometidas ?? []).map((s) => (
              <li key={s.codigo} className="border-t border-tinta/10 pt-4 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-medium text-tinta">{s.titulo}</p>
                  <span className="text-xs text-tinta-tenue">
                    {ETIQUETA_FUENTE[s.fuente] ?? s.fuente}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-tinta-tenue">{s.queResponde}</p>
                {s.condicional && (
                  <p className="mt-1 text-xs text-tinta-tenue">Aplica a: {s.condicional}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Los límites van completos y en el cuerpo del informe. Es el requisito
          que evita que el nivel gratis se lea como un estudio de títulos. */}
      {(contenido.limites ?? []).length > 0 && (
        <section className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <AlertTriangle className="h-6 w-6 text-amber-700" strokeWidth={1.75} />
          <h2 className="mt-3 font-semibold text-tinta">Qué no incluye este informe</h2>
          <ul className="mt-3 space-y-2">
            {(contenido.limites ?? []).map((limite) => (
              <li key={limite} className="flex gap-2 text-sm leading-relaxed text-amber-900">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-700" />
                {limite}
              </li>
            ))}
          </ul>

          {(contenido.aportesDelNivelPagado ?? []).length > 0 && informe.propiedad && (
            <div className="mt-5 border-t border-amber-200 pt-4">
              <p className="text-sm font-medium text-tinta">
                La carpeta de títulos sí cubre eso:
              </p>
              <ul className="mt-2 space-y-1">
                {(contenido.aportesDelNivelPagado ?? []).map((a) => (
                  <li key={a} className="text-sm leading-relaxed text-amber-900">
                    {a}
                  </li>
                ))}
              </ul>
              <Link
                href={`/propiedades/${informe.propiedad.id}`}
                className="mt-3 inline-block text-sm font-medium text-trato-700 hover:text-trato-800"
              >
                Pedirla desde la publicación
              </Link>
            </div>
          )}
        </section>
      )}

      {contenido.consentimiento && (
        <p className="mt-8 text-xs leading-relaxed text-tinta-tenue">
          El vendedor autorizó mostrar estos antecedentes el{' '}
          {new Intl.DateTimeFormat('es-CL', {
            timeZone: 'America/Santiago',
            dateStyle: 'long',
          }).format(new Date(contenido.consentimiento.otorgadoEn))}
          . Este informe no constituye asesoría legal ni tributaria.
        </p>
      )}
    </div>
  );
}
