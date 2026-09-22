import * as Location from 'expo-location';
import { LocalStorage, Alert } from '@anti-grooming/shared';
import { v4 as uuidv4 } from 'uuid';

export interface LocationAlert {
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

// Lugares potencialmente peligrosos (ejemplo)
const RISKY_LOCATIONS: LocationAlert[] = [
  // Estos son ejemplos. En producción, obtener de base de datos.
  {
    name: 'Moteles desconocidos',
    lat: 0,
    lng: 0,
    radius: 500,
  },
];

export class LocationService {
  private static watchLocationId: string | null = null;

  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  static async startWatchingLocation(
    onLocationChange: (location: Location.LocationObject) => void
  ): Promise<void> {
    try {
      this.watchLocationId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // 5 segundos
          distanceInterval: 50, // 50 metros
        },
        (location) => {
          onLocationChange(location);
          this.checkForRiskyLocations(location);
        }
      );
    } catch (error) {
      console.error('Error starting location watch:', error);
    }
  }

  static async stopWatchingLocation(): Promise<void> {
    if (this.watchLocationId) {
      await Location.removeWatchAsync(this.watchLocationId);
      this.watchLocationId = null;
    }
  }

  private static async checkForRiskyLocations(location: Location.LocationObject): Promise<void> {
    for (const riskLocation of RISKY_LOCATIONS) {
      const distance = this.calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        riskLocation.lat,
        riskLocation.lng
      );

      if (distance < riskLocation.radius) {
        const alert: Alert = {
          id: uuidv4(),
          timestamp: Date.now(),
          severity: 'high',
          type: 'location_suspicious',
          title: `Ubicación sospechosa detectada`,
          description: `Se detectó ubicación cerca de: ${riskLocation.name}`,
          context: `Coordenadas: ${location.coords.latitude}, ${location.coords.longitude}`,
          reviewed: false,
        };

        await LocalStorage.saveAlert(alert);
      }
    }
  }

  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static async getLocationName(lat: number, lng: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (result.length > 0) {
        const address = result[0];
        return `${address.name || address.street || ''}, ${address.city || ''}, ${address.country || ''}`.trim();
      }
      return `${lat}, ${lng}`;
    } catch (error) {
      console.error('Error getting location name:', error);
      return `${lat}, ${lng}`;
    }
  }

  static async geocodeAddress(address: string): Promise<Location.LocationObject | null> {
    try {
      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        return {
          coords: {
            latitude: result[0].latitude,
            longitude: result[0].longitude,
            altitude: 0,
            accuracy: 0,
            altitudeAccuracy: 0,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }
}
