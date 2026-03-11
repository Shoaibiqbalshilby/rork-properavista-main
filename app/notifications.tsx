import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Colors from '@/constants/colors';

export default function NotificationsScreen() {
  const [savedSearchAlerts, setSavedSearchAlerts] = React.useState(true);
  const [nearbyListingAlerts, setNearbyListingAlerts] = React.useState(true);
  const [accountUpdates, setAccountUpdates] = React.useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Notifications</Text>
        <Text style={styles.heroText}>
          Choose which in-app alerts you want to see while using Properavista.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Saved search alerts</Text>
            <Text style={styles.toggleText}>Updates when matching listings appear.</Text>
          </View>
          <Switch
            value={savedSearchAlerts}
            onValueChange={setSavedSearchAlerts}
            trackColor={{ false: '#D6DCE3', true: '#B6CDE6' }}
            thumbColor={savedSearchAlerts ? Colors.light.primary : '#FFFFFF'}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Nearby listings</Text>
            <Text style={styles.toggleText}>Suggestions based on your current search area.</Text>
          </View>
          <Switch
            value={nearbyListingAlerts}
            onValueChange={setNearbyListingAlerts}
            trackColor={{ false: '#D6DCE3', true: '#B6CDE6' }}
            thumbColor={nearbyListingAlerts ? Colors.light.primary : '#FFFFFF'}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Account updates</Text>
            <Text style={styles.toggleText}>Important changes to profile and listing activity.</Text>
          </View>
          <Switch
            value={accountUpdates}
            onValueChange={setAccountUpdates}
            trackColor={{ false: '#D6DCE3', true: '#B6CDE6' }}
            thumbColor={accountUpdates ? Colors.light.primary : '#FFFFFF'}
          />
        </View>
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={() => Alert.alert('Preferences saved', 'Your notification preferences were updated for this device.')}
      >
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </Pressable>
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
  toggleRow: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  toggleText: {
    fontSize: 13,
    color: Colors.light.subtext,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});