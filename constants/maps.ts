export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  'AIzaSyAwz9goP51ERpdNhzIVksk8upwRh9MT7S0';

export const hasGoogleMapsApiKey = GOOGLE_MAPS_API_KEY.length > 0;

export function getStaticMapUrl(options: {
  latitude: number;
  longitude: number;
  zoom?: number;
  width?: number;
  height?: number;
}) {
  const {
    latitude,
    longitude,
    zoom = 15,
    width = 900,
    height = 500,
  } = options;

  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
}