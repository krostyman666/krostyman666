'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { cargarGoogleMaps, hayGoogleMaps } from '@/lib/mapa';

interface Props {
  latitud: number | null;
  longitud: number | null;
  comuna: string;
  /**
   * La dirección exacta se muestra recién cuando hay visita confirmada. Antes
   * de eso el mapa marca el sector: si el punto exacto va en la página pública,
   * cualquiera puede llegar al vendedor por fuera y la plataforma no cumple su
   * parte de la operación.
   */
  exacta?: boolean;
}

// Mismo radio que usa el backend para redondear la coordenada pública
// (`redondearSector`, ~110 m): el círculo dibujado tiene que representar la
// misma incertidumbre real, ni más preciso ni más vago de lo que el dato es.
const RADIO_SECTOR_METROS = 120;

/**
 * Mapa interactivo de una propiedad -- se puede arrastrar, hacer zoom y ver
 * el barrio sin salir de la ficha, como en cualquier portal inmobiliario. Dos
 * proveedores, mismo criterio que `MapaResultados`: Google Maps si hay
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, Leaflet + OpenStreetMap si no -- gratis,
 * sin llave, también interactivo. Antes esto era un iframe estático de
 * embed.html de OSM; se cambió a un mapa de verdad para que el zoom/paneo no
 * dependa de los parámetros fijos de un embed y para compartir exactamente el
 * mismo mecanismo de carga que ya usa la búsqueda.
 */
export default function MapaPropiedad({ latitud, longitud, comuna, exacta = false }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | google.maps.Map | null>(null);
  const proveedorRef = useRef<'leaflet' | 'google' | null>(null);
  const overlayRef = useRef<
    L.Layer | google.maps.Circle | google.maps.marker.AdvancedMarkerElement | null
  >(null);
  // El efecto que dibuja el marcador/círculo depende de que el mapa ya exista
  // (`mapaRef.current`), pero ese ref lo llena un `import()` asíncrono de acá
  // abajo. Sin este estado, si el efecto de dibujar corre antes de que el
  // import termine, se sale temprano y nunca se vuelve a disparar porque
  // `latitud`/`longitud`/`exacta` no cambian de nuevo -- el círculo quedaba
  // sin dibujarse en el primer render, siempre, no sólo a veces.
  const [listo, setListo] = useState(false);

  // Inicializa el mapa una sola vez, centrado en el punto que ya tenemos al
  // montar. Si la propiedad no tiene coordenadas el componente ni siquiera
  // llega a renderizar el contenedor (ver el return más abajo), así que acá
  // adentro `latitud`/`longitud` nunca son null en los efectos.
  useEffect(() => {
    if (latitud === null || longitud === null || !contenedorRef.current) return;
    let cancelado = false;
    const centro = { lat: latitud, lng: longitud };
    const zoom = exacta ? 17 : 15;

    async function iniciar() {
      if (hayGoogleMaps) {
        await cargarGoogleMaps();
        if (cancelado || !contenedorRef.current) return;
        const mapa = new google.maps.Map(contenedorRef.current, {
          center: centro,
          zoom,
          mapId: 'DEMO_MAP_ID',
          streetViewControl: true,
          mapTypeControl: false,
        });
        mapaRef.current = mapa;
        proveedorRef.current = 'google';
        setListo(true);
        return;
      }

      const L = await import('leaflet');
      if (cancelado || !contenedorRef.current) return;
      const mapa = L.map(contenedorRef.current).setView([centro.lat, centro.lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa);
      mapaRef.current = mapa;
      proveedorRef.current = 'leaflet';
      setListo(true);
    }

    iniciar();
    return () => {
      cancelado = true;
      if (proveedorRef.current === 'leaflet' && mapaRef.current) {
        (mapaRef.current as L.Map).remove();
      }
      mapaRef.current = null;
      proveedorRef.current = null;
      overlayRef.current = null;
      setListo(false);
    };
    // Sólo al montar: esta ficha no cambia de propiedad sin desmontarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dibuja el marcador (ubicación exacta) o el círculo de sector (aproximada).
  // Corre tanto cuando cambian las coordenadas como cuando el mapa recién
  // termina de inicializarse (`listo`) -- ver la nota junto a `overlayRef`.
  useEffect(() => {
    const proveedor = proveedorRef.current;
    const mapa = mapaRef.current;
    if (!mapa || !proveedor || latitud === null || longitud === null) return;

    (async () => {
      if (proveedor === 'leaflet') {
        const L = await import('leaflet');
        if (proveedorRef.current !== 'leaflet') return;
        if (overlayRef.current) (overlayRef.current as L.Layer).remove();
        overlayRef.current = exacta
          ? L.marker([latitud, longitud]).addTo(mapa as L.Map)
          : L.circle([latitud, longitud], {
              radius: RADIO_SECTOR_METROS,
              color: '#059669',
              fillColor: '#059669',
              fillOpacity: 0.2,
            }).addTo(mapa as L.Map);
      } else {
        await cargarGoogleMaps();
        if (proveedorRef.current !== 'google') return;
        const anterior = overlayRef.current as
          | google.maps.marker.AdvancedMarkerElement
          | google.maps.Circle
          | null;
        if (anterior instanceof google.maps.Circle) anterior.setMap(null);
        else if (anterior) anterior.map = null;
        overlayRef.current = exacta
          ? new google.maps.marker.AdvancedMarkerElement({
              map: mapa as google.maps.Map,
              position: { lat: latitud, lng: longitud },
            })
          : new google.maps.Circle({
              map: mapa as google.maps.Map,
              center: { lat: latitud, lng: longitud },
              radius: RADIO_SECTOR_METROS,
              strokeColor: '#059669',
              fillColor: '#059669',
              fillOpacity: 0.2,
            });
      }
    })();
  }, [latitud, longitud, exacta, listo]);

  if (latitud === null || longitud === null) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-tinta/20 p-6">
        <MapPin className="h-5 w-5 shrink-0 text-tinta-tenue" />
        <p className="text-sm text-tinta-tenue">
          Esta publicación todavía no tiene ubicación en el mapa. Está en {comuna}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={contenedorRef}
        className="aspect-video overflow-hidden rounded-2xl border border-tinta/10 bg-tinta/5"
      />
      <p className="mt-2 text-xs text-tinta-tenue">
        {exacta
          ? 'Ubicación exacta de la propiedad.'
          : 'Sector aproximado. La dirección exacta te llega cuando confirmamos la visita.'}
      </p>
    </div>
  );
}
