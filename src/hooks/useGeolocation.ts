import { useState, useEffect, useCallback } from 'react';

// Coordenadas del Luckia Casino, Arica
const CASINO_LAT = -18.473375;
const CASINO_LNG = -70.314600;
const RADIO_METROS = 200;

export type GeoEstado =
  | 'verificando'        // Pidiendo permiso / obteniendo ubicación
  | 'dentro_del_rango'   // Cliente está en el casino
  | 'fuera_del_rango'    // Cliente está lejos
  | 'permiso_denegado'   // Rechazó el permiso de ubicación
  | 'no_soportado'       // Browser no soporta geolocation
  | 'error';             // Error genérico

export interface GeoResult {
  estado: GeoEstado;
  distancia: number | null; // metros al casino (null si no se pudo calcular)
  intentar: () => void;     // función para reintentar
}

/**
 * Calcula distancia en metros entre dos coordenadas usando la fórmula de Haversine.
 */
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useGeolocation = (): GeoResult => {
  const [estado, setEstado] = useState<GeoEstado>('verificando');
  const [distancia, setDistancia] = useState<number | null>(null);

  const verificar = useCallback(() => {
    if (!navigator.geolocation) {
      setEstado('no_soportado');
      return;
    }

    setEstado('verificando');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = calcularDistancia(
          position.coords.latitude,
          position.coords.longitude,
          CASINO_LAT,
          CASINO_LNG
        );
        setDistancia(Math.round(dist));
        setEstado(dist <= RADIO_METROS ? 'dentro_del_rango' : 'fuera_del_rango');
      },
      (error) => {
        setDistancia(null);
        if (error.code === error.PERMISSION_DENIED) {
          setEstado('permiso_denegado');
        } else {
          setEstado('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache de 1 minuto
      }
    );
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  return { estado, distancia, intentar: verificar };
};
