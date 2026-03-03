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
}

export type PaymentFrequency = {
  rent?: 'monthly' | 'yearly';
  'short-let'?: 'daily' | 'weekly' | 'monthly';
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