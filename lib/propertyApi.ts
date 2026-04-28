import { supabaseClient } from '@/lib/supabase';
import { resolveStorageImageUrls } from '@/lib/storage';
import { Property } from '@/types/property';

type PropertyRow = {
  id: string;
  user_id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  video_url?: string | null;
  is_featured: boolean;
  property_type: Property['type'];
  amenities: string[];
  year_built: number;
  latitude: number;
  longitude: number;
  listing_type: Property['listingType'];
  payment_frequency?: Property['paymentFrequency'] | null;
  listing_status?: Property['listingStatus'] | null;
  land_details?: Property['landDetails'] | null;
  lister?: Property['lister'] | null;
  nearby_facilities?: Property['nearbyFacilities'] | null;
  created_at?: string;
  updated_at?: string;
};

const mapRowToProperty = (row: PropertyRow): Property => ({
  id: row.id,
  title: row.title,
  price: row.price,
  address: row.address,
  city: row.city,
  state: row.state,
  zipCode: row.zip_code,
  description: row.description,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  squareFeet: row.square_feet,
  images: row.images || [],
  video: row.video_url || undefined,
  isFeatured: row.is_featured,
  type: row.property_type,
  amenities: row.amenities || [],
  yearBuilt: row.year_built,
  latitude: row.latitude,
  longitude: row.longitude,
  listingType: row.listing_type,
  paymentFrequency: row.payment_frequency || undefined,
  listingStatus: row.listing_status || 'available',
  landDetails: row.land_details || undefined,
  listedByUserId: row.user_id,
  lister: row.lister || undefined,
  nearbyFacilities: row.nearby_facilities || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPropertyToRow = (property: Omit<Property, 'id'>, userId: string) => ({
  user_id: userId,
  title: property.title,
  price: property.price,
  address: property.address,
  city: property.city,
  state: property.state,
  zip_code: property.zipCode,
  description: property.description,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  square_feet: property.squareFeet,
  images: property.images,
  video_url: property.video || null,
  is_featured: property.isFeatured,
  property_type: property.type,
  amenities: property.amenities,
  year_built: property.yearBuilt,
  latitude: property.latitude,
  longitude: property.longitude,
  listing_type: property.listingType,
  payment_frequency: property.paymentFrequency || null,
  listing_status: property.listingStatus || 'available',
  land_details: property.landDetails || null,
  lister: property.lister || null,
  nearby_facilities: property.nearbyFacilities || [],
});

const mapRowToPropertyWithResolvedImages = async (row: PropertyRow): Promise<Property> => {
  const resolvedImages = await resolveStorageImageUrls(row.images || [], 'property-images');
  return mapRowToProperty({
    ...row,
    images: resolvedImages,
  });
};

export const fetchAllPropertiesFromSupabase = async () => {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all(((data || []) as PropertyRow[]).map(mapRowToPropertyWithResolvedImages));
};

export const fetchUserPropertiesFromSupabase = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all(((data || []) as PropertyRow[]).map(mapRowToPropertyWithResolvedImages));
};

export const createPropertyInSupabase = async (property: Omit<Property, 'id'>) => {
  // Get the authenticated user's ID from Supabase session
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError || !session) {
    console.error('[PropertyAPI] No active session:', sessionError);
    throw new Error('You must be logged in to create a property. Please sign in again.');
  }
  
  const userId = session.user.id;
  console.log('[PropertyAPI] Creating property for authenticated user:', userId);
  console.log('[PropertyAPI] Property data:', JSON.stringify(property, null, 2));
  
  const rowData = mapPropertyToRow(property, userId);
  console.log('[PropertyAPI] Mapped row data:', JSON.stringify(rowData, null, 2));
  
  const { data, error } = await supabaseClient
    .from('properties')
    .insert(rowData)
    .select('*')
    .single();

  if (error) {
    console.error('[PropertyAPI] Insert error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to create property: ${error.message}`);
  }

  console.log('[PropertyAPI] Property created successfully:', data?.id);
  return mapRowToPropertyWithResolvedImages(data as PropertyRow);
};

export const updatePropertyInSupabase = async (
  propertyId: string,
  updates: Partial<Omit<Property, 'id'>>
) => {
  // Get the authenticated user's ID from Supabase session
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError || !session) {
    console.error('[PropertyAPI] No active session:', sessionError);
    throw new Error('You must be logged in to update a property. Please sign in again.');
  }
  
  const userId = session.user.id;
  
  const rowUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) rowUpdates.title = updates.title;
  if (updates.price !== undefined) rowUpdates.price = updates.price;
  if (updates.address !== undefined) rowUpdates.address = updates.address;
  if (updates.city !== undefined) rowUpdates.city = updates.city;
  if (updates.state !== undefined) rowUpdates.state = updates.state;
  if (updates.zipCode !== undefined) rowUpdates.zip_code = updates.zipCode;
  if (updates.description !== undefined) rowUpdates.description = updates.description;
  if (updates.bedrooms !== undefined) rowUpdates.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) rowUpdates.bathrooms = updates.bathrooms;
  if (updates.squareFeet !== undefined) rowUpdates.square_feet = updates.squareFeet;
  if (updates.images !== undefined) rowUpdates.images = updates.images;
  if (updates.video !== undefined) rowUpdates.video_url = updates.video;
  if (updates.isFeatured !== undefined) rowUpdates.is_featured = updates.isFeatured;
  if (updates.type !== undefined) rowUpdates.property_type = updates.type;
  if (updates.amenities !== undefined) rowUpdates.amenities = updates.amenities;
  if (updates.yearBuilt !== undefined) rowUpdates.year_built = updates.yearBuilt;
  if (updates.latitude !== undefined) rowUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) rowUpdates.longitude = updates.longitude;
  if (updates.listingType !== undefined) rowUpdates.listing_type = updates.listingType;
  if (updates.paymentFrequency !== undefined) rowUpdates.payment_frequency = updates.paymentFrequency;
  if (updates.listingStatus !== undefined) rowUpdates.listing_status = updates.listingStatus;
  if (updates.landDetails !== undefined) rowUpdates.land_details = updates.landDetails;
  if (updates.lister !== undefined) rowUpdates.lister = updates.lister;
  if (updates.nearbyFacilities !== undefined) rowUpdates.nearby_facilities = updates.nearbyFacilities;

  const { data, error } = await supabaseClient
    .from('properties')
    .update(rowUpdates)
    .eq('id', propertyId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToPropertyWithResolvedImages(data as PropertyRow);
};
