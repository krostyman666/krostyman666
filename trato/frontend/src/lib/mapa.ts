import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

/**
 * Sin esta llave el mapa de resultados funciona igual, con Leaflet y
 * OpenStreetMap (gratis, sin llave) -- ver MapaResultados.tsx. Cuando se
 * contrate una cuenta de Google Cloud, basta con poner la llave en el .env
 * del frontend: ningún código cambia.
 */
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const hayGoogleMaps = GOOGLE_MAPS_API_KEY.length > 0;

let configurado = false;

function asegurarConfigurado(): void {
  if (!hayGoogleMaps) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada.');
  }
  if (!configurado) {
    // `language`/`region` fijan español y sesgo a Chile en lo que devuelve la
    // API (nombres de calle, comuna, región) -- sin esto el idioma depende del
    // navegador de quien visita, y un vendedor con el navegador en inglés
    // vería "Santiago Metropolitan Region" en vez de "Metropolitana de
    // Santiago", que además no calza con nuestro enum de regiones.
    setOptions({ key: GOOGLE_MAPS_API_KEY, language: 'es', region: 'CL' });
    configurado = true;
  }
}

/** Deja listos `google.maps.Map` y `google.maps.marker.AdvancedMarkerElement`. */
export async function cargarGoogleMaps(): Promise<void> {
  asegurarConfigurado();
  await Promise.all([importLibrary('maps'), importLibrary('marker')]);
}

/**
 * Deja listo `google.maps.places.PlaceAutocompleteElement`, para el
 * formulario de publicar. No es `google.maps.places.Autocomplete`: ese
 * widget legacy no está disponible para proyectos nuevos de Google Cloud
 * desde marzo de 2025 (verificado en vivo contra la cuenta real del
 * proyecto: "legacy API, which is not enabled for your project", cero
 * sugerencias) -- ver CLAUDE.md, sección Google Maps.
 */
export async function cargarGooglePlaces(): Promise<void> {
  asegurarConfigurado();
  await importLibrary('places');
}
