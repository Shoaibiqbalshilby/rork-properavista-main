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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
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
import PropertyVideoPlayer from '@/components/PropertyVideoPlayer';
import Colors from '@/constants/colors';
import { calculateDistance, formatDistance } from '@/utils/distance';
import { normalizePhone } from '@/utils/contact';
import { getNearbyFacilityDistances } from '@/utils/facilities';
import { getStaticMapUrl, hasGoogleMapsApiKey } from '@/constants/maps';
import { supabaseClient } from '@/lib/supabase';

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
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [ownerUserId, setOwnerUserId] = useState<string | null>(property?.listedByUserId || null);

  // Live lister business profile fetched from Supabase.
  // Priority: business_profiles table (website primary) → user_profiles table (mobile) → property.lister snapshot.
  const [liveProfile, setLiveProfile] = useState<{
    name?: string;
    companyName?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchListerProfile = async () => {
      if (!property?.id) {
        if (!cancelled) {
          setOwnerUserId(null);
          setLiveProfile(null);
        }
        return;
      }

      const { data: propertyData } = await supabaseClient
        .from('properties')
        .select('user_id, lister')
        .eq('id', property.id)
        .maybeSingle();

      const userId = propertyData?.user_id || property.listedByUserId;
      const listerSnapshot = propertyData?.lister || property.lister;

      if (!userId) {
        if (!cancelled) {
          setOwnerUserId(null);
          setLiveProfile({
            name: listerSnapshot?.name || undefined,
            companyName: listerSnapshot?.companyName || undefined,
            phone: listerSnapshot?.phone || undefined,
            whatsapp: listerSnapshot?.whatsapp || undefined,
            address: listerSnapshot?.address || undefined,
          });
        }
        return;
      }

      // 1. Try business_profiles (same table the website writes to)
      const [{ data: bpData, error: bpError }, { data: upData }] = await Promise.all([
        supabaseClient
          .from('business_profiles')
          .select('company_name, contact_phone, whatsapp_number, address')
          .eq('user_id', userId)
          .maybeSingle(),
        supabaseClient
          .from('user_profiles')
          .select('name, company_name, phone, whatsapp, address')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const bpTableMissing = bpError?.message?.includes('Could not find the table');
      const bpRow = !bpTableMissing ? bpData : null;

      setOwnerUserId(userId);
      setLiveProfile({
        name: upData?.name || listerSnapshot?.name || undefined,
        companyName: bpRow?.company_name || upData?.company_name || listerSnapshot?.companyName || undefined,
        phone: bpRow?.contact_phone || upData?.phone || listerSnapshot?.phone || undefined,
        whatsapp: bpRow?.whatsapp_number || upData?.whatsapp || listerSnapshot?.whatsapp || undefined,
        address: bpRow?.address || upData?.address || listerSnapshot?.address || undefined,
      });
    };

    fetchListerProfile();
    return () => { cancelled = true; };
  }, [property?.id, property?.listedByUserId, property?.lister]);

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

  // Merged lister info: live Supabase data takes priority over property snapshot
  const listerName = liveProfile?.name || property.lister?.name || 'Property Owner';
  const listerCompany = liveProfile?.companyName || property.lister?.companyName;
  const listerPhone = liveProfile?.phone || property.lister?.phone;
  const listerWhatsapp = liveProfile?.whatsapp || property.lister?.whatsapp;
  const listerAddress = liveProfile?.address || property.lister?.address;
  const propertyVideoUrl = property.video || property.previewVideo;

  const handleContactPress = async () => {
    const phone = normalizePhone(listerPhone);
    if (!phone) {
      Alert.alert('Phone not available', 'The property owner has not added a phone number yet.');
      return;
    }
    // Open dialer immediately pre-filled with the lister number
    Linking.openURL(`tel:${phone}`);
  };

  const sendMessageToOwner = async (body: string) => {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    const authUser = authData.user;
    const senderId = authUser?.id || user?.id;

    if (authError || !senderId) {
      Alert.alert('Sign In Required', 'Please sign in to send a message to the property owner.');
      return;
    }

    setIsSendingMessage(true);

    try {
      const { data: propertyData } = await supabaseClient
        .from('properties')
        .select('user_id')
        .eq('id', property.id)
        .maybeSingle();

      const recipientId = propertyData?.user_id || ownerUserId || property.listedByUserId;

      if (!recipientId) {
        setIsSendingMessage(false);
        Alert.alert('Message unavailable', 'This listing is missing owner details.');
        return;
      }

      // Find or create conversation between sender and owner for this property
      const { data: existingConv, error: convQueryError } = await supabaseClient
        .from('conversations')
        .select('id')
        .eq('property_id', property.id)
        .or(`and(user_1_id.eq.${senderId},user_2_id.eq.${recipientId}),and(user_1_id.eq.${recipientId},user_2_id.eq.${senderId})`)
        .maybeSingle();

      let conversationId: string;

      if (existingConv?.id) {
        // Use existing conversation
        conversationId = existingConv.id;
      } else {
        if (convQueryError) {
          setIsSendingMessage(false);
          Alert.alert('Unable to start conversation', convQueryError.message || 'Try again later.');
          return;
        }

        // Create new conversation
        const { data: newConv, error: createError } = await supabaseClient
          .from('conversations')
          .insert({
            property_id: property.id,
            user_1_id: senderId,
            user_2_id: recipientId,
          })
          .select('id')
          .single();

        if (createError || !newConv?.id) {
          setIsSendingMessage(false);
          Alert.alert('Unable to create conversation', createError?.message || 'Try again later.');
          return;
        }

        conversationId = newConv.id;
      }

      // Insert message into conversation_messages table
      const { error: msgError } = await supabaseClient.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message: body.trim(),
        is_read: false,
      });

      setIsSendingMessage(false);

      if (msgError) {
        const errorText = (msgError.message || '').toLowerCase();
        if (errorText.includes("could not find") && (errorText.includes("conversation_messages") || errorText.includes("conversations"))) {
          Alert.alert(
            'Tables missing',
            'Supabase is missing conversation tables. Run backend/db/schema_fixed.sql in your Supabase SQL Editor, then try again.'
          );
        } else {
          Alert.alert('Unable to send message', msgError.message);
        }
        return;
      }

      setShowMessageModal(false);
      setDraftMessage('');
      Alert.alert('Message Sent', 'Your message has been delivered to the property owner inbox.');
    } catch (error) {
      setIsSendingMessage(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleMessagePress = () => {
    const defaultBody = [
      'Hi, I am interested in this property.',
      '',
      `Property: ${property.title}`,
      `Location: ${property.address}, ${property.city}, ${property.state}`,
    ].join('\n');
    setDraftMessage(defaultBody);
    setShowMessageModal(true);
  };

  const handleContactCardPress = () => {
    if (!listerPhone) {
      Alert.alert('Contact unavailable', 'Property owner has not added a contact number yet.');
      return;
    }

    Alert.alert('Property Owner Contact', listerPhone, [
      { text: 'Close', style: 'cancel' },
      { text: 'Call', onPress: () => void handleContactPress() },
    ]);
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
          {propertyVideoUrl ? (
            <View style={styles.videoCard}>
              <Text style={styles.videoCardTitle}>Property Video</Text>
              <PropertyVideoPlayer source={propertyVideoUrl} style={styles.videoPlayer} />
            </View>
          ) : null}

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
                <Text style={styles.detailValue}>{listerName}</Text>
              </View>
              {listerCompany ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Company</Text>
                  <Text style={styles.detailValue}>{listerCompany}</Text>
                </View>
              ) : null}
              {listerPhone ? (
                <Pressable style={styles.detailItem} onPress={handleContactCardPress}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{listerPhone}</Text>
                  <Text style={styles.detailHint}>Tap to view contact popup</Text>
                </Pressable>
              ) : null}
              {listerWhatsapp && listerWhatsapp !== listerPhone ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>WhatsApp</Text>
                  <Text style={styles.detailValue}>{listerWhatsapp}</Text>
                </View>
              ) : null}
              {listerAddress ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{listerAddress}</Text>
                </View>
              ) : null}
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
          <Text style={styles.messageButtonText}>Send Message</Text>
        </Pressable>
        <Pressable style={styles.callButton} onPress={handleContactPress}>
          <Phone size={22} color="white" />
          <Text style={styles.callButtonText}>Call Lister</Text>
        </Pressable>
      </View>

      {/* ─── Message Compose Modal ─────────────────────────────── */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalCard}
            >
              <Text style={styles.modalTitle}>Send Message</Text>
              <Text style={styles.modalSubtitle}>
                To: {property.title}
              </Text>

              <TextInput
                style={styles.messageInput}
                value={draftMessage}
                onChangeText={setDraftMessage}
                placeholder="Write your message here…"
                placeholderTextColor={Colors.light.subtext}
                multiline
                textAlignVertical="top"
                autoFocus
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowMessageModal(false)}
                  disabled={isSendingMessage}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSendBtn, (isSendingMessage || !draftMessage.trim()) && styles.buttonDisabled]}
                  onPress={() => void sendMessageToOwner(draftMessage)}
                  disabled={isSendingMessage || !draftMessage.trim()}
                >
                  {isSendingMessage
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={styles.modalSendText}>Send</Text>}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  videoCard: {
    marginBottom: 16,
    gap: 12,
  },
  videoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
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
  detailHint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.light.primary,
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
  buttonDisabled: {
    opacity: 0.6,
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
  // ─── Message Compose Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.subtext,
    marginBottom: 14,
  },
  messageInput: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 150,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 15,
  },
  modalSendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
