import { REGIONES } from './propiedades';

type Region = (typeof REGIONES)[number];

function sinAcentos(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Sin tildes a propósito: se comparan contra `limpio`, que ya pasó por
// `sinAcentos` más abajo. Con tilde (`'región de '`) el `startsWith` nunca
// calzaba -- bug real encontrado al probar "Región Metropolitana" (sin "de
// Santiago") contra la API real: el fallback por substring que sigue más
// abajo lo disimulaba en los demás casos ("región de X" sigue conteniendo
// "X" aunque el prefijo no se haya recortado), pero no en este.
//
// De más específico a más genérico: "region de "/"region del " sólo matan esa
// palabra puntual, así que se intentan antes que el "region " genérico, que si
// fuera primero dejaría "de valparaiso" en vez de "valparaiso".
const PREFIJOS_REGION = ['region de ', 'region del ', 'region '];

/**
 * Hace calzar el nombre de región que devuelve Google (`administrative_area_level_1`)
 * contra nuestro enum fijo. Verificado en vivo contra una cuenta real: para la
 * Región Metropolitana, Google (Places API New) devuelve literalmente
 * "Región Metropolitana" -- sin el "de Santiago" que trae nuestro enum -- así
 * que el calce exacto no basta y hace falta el fallback por substring de más
 * abajo (`"metropolitana de santiago".includes("metropolitana")`). Si el
 * nombre no calza ni por prefijo ni por substring, no se adivina: se deja la
 * región sin tocar y el vendedor la elige a mano, como ya podía hacer antes
 * de que existiera el autocompletado.
 */
export function normalizarRegion(nombreGoogle: string): Region | null {
  let limpio = sinAcentos(nombreGoogle);
  if (!limpio) return null;
  for (const prefijo of PREFIJOS_REGION) {
    if (limpio.startsWith(prefijo)) {
      limpio = limpio.slice(prefijo.length);
      break;
    }
  }

  const exacta = REGIONES.find((r) => sinAcentos(r) === limpio);
  if (exacta) return exacta;

  const parcial = REGIONES.find((r) => {
    const candidato = sinAcentos(r);
    return candidato.includes(limpio) || limpio.includes(candidato);
  });
  return parcial ?? null;
}

// Forma de `google.maps.places.Place` (Places API New, vía
// `PlaceAutocompleteElement`) después de `fetchFields`. El widget legacy
// (`google.maps.places.Autocomplete`) usaba otros nombres de campo
// (`address_components`/`long_name`/`geometry.location`) pero dejó de estar
// disponible para proyectos nuevos desde marzo de 2025 -- ver CLAUDE.md,
// sección "Google Maps". `AddressComponent.longText`/`.shortText`/`.types`
// verificados en vivo contra la API real.
export interface DireccionComponentes {
  addressComponents?: Array<{ longText: string | null; shortText: string | null; types: string[] }>;
  location?: { lat: () => number; lng: () => number } | null;
}

export interface DireccionExtraida {
  calle: string | null;
  numero: string | null;
  comuna: string | null;
  region: Region | null;
  latitud: number | null;
  longitud: number | null;
}

function componente(
  place: DireccionComponentes,
  tipo: string,
): { longText: string | null; shortText: string | null } | null {
  return place.addressComponents?.find((c) => c.types.includes(tipo)) ?? null;
}

/**
 * Saca calle/número/comuna/región/coordenadas de un `Place` de Google Place
 * Autocomplete (New), después de `fetchFields`. La comuna chilena casi
 * siempre viene en `administrative_area_level_3` (Google pone ahí la comuna,
 * no en `locality`, para la jerarquía región/provincia/comuna de Chile); se
 * cae a `locality` por si alguna comuna rural no sigue el patrón. Verificado
 * en vivo: "Av. Apoquindo 3000, Las Condes" trae
 * `administrative_area_level_3` = "Las Condes" con `locality` idéntico, y
 * `administrative_area_level_1` = "Región Metropolitana" (ver nota en
 * `normalizarRegion`).
 */
export function direccionDesdeLugar(place: DireccionComponentes): DireccionExtraida {
  const route = componente(place, 'route');
  const numero = componente(place, 'street_number');
  const comuna = componente(place, 'administrative_area_level_3') ?? componente(place, 'locality');
  const region = componente(place, 'administrative_area_level_1');

  return {
    calle: route?.longText ?? null,
    numero: numero?.longText ?? null,
    comuna: comuna?.longText ?? null,
    region: region?.longText ? normalizarRegion(region.longText) : null,
    latitud: place.location ? place.location.lat() : null,
    longitud: place.location ? place.location.lng() : null,
  };
}
