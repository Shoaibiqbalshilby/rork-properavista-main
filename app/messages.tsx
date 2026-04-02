import React from 'react';
import { Pressable, StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabaseClient } from '@/lib/supabase';

type InboxMessage = {
  id: string;
  message: string;
  property_title: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  created_at: string;
  is_read: boolean;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadMessages = React.useCallback(async () => {
    if (!isAuthenticated) {
      setMessages([]);
      return;
    }

    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    const ownerId = authData.user?.id || user?.id;

    if (authError || !ownerId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabaseClient
      .from('messages')
      .select('id, message, property_title, sender_name, sender_email, sender_phone, created_at, is_read')
      .eq('recipient_id', ownerId)
      .order('created_at', { ascending: false });
    setIsLoading(false);

    if (error) {
      setMessages([]);
      return;
    }

    setMessages((data || []) as InboxMessage[]);
  }, [isAuthenticated, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isAuthenticated ? 'Messages Inbox' : 'Sign in to view messages'}</Text>
        {!isAuthenticated ? (
          <Text style={styles.text}>
            Create or sign in to an account to manage listing conversations from one place.
          </Text>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.light.primary} />
            <Text style={styles.text}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <Text style={styles.text}>No inbox messages yet.</Text>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.messageCard}>
                <Text style={styles.messageProperty}>{item.property_title}</Text>
                <Text style={styles.messageMeta}>From: {item.sender_name}</Text>
                <Text style={styles.messageMeta}>Email: {item.sender_email}</Text>
                {item.sender_phone ? <Text style={styles.messageMeta}>Phone: {item.sender_phone}</Text> : null}
                <Text style={styles.messageBody} numberOfLines={6}>{item.message}</Text>
                <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            )}
          />
        )}

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push((isAuthenticated ? '/my-properties' : '/login') as any)}
        >
          <Text style={styles.primaryButtonText}>{isAuthenticated ? 'Open My Properties' : 'Sign In'}</Text>
        </Pressable>

        {isAuthenticated ? (
          <Pressable style={styles.secondaryButton} onPress={loadMessages}>
            <Text style={styles.secondaryButtonText}>Refresh Inbox</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/favorites' as any)}>
            <Text style={styles.secondaryButtonText}>Go to Favorites</Text>
          </Pressable>
        )}
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
  loadingContainer: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  listContent: {
    gap: 10,
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 12,
  },
  messageProperty: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  messageMeta: {
    color: Colors.light.subtext,
    fontSize: 13,
    marginBottom: 3,
  },
  messageBody: {
    color: Colors.light.text,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  messageTime: {
    color: Colors.light.subtext,
    fontSize: 12,
    marginTop: 8,
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