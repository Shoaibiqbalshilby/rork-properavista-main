import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { useLocationStore } from '@/hooks/useLocationStore';

export default function PrivacyScreen() {
  const clearStoredLocation = useLocationStore((state) => state.clearStoredLocation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Location privacy</Text>
        <Text style={styles.noticeText}>
          Properavista requests location only while you actively use Nearby or Map. The app does not request or retain background location access.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Controls</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.rowButton}
            onPress={() => {
              clearStoredLocation();
              Alert.alert('Location cleared', 'The saved location cache has been removed from this device.');
            }}
          >
            <Text style={styles.rowTitle}>Clear saved location</Text>
            <Text style={styles.rowText}>Remove the last cached map position from local storage.</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.rowButton}
            onPress={() =>
              Alert.alert(
                'How data is used',
                'Location data is used only to show nearby properties, center the map, and improve local search results during the current session.'
              )
            }
          >
            <Text style={styles.rowTitle}>How location data is used</Text>
            <Text style={styles.rowText}>Read the in-app summary of the current location behavior.</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  noticeCard: {
    backgroundColor: '#F5F9FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E6F3',
    padding: 18,
  },
  noticeTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  rowButton: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  rowText: {
    fontSize: 13,
    color: Colors.light.subtext,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
});