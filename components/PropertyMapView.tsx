import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { useLocationStore } from '@/hooks/useLocationStore';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { Property } from '@/types/property';
import Colors from '@/constants/colors';
import { formatDistance } from '@/utils/distance';

// This is a placeholder component for the map view
// In a real app, you would use react-native-maps here
export default function PropertyMapView() {
  const { userLocation, permissionStatus, requestLocationPermission, getCurrentLocation, isLoading, error } = useLocationStore();
  const { getPropertiesNearby } = usePropertyStore();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    // Request location permission when component mounts
    if (!permissionStatus) {
      requestLocationPermission();
    }
    
    // Get current location if permission is granted
    if (permissionStatus === 'granted' && !userLocation) {
      getCurrentLocation();
    }
  }, [permissionStatus]);
  
  useEffect(() => {
    // Get nearby properties when user location changes
    if (userLocation) {
      const properties = getPropertiesNearby(userLocation.latitude, userLocation.longitude, 20);
      setNearbyProperties(properties);
    }
  }, [userLocation]);
  
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>
            Map view is not fully supported on web.
          </Text>
          {userLocation && (
            <Text style={styles.locationText}>
              Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          )}
          {nearbyProperties.length > 0 && (
            <Text style={styles.propertiesText}>
              {nearbyProperties.length} properties found within 20km
            </Text>
          )}
        </View>
        
        {nearbyProperties.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Nearby Properties</Text>
            {nearbyProperties.map(property => (
              <View key={property.id} style={styles.propertyItem}>
                <Text style={styles.propertyTitle}>{property.title}</Text>
                <Text style={styles.propertyAddress}>{property.address}, {property.city}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Getting your location...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.messageText}>
          Please enable location services to see properties near you.
        </Text>
      </View>
    );
  }
  
  if (!userLocation) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>
          We need your location to show nearby properties.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>
          Map View
        </Text>
        <Text style={styles.locationText}>
          Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Text>
        <Text style={styles.propertiesText}>
          {nearbyProperties.length} properties found within 20km
        </Text>
      </View>
      
      {nearbyProperties.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Nearby Properties</Text>
          {nearbyProperties.map(property => (
            <View key={property.id} style={styles.propertyItem}>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <Text style={styles.propertyAddress}>{property.address}, {property.city}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 8,
  },
  propertiesText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    color: Colors.light.subtext,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  propertyItem: {
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
});