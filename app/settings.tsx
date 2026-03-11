import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>App Settings</Text>
        <Text style={styles.heroText}>
          Manage the core app preferences that affect search, account navigation, and location usage.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location access</Text>
            <Text style={styles.infoValue}>While using the app</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Photos access</Text>
            <Text style={styles.infoValue}>Profile image upload</Text>
          </View>
          <View style={styles.divider} />
          <Pressable
            style={styles.rowButton}
            onPress={() =>
              Alert.alert(
                'Location usage',
                'Properavista only uses your location while you browse nearby properties or the map. Background location tracking is not used.'
              )
            }
          >
            <Text style={styles.rowButtonText}>Review location usage</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Pressable style={styles.rowButton} onPress={() => router.push('/business-profile' as any)}>
            <Text style={styles.rowButtonText}>Open business profile</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.rowButton} onPress={() => router.push('/my-properties' as any)}>
            <Text style={styles.rowButtonText}>Manage my properties</Text>
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
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.light.subtext,
  },
  rowButton: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowButtonText: {
    fontSize: 15,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
});