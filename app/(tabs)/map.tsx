import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { useLocationStore } from '@/hooks/useLocationStore';
import PropertyMapView from '@/components/PropertyMapView';
import Colors from '@/constants/colors';

export default function MapScreen() {
  const { 
    userLocation, 
    permissionStatus, 
    requestLocationPermission, 
    getCurrentLocation, 
    isLoading, 
    error 
  } = useLocationStore();
  
  useEffect(() => {
    // Request location permission when component mounts
    if (!permissionStatus) {
      requestLocationPermission();
    }
  }, []);
  
  const handleGetLocation = () => {
    getCurrentLocation();
  };
  
  // If we have location permission and user location, show the map
  if (permissionStatus === 'granted' && userLocation) {
    return <PropertyMapView />;
  }
  
  // Otherwise show a permission request screen
  return (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <MapPin size={40} color={Colors.light.primary} />
        </View>
        <Text style={styles.emptyTitle}>Find Properties Near You</Text>
        <Text style={styles.emptyText}>
          {error ? error : "We need your location to show properties within 20km of you."}
        </Text>
        
        <Pressable 
          style={styles.locationButton} 
          onPress={handleGetLocation}
          disabled={isLoading}
        >
          <Navigation size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.locationButtonText}>
            {isLoading ? "Getting Location..." : "Share My Location"}
          </Text>
        </Pressable>
        
        {Platform.OS === 'web' && (
          <Text style={styles.webNote}>
            Note: Location services may be limited on web browsers.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.subtext,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  webNote: {
    marginTop: 16,
    fontSize: 12,
    color: Colors.light.subtext,
    textAlign: 'center',
  },
});