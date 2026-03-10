import { supabaseClient } from '@/lib/supabase';

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
    console.log('[Storage] Fetching image from URI:', imageUri);
    
    const response = await fetch(imageUri);
    if (!response.ok) {
      console.error('[Storage] Failed to fetch image:', response.status, response.statusText);
      return imageUri;
    }
    
    const blob = await response.blob();
    console.log('[Storage] Image blob size:', blob.size, 'type:', blob.type);
    
    const extension = getFileExtension(imageUri);
    const filePath = createFilePath(userId, extension);
    console.log('[Storage] Uploading to path:', filePath);

    const { data: uploadData, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: blob.type || `image/${extension}`,
        upsert: false,
      });

    if (error) {
      console.error('[Storage] Upload error details:', {
        message: error.message,
        name: error.name,
        bucket,
        filePath,
      });
      return imageUri; // Return original URI if upload fails
    }

    console.log('[Storage] Upload successful:', uploadData?.path);
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
    console.log('[Storage] Public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('[Storage] Exception during upload:', error);
    return imageUri; // Return original URI if any error occurs
  }
};

export const uploadPropertyImages = async (
  images: string[], 
  userId: string,
  onProgress?: (progress: number) => void
) => {
  try {
    const totalImages = images.length;
    const uploaded: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageUri = images[i];
      const uploadedUri = await uploadImageToBucket(imageUri, 'property-images', userId);
      uploaded.push(uploadedUri);
      
      // Calculate and report progress
      const progress = Math.round(((i + 1) / totalImages) * 100);
      if (onProgress) {
        onProgress(progress);
      }
    }
    
    return uploaded;
  } catch (error) {
    console.error('Property images upload failed:', error);
    return images; // Return original images if upload fails
  }
};
