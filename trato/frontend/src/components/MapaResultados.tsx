'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import { cargarGoogleMaps, hayGoogleMaps } from '@/lib/mapa';
import { formatearPrecio, type PropiedadApi } from '@/lib/propiedades';

export interface BoundsMapa {
  norte: number;
  sur: number;
  este: number;
  oeste: number;
}

interface Props {
  propiedades: PropiedadApi[];
  /** Cuál tarjeta está destacada en la lista (hover), para resaltar su pin. */
  destacada?: string | null;
  onBoundsChange?: (bounds: BoundsMapa) => void;
}

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };

/**
 * Mapa con todos los resultados de la búsqueda. Dos proveedores posibles:
 *
 * - Google Maps, si `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada.
 * - Leaflet + OpenStreetMap si no -- gratis, sin llave, igual que el mapa de
 *   la ficha individual. La diferencia con `MapaPropiedad` es que ahí un
 *   iframe de embed alcanza para un solo punto; acá hacen falta varios pines
 *   con comportamiento propio (clic, resaltado), y eso un iframe no lo hace.
 *
 * Las coordenadas que llegan del backend ya vienen redondeadas a ~100 m
 * (sector, no punto exacto) para cualquiera sin acceso al expediente -- ver
 * `redondearSector` en el backend. El mapa no sabe ni necesita saber eso: se
 * limita a dibujar lo que recibe.
 */
export default function MapaResultados({ propiedades, destacada, onBoundsChange }: Props) {
  const router = useRouter();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | google.maps.Map | null>(null);
  const proveedorRef = useRef<'leaflet' | 'google' | null>(null);
  const marcadoresRef = useRef<Map<string, L.CircleMarker | google.maps.marker.AdvancedMarkerElement>>(
    new Map(),
  );
  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);
  // El primer "idle"/"moveend" lo dispara el propio `setView`/constructor del
  // mapa, no un movimiento del usuario. Si se contara, el botón "Buscar en
  // esta zona" aparecería solo al cargar la página, sin que nadie tocara nada.
  const primerMovimientoRef = useRef(true);
  const emitirBounds = useCallback((bounds: BoundsMapa) => {
    if (primerMovimientoRef.current) {
      primerMovimientoRef.current = false;
      return;
    }
    onBoundsChangeRef.current?.(bounds);
  }, []);

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      if (!contenedorRef.current) return;

      if (hayGoogleMaps) {
        await cargarGoogleMaps();
        if (cancelado || !contenedorRef.current) return;
        const mapa = new google.maps.Map(contenedorRef.current, {
          center: SANTIAGO,
          zoom: 12,
          // Sentinel oficial de Google para probar Advanced Markers sin tener
          // que crear un Map ID propio en Cloud Console.
          mapId: 'DEMO_MAP_ID',
        });
        mapa.addListener('idle', () => {
          const b = mapa.getBounds();
          if (!b) return;
          emitirBounds({
            norte: b.getNorthEast().lat(),
            sur: b.getSouthWest().lat(),
            este: b.getNorthEast().lng(),
            oeste: b.getSouthWest().lng(),
          });
        });
        mapaRef.current = mapa;
        proveedorRef.current = 'google';
        return;
      }

      const L = await import('leaflet');
      if (cancelado || !contenedorRef.current) return;
      const mapa = L.map(contenedorRef.current).setView([SANTIAGO.lat, SANTIAGO.lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa);
      mapa.on('moveend', () => {
        const b = mapa.getBounds();
        emitirBounds({
          norte: b.getNorth(),
          sur: b.getSouth(),
          este: b.getEast(),
          oeste: b.getWest(),
        });
      });
      mapaRef.current = mapa;
      proveedorRef.current = 'leaflet';
    }

    iniciar();
    return () => {
      cancelado = true;
      if (proveedorRef.current === 'leaflet' && mapaRef.current) {
        (mapaRef.current as L.Map).remove();
      }
      mapaRef.current = null;
      proveedorRef.current = null;
    };
    // Sólo al montar: cambiar de proveedor en caliente no es un caso real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redibuja los pines cuando cambian los resultados.
  useEffect(() => {
    const proveedor = proveedorRef.current;
    const mapa = mapaRef.current;
    if (!mapa || !proveedor) return;

    const conUbicacion = propiedades.filter(
      (p): p is PropiedadApi & { latitud: number; longitud: number } =>
        p.latitud !== null && p.longitud !== null,
    );
    const idsActuales = new Set(conUbicacion.map((p) => p.id));

    for (const [id, marcador] of marcadoresRef.current) {
      if (!idsActuales.has(id)) {
        if (proveedor === 'leaflet') (marcador as L.CircleMarker).remove();
        else (marcador as google.maps.marker.AdvancedMarkerElement).map = null;
        marcadoresRef.current.delete(id);
      }
    }

    conUbicacion.forEach(async (p) => {
      const existente = marcadoresRef.current.get(p.id);
      const esDestacada = p.id === destacada;

      if (proveedor === 'leaflet') {
        const L = await import('leaflet');
        if (proveedorRef.current !== 'leaflet') return;
        let marcador = existente as L.CircleMarker | undefined;
        if (!marcador) {
          marcador = L.circleMarker([p.latitud, p.longitud], { radius: 8 }).addTo(
            mapa as L.Map,
          );
          marcador.bindTooltip(formatearPrecio(p.precio, p.moneda));
          marcador.on('click', () => router.push(`/propiedades/${p.id}`));
          marcadoresRef.current.set(p.id, marcador);
        }
        marcador.setStyle({
          color: esDestacada ? '#0f172a' : '#059669',
          fillColor: esDestacada ? '#0f172a' : '#059669',
          fillOpacity: 0.9,
          weight: esDestacada ? 3 : 2,
        });
        if (esDestacada) marcador.setRadius(11);
        else marcador.setRadius(8);
      } else {
        await cargarGoogleMaps();
        if (proveedorRef.current !== 'google') return;
        let marcador = existente as google.maps.marker.AdvancedMarkerElement | undefined;
        if (!marcador) {
          const pin = document.createElement('div');
          pin.className = 'trato-pin';
          pin.textContent = formatearPrecio(p.precio, p.moneda);
          marcador = new google.maps.marker.AdvancedMarkerElement({
            map: mapa as google.maps.Map,
            position: { lat: p.latitud, lng: p.longitud },
            content: pin,
          });
          marcador.addListener('click', () => router.push(`/propiedades/${p.id}`));
          marcadoresRef.current.set(p.id, marcador);
        }
        const pin = marcador.content as HTMLDivElement;
        pin.classList.toggle('trato-pin--activa', esDestacada);
      }
    });
  }, [propiedades, destacada, router]);

  return (
    <div
      ref={contenedorRef}
      className="h-full w-full overflow-hidden rounded-2xl border border-tinta/10 bg-tinta/5"
    />
  );
}
