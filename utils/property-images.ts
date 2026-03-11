import { Image } from 'expo-image';
import { Property } from '@/types/property';

const isRemoteImageUri = (uri?: string | null) => !!uri && /^https?:\/\//i.test(uri);

export const getPropertyPrimaryImage = (property: Property) => {
  return property.images[0] || property.previewImages?.[0] || undefined;
};

export const getPropertyImagePlaceholder = (property: Property, index = 0) => {
  const placeholderUri = property.previewImages?.[index] || property.previewImages?.[0];
  return placeholderUri ? { uri: placeholderUri } : undefined;
};

export const prefetchPropertyImageUrls = async (urls: string[]) => {
  const uniqueRemoteUrls = Array.from(new Set(urls.filter((url) => isRemoteImageUri(url))));

  if (uniqueRemoteUrls.length === 0) {
    return;
  }

  try {
    await Image.prefetch(uniqueRemoteUrls, 'memory-disk');
  } catch (error) {
    console.warn('[Images] Prefetch failed:', error);
  }
};

export const prefetchPropertyImages = async (properties: Property[]) => {
  const urls = properties.flatMap((property) => property.images);
  await prefetchPropertyImageUrls(urls);
};