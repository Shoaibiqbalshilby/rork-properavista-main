import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import PropertyCard from '@/components/PropertyCard';
import Colors from '@/constants/colors';
import { Heart } from 'lucide-react-native';

export default function FavoritesScreen() {
  const { properties, favorites } = usePropertyStore();
  
  const favoriteProperties = properties.filter(property => 
    favorites.includes(property.id)
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Heart size={40} color={Colors.light.favorite} />
      </View>
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptyText}>
        Properties you save will appear here. Tap the heart icon on any property to add it to your favorites.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteProperties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    height: 400,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    maxWidth: 300,
  },
});