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

/** Deja listos `google.maps.Map` y `google.maps.marker.AdvancedMarkerElement`. */
export async function cargarGoogleMaps(): Promise<void> {
  if (!hayGoogleMaps) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada.');
  }
  if (!configurado) {
    setOptions({ key: GOOGLE_MAPS_API_KEY });
    configurado = true;
  }
  await Promise.all([importLibrary('maps'), importLibrary('marker')]);
}
