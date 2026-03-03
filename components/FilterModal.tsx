import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView,
  Pressable
} from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PropertyFilter } from '@/types/property';
import StateSelector from '@/components/StateSelector';
import CitySelector from '@/components/CitySelector';

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  initialFilter: PropertyFilter;
  onApply: (filter: PropertyFilter) => void;
};

const propertyTypes = [
  { label: 'House', value: 'house' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Villa', value: 'villa' },
  { label: 'Duplex', value: 'duplex' },
  { label: 'Flat', value: 'flat' },
  { label: 'Landed', value: 'landed' },
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

const bedroomOptions = [1, 2, 3, 4, '5+'];
const bathroomOptions = [1, 1.5, 2, 2.5, 3, '3+'];
const priceRanges = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Under ₦50M', min: undefined, max: 50000000 },
  { label: '₦50M - ₦100M', min: 50000000, max: 100000000 },
  { label: '₦100M - ₦200M', min: 100000000, max: 200000000 },
  { label: '₦200M - ₦500M', min: 200000000, max: 500000000 },
  { label: '₦500M+', min: 500000000, max: undefined },
];

const rentPriceRanges = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Under ₦500K', min: undefined, max: 500000 },
  { label: '₦500K - ₦1M', min: 500000, max: 1000000 },
  { label: '₦1M - ₦2M', min: 1000000, max: 2000000 },
  { label: '₦2M - ₦5M', min: 2000000, max: 5000000 },
  { label: '₦5M+', min: 5000000, max: undefined },
];

const shortLetPriceRanges = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Under ₦50K', min: undefined, max: 50000 },
  { label: '₦50K - ₦100K', min: 50000, max: 100000 },
  { label: '₦100K - ₦200K', min: 100000, max: 200000 },
  { label: '₦200K - ₦500K', min: 200000, max: 500000 },
  { label: '₦500K+', min: 500000, max: undefined },
];

export default function FilterModal({ 
  visible, 
  onClose, 
  initialFilter, 
  onApply 
}: FilterModalProps) {
  const [filter, setFilter] = useState<PropertyFilter>(initialFilter);
  
  const handleReset = () => {
    setFilter({});
  };
  
  const handleApply = () => {
    onApply(filter);
    onClose();
  };

  const togglePropertyType = (type: string) => {
    setFilter(current => {
      const currentTypes = current.propertyType || [];
      
      if (currentTypes.includes(type)) {
        return {
          ...current,
          propertyType: currentTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...current,
          propertyType: [...currentTypes, type]
        };
      }
    });
  };

  const toggleListingType = (type: string) => {
    setFilter(current => {
      const currentTypes = current.listingType || [];
      
      if (currentTypes.includes(type)) {
        return {
          ...current,
          listingType: currentTypes.filter(t => t !== type),
          // Clear payment frequency if no listing type requires it
          paymentFrequency: undefined
        };
      } else {
        return {
          ...current,
          listingType: [...currentTypes, type]
        };
      }
    });
  };

  const setPaymentFrequency = (frequency: string) => {
    setFilter(current => ({
      ...current,
      paymentFrequency: frequency
    }));
  };

  const setPriceRange = (min?: number, max?: number) => {
    setFilter(current => ({
      ...current,
      minPrice: min,
      maxPrice: max
    }));
  };

  const setBedrooms = (value: number | string) => {
    const bedroomValue = value === '5+' ? 5 : value;
    setFilter(current => ({
      ...current,
      bedrooms: bedroomValue as number
    }));
  };

  const setBathrooms = (value: number | string) => {
    const bathroomValue = value === '3+' ? 3 : value;
    setFilter(current => ({
      ...current,
      bathrooms: bathroomValue as number
    }));
  };

  const handleStateSelect = (state: string) => {
    setFilter(current => ({
      ...current,
      state,
      // Clear city when state changes
      city: undefined
    }));
  };

  const handleCitySelect = (city: string) => {
    setFilter(current => ({
      ...current,
      city
    }));
  };

  // Determine if we should show rent, short-let, or sale price ranges
  const isRentFilter = filter.listingType?.includes('rent');
  const isShortLetFilter = filter.listingType?.includes('short-let');
  
  let priceRangesToShow = priceRanges;
  if (isRentFilter && !isShortLetFilter) {
    priceRangesToShow = rentPriceRanges;
  } else if (isShortLetFilter && !isRentFilter) {
    priceRangesToShow = shortLetPriceRanges;
  } else if (isRentFilter && isShortLetFilter) {
    // If both are selected, show rent ranges as they're in the middle
    priceRangesToShow = rentPriceRanges;
  }

  // Determine which payment frequencies to show
  const showPaymentFrequencies = () => {
    if (filter.listingType?.includes('rent') && filter.listingType?.includes('short-let')) {
      // If both are selected, show both sets of options
      return (
        <>
          <Text style={styles.subSectionTitle}>Rent Payment</Text>
          <View style={styles.optionsGrid}>
            {paymentFrequencies.rent.map((option, index) => (
              <TouchableOpacity
                key={`rent-${index}`}
                style={[
                  styles.optionButton,
                  filter.paymentFrequency === option.value && styles.optionSelected
                ]}
                onPress={() => setPaymentFrequency(option.value)}
              >
                <Text 
                  style={[
                    styles.optionText,
                    filter.paymentFrequency === option.value && styles.optionTextSelected
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.subSectionTitle, {marginTop: 12}]}>Short-Let Payment</Text>
          <View style={styles.optionsGrid}>
            {paymentFrequencies["short-let"].map((option, index) => (
              <TouchableOpacity
                key={`short-let-${index}`}
                style={[
                  styles.optionButton,
                  filter.paymentFrequency === option.value && styles.optionSelected
                ]}
                onPress={() => setPaymentFrequency(option.value)}
              >
                <Text 
                  style={[
                    styles.optionText,
                    filter.paymentFrequency === option.value && styles.optionTextSelected
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      );
    } else if (filter.listingType?.includes('rent')) {
      // Only show rent options
      return (
        <View style={styles.optionsGrid}>
          {paymentFrequencies.rent.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                filter.paymentFrequency === option.value && styles.optionSelected
              ]}
              onPress={() => setPaymentFrequency(option.value)}
            >
              <Text 
                style={[
                  styles.optionText,
                  filter.paymentFrequency === option.value && styles.optionTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (filter.listingType?.includes('short-let')) {
      // Only show short-let options
      return (
        <View style={styles.optionsGrid}>
          {paymentFrequencies["short-let"].map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                filter.paymentFrequency === option.value && styles.optionSelected
              ]}
              onPress={() => setPaymentFrequency(option.value)}
            >
              <Text 
                style={[
                  styles.optionText,
                  filter.paymentFrequency === option.value && styles.optionTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Filter Properties</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {/* Listing Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Listing Type</Text>
                  <View style={styles.optionsGrid}>
                    {listingTypes.map((type, index) => {
                      const isSelected = filter.listingType?.includes(type.value);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.optionButton,
                            isSelected && styles.optionSelected
                          ]}
                          onPress={() => toggleListingType(type.value)}
                        >
                          <Text 
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Payment Frequency - Only show if rent or short-let is selected */}
                {(filter.listingType?.includes('rent') || filter.listingType?.includes('short-let')) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Frequency</Text>
                    {showPaymentFrequencies()}
                  </View>
                )}

                {/* Location */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Location</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>State</Text>
                    <StateSelector 
                      value={filter.state || ""}
                      onSelect={handleStateSelect}
                      placeholder="Select state"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <CitySelector 
                      value={filter.city || ""}
                      onSelect={handleCitySelect}
                      selectedState={filter.state}
                      placeholder="Select city"
                    />
                  </View>
                </View>

                {/* Price Range */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Price Range</Text>
                  <View style={styles.optionsGrid}>
                    {priceRangesToShow.map((range, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          filter.minPrice === range.min && filter.maxPrice === range.max && styles.optionSelected
                        ]}
                        onPress={() => setPriceRange(range.min, range.max)}
                      >
                        <Text 
                          style={[
                            styles.optionText,
                            filter.minPrice === range.min && filter.maxPrice === range.max && styles.optionTextSelected
                          ]}
                        >
                          {range.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bedrooms */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bedrooms</Text>
                  <View style={styles.optionsRow}>
                    {bedroomOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.circleOption,
                          filter.bedrooms === (option === '5+' ? 5 : option) && styles.circleOptionSelected
                        ]}
                        onPress={() => setBedrooms(option)}
                      >
                        <Text 
                          style={[
                            styles.circleOptionText,
                            filter.bedrooms === (option === '5+' ? 5 : option) && styles.circleOptionTextSelected
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bathrooms */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bathrooms</Text>
                  <View style={styles.optionsRow}>
                    {bathroomOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.circleOption,
                          filter.bathrooms === (option === '3+' ? 3 : option) && styles.circleOptionSelected
                        ]}
                        onPress={() => setBathrooms(option)}
                      >
                        <Text 
                          style={[
                            styles.circleOptionText,
                            filter.bathrooms === (option === '3+' ? 3 : option) && styles.circleOptionTextSelected
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Property Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Property Type</Text>
                  <View style={styles.optionsGrid}>
                    {propertyTypes.map((type, index) => {
                      const isSelected = filter.propertyType?.includes(type.value);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.optionButton,
                            isSelected && styles.optionSelected
                          ]}
                          onPress={() => togglePropertyType(type.value)}
                        >
                          <Text 
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </Pressable>
                <Pressable style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
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
  optionsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  circleOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: Colors.light.tag,
    borderWidth: 1,
    borderColor: Colors.light.tag,
  },
  circleOptionSelected: {
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    borderColor: Colors.light.primary,
  },
  circleOptionText: {
    color: Colors.light.tagText,
    fontSize: 14,
  },
  circleOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resetButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});