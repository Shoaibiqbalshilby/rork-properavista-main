import { supabaseClient } from '@/lib/supabase';

const STORAGE_URL_PATTERN = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/i;
const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  '3gp': 'video/3gpp',
};

export const isRemoteMediaUrl = (uri?: string | null) => !!uri && /^https?:\/\//i.test(uri);

export const isRemoteImageUrl = isRemoteMediaUrl;

export const isLocalImageUri = (uri?: string | null) => !!uri && /^(file|content|ph|assets-library):/i.test(uri);

export const extractStorageObjectPath = (uri?: string | null, bucket = 'property-images') => {
  if (!uri || isLocalImageUri(uri)) {
    return null;
  }

  if (!isRemoteMediaUrl(uri)) {
    return uri.replace(/^\/+/, '');
  }

  try {
    const parsedUrl = new URL(uri);
    const match = parsedUrl.pathname.match(STORAGE_URL_PATTERN);

    if (!match) {
      return null;
    }

    const [, bucketName, objectPath] = match;
    if (bucketName !== bucket) {
      return null;
    }

    return decodeURIComponent(objectPath);
  } catch {
    return null;
  }
};

export const resolveStorageImageUrl = async (
  uri?: string | null,
  bucket: 'avatar-images' | 'property-images' = 'property-images'
) => {
  if (!uri) {
    return '';
  }

  if (isLocalImageUri(uri)) {
    return '';
  }

  const objectPath = extractStorageObjectPath(uri, bucket);
  if (!objectPath) {
    return uri;
  }

  try {
    const { data, error } = await supabaseClient.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24 * 30);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (error) {
    console.warn('[Storage] Failed to create signed URL, falling back to public URL:', error);
  }

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl || uri;
};

export const resolveStorageImageUrls = async (
  uris: string[],
  bucket: 'avatar-images' | 'property-images' = 'property-images'
) => {
  const resolved = await Promise.all(uris.map((uri) => resolveStorageImageUrl(uri, bucket)));
  return resolved.filter(Boolean);
};

const getFileExtension = (uri: string) => {
  const cleanUri = uri.split('?')[0];
  const extension = cleanUri.split('.').pop()?.toLowerCase();
  if (!extension || extension.length > 5) {
    return 'jpg';
  }
  return extension;
};

const createFilePath = (userId: string, extension: string) => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${userId}/${Date.now()}-${randomPart}.${extension}`;
};

const getMimeType = (uri: string, fallbackType?: string | null) => {
  if (fallbackType) {
    return fallbackType;
  }

  const extension = getFileExtension(uri);
  return MIME_TYPES_BY_EXTENSION[extension] || 'image/jpeg';
};

const blobFromXhr = (uri: string) =>
  new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = () => reject(new Error('XMLHttpRequest failed to read the image file.'));
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });

const readImageAsArrayBuffer = async (uri: string) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to read image file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Image file is empty.');
    }

    return {
      body: arrayBuffer,
      contentType: getMimeType(uri, response.headers.get('content-type')),
    };
  } catch (fetchError) {
    console.warn('[Storage] Fetch-based file read failed, trying XHR fallback:', fetchError);
    const blob = await blobFromXhr(uri);
    const arrayBuffer = await blob.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Image file is empty.');
    }

    return {
      body: arrayBuffer,
      contentType: getMimeType(uri, blob.type),
    };
  }
};

export const uploadImageToBucket = async (
  imageUri: string,
  bucket: 'avatar-images' | 'property-images',
  userId: string
) => {
  if (!imageUri || imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    console.log('Skipping upload for remote/empty URI:', imageUri);
    return imageUri;
  }

  try {
    console.log(`[Storage] Starting upload to ${bucket} for user ${userId}`);
    const extension = getFileExtension(imageUri);
    const filePath = createFilePath(userId, extension);
    const { body, contentType } = await readImageAsArrayBuffer(imageUri);

    console.log('[Storage] Uploading image bytes:', body.byteLength, 'type:', contentType);
    console.log('[Storage] Uploading to path:', filePath);

    const { data: uploadData, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, body, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('[Storage] Upload error details:', {
        message: error.message,
        name: error.name,
        bucket,
        filePath,
      });
      throw new Error(error.message || 'Upload failed');
    }

    console.log('[Storage] Upload successful:', uploadData?.path);
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
    console.log('[Storage] Public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('[Storage] Exception during upload:', error);
    throw error instanceof Error ? error : new Error('Image upload failed');
  }
};

export const uploadVideoToBucket = async (
  videoUri: string,
  bucket: 'property-images',
  userId: string
) => {
  try {
    return await uploadImageToBucket(videoUri, bucket, userId);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Video upload failed');
  }
};

export const uploadPropertyImages = async (
  images: string[], 
  userId: string,
  onProgress?: (progress: number) => void
) => {
  const totalImages = images.length;
  const uploaded: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const imageUri = images[i];
    const uploadedUri = await uploadImageToBucket(imageUri, 'property-images', userId);
    uploaded.push(uploadedUri);

    const progress = Math.round(((i + 1) / totalImages) * 100);
    if (onProgress) {
      onProgress(progress);
    }
  }

  return uploaded;
};

export const uploadPropertyVideo = async (videoUri: string, userId: string) => {
  return uploadVideoToBucket(videoUri, 'property-images', userId);
};
