import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Help & Support</Text>
        <Text style={styles.heroText}>
          Quick answers for common questions about listings, saved properties, and location-based browsing.
        </Text>
      </View>

      <View style={styles.card}>
        <Pressable
          style={styles.rowButton}
          onPress={() => Alert.alert('Nearby search', 'Use the Nearby tab to find listings around your current location after granting location access while using the app.')}
        >
          <Text style={styles.rowTitle}>How does Nearby search work?</Text>
          <Text style={styles.rowText}>Learn how local results are generated.</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.rowButton}
          onPress={() => Alert.alert('Saved properties', 'Tap the heart icon on any property card to add it to your favorites for quick access later.')}
        >
          <Text style={styles.rowTitle}>How do I save a property?</Text>
          <Text style={styles.rowText}>See how favorites work in the app.</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.rowButton}
          onPress={() => Alert.alert('Support', 'For review and production support flows, add your support email or WhatsApp contact here before the next release.')}
        >
          <Text style={styles.rowTitle}>Contact support</Text>
          <Text style={styles.rowText}>Open the current support placeholder.</Text>
        </Pressable>
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
  heroCard: {
    backgroundColor: '#EEF4FA',
    borderRadius: 16,
    padding: 18,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
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