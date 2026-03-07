import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Camera, Check, X } from 'lucide-react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';
import StateSelector from '@/components/StateSelector';
import CitySelector from '@/components/CitySelector';
import { getNearbyFacilityDistances } from '@/utils/facilities';
import { LandUnit, ListingStatus, Property } from '@/types/property';

const propertyTypes = [
  { label: 'House', value: 'house' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Villa', value: 'villa' },
  { label: 'Duplex', value: 'duplex' },
  { label: 'Flat', value: 'flat' },
  { label: 'Landed Property', value: 'landed' },
];

const listingTypes = [
  { label: 'For Sale', value: 'sell' },
  { label: 'For Rent', value: 'rent' },
  { label: 'Short-Let', value: 'short-let' },
];

const listingStatuses: { label: string; value: ListingStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Sold', value: 'sold' },
];

const landUnits: { label: string; value: LandUnit }[] = [
  { label: 'Plot', value: 'plot' },
  { label: 'Acre', value: 'acre' },
  { label: 'Hectare', value: 'hectare' },
];

const paymentFrequencies = {
  rent: [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ],
  'short-let': [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ],
};

const commonAmenities = [
  'Pool',
  'Gym',
  'Parking',
  'Elevator',
  'Balcony',
  'Garden',
  'Security',
  'Furnished',
  'Air Conditioning',
  'Heating',
  'Washer/Dryer',
  'Dishwasher',
  'Pet Friendly',
  'Storage',
  'Fireplace',
  'Smart Home',
  'Waterfront',
  'Mountain View',
];

const mapProvider = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? PROVIDER_GOOGLE : undefined;

export default function AddPropertyScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { user } = useAuthStore();
  const { properties, addProperty, updateProperty, updatePropertyFacilities } = usePropertyStore();

  const editingProperty = useMemo(
    () => properties.find((property) => property.id === editId),
    [properties, editId]
  );

  const isEditMode = Boolean(editingProperty);
  const canEdit = !editingProperty || (!!user && editingProperty.listedByUserId === user.id);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState('0');
  const [bathrooms, setBathrooms] = useState('0');
  const [squareFeet, setSquareFeet] = useState('0');
  const [yearBuilt, setYearBuilt] = useState(String(new Date().getFullYear()));
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('sell');
  const [listingStatus, setListingStatus] = useState<ListingStatus>('available');
  const [paymentFrequency, setPaymentFrequency] = useState<string | undefined>();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [landUnit, setLandUnit] = useState<LandUnit>('plot');
  const [landQuantity, setLandQuantity] = useState('1');
  const [latitude, setLatitude] = useState('6.5244');
  const [longitude, setLongitude] = useState('3.3792');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editingProperty) return;

    setTitle(editingProperty.title);
    setPrice(String(editingProperty.price));
    setAddress(editingProperty.address);
    setCity(editingProperty.city);
    setState(editingProperty.state);
    setZipCode(editingProperty.zipCode);
    setDescription(editingProperty.description);
    setBedrooms(String(editingProperty.bedrooms));
    setBathrooms(String(editingProperty.bathrooms));
    setSquareFeet(String(editingProperty.squareFeet));
    setYearBuilt(String(editingProperty.yearBuilt));
    setPropertyType(editingProperty.type);
    setListingType(editingProperty.listingType);
    setListingStatus(editingProperty.listingStatus || 'available');
    setSelectedAmenities(editingProperty.amenities || []);
    setImages(editingProperty.images || []);
    setLatitude(String(editingProperty.latitude));
    setLongitude(String(editingProperty.longitude));

    if (editingProperty.type === 'landed' && editingProperty.landDetails) {
      setLandUnit(editingProperty.landDetails.unit);
      setLandQuantity(String(editingProperty.landDetails.quantity));
    }

    if (editingProperty.paymentFrequency?.rent) {
      setPaymentFrequency(editingProperty.paymentFrequency.rent);
    } else if (editingProperty.paymentFrequency?.['short-let']) {
      setPaymentFrequency(editingProperty.paymentFrequency['short-let']);
    }
  }, [editingProperty]);

  useEffect(() => {
    if (!isEditMode) {
      setPaymentFrequency(undefined);
    }
  }, [listingType, isEditMode]);

  const isLandProperty = propertyType === 'landed';

  const handleAddImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Image picking is not fully supported on web.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, imageIndex) => imageIndex !== index));
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((selected) => selected !== amenity));
      return;
    }

    setSelectedAmenities([...selectedAmenities, amenity]);
  };

  const onMapPress = (event: MapPressEvent) => {
    const selectedLatitude = event.nativeEvent.coordinate.latitude;
    const selectedLongitude = event.nativeEvent.coordinate.longitude;
    setLatitude(selectedLatitude.toFixed(6));
    setLongitude(selectedLongitude.toFixed(6));
  };

  const validateForm = () => {
    if (!title.trim()) return 'Please enter a title';
    if (!price || isNaN(Number(price))) return 'Please enter a valid price';
    if (!address.trim()) return 'Please enter an address';
    if (!city.trim()) return 'Please enter a city';
    if (!state.trim()) return 'Please enter a state';
    if (!zipCode.trim()) return 'Please enter a ZIP code';
    if (!propertyType) return 'Please select a property type';
    if (!listingType) return 'Please select a listing type';
    if ((listingType === 'rent' || listingType === 'short-let') && !paymentFrequency) {
      return 'Please select a payment frequency';
    }

    if (!isLandProperty) {
      if (!bedrooms || isNaN(Number(bedrooms))) return 'Please enter valid bedrooms';
      if (!bathrooms || isNaN(Number(bathrooms))) return 'Please enter valid bathrooms';
      if (!squareFeet || isNaN(Number(squareFeet))) return 'Please enter valid square footage';
    } else {
      if (!landQuantity || isNaN(Number(landQuantity)) || Number(landQuantity) <= 0) {
        return 'Please enter valid land quantity';
      }
    }

    if (!yearBuilt || isNaN(Number(yearBuilt))) return 'Please enter a valid year built';
    if (!latitude || isNaN(Number(latitude))) return 'Please enter valid latitude';
    if (!longitude || isNaN(Number(longitude))) return 'Please enter valid longitude';
    if (images.length === 0) return 'Please add at least one image';

    return null;
  };

  const buildPropertyPayload = (): Omit<Property, 'id'> => {
    const paymentFrequencyObj = !paymentFrequency
      ? undefined
      : listingType === 'rent'
      ? { rent: paymentFrequency as 'monthly' | 'yearly' }
      : listingType === 'short-let'
      ? { 'short-let': paymentFrequency as 'daily' | 'weekly' | 'monthly' }
      : undefined;

    return {
      title,
      price: Number(price),
      address,
      city,
      state,
      zipCode,
      description,
      bedrooms: isLandProperty ? 0 : Number(bedrooms),
      bathrooms: isLandProperty ? 0 : Number(bathrooms),
      squareFeet: isLandProperty ? 0 : Number(squareFeet),
      yearBuilt: Number(yearBuilt),
      type: propertyType as Property['type'],
      listingType: listingType as Property['listingType'],
      listingStatus,
      amenities: selectedAmenities,
      images,
      latitude: Number(latitude),
      longitude: Number(longitude),
      isFeatured: false,
      paymentFrequency: paymentFrequencyObj,
      landDetails: isLandProperty
        ? {
            unit: landUnit,
            quantity: Number(landQuantity),
          }
        : undefined,
      listedByUserId: user?.id,
      lister: {
        name: user?.name || 'Property Owner',
        companyName: user?.companyName,
        description: user?.description,
        phone: user?.phone,
        whatsapp: user?.whatsapp || user?.phone,
        address: user?.address,
      },
      nearbyFacilities: editingProperty?.nearbyFacilities || [],
    };
  };

  const updateFacilities = async (propertyId: string) => {
    const facilities = await getNearbyFacilityDistances(Number(latitude), Number(longitude));
    if (facilities.length > 0) {
      updatePropertyFacilities(propertyId, facilities);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in before listing or editing properties.');
      router.push('/login');
      return;
    }

    if (isEditMode && !canEdit) {
      Alert.alert('Not Allowed', 'Only the original lister can edit this property.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const payload = buildPropertyPayload();

    try {
      setSubmitting(true);
      let propertyId = editingProperty?.id;

      if (editingProperty) {
        updateProperty(editingProperty.id, payload);
      } else {
        propertyId = addProperty(payload);
      }

      if (propertyId) {
        await updateFacilities(propertyId);
      }

      Alert.alert(
        'Success',
        editingProperty ? 'Property updated successfully!' : 'Property added successfully!',
        [{ text: 'OK', onPress: () => router.push('/' as any) }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentFrequencyOptions = () => {
    if (listingType === 'rent') {
      return paymentFrequencies.rent;
    }

    if (listingType === 'short-let') {
      return paymentFrequencies['short-let'];
    }

    return [];
  };

  const getPriceLabel = () => {
    if (listingType === 'sell') return '(₦)';
    if (listingType === 'rent') return paymentFrequency === 'yearly' ? '(₦/year)' : '(₦/month)';
    if (listingType === 'short-let') {
      if (paymentFrequency === 'daily') return '(₦/day)';
      if (paymentFrequency === 'weekly') return '(₦/week)';
      if (paymentFrequency === 'monthly') return '(₦/month)';
    }
    return '(₦)';
  };

  const paymentFrequencyOptions = getPaymentFrequencyOptions();
  const showPaymentFrequency = listingType === 'rent' || listingType === 'short-let';

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Edit Property' : 'Add Property',
          headerBackTitle: 'Cancel',
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Property Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter property title"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Listing Type</Text>
            <View style={styles.optionsGrid}>
              {listingTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[styles.optionButton, listingType === type.value && styles.optionSelected]}
                  onPress={() => setListingType(type.value)}
                >
                  <Text style={[styles.optionText, listingType === type.value && styles.optionTextSelected]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.optionsGrid}>
              {listingStatuses.map((status) => (
                <Pressable
                  key={status.value}
                  style={[styles.optionButton, listingStatus === status.value && styles.optionSelected]}
                  onPress={() => setListingStatus(status.value)}
                >
                  <Text style={[styles.optionText, listingStatus === status.value && styles.optionTextSelected]}>
                    {status.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {showPaymentFrequency && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Frequency</Text>
              <View style={styles.optionsGrid}>
                {paymentFrequencyOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.optionButton, paymentFrequency === option.value && styles.optionSelected]}
                    onPress={() => setPaymentFrequency(option.value)}
                  >
                    <Text style={[styles.optionText, paymentFrequency === option.value && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.optionsGrid}>
              {propertyTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[styles.optionButton, propertyType === type.value && styles.optionSelected]}
                  onPress={() => setPropertyType(type.value)}
                >
                  <Text style={[styles.optionText, propertyType === type.value && styles.optionTextSelected]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price {getPriceLabel()}</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              placeholderTextColor={Colors.light.subtext}
              keyboardType="numeric"
            />
          </View>

          {isLandProperty && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Land Unit</Text>
                <View style={styles.optionsGrid}>
                  {landUnits.map((unit) => (
                    <Pressable
                      key={unit.value}
                      style={[styles.optionButton, landUnit === unit.value && styles.optionSelected]}
                      onPress={() => setLandUnit(unit.value)}
                    >
                      <Text style={[styles.optionText, landUnit === unit.value && styles.optionTextSelected]}>
                        {unit.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Land Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={landQuantity}
                  onChangeText={setLandQuantity}
                  placeholder="Example: 3"
                  placeholderTextColor={Colors.light.subtext}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter street address"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <StateSelector value={state} onSelect={setState} placeholder="Select state" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <CitySelector value={city} onSelect={setCity} selectedState={state} placeholder="Select city" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="ZIP Code"
              placeholderTextColor={Colors.light.subtext}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="6.5244"
                placeholderTextColor={Colors.light.subtext}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="3.3792"
                placeholderTextColor={Colors.light.subtext}
                keyboardType="numeric"
              />
            </View>
          </View>

          {Platform.OS !== 'web' && (
            <View style={styles.mapContainer}>
              <Text style={styles.mapInstruction}>Tap map to set exact location</Text>
              <MapView
                provider={mapProvider}
                style={styles.map}
                onPress={onMapPress}
                initialRegion={{
                  latitude: Number(latitude) || 6.5244,
                  longitude: Number(longitude) || 3.3792,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                region={{
                  latitude: Number(latitude) || 6.5244,
                  longitude: Number(longitude) || 3.3792,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: Number(latitude) || 6.5244,
                    longitude: Number(longitude) || 3.3792,
                  }}
                />
              </MapView>
            </View>
          )}

          <Text style={styles.sectionTitle}>Details</Text>

          {!isLandProperty && (
            <>
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                  <Text style={styles.label}>Bedrooms</Text>
                  <TextInput
                    style={styles.input}
                    value={bedrooms}
                    onChangeText={setBedrooms}
                    placeholder="0"
                    placeholderTextColor={Colors.light.subtext}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                  <Text style={styles.label}>Bathrooms</Text>
                  <TextInput
                    style={styles.input}
                    value={bathrooms}
                    onChangeText={setBathrooms}
                    placeholder="0"
                    placeholderTextColor={Colors.light.subtext}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Square Feet</Text>
                <TextInput
                  style={styles.input}
                  value={squareFeet}
                  onChangeText={setSquareFeet}
                  placeholder="0"
                  placeholderTextColor={Colors.light.subtext}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year Built</Text>
            <TextInput
              style={styles.input}
              value={yearBuilt}
              onChangeText={setYearBuilt}
              placeholder="2023"
              placeholderTextColor={Colors.light.subtext}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the property..."
              placeholderTextColor={Colors.light.subtext}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {commonAmenities.map((amenity) => (
              <Pressable
                key={amenity}
                style={[styles.amenityButton, selectedAmenities.includes(amenity) && styles.amenitySelected]}
                onPress={() => toggleAmenity(amenity)}
              >
                {selectedAmenities.includes(amenity) && (
                  <Check size={14} color={Colors.light.primary} style={styles.checkIcon} />
                )}
                <Text
                  style={[
                    styles.amenityText,
                    selectedAmenities.includes(amenity) && styles.amenityTextSelected,
                  ]}
                >
                  {amenity}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imagesContainer}>
            <Pressable style={styles.addImageButton} onPress={handleAddImage}>
              <Camera size={24} color={Colors.light.primary} />
              <Text style={styles.addImageText}>Add Image</Text>
            </Pressable>

            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imagePreviewContainer}>
                <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
                <Pressable style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                  <X size={16} color="white" />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable style={[styles.submitButton, submitting && styles.disabledButton]} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {submitting
                ? isEditMode
                  ? 'Updating Property...'
                  : 'Adding Property...'
                : isEditMode
                ? 'Update Property'
                : 'Add Property'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    backgroundColor: Colors.light.tag,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.tag,
  },
  optionSelected: {
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    borderColor: Colors.light.primary,
  },
  optionText: {
    color: Colors.light.tagText,
    fontSize: 14,
  },
  optionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapInstruction: {
    color: Colors.light.subtext,
    marginBottom: 8,
    fontSize: 13,
  },
  map: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  amenityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tag,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.tag,
  },
  amenitySelected: {
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    borderColor: Colors.light.primary,
  },
  checkIcon: {
    marginRight: 4,
  },
  amenityText: {
    color: Colors.light.tagText,
    fontSize: 14,
  },
  amenityTextSelected: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  addImageText: {
    color: Colors.light.primary,
    fontSize: 12,
    marginTop: 8,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    margin: 4,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
