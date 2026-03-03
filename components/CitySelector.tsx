import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  FlatList,
  Pressable
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { popularCities, getAllCities } from '@/constants/nigeria';
import SearchBar from './SearchBar';

type CitySelectorProps = {
  value: string;
  onSelect: (city: string) => void;
  selectedState?: string;
  placeholder?: string;
};

export default function CitySelector({ 
  value, 
  onSelect, 
  selectedState,
  placeholder = "Select City" 
}: CitySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  useEffect(() => {
    if (selectedState) {
      // Type-safe check if the selected state exists in popularCities
      const citiesForState = selectedState in popularCities 
        ? popularCities[selectedState as keyof typeof popularCities] 
        : [];
      
      if (citiesForState.length > 0) {
        setAvailableCities(citiesForState);
      } else {
        setAvailableCities(getAllCities());
      }
    } else {
      setAvailableCities(getAllCities());
    }
  }, [selectedState]);
  
  const filteredCities = availableCities.filter(city => 
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = (city: string) => {
    onSelect(city);
    setModalVisible(false);
    setSearchQuery('');
  };
  
  return (
    <View>
      <Pressable 
        style={styles.selector} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={value ? styles.selectorText : styles.placeholderText}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color={Colors.light.subtext} />
      </Pressable>
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedState ? `Cities in ${selectedState}` : 'Select City'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchContainer}>
                  <SearchBar 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search cities..."
                  />
                </View>
                
                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.cityItem}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={styles.cityText}>{item}</Text>
                      {value === item && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.citiesList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No cities found</Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.subtext,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  citiesList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  cityText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectedIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.subtext,
  },
});