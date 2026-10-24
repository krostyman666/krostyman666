'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { api, mensajeDeError } from '@/lib/api';
import { REGIONES, TIPOS_PROPIEDAD } from '@/lib/propiedades';
import { cargarGooglePlaces, hayGoogleMaps } from '@/lib/mapa';
import { direccionDesdeLugar } from '@/lib/direccion';

// El formulario trabaja siempre con strings y la conversión a número ocurre una
// sola vez, al enviar. Transformar dentro del esquema hace que el tipo de entrada
// y el de salida diverjan, que fue justo lo que rompió el envío antes.
const numeroOpcional = z
  .string()
  .optional()
  .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Debe ser un número');

const aNumero = (v?: string): number | null => (v && v.trim() !== '' ? Number(v) : null);

const esquema = z.object({
  titulo: z.string().trim().min(5, 'Mínimo 5 caracteres').max(150),
  tipo: z.enum(['casa', 'departamento', 'oficina', 'terreno', 'parcela', 'bodega', 'estacionamiento']),
  precio: z
    .string()
    .min(1, 'Pon un precio')
    .refine((v) => Number(v) > 0, 'El precio debe ser mayor que cero'),
  moneda: z.enum(['uf', 'clp']),
  calle: z.string().trim().min(2, 'Falta la calle'),
  numero: z.string().trim().min(1, 'Falta el número'),
  depto: z.string().trim().optional(),
  comuna: z.string().trim().min(2, 'Falta la comuna'),
  region: z.string().min(2, 'Elige una región'),
  rolAvaluo: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{1,5}-\d{1,5}$/.test(v), 'Formato: 12345-67'),
  fojas: z.string().trim().optional(),
  numeroInscripcion: z.string().trim().optional(),
  anoInscripcion: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 1800 && Number(v) <= new Date().getFullYear()), 'Año válido'),
  dormitorios: numeroOpcional,
  banos: numeroOpcional,
  superficieConstruida: numeroOpcional,
  estacionamientos: numeroOpcional,
  tieneHipoteca: z.boolean(),
  descripcion: z.string().trim().max(5000).optional(),
});

type Campos = z.infer<typeof esquema>;

const INPUT =
  'w-full rounded-xl border border-tinta/15 px-4 py-3 text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

