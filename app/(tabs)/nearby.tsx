import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Navigation, MapPin } from 'lucide-react-native';
import { useLocationStore } from '@/hooks/useLocationStore';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import PropertyCard from '@/components/PropertyCard';
import Colors from '@/constants/colors';
import { Property } from '@/types/property';

export default function NearbyScreen() {
  const { 
    userLocation, 
    permissionStatus, 
    requestLocationPermission, 
    getCurrentLocation, 
    isLoading, 
    error 
  } = useLocationStore();
  const { getPropertiesNearby } = usePropertyStore();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    // Request location permission when component mounts
    if (!permissionStatus) {
      requestLocationPermission();
    }
  }, []);
  
  useEffect(() => {
    // Get nearby properties when user location changes
    if (userLocation) {
      const properties = getPropertiesNearby(userLocation.latitude, userLocation.longitude, 20);
      setNearbyProperties(properties);
    }
  }, [userLocation]);
  
  const handleGetLocation = () => {
    getCurrentLocation();
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No properties found nearby</Text>
      <Text style={styles.emptyText}>
        There are no properties within 20km of your current location.
      </Text>
    </View>
  );
  
  // If we don't have location permission or user location, show a permission request screen
  if (permissionStatus !== 'granted' || !userLocation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Nearby Properties" }} />
        
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
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Nearby Properties" }} />
      
      <View style={styles.headerContainer}>
        <View style={styles.locationContainer}>
          <MapPin size={16} color={Colors.light.primary} />
          <Text style={styles.locationText}>
            Properties within 20km of your location
          </Text>
        </View>
        <Text style={styles.resultsText}>
          {nearbyProperties.length} {nearbyProperties.length === 1 ? 'property' : 'properties'} found
        </Text>
      </View>
      
      <FlatList
        data={nearbyProperties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} showDistance={true} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  listContent: {
    padding: 16,
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
});