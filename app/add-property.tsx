import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  Pressable, 
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { 
  Plus, 
  Camera, 
  X,
  Check
} from 'lucide-react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import Colors from '@/constants/colors';
import StateSelector from '@/components/StateSelector';
import CitySelector from '@/components/CitySelector';

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

const paymentFrequencies = {
  rent: [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ],
  'short-let': [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ]
};

const commonAmenities = [
  'Pool', 'Gym', 'Parking', 'Elevator', 'Balcony', 'Garden', 
  'Security', 'Furnished', 'Air Conditioning', 'Heating',
  'Washer/Dryer', 'Dishwasher', 'Pet Friendly', 'Storage',
  'Fireplace', 'Smart Home', 'Waterfront', 'Mountain View'
];

export default function AddPropertyScreen() {
  const router = useRouter();
  const { addProperty } = usePropertyStore();
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('sell');
  const [paymentFrequency, setPaymentFrequency] = useState<string | undefined>();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  
  // Reset payment frequency when listing type changes
  useEffect(() => {
    setPaymentFrequency(undefined);
  }, [listingType]);
  
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
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };
  
  const validateForm = () => {
    if (!title) return 'Please enter a title';
    if (!price || isNaN(Number(price))) return 'Please enter a valid price';
    if (!address) return 'Please enter an address';
    if (!city) return 'Please enter a city';
    if (!state) return 'Please enter a state';
    if (!zipCode) return 'Please enter a ZIP code';
    if (!bedrooms || isNaN(Number(bedrooms))) return 'Please enter a valid number of bedrooms';
    if (!bathrooms || isNaN(Number(bathrooms))) return 'Please enter a valid number of bathrooms';
    if (!squareFeet || isNaN(Number(squareFeet))) return 'Please enter valid square footage';
    if (!yearBuilt || isNaN(Number(yearBuilt))) return 'Please enter a valid year built';
    if (!propertyType) return 'Please select a property type';
    if (!listingType) return 'Please select a listing type';
    if ((listingType === 'rent' || listingType === 'short-let') && !paymentFrequency) {
      return 'Please select a payment frequency';
    }
    if (images.length === 0) return 'Please add at least one image';
    
    return null;
  };
  
  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    
    // For demo purposes, we'll use placeholder images if on web
    const propertyImages = images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    ];
    
    // Create payment frequency object based on listing type
    let paymentFrequencyObj = undefined;
    if (paymentFrequency) {
      if (listingType === 'rent') {
        paymentFrequencyObj = { rent: paymentFrequency as 'monthly' | 'yearly' };
      } else if (listingType === 'short-let') {
        paymentFrequencyObj = { 'short-let': paymentFrequency as 'daily' | 'weekly' | 'monthly' };
      }
    }
    
    const newProperty = {
      title,
      price: Number(price),
      address,
      city,
      state,
      zipCode,
      description,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      squareFeet: Number(squareFeet),
      yearBuilt: Number(yearBuilt),
      type: propertyType as any,
      listingType: listingType as any,
      amenities: selectedAmenities,
      images: propertyImages,
      // Generate random coordinates for demo purposes
      latitude: 40 + Math.random() * 10,
      longitude: -100 - Math.random() * 20,
      isFeatured: false,
      paymentFrequency: paymentFrequencyObj
    };
    
    addProperty(newProperty);
    Alert.alert(
      'Success', 
      'Property added successfully!',
      [{ text: 'OK', onPress: () => router.push('/') }]
    );
  };

  // Get available payment frequencies based on listing type
  const getPaymentFrequencyOptions = () => {
    if (listingType === 'rent') {
      return paymentFrequencies.rent;
    } else if (listingType === 'short-let') {
      return paymentFrequencies["short-let"];
    }
    return [];
  };

  const paymentFrequencyOptions = getPaymentFrequencyOptions();
  const showPaymentFrequency = listingType === 'rent' || listingType === 'short-let';

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Add Property',
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
              {listingTypes.map((type, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    listingType === type.value && styles.optionSelected
                  ]}
                  onPress={() => setListingType(type.value)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      listingType === type.value && styles.optionTextSelected
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          {/* Payment Frequency - Only show for rent or short-let */}
          {showPaymentFrequency && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Frequency</Text>
              <View style={styles.optionsGrid}>
                {paymentFrequencyOptions.map((option, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.optionButton,
                      paymentFrequency === option.value && styles.optionSelected
                    ]}
                    onPress={() => setPaymentFrequency(option.value)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        paymentFrequency === option.value && styles.optionTextSelected
                      ]}
                    >
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
              {propertyTypes.map((type, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    propertyType === type.value && styles.optionSelected
                  ]}
                  onPress={() => setPropertyType(type.value)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      propertyType === type.value && styles.optionTextSelected
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Price {getPriceLabel()}
            </Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              placeholderTextColor={Colors.light.subtext}
              keyboardType="numeric"
            />
          </View>
          
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
            <StateSelector 
              value={state}
              onSelect={setState}
              placeholder="Select state"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <CitySelector 
              value={city}
              onSelect={setCity}
              selectedState={state}
              placeholder="Select city"
            />
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
          
          <Text style={styles.sectionTitle}>Details</Text>
          
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
          
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
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
            {commonAmenities.map((amenity, index) => (
              <Pressable
                key={index}
                style={[
                  styles.amenityButton,
                  selectedAmenities.includes(amenity) && styles.amenitySelected
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                {selectedAmenities.includes(amenity) && (
                  <Check size={14} color={Colors.light.primary} style={styles.checkIcon} />
                )}
                <Text 
                  style={[
                    styles.amenityText,
                    selectedAmenities.includes(amenity) && styles.amenityTextSelected
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
              <View key={index} style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <Pressable 
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>
            ))}
          </View>
          
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Property</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
  
  // Helper function to get the appropriate price label based on listing type and payment frequency
  function getPriceLabel() {
    if (listingType === 'sell') {
      return '(₦)';
    } else if (listingType === 'rent') {
      return paymentFrequency === 'yearly' ? '(₦/year)' : '(₦/month)';
    } else if (listingType === 'short-let') {
      if (paymentFrequency === 'daily') return '(₦/day)';
      if (paymentFrequency === 'weekly') return '(₦/week)';
      if (paymentFrequency === 'monthly') return '(₦/month)';
      return '(₦)';
    }
    return '(₦)';
  }
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
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});