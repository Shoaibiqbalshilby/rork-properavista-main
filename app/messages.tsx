import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function MessagesScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isAuthenticated ? 'No messages yet' : 'Sign in to view messages'}</Text>
        <Text style={styles.text}>
          {isAuthenticated
            ? 'Your conversations with buyers and agents will appear here once messaging is enabled.'
            : 'Create or sign in to an account to manage listing conversations from one place.'}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push((isAuthenticated ? '/my-properties' : '/login') as any)}
        >
          <Text style={styles.primaryButtonText}>{isAuthenticated ? 'Open My Properties' : 'Sign In'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/favorites' as any)}>
          <Text style={styles.secondaryButtonText}>Go to Favorites</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 18,
    padding: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600',
  },
});