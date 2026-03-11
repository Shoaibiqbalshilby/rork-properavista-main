import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MapPin } from 'lucide-react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { useLocationStore } from '@/hooks/useLocationStore';
import Colors from '@/constants/colors';
import { Property } from '@/types/property';
import { calculateDistance, formatDistance } from '@/utils/distance';
import {
  getPropertyImagePlaceholder,
  getPropertyPrimaryImage,
  prefetchPropertyImageUrls,
} from '@/utils/property-images';

type PropertyCardProps = {
  property: Property;
  isFeatured?: boolean;
  showDistance?: boolean;
};

export default function PropertyCard({ property, isFeatured = false, showDistance = false }: PropertyCardProps) {
  const router = useRouter();
  const { favorites, toggleFavorite } = usePropertyStore();
  const { userLocation } = useLocationStore();
  const isFavorite = favorites.includes(property.id);
  const primaryImage = getPropertyPrimaryImage(property);

  React.useEffect(() => {
    void prefetchPropertyImageUrls(property.images);
  }, [property.images]);

  const handlePress = () => {
    router.push(`/property/${property.id}` as any);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(property.id);
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

  // Calculate distance if user location is available and showDistance is true
  const distance = showDistance && userLocation ? 
    calculateDistance(
      userLocation.latitude, 
      userLocation.longitude, 
      property.latitude, 
      property.longitude
    ) : null;

  // Get payment frequency label
  const getPaymentFrequencyLabel = () => {
    if (!property.paymentFrequency) return null;
    
    if (property.listingType === 'rent' && property.paymentFrequency.rent) {
      return property.paymentFrequency.rent === 'monthly' ? '/month' : '/year';
    }
    
    if (property.listingType === 'short-let' && property.paymentFrequency["short-let"]) {
      switch(property.paymentFrequency["short-let"]) {
        case 'daily': return '/day';
        case 'weekly': return '/week';
        case 'monthly': return '/month';
        default: return '';
      }
    }
    
    return '';
  };

  return (
    <Pressable 
      style={[styles.container, isFeatured && styles.featuredContainer]} 
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={primaryImage ? { uri: primaryImage } : undefined}
          placeholder={getPropertyImagePlaceholder(property)}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={120}
        />
        {isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={styles.listingTypeBadge}>
          <Text style={styles.listingTypeText}>{getListingTypeLabel()}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>
        <Pressable 
          style={styles.favoriteButton} 
          onPress={handleFavoritePress}
          hitSlop={10}
        >
          <Heart
            size={22}
            color={isFavorite ? Colors.light.favorite : 'white'}
            fill={isFavorite ? Colors.light.favorite : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.price}>
          {formatPrice(property.price)}
          <Text style={styles.priceUnit}>{getPaymentFrequencyLabel()}</Text>
        </Text>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {property.address}, {property.city}, {property.state}
        </Text>

        {property.type === 'landed' && property.landDetails && (
          <Text style={styles.landText}>
            Land: {property.landDetails.quantity} {property.landDetails.unit}
            {property.landDetails.quantity > 1 ? 's' : ''}
          </Text>
        )}
        
        {distance !== null && (
          <View style={styles.distanceContainer}>
            <MapPin size={14} color={Colors.light.primary} />
            <Text style={styles.distanceText}>{formatDistance(distance)} away</Text>
          </View>
        )}
        
        <View style={styles.detailsContainer}>
          <View style={styles.detail}>
            <Text style={styles.detailValue}>{property.bedrooms}</Text>
            <Text style={styles.detailLabel}>Beds</Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailValue}>{property.bathrooms}</Text>
            <Text style={styles.detailLabel}>Baths</Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailValue}>{property.squareFeet.toLocaleString()}</Text>
            <Text style={styles.detailLabel}>Sq Ft</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  featuredContainer: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listingTypeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    right: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.light.text,
    fontSize: 11,
    fontWeight: '600',
  },
  listingTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.light.subtext,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 8,
  },
  landText: {
    fontSize: 13,
    color: Colors.light.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  detail: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 2,
  },
});