import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type PermissionStatusType = 'granted' | 'denied' | 'undetermined';

interface LocationState {
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  permissionStatus: PermissionStatusType | null;
  isLoading: boolean;
  error: string | null;
  
  requestLocationPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  clearError: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      userLocation: null,
      permissionStatus: null,
      isLoading: false,
      error: null,
      
      requestLocationPermission: async () => {
        set({ isLoading: true, error: null });
        
        try {
          if (Platform.OS === 'web') {
            set({ 
              permissionStatus: 'granted',
              isLoading: false 
            });
            return;
          }
          
          const Location = await import('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          set({ 
            permissionStatus: status as PermissionStatusType,
            isLoading: false,
            error: status !== 'granted' ? 'Permission to access location was denied' : null
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: 'Failed to request location permission' 
          });
        }
      },
      
      getCurrentLocation: async () => {
        const { permissionStatus } = get();
        
        if (permissionStatus !== 'granted') {
          await get().requestLocationPermission();
          if (get().permissionStatus !== 'granted') {
            return;
          }
        }
        
        set({ isLoading: true, error: null });
        
        try {
          if (Platform.OS === 'web') {
            // Use browser geolocation API for web
            navigator.geolocation.getCurrentPosition(
              (position) => {
                set({
                  userLocation: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  },
                  isLoading: false
                });
              },
              (error) => {
                set({
                  isLoading: false,
                  error: `Error getting location: ${error.message}`
                });
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
          } else {
            const Location = await import('expo-location');
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced
            });
            
            set({
              userLocation: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              },
              isLoading: false
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: 'Failed to get current location' 
          });
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ userLocation: state.userLocation }),
    }
  )
);