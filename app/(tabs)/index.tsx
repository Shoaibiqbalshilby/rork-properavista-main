import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Filter, MapPin, Plus } from 'lucide-react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import PropertyCard from '@/components/PropertyCard';
import SearchBar from '@/components/SearchBar';
import FilterModal from '@/components/FilterModal';
import Colors from '@/constants/colors';
import { fetchAllPropertiesFromSupabase } from '@/lib/propertyApi';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { properties, filter, setFilter, getFeaturedProperties, setProperties } = usePropertyStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);

  // Reload properties when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadProperties = async () => {
        try {
          const remoteProperties = await fetchAllPropertiesFromSupabase();
          if (remoteProperties.length > 0) {
            setProperties(remoteProperties);
          }
        } catch (error) {
          console.error('Failed to load properties:', error);
        }
      };

      loadProperties();
    }, [setProperties])
  );
  
  const featuredProperties = getFeaturedProperties();
  
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
  
  const handleViewAll = () => {
    router.push('/search' as any);
  };
  
  const handleAddProperty = () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Business Users Only', 'Only business users can add the property. Please sign in first.');
      return;
    }

    if (!user.companyName) {
      Alert.alert(
        'Business Profile Required',
        'Only business users can add the property. Please complete your Business Profile first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Profile', onPress: () => router.push('/business-profile' as any) },
        ]
      );
      return;
    }

    router.push('/add-property' as any);
  };

  // Get properties by listing type
  const getPropertiesByListingType = (type: string) => {
    return properties.filter(p => p.listingType === type).slice(0, 3);
  };

  const rentProperties = getPropertiesByListingType('rent');
  const saleProperties = getPropertiesByListingType('sell');

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Find your</Text>
          <Text style={styles.titleText}>Perfect Home</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <SearchBar 
            value={searchQuery} 
            onChangeText={handleSearch} 
            placeholder="Search by city, address or ZIP code"
          />
          <Pressable style={styles.filterButton} onPress={handleFilterPress}>
            <Filter size={22} color={Colors.light.text} />
          </Pressable>
        </View>
        
        {/* Featured Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <Pressable onPress={handleViewAll}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {featuredProperties.map(property => (
              <View key={property.id} style={styles.featuredItem}>
                <PropertyCard property={property} isFeatured />
              </View>
            ))}
          </ScrollView>
        </View>
        
        {/* Cities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.citiesList}
          >
            {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'].map((city, index) => (
              <Pressable 
                key={index} 
                style={styles.cityItem}
                onPress={() => {
                  setFilter({ searchQuery: city });
                  router.push('/search' as any);
                }}
              >
                <View style={styles.cityIconContainer}>
                  <MapPin size={20} color={Colors.light.primary} />
                </View>
                <Text style={styles.cityName}>{city}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        {/* Properties for Rent */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For Rent</Text>
            <Pressable onPress={() => {
              setFilter({ listingType: ['rent'] });
              router.push('/search' as any);
            }}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          <View style={styles.recentList}>
            {rentProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>
        </View>

        {/* Properties for Sale */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For Sale</Text>
            <Pressable onPress={() => {
              setFilter({ listingType: ['sell'] });
              router.push('/search' as any);
            }}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          <View style={styles.recentList}>
            {saleProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>
        </View>
        
        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          initialFilter={filter}
          onApply={handleFilterApply}
        />
      </ScrollView>
      
      {/* Add Property Button - Now outside ScrollView */}
      <Pressable style={styles.addButton} onPress={handleAddProperty}>
        <Plus size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    color: Colors.light.subtext,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  featuredList: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  featuredItem: {
    width: 280,
    marginRight: 12,
  },
  citiesList: {
    paddingHorizontal: 20,
  },
  cityItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  cityIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cityName: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  recentList: {
    paddingHorizontal: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999,
  },
});