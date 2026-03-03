import React, { useState } from 'react';
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
import { ChevronDown, X, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { nigerianStates } from '@/constants/nigeria';
import SearchBar from './SearchBar';

type StateSelectorProps = {
  value: string;
  onSelect: (state: string) => void;
  placeholder?: string;
};

export default function StateSelector({ 
  value, 
  onSelect, 
  placeholder = "Select State" 
}: StateSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredStates = nigerianStates.filter(state => 
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = (state: string) => {
    onSelect(state);
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
                  <Text style={styles.modalTitle}>Select State</Text>
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
                    placeholder="Search states..."
                  />
                </View>
                
                <FlatList
                  data={filteredStates}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.stateItem}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={styles.stateText}>{item}</Text>
                      {value === item && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.statesList}
                  showsVerticalScrollIndicator={false}
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
  statesList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  stateText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectedIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
});