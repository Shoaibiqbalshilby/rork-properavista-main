import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Filter } from 'lucide-react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import PropertyCard from '@/components/PropertyCard';
import SearchBar from '@/components/SearchBar';
import FilterModal from '@/components/FilterModal';
import Colors from '@/constants/colors';

export default function SearchScreen() {
  const { filter, setFilter, getFilteredProperties } = usePropertyStore();
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [properties, setProperties] = useState(getFilteredProperties());
  
  useEffect(() => {
    // Update properties when filter changes
    setProperties(getFilteredProperties());
  }, [filter]);
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilter({ ...filter, searchQuery: text });
  };
  
  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };
  
  const handleFilterApply = (newFilter: any) => {
    // Preserve the search query when applying other filters
    setFilter({ ...newFilter, searchQuery });
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No properties found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search or filter criteria to find properties.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar 
          value={searchQuery} 
          onChangeText={handleSearch} 
          placeholder="Search by city, address or ZIP code"
        />
        <Pressable 
          style={[
            styles.filterButton,
            Object.keys(filter).length > 0 && 
            (filter.searchQuery ? Object.keys(filter).length > 1 : Object.keys(filter).length > 0) && 
            styles.filterButtonActive
          ]} 
          onPress={handleFilterPress}
        >
          <Filter size={22} color={
            Object.keys(filter).length > 0 && 
            (filter.searchQuery ? Object.keys(filter).length > 1 : Object.keys(filter).length > 0) 
              ? 'white' 
              : Colors.light.text
          } />
        </Pressable>
      </View>
      
      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
        </Text>
      </View>
      
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialFilter={filter}
        onApply={handleFilterApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterButton: {
    backgroundColor: Colors.light.card,
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.subtext,
    textAlign: 'center',
  },
});