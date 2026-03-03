import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Linking, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { 
  Heart, 
  Share2, 
  Bed, 
  Bath, 
  Square, 
  Calendar, 
  Phone, 
  MessageCircle,
  MapPin
} from 'lucide-react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { useLocationStore } from '@/hooks/useLocationStore';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import PropertyFeature from '@/components/PropertyFeature';
import Colors from '@/constants/colors';
import { calculateDistance, formatDistance } from '@/utils/distance';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { properties, favorites, toggleFavorite } = usePropertyStore();
  const { userLocation } = useLocationStore();
  
  const property = properties.find(p => p.id === id);
  const isFavorite = favorites.includes(id);
  
  // For rental properties, allow selecting payment frequency
  const [selectedPaymentFrequency, setSelectedPaymentFrequency] = useState<string | undefined>(
    property?.paymentFrequency?.rent || 
    property?.paymentFrequency?.["short-let"] || 
    undefined
  );
  
  // Calculate distance if user location is available
  const distance = userLocation ? 
    calculateDistance(
      userLocation.latitude, 
      userLocation.longitude, 
      property?.latitude || 0, 
      property?.longitude || 0
    ) : null;
  
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
  
  const handleSharePress = async () => {
    try {
      if (Platform.OS === 'web') {
        alert('Sharing is not available on web');
      } else {
        // This would use the Share API on native platforms
        alert('Share functionality would be implemented here');
      }
    } catch (error) {
      console.error('Error sharing property:', error);
    }
  };
  
  const handleContactPress = () => {
    Linking.openURL(`tel:+1234567890`);
  };
  
  const handleMessagePress = () => {
    Linking.openURL(`sms:+1234567890`);
  };
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    });
  };

  const getListingTypeLabel = () => {
    switch(property.listingType) {
      case 'rent': return 'For Rent';
      case 'short-let': return 'Short-Let';
      case 'sell': return 'For Sale';
      default: return 'For Sale';
    }
  };

  // Get available payment frequencies based on listing type
  const getPaymentFrequencies = () => {
    if (property.listingType === 'rent') {
      return [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' }
      ];
    } else if (property.listingType === 'short-let') {
      return [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' }
      ];
    }
    return [];
  };

  // Get payment frequency label for display
  const getPaymentFrequencyLabel = (frequency: string) => {
    switch(frequency) {
      case 'daily': return '/day';
      case 'weekly': return '/week';
      case 'monthly': return '/month';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  // Calculate price based on selected payment frequency
  const calculateAdjustedPrice = () => {
    if (!selectedPaymentFrequency || property.listingType === 'sell') {
      return property.price;
    }

    // Base price is assumed to be monthly for rent and daily for short-let
    if (property.listingType === 'rent') {
      if (selectedPaymentFrequency === 'yearly') {
        return property.price * 12; // Annual price
      }
      return property.price; // Monthly price
    } else if (property.listingType === 'short-let') {
      if (selectedPaymentFrequency === 'weekly') {
        return property.price * 7; // Weekly price
      } else if (selectedPaymentFrequency === 'monthly') {
        return property.price * 30; // Monthly price (approximate)
      }
      return property.price; // Daily price
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
        <PropertyImageGallery images={property.images} />
        
        <View style={styles.contentContainer}>
          <View style={styles.listingTypeContainer}>
            <Text style={styles.listingTypeText}>{getListingTypeLabel()}</Text>
          </View>
          
          <Text style={styles.price}>
            {formatPrice(adjustedPrice)}
            {selectedPaymentFrequency && (
              <Text style={styles.priceUnit}>
                {getPaymentFrequencyLabel(selectedPaymentFrequency)}
              </Text>
            )}
          </Text>
          
          {/* Payment Frequency Selector */}
          {showPaymentOptions && (
            <View style={styles.paymentOptionsContainer}>
              {paymentFrequencies.map((option, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.paymentOption,
                    selectedPaymentFrequency === option.value && styles.paymentOptionSelected
                  ]}
                  onPress={() => setSelectedPaymentFrequency(option.value)}
                >
                  <Text 
                    style={[
                      styles.paymentOptionText,
                      selectedPaymentFrequency === option.value && styles.paymentOptionTextSelected
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
            <PropertyFeature 
              icon={<Bed size={20} color={Colors.light.primary} />}
              label="Bedrooms"
              value={property.bedrooms}
            />
            <PropertyFeature 
              icon={<Bath size={20} color={Colors.light.primary} />}
              label="Bathrooms"
              value={property.bathrooms}
            />
            <PropertyFeature 
              icon={<Square size={20} color={Colors.light.primary} />}
              label="Square Feet"
              value={property.squareFeet.toLocaleString()}
            />
            <PropertyFeature 
              icon={<Calendar size={20} color={Colors.light.primary} />}
              label="Year Built"
              value={property.yearBuilt}
            />
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Property Type</Text>
                <Text style={styles.detailValue}>
                  {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Year Built</Text>
                <Text style={styles.detailValue}>{property.yearBuilt}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Listing Type</Text>
                <Text style={styles.detailValue}>{getListingTypeLabel()}</Text>
              </View>
              {property.paymentFrequency && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Default Payment</Text>
                  <Text style={styles.detailValue}>
                    {property.paymentFrequency.rent ? 
                      (property.paymentFrequency.rent === 'monthly' ? 'Monthly' : 'Yearly') : 
                      property.paymentFrequency["short-let"] === 'daily' ? 'Daily' :
                      property.paymentFrequency["short-let"] === 'weekly' ? 'Weekly' : 'Monthly'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {property.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
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
          <Text style={styles.messageButtonText}>Message</Text>
        </Pressable>
        <Pressable style={styles.callButton} onPress={handleContactPress}>
          <Phone size={22} color="white" />
          <Text style={styles.callButtonText}>Call Agent</Text>
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
  listingTypeContainer: {
    backgroundColor: Colors.light.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  listingTypeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
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
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  amenityTag: {
    backgroundColor: Colors.light.tag,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: Colors.light.tagText,
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
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  messageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  callButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});