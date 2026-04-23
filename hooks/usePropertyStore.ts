import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NearbyFacility, Property, PropertyFilter } from '@/types/property';
import { properties as mockProperties } from '@/mocks/properties';
import { calculateDistance } from '@/utils/distance';
import { prefetchPropertyImages } from '@/utils/property-images';

interface PropertyState {
  properties: Property[];
  favorites: string[];
  hiddenProperties: string[];
  blockedProperties: string[];
  filter: PropertyFilter;
  
  // Actions
  toggleFavorite: (id: string) => void;
  setFilter: (filter: PropertyFilter) => void;
  clearFilter: () => void;
  getFilteredProperties: () => Property[];
  getFeaturedProperties: () => Property[];
  getPropertiesNearby: (latitude: number, longitude: number, maxDistance: number) => Property[];
  addProperty: (property: Omit<Property, 'id'>) => string;
  updateProperty: (id: string, updates: Partial<Omit<Property, 'id'>>) => void;
  updatePropertyFacilities: (id: string, facilities: NearbyFacility[]) => void;
  getPropertiesByUser: (userId: string) => Property[];
  setProperties: (properties: Property[]) => void;
  upsertProperty: (property: Property) => void;
  resetForSignOut: () => void;
  hideProperty: (id: string) => void;
  unhideProperty: (id: string) => void;
  blockProperty: (id: string) => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: mockProperties,
      favorites: [],
      hiddenProperties: [],
      blockedProperties: [],
      filter: {},
      
      toggleFavorite: (id: string) => set((state) => {
        if (state.favorites.includes(id)) {
          return { favorites: state.favorites.filter(favId => favId !== id) };
        } else {
          return { favorites: [...state.favorites, id] };
        }
      }),
      
      setFilter: (filter: PropertyFilter) => set({ filter }),
      
      clearFilter: () => set({ filter: {} }),
      
      getFilteredProperties: () => {
        const { properties, filter, hiddenProperties, blockedProperties } = get();
        
        return properties.filter(property => {
          // Exclude hidden and blocked properties
          if (hiddenProperties.includes(property.id)) return false;
          if (blockedProperties.includes(property.id)) return false;
          // Filter by price range
          if (filter.minPrice && property.price < filter.minPrice) return false;
          if (filter.maxPrice && property.price > filter.maxPrice) return false;
          
          // Filter by bedrooms
          if (filter.bedrooms && property.bedrooms < filter.bedrooms) return false;
          
          // Filter by bathrooms
          if (filter.bathrooms && property.bathrooms < filter.bathrooms) return false;
          
          // Filter by property type
          if (filter.propertyType && filter.propertyType.length > 0 && 
              !filter.propertyType.includes(property.type)) return false;
          
          // Filter by listing type
          if (filter.listingType && filter.listingType.length > 0 && 
              !filter.listingType.includes(property.listingType)) return false;
          
          // Filter by payment frequency
          if (filter.paymentFrequency && property.paymentFrequency) {
            const matchesFrequency = 
              (property.listingType === 'rent' && property.paymentFrequency.rent === filter.paymentFrequency) ||
              (property.listingType === 'short-let' && property.paymentFrequency["short-let"] === filter.paymentFrequency);
            
            if (!matchesFrequency) return false;
          }
          
          // Filter by state
          if (filter.state && property.state !== filter.state) return false;
          
          // Filter by city
          if (filter.city && property.city !== filter.city) return false;
          
          // Filter by search query (title, address, city, state)
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            const matchesQuery = 
              property.title.toLowerCase().includes(query) ||
              property.address.toLowerCase().includes(query) ||
              property.city.toLowerCase().includes(query) ||
              property.state.toLowerCase().includes(query);
            
            if (!matchesQuery) return false;
          }
          
          return true;
        });
      },
      
      getFeaturedProperties: () => {
        const { properties, hiddenProperties, blockedProperties } = get();
        return properties.filter(property =>
          property.isFeatured &&
          !hiddenProperties.includes(property.id) &&
          !blockedProperties.includes(property.id)
        );
      },
      
      getPropertiesNearby: (latitude: number, longitude: number, maxDistance: number = 20) => {
        const { properties } = get();
        
        return properties.filter(property => {
          const distance = calculateDistance(
            latitude,
            longitude,
            property.latitude,
            property.longitude
          );
          
          // Return properties within the specified distance (default 20km)
          return distance <= maxDistance;
        });
      },
      
      addProperty: (property) => {
        // Generate a unique ID
        const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const timestamp = new Date().toISOString();
        const newProperty = {
          ...property,
          id,
          listingStatus: property.listingStatus || 'available',
          createdAt: property.createdAt || timestamp,
          updatedAt: timestamp,
        };

        set((state) => ({
          properties: [...state.properties, newProperty]
        }));

        void prefetchPropertyImages([newProperty]);

        return id;
      },

      updateProperty: (id, updates) => set((state) => ({
        properties: state.properties.map((property) =>
          property.id === id
            ? {
                ...property,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : property
        ),
      })),

      updatePropertyFacilities: (id, facilities) => set((state) => ({
        properties: state.properties.map((property) =>
          property.id === id
            ? {
                ...property,
                nearbyFacilities: facilities,
                updatedAt: new Date().toISOString(),
              }
            : property
        ),
      })),

      getPropertiesByUser: (userId) => {
        return get().properties.filter((property) => property.listedByUserId === userId);
      },

      setProperties: (properties) => set((state) => {
        const localOnlyProperties = state.properties.filter(
          (existingProperty) => !properties.some((incomingProperty) => incomingProperty.id === existingProperty.id)
        );

        const mergedProperties = properties.map((incomingProperty) => {
          const existingProperty = state.properties.find((property) => property.id === incomingProperty.id);
          return existingProperty?.previewImages && !incomingProperty.previewImages
            ? { ...incomingProperty, previewImages: existingProperty.previewImages }
            : incomingProperty;
        });

        const nextProperties = [...mergedProperties, ...localOnlyProperties];

        void prefetchPropertyImages(nextProperties);

        return { properties: nextProperties };
      }),

      upsertProperty: (property) => set((state) => {
        const existingIndex = state.properties.findIndex((item) => item.id === property.id);

        const existingProperty = existingIndex === -1 ? null : state.properties[existingIndex];
        const nextProperty = existingProperty?.previewImages && !property.previewImages
          ? { ...property, previewImages: existingProperty.previewImages }
          : property;

        void prefetchPropertyImages([nextProperty]);

        if (existingIndex === -1) {
          return { properties: [nextProperty, ...state.properties] };
        }

        const nextProperties = [...state.properties];
        nextProperties[existingIndex] = nextProperty;

        return { properties: nextProperties };
      }),

      resetForSignOut: () => set({
        properties: mockProperties,
        favorites: [],
        hiddenProperties: [],
        blockedProperties: [],
        filter: {},
      }),

      hideProperty: (id: string) => set((state) => ({
        hiddenProperties: state.hiddenProperties.includes(id)
          ? state.hiddenProperties
          : [...state.hiddenProperties, id],
      })),

      unhideProperty: (id: string) => set((state) => ({
        hiddenProperties: state.hiddenProperties.filter((hid) => hid !== id),
      })),

      blockProperty: (id: string) => set((state) => ({
        blockedProperties: state.blockedProperties.includes(id)
          ? state.blockedProperties
          : [...state.blockedProperties, id],
      })),
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favorites: state.favorites, properties: state.properties, hiddenProperties: state.hiddenProperties, blockedProperties: state.blockedProperties }),
    }
  )
);