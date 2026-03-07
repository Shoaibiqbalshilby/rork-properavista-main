export interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: string[];
  isFeatured: boolean;
  type: 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'duplex' | 'flat' | 'landed';
  amenities: string[];
  yearBuilt: number;
  latitude: number;
  longitude: number;
  listingType: 'sell' | 'rent' | 'short-let';
  paymentFrequency?: PaymentFrequency;
  listingStatus?: ListingStatus;
  landDetails?: LandDetails;
  listedByUserId?: string;
  lister?: ListerProfile;
  nearbyFacilities?: NearbyFacility[];
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentFrequency = {
  rent?: 'monthly' | 'yearly';
  'short-let'?: 'daily' | 'weekly' | 'monthly';
};

export type ListingStatus = 'available' | 'reserved' | 'sold';

export type LandUnit = 'plot' | 'acre' | 'hectare';

export type LandDetails = {
  unit: LandUnit;
  quantity: number;
};

export type ListerProfile = {
  name: string;
  companyName?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
};

export type NearbyFacility = {
  key: string;
  label: string;
  distanceKm: number;
};

export type PropertyFilter = {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string[];
  listingType?: string[];
  searchQuery?: string;
  state?: string;
  city?: string;
  paymentFrequency?: string;
};