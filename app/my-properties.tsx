import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import PropertyCard from '@/components/PropertyCard';
import Colors from '@/constants/colors';
import { fetchUserPropertiesFromSupabase } from '@/lib/propertyApi';
import { Property } from '@/types/property';

export default function MyPropertiesScreen() {
  const { user } = useAuthStore();
  const { getPropertiesByUser } = usePropertyStore();
  const [properties, setProperties] = React.useState<Property[]>([]);

  React.useEffect(() => {
    setProperties(user ? getPropertiesByUser(user.id) : []);
  }, [user, getPropertiesByUser]);

  React.useEffect(() => {
    const loadMyProperties = async () => {
      if (!user) return;

      try {
        const userProperties = await fetchUserPropertiesFromSupabase(user.id);
        setProperties(userProperties);
      } catch {
      }
    };

    loadMyProperties();
  }, [user]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Properties' }} />

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyText}>Properties you list will appear here and can be edited from the detail page.</Text>
          </View>
        }
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
    paddingVertical: 80,
    paddingHorizontal: 20,
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
    maxWidth: 320,
  },
});
