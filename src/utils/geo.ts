import { GeoLocationData } from '../types';

/**
 * Calculates the great circle distance between two points on earth in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatCoordinates(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(6)}° ${lat >= 0 ? 'B' : 'N'}`;
  const lngStr = `${Math.abs(lng).toFixed(6)}° ${lng >= 0 ? 'Đ' : 'T'}`;
  return `${latStr}, ${lngStr}`;
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Fetch human-readable approximate address using OpenStreetMap Nominatim
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'vi,en;q=0.9',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (error) {
    console.warn('Could not reverse geocode:', error);
  }

  return `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export interface GeolocationResult {
  success: boolean;
  data?: GeoLocationData;
  error?: string;
}

/**
 * Promise-based current position with high accuracy
 */
export function getCurrentPositionPromise(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Trình duyệt của bạn không hỗ trợ chức năng định vị vị trí (Geolocation).',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 10);
        
        let address: string | undefined;
        try {
          address = await reverseGeocode(lat, lng);
        } catch {
          address = `Vị trí: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        resolve({
          success: true,
          data: {
            latitude: lat,
            longitude: lng,
            accuracy,
            address,
            timestamp: position.timestamp || Date.now(),
          },
        });
      },
      (error) => {
        let errorMsg = 'Không thể lấy được vị trí.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Bạn đã từ chối cấp quyền định vị vị trí. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt để điểm danh.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Tín hiệu định vị GPS hiện không khả dụng. Vui lòng thử lại ở nơi thoáng hơn hoặc bật Wi-Fi/GPS.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Quá thời gian yêu cầu định vị GPS. Vui lòng bấm thử lại.';
            break;
        }
        resolve({
          success: false,
          error: errorMsg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  });
}
