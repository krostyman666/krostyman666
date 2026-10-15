import { REGIONES } from './propiedades';

type Region = (typeof REGIONES)[number];

function sinAcentos(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// De más específico a más genérico: "región de "/"región del " sólo matan esa
// palabra puntual, así que se intentan antes que el "región " genérico, que si
// fuera primero dejaría "de valparaíso" en vez de "valparaíso".
const PREFIJOS_REGION = ['región de ', 'región del ', 'región '];

/**
 * Hace calzar el nombre de región que devuelve Google (`administrative_area_level_1`,
 * ej. "Región de Valparaíso" o "Región Metropolitana de Santiago") contra
 * nuestro enum fijo. No se verificó contra una cuenta real de Google Maps
 * todavía -- sin API key no hay forma de probarlo en vivo -- así que si el
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

export interface DireccionComponentes {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  geometry?: { location?: { lat: () => number; lng: () => number } };
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
): { long_name: string; short_name: string } | null {
  return place.address_components?.find((c) => c.types.includes(tipo)) ?? null;
}

/**
 * Saca calle/número/comuna/región/coordenadas de un `PlaceResult` de Google
 * Places Autocomplete. La comuna chilena casi siempre viene en
 * `administrative_area_level_3` (Google pone ahí la comuna, no en `locality`,
 * para la jerarquía región/provincia/comuna de Chile); se cae a `locality` por
 * si alguna comuna rural no sigue el patrón. Esto tampoco se verificó contra
 * una cuenta real todavía -- ver nota en `normalizarRegion`.
 */
export function direccionDesdeLugar(place: DireccionComponentes): DireccionExtraida {
  const route = componente(place, 'route');
  const numero = componente(place, 'street_number');
  const comuna = componente(place, 'administrative_area_level_3') ?? componente(place, 'locality');
  const region = componente(place, 'administrative_area_level_1');

  return {
    calle: route?.long_name ?? null,
    numero: numero?.long_name ?? null,
    comuna: comuna?.long_name ?? null,
    region: region ? normalizarRegion(region.long_name) : null,
    latitud: place.geometry?.location ? place.geometry.location.lat() : null,
    longitud: place.geometry?.location ? place.geometry.location.lng() : null,
  };
}
