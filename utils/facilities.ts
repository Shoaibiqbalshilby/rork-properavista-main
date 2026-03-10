import { NearbyFacility } from '@/types/property';
import { calculateDistance } from '@/utils/distance';
import { GOOGLE_MAPS_API_KEY } from '@/constants/maps';

const facilityTypes = [
  { key: 'hospital', label: 'Hospital' },
  { key: 'police', label: 'Police Station' },
  { key: 'school', label: 'School' },
  { key: 'supermarket', label: 'Supermarket' },
] as const;

const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

export async function getNearbyFacilityDistances(
  latitude: number,
  longitude: number
): Promise<NearbyFacility[]> {
  const apiKey = GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return [];
  }

  const results = await Promise.all(
    facilityTypes.map(async (facility) => {
      try {
        const url = `${GOOGLE_PLACES_URL}?location=${latitude},${longitude}&rankby=distance&type=${facility.key}&key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          return null;
        }

        const json = await response.json();
        const nearest = json?.results?.[0]?.geometry?.location;

        if (!nearest?.lat || !nearest?.lng) {
          return null;
        }

        const distanceKm = calculateDistance(latitude, longitude, nearest.lat, nearest.lng);

        return {
          key: facility.key,
          label: facility.label,
          distanceKm: Number(distanceKm.toFixed(2)),
        } as NearbyFacility;
      } catch {
        return null;
      }
    })
  );

  return results.filter((item): item is NearbyFacility => item !== null);
}
