import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Alert,
  UIManager,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bath,
  Bed,
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Square,
  Pencil,
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { useLocationStore } from '@/hooks/useLocationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import PropertyFeature from '@/components/PropertyFeature';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import Colors from '@/constants/colors';
import { calculateDistance, formatDistance } from '@/utils/distance';
import { normalizePhone, whatsappUrl } from '@/utils/contact';
import { getNearbyFacilityDistances } from '@/utils/facilities';
import { getStaticMapUrl, hasGoogleMapsApiKey } from '@/constants/maps';

const mapProvider = Platform.OS === 'android' && hasGoogleMapsApiKey ? PROVIDER_GOOGLE : undefined;
const hasNativeMapView = Platform.OS !== 'web' && !!UIManager.getViewManagerConfig?.('AIRMap');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { properties, favorites, toggleFavorite, updatePropertyFacilities } = usePropertyStore();
  const { userLocation } = useLocationStore();
  const { user } = useAuthStore();

  const property = properties.find((item) => item.id === id);
  const isFavorite = favorites.includes(id);
  const canEdit = !!property && !!user && property.listedByUserId === user.id;

  const [selectedPaymentFrequency, setSelectedPaymentFrequency] = useState<string | undefined>(
    property?.paymentFrequency?.rent || property?.paymentFrequency?.['short-let'] || undefined
  );

  const distance =
    userLocation && property
      ? calculateDistance(userLocation.latitude, userLocation.longitude, property.latitude, property.longitude)
      : null;

  useEffect(() => {
    let isMounted = true;

    const loadFacilities = async () => {
      if (!property || !hasGoogleMapsApiKey) {
        return;
      }

      if ((property.nearbyFacilities?.length || 0) > 0) {
        return;
      }

      const facilities = await getNearbyFacilityDistances(property.latitude, property.longitude);

      if (isMounted && facilities.length > 0) {
        updatePropertyFacilities(property.id, facilities);
      }
    };

    loadFacilities();

    return () => {
      isMounted = false;
    };
  }, [
    property?.id,
    property?.latitude,
    property?.longitude,
    property?.nearbyFacilities?.length,
    updatePropertyFacilities,
  ]);

  if (!property) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Property not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleFavoritePress = () => {
    toggleFavorite(id);
  };

  const handleSharePress = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Sharing is not available on web');
      return;
    }

    Alert.alert('Share', 'Share functionality can be connected here.');
  };

  const handleContactPress = async () => {
    const phone = normalizePhone(property.lister?.phone);
    if (!phone) {
      Alert.alert('Phone not available', 'Lister has not added a phone number yet.');
      return;
    }

    const telUrl = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(telUrl);
    if (canOpen) {
      Linking.openURL(telUrl);
      return;
    }

    Alert.alert('Dialer unavailable', 'Your device could not open the phone dialer.');
  };

  const handleMessagePress = async () => {
    const message = [
      'Hello, I am interested in this property.',
      '',
      `Title: ${property.title}`,
      `Price: ${formatPrice(adjustedPrice)}${selectedPaymentFrequency ? getPaymentFrequencyLabel(selectedPaymentFrequency) : ''}`,
      `Type: ${getListingTypeLabel()}`,
      `Location: ${property.address}, ${property.city}, ${property.state}`,
    ].join('\n');
    const url = whatsappUrl(property.lister?.whatsapp || property.lister?.phone, message);

    if (!url) {
      Alert.alert('WhatsApp not available', 'Lister has not added a WhatsApp number yet.');
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
      return;
    }

    Alert.alert('WhatsApp unavailable', 'Please ensure WhatsApp is installed on your device.');
  };

  const handleEditPress = () => {
    router.push({
      pathname: '/add-property',
      params: { editId: property.id },
    });
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    });

  const getListingTypeLabel = () => {
    switch (property.listingType) {
      case 'rent':
        return 'For Rent';
      case 'short-let':
        return 'Short-Let';
      case 'sell':
      default:
        return 'For Sale';
    }
  };

  const getStatusLabel = () => {
    switch (property.listingStatus) {
      case 'reserved':
        return 'Reserved';
      case 'sold':
        return 'Sold';
      case 'available':
      default:
        return 'Available';
    }
  };

  const getPaymentFrequencies = () => {
    if (property.listingType === 'rent') {
      return [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
      ];
    }

    if (property.listingType === 'short-let') {
      return [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ];
    }

    return [];
  };

  const getPaymentFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '/day';
      case 'weekly':
        return '/week';
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
      default:
        return '';
    }
  };

  const calculateAdjustedPrice = () => {
    if (!selectedPaymentFrequency || property.listingType === 'sell') {
      return property.price;
    }

    if (property.listingType === 'rent') {
      return selectedPaymentFrequency === 'yearly' ? property.price * 12 : property.price;
    }

    if (property.listingType === 'short-let') {
      if (selectedPaymentFrequency === 'weekly') return property.price * 7;
      if (selectedPaymentFrequency === 'monthly') return property.price * 30;
      return property.price;
    }

    return property.price;
  };

  const paymentFrequencies = getPaymentFrequencies();
  const showPaymentOptions = paymentFrequencies.length > 0;
  const adjustedPrice = calculateAdjustedPrice();

  return (
    <>
      <Stack.Screen
        options={{
          title: property.title,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {canEdit && (
                <Pressable style={styles.headerButton} onPress={handleEditPress}>
                  <Pencil size={20} color={Colors.light.text} />
                </Pressable>
              )}
              <Pressable style={styles.headerButton} onPress={handleSharePress}>
                <Share2 size={22} color={Colors.light.text} />
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleFavoritePress}>
                <Heart
                  size={22}
                  color={isFavorite ? Colors.light.favorite : Colors.light.text}
                  fill={isFavorite ? Colors.light.favorite : 'transparent'}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <PropertyImageGallery images={property.images} previewImages={property.previewImages} />

        <View style={styles.contentContainer}>
          <View style={styles.badgesRow}>
            <View style={styles.listingTypeContainer}>
              <Text style={styles.listingTypeText}>{getListingTypeLabel()}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{getStatusLabel()}</Text>
            </View>
          </View>

          <Text style={styles.price}>
            {formatPrice(adjustedPrice)}
            {selectedPaymentFrequency && (
              <Text style={styles.priceUnit}>{getPaymentFrequencyLabel(selectedPaymentFrequency)}</Text>
            )}
          </Text>

          {showPaymentOptions && (
            <View style={styles.paymentOptionsContainer}>
              {paymentFrequencies.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.paymentOption,
                    selectedPaymentFrequency === option.value && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setSelectedPaymentFrequency(option.value)}
                >
                  <Text
                    style={[
                      styles.paymentOptionText,
                      selectedPaymentFrequency === option.value && styles.paymentOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.address}>
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </Text>

          {distance !== null && (
            <View style={styles.distanceContainer}>
              <MapPin size={16} color={Colors.light.primary} />
              <Text style={styles.distanceText}>{formatDistance(distance)} from your location</Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            <PropertyFeature icon={<Bed size={20} color={Colors.light.primary} />} label="Bedrooms" value={property.bedrooms} />
            <PropertyFeature icon={<Bath size={20} color={Colors.light.primary} />} label="Bathrooms" value={property.bathrooms} />
            <PropertyFeature
              icon={<Square size={20} color={Colors.light.primary} />}
              label="Square Feet"
              value={property.squareFeet.toLocaleString()}
            />
            <PropertyFeature icon={<Calendar size={20} color={Colors.light.primary} />} label="Year Built" value={property.yearBuilt} />
          </View>

          {property.type === 'landed' && property.landDetails && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Land Size</Text>
              <Text style={styles.description}>
                {property.landDetails.quantity} {property.landDetails.unit}
                {property.landDetails.quantity > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Map</Text>
            {Platform.OS === 'web' ? (
              <Text style={styles.description}>
                Coordinates: {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
              </Text>
            ) : hasNativeMapView ? (
              <MapView
                provider={mapProvider}
                style={styles.map}
                region={{
                  latitude: property.latitude,
                  longitude: property.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker coordinate={{ latitude: property.latitude, longitude: property.longitude }} title={property.title} />
              </MapView>
            ) : (
              <Image
                source={{
                  uri: getStaticMapUrl({
                    latitude: property.latitude,
                    longitude: property.longitude,
                  }),
                }}
                style={styles.map}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities Nearby</Text>
            {property.nearbyFacilities && property.nearbyFacilities.length > 0 ? (
              property.nearbyFacilities.map((facility) => (
                <View key={facility.key} style={styles.facilityRow}>
                  <Text style={styles.facilityName}>{facility.label}</Text>
                  <Text style={styles.facilityDistance}>{facility.distanceKm.toFixed(2)} km</Text>
                </View>
              ))
            ) : (
              <Text style={styles.description}>
                Facilities distance is not available right now. Please verify Google Maps Places API is enabled and try again.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lister Profile</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{property.lister?.name || 'Property Owner'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Company</Text>
                <Text style={styles.detailValue}>{property.lister?.companyName || 'Not provided'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValue}>{property.lister?.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{property.lister?.address || 'Not provided'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {property.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.messageButton} onPress={handleMessagePress}>
          <MessageCircle size={22} color={Colors.light.primary} />
          <Text style={styles.messageButtonText}>WhatsApp</Text>
        </Pressable>
        <Pressable style={styles.callButton} onPress={handleContactPress}>
          <Phone size={22} color="white" />
          <Text style={styles.callButtonText}>Call Lister</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  contentContainer: {
    padding: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  listingTypeContainer: {
    backgroundColor: Colors.light.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  listingTypeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: Colors.light.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.light.subtext,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: 8,
  },
  paymentOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: Colors.light.tag,
    borderWidth: 1,
    borderColor: Colors.light.tag,
  },
  paymentOptionSelected: {
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    borderColor: Colors.light.primary,
  },
  paymentOptionText: {
    fontSize: 14,
    color: Colors.light.tagText,
  },
  paymentOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: Colors.light.subtext,
    marginBottom: 12,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.light.subtext,
    lineHeight: 22,
  },
  map: {
    height: 220,
    borderRadius: 12,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  amenityTag: {
    backgroundColor: Colors.light.tag,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
  },
  amenityText: {
    color: Colors.light.tagText,
    fontSize: 13,
    fontWeight: '500',
  },
  facilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  facilityName: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '500',
  },
  facilityDistance: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
  },
  messageButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
