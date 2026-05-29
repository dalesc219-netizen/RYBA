import { useState, useEffect } from 'react';
import { useAppStore } from '../core/store';

export interface WeatherData {
  temperature_2m: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

const FALLBACK_LAT = 58.07;
const FALLBACK_LON = 38.29;

export function useWeather() {
  const { userLocation, setUserLocation } = useAppStore();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        setLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather');
        const json = await res.json();
        
        if (mounted && json.current) {
          setData({
            temperature_2m: json.current.temperature_2m,
            surface_pressure: Math.round(json.current.surface_pressure * 0.750062),
            wind_speed_10m: json.current.wind_speed_10m,
            wind_direction_10m: json.current.wind_direction_10m,
          });
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (userLocation) {
      fetchWeather(userLocation[0], userLocation[1]);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setUserLocation([lat, lon]);
          },
          () => {
            fetchWeather(FALLBACK_LAT, FALLBACK_LON);
          },
          { timeout: 5000 }
        );
      } else {
        fetchWeather(FALLBACK_LAT, FALLBACK_LON);
      }
    }

    return () => {
      mounted = false;
    };
  }, [userLocation, setUserLocation]);

  return { data, loading, error };
}