export default function FormularioPropiedad() {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  // Sólo se llenan al elegir una sugerencia del autocompletado de Google; si
  // el vendedor escribe la calle a mano (o no hay API key configurada) quedan
  // en null y la propiedad se publica sin coordenadas, igual que siempre.
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const calleInputRef = useRef<HTMLInputElement | null>(null);
  // Sólo se usa cuando hay API key: ahí "Calle" no es un <input> normal sino
  // el custom element de Google (ver el efecto más abajo), así que necesita
  // un contenedor donde montarlo a mano en vez de JSX declarativo.
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({
    resolver: zodResolver(esquema),
    defaultValues: { moneda: 'uf', tipo: 'departamento', tieneHipoteca: false, region: '' },
  });

  const { ref: calleRHFRef, ...calleRegistro } = register('calle');

  // Monta el autocompletado de Google en "Calle" apenas hay API key. Sin
  // key, `hayGoogleMaps` es false y el campo se queda como un input normal
  // -- la dirección sigue siendo 100% editable a mano, como antes de que
  // existiera esto.
  //
  // Es `PlaceAutocompleteElement`, no `google.maps.places.Autocomplete`: ese
  // widget clásico no está disponible para proyectos nuevos de Google Cloud
  // desde marzo de 2025, confirmado en vivo con la cuenta real de este
  // proyecto ("legacy API, which is not enabled for your project", cero
  // sugerencias) -- ver CLAUDE.md. El elemento nuevo es un custom element
  // con shadow DOM cerrado (no se puede leer su input real con
  // `document.querySelector`, ni siquiera con el ref), así que se monta a
  // mano dentro de `autocompleteContainerRef` en vez de declararlo como
  // JSX, y reemplaza por completo al `<input>` de "Calle" -- no lo decora
  // como hacía el widget legacy.
  useEffect(() => {
    if (!hayGoogleMaps || !autocompleteContainerRef.current) return;
    let cancelado = false;
    let elemento: google.maps.places.PlaceAutocompleteElement | undefined;

    cargarGooglePlaces().then(() => {
      if (cancelado || !autocompleteContainerRef.current) return;
      elemento = new google.maps.places.PlaceAutocompleteElement({
        includedRegionCodes: ['cl'],
      });
      elemento.placeholder = 'Ej: Av. Apoquindo 3000';
      elemento.className = 'w-full';

      elemento.addEventListener('gmp-select', async (evento) => {
        let place = evento.placePrediction.toPlace();
        const { place: placeConDatos } = await place.fetchFields({
          fields: ['addressComponents', 'location'],
        });
        place = placeConDatos;
        const lugar = direccionDesdeLugar(place);
        if (lugar.calle) setValue('calle', lugar.calle, { shouldValidate: true });
        if (lugar.numero) setValue('numero', lugar.numero, { shouldValidate: true });
        if (lugar.comuna) setValue('comuna', lugar.comuna, { shouldValidate: true });
        if (lugar.region) setValue('region', lugar.region, { shouldValidate: true });
        setUbicacion(
          lugar.latitud !== null && lugar.longitud !== null
            ? { lat: lugar.latitud, lng: lugar.longitud }
            : null,
        );
      });
      // Si el vendedor escribe y no elige ninguna sugerencia, igual
      // queremos que "calle" quede con lo que escribió -- el host refleja
      // el valor de su input interno en su propia propiedad `value`, que sí
      // es pública aunque el shadow DOM sea cerrado.
      elemento.addEventListener('input', () => {
        setValue('calle', elemento!.value, { shouldValidate: false });
      });

      autocompleteContainerRef.current.appendChild(elemento);
    });

    return () => {
      cancelado = true;
      elemento?.remove();
    };
  }, [setValue]);

  async function enviar(datos: Campos) {
    setErrorServidor(null);
    try {
      const { data } = await api.post('/propiedades', {
        titulo: datos.titulo,
        tipo: datos.tipo,
        moneda: datos.moneda,
        calle: datos.calle,
        numero: datos.numero,
        comuna: datos.comuna,
        region: datos.region,
        tieneHipoteca: datos.tieneHipoteca,
        precio: Number(datos.precio),
        depto: datos.depto || null,
        rolAvaluo: datos.rolAvaluo || null,
        fojas: datos.fojas || null,
        numeroInscripcion: datos.numeroInscripcion || null,
        anoInscripcion: datos.anoInscripcion ? Number(datos.anoInscripcion) : null,
        descripcion: datos.descripcion || null,
        dormitorios: aNumero(datos.dormitorios),
        banos: aNumero(datos.banos),
        superficieConstruida: aNumero(datos.superficieConstruida),
        estacionamientos: aNumero(datos.estacionamientos) ?? 0,
        latitud: ubicacion?.lat ?? null,
        longitud: ubicacion?.lng ?? null,
      });
      router.push(`/propiedades/${data.propiedad.id}/documentos`);
    } catch (error) {
      setErrorServidor(mensajeDeError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-8">
      <Seccion titulo="Lo básico">
        <Campo etiqueta="Título del aviso" error={errors.titulo?.message} ancho="full">
          <input
            {...register('titulo')}
            className={INPUT}
            placeholder="Departamento 3D 2B en Ñuñoa, cerca del metro"
          />
        </Campo>
        <Campo etiqueta="Tipo" error={errors.tipo?.message}>
          <select {...register('tipo')} className={INPUT}>
            {TIPOS_PROPIEDAD.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Campo
            etiqueta="Precio"
            error={errors.precio?.message}
            ayuda="Trato publica propiedades desde UF 5.000."
          >
            <input {...register('precio')} inputMode="numeric" className={INPUT} placeholder="9500" />
          </Campo>
          <Campo etiqueta="Moneda">
            <select {...register('moneda')} className={INPUT}>
              <option value="uf">UF</option>
              <option value="clp">Pesos</option>
            </select>
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Dirección">
        <Campo
          etiqueta="Calle"
          error={errors.calle?.message}
          ayuda={hayGoogleMaps ? 'Empieza a escribir y elige una sugerencia: así capturamos la ubicación exacta para el mapa.' : undefined}
        >
          {hayGoogleMaps ? (
            <div ref={autocompleteContainerRef} />
          ) : (
            <input
              {...calleRegistro}
              ref={(el) => {
                calleRHFRef(el);
                calleInputRef.current = el;
              }}
              className={INPUT}
              autoComplete="off"
            />
          )}
          {ubicacion && (
            <span className="mt-1.5 flex items-center gap-1 text-xs text-cierre-700">
              <MapPin className="h-3.5 w-3.5" />
              Ubicación detectada para el mapa.
            </span>
          )}
        </Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo etiqueta="Número" error={errors.numero?.message}>
            <input {...register('numero')} className={INPUT} />
          </Campo>
          <Campo etiqueta="Depto">
            <input {...register('depto')} className={INPUT} />
          </Campo>
        </div>
        <Campo etiqueta="Comuna" error={errors.comuna?.message}>
          <input {...register('comuna')} className={INPUT} />
        </Campo>
        <Campo etiqueta="Región" error={errors.region?.message}>
          <select {...register('region')} className={INPUT}>
            <option value="">Elige una región</option>
            {REGIONES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          etiqueta="Rol de avalúo (SII)"
          error={errors.rolAvaluo?.message}
          ayuda="Con el rol pedimos el avalúo fiscal y la deuda de contribuciones por ti. Está en tu boleta de contribuciones."
          ancho="full"
        >
          <input {...register('rolAvaluo')} className={INPUT} placeholder="12345-67" />
        </Campo>
      </Seccion>

      <Seccion titulo="Datos de inscripción (Conservador)">
        <Campo
          etiqueta="Fojas"
          error={errors.fojas?.message}
          ayuda="Del registro de inscripción actual. Búscalo en tu contrato de compra o en el Conservador de tu región."
        >
          <input {...register('fojas')} className={INPUT} placeholder="1234" />
        </Campo>
        <Campo
          etiqueta="Número de inscripción"
          error={errors.numeroInscripcion?.message}
        >
          <input {...register('numeroInscripcion')} className={INPUT} placeholder="567" />
        </Campo>
        <Campo
          etiqueta="Año de inscripción"
          error={errors.anoInscripcion?.message}
        >
          <input
            {...register('anoInscripcion')}
            inputMode="numeric"
            className={INPUT}
            placeholder={new Date().getFullYear().toString()}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Características">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Campo etiqueta="Dormitorios">
            <input {...register('dormitorios')} inputMode="numeric" className={INPUT} />
          </Campo>
          <Campo etiqueta="Baños">
            <input {...register('banos')} inputMode="numeric" className={INPUT} />
          </Campo>
          <Campo etiqueta="m² construidos">
            <input {...register('superficieConstruida')} inputMode="numeric" className={INPUT} />
          </Campo>
          <Campo etiqueta="Estacionamientos">
            <input {...register('estacionamientos')} inputMode="numeric" className={INPUT} />
          </Campo>
        </div>
        <Campo etiqueta="Descripción" ancho="full">
          <textarea {...register('descripcion')} rows={4} className={INPUT} />
        </Campo>
      </Seccion>

      <Seccion titulo="Situación legal">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-tinta/15 p-4 sm:col-span-2">
          <input
            type="checkbox"
            {...register('tieneHipoteca')}
            className="mt-0.5 h-5 w-5 accent-trato-600"
          />
          <span className="text-sm">
            <span className="font-medium text-tinta">La propiedad tiene un crédito hipotecario vigente</span>
            <span className="mt-1 block text-tinta-tenue">
              Si lo tiene, agregamos el alzamiento de hipoteca a tu lista de trámites: sin eso no se
              puede inscribir a nombre del comprador.
            </span>
          </span>
        </label>
      </Seccion>

      {errorServidor && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorServidor}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-trato-600 px-6 py-3.5 font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar y ver mis trámites'}
        </button>
        <p className="self-center text-sm text-tinta-tenue">
          Queda en borrador. La publicas cuando quieras.
        </p>
      </div>
    </form>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold text-tinta">{titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Campo({
  etiqueta,
  error,
  ayuda,
  ancho,
  children,
}: {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  ancho?: 'full';
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${ancho === 'full' ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-sm font-medium text-tinta-suave">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1.5 block text-xs text-tinta-tenue">{ayuda}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
