import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Platform, UIManager, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocationStore } from '@/hooks/useLocationStore';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { Property } from '@/types/property';
import Colors from '@/constants/colors';
import { formatDistance, calculateDistance } from '@/utils/distance';
import { getStaticMapUrl, hasGoogleMapsApiKey } from '@/constants/maps';

const mapProvider = Platform.OS === 'android' && hasGoogleMapsApiKey ? PROVIDER_GOOGLE : undefined;
const hasNativeMapView = Platform.OS !== 'web' && !!UIManager.getViewManagerConfig?.('AIRMap');

export default function PropertyMapView() {
  const { userLocation, permissionStatus, requestLocationPermission, getCurrentLocation, isLoading, error } = useLocationStore();
  const { getPropertiesNearby } = usePropertyStore();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (!permissionStatus) {
      requestLocationPermission();
    }

    if (permissionStatus === 'granted' && !userLocation) {
      getCurrentLocation();
    }
  }, [permissionStatus, requestLocationPermission, getCurrentLocation, userLocation]);

  useEffect(() => {
    if (userLocation) {
      const properties = getPropertiesNearby(userLocation.latitude, userLocation.longitude, 20);
      setNearbyProperties(properties);
    }
  }, [userLocation, getPropertiesNearby]);

  const initialRegion = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    return {
      latitude: 6.5244,
      longitude: 3.3792,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [userLocation]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>Map preview is limited on web.</Text>
          {userLocation && (
            <Text style={styles.locationText}>
              Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          )}
          <Text style={styles.propertiesText}>{nearbyProperties.length} properties found within 20km</Text>
        </View>
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
        <Text style={styles.messageText}>Please enable location services to see nearby properties.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasNativeMapView ? (
        <MapView provider={mapProvider} style={styles.map} initialRegion={initialRegion} region={initialRegion}>
          {userLocation && (
            <Marker coordinate={userLocation} title="You are here" pinColor={Colors.light.primary} />
          )}

          {nearbyProperties.map((property) => {
            const distance = userLocation
              ? calculateDistance(userLocation.latitude, userLocation.longitude, property.latitude, property.longitude)
              : null;

            return (
              <Marker
                key={property.id}
                coordinate={{ latitude: property.latitude, longitude: property.longitude }}
                title={property.title}
                description={distance !== null ? `${formatDistance(distance)} away` : property.address}
              />
            );
          })}
        </MapView>
      ) : (
        <Image
          source={{
            uri: getStaticMapUrl({
              latitude: initialRegion.latitude,
              longitude: initialRegion.longitude,
                zoom: 16,
            }),
          }}
          style={styles.map}
        />
      )}

      <View style={styles.footerInfo}>
        <Text style={styles.propertiesText}>{nearbyProperties.length} properties found within 20km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
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
    fontSize: 15,
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
  footerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});
