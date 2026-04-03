import React from 'react';
import { Pressable, StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageCircle, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabaseClient } from '@/lib/supabase';

type ConversationThread = {
  id: string;
  property_id: string;
  property_title: string;
  user_1_id: string;
  user_2_id: string;
  other_user_name: string;
  other_user_email: string;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  unread_count: number;
};

const LEGACY_CONVERSATION_PREFIX = 'legacy-';

const buildLegacyConversationId = (propertyId: string, otherUserId: string) =>
  `${LEGACY_CONVERSATION_PREFIX}${propertyId}-${otherUserId}`;

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [conversations, setConversations] = React.useState<ConversationThread[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null);
  const loadDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = React.useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }

    const { data: authData } = await supabaseClient.auth.getUser();
    const userId = authData.user?.id || user?.id;

    if (!userId) {
      console.warn('No user ID found');
      setConversations([]);
      return;
    }

    // Don't show loading state if we already have conversations (preserve UI during updates)
    const shouldShowLoading = conversations.length === 0;
    if (shouldShowLoading) {
      setIsLoading(true);
    }

    const allConversations: ConversationThread[] = [];

    try {
      // 1. Load NEW conversations from conversations table
      const { data: convData, error: convError } = await supabaseClient
        .from('conversations')
        .select('*')
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('Error loading conversations:', convError);
      }

      if (convData && convData.length > 0) {
        console.log(`Found ${convData.length} new conversations`);
        
        const enriched = await Promise.all(
          (convData as any[]).map(async (conv) => {
            const otherUserId = conv.user_1_id === userId ? conv.user_2_id : conv.user_1_id;

            const [propertyResult, userResult, unreadResult, lastMessageResult] = await Promise.all([
              supabaseClient
                .from('properties')
                .select('title')
                .eq('id', conv.property_id)
                .maybeSingle(),
              supabaseClient
                .from('user_profiles')
                .select('name, email')
                .eq('id', otherUserId)
                .maybeSingle(),
              supabaseClient
                .from('conversation_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('sender_id', otherUserId)
                .eq('is_read', false),
              supabaseClient
                .from('conversation_messages')
                .select('message, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            ]);

            if (propertyResult.error) {
              console.error('Error loading conversation property:', propertyResult.error);
            }

            if (userResult.error) {
              console.error('Error loading conversation user:', userResult.error);
            }

            if (unreadResult.error) {
              console.error('Error loading unread count:', unreadResult.error);
            }

            if (lastMessageResult.error) {
              console.error('Error loading last message preview:', lastMessageResult.error);
            }

            return {
              ...conv,
              property_title: propertyResult.data?.title || 'Property',
              other_user_name: userResult.data?.name || 'User',
              other_user_email: userResult.data?.email || '',
              last_message_preview: lastMessageResult.data?.message?.trim() || 'No messages yet',
              unread_count: unreadResult.count || 0,
            };
          })
        );

        allConversations.push(...enriched);
      }

      // 2. Load LEGACY messages from messages table (only if no new conversations or to fill gaps)
      const { data: legacyMessages, error: legacyError } = await supabaseClient
        .from('messages')
        .select('*')
        .or(`recipient_id.eq.${userId},sender_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (legacyError) {
        console.error('Error loading legacy messages:', legacyError);
      }

      if (legacyMessages && legacyMessages.length > 0) {
        console.log(`Found ${legacyMessages.length} legacy messages`);
        
        const legacyMessageMap = new Map<string, any[]>();

        (legacyMessages as any[]).forEach((msg) => {
          const otherUserId = msg.recipient_id === userId ? msg.sender_id : msg.recipient_id;
          const key = `${msg.property_id}-${[userId, otherUserId].sort().join('-')}`;
          
          if (!legacyMessageMap.has(key)) {
            legacyMessageMap.set(key, []);
          }
          legacyMessageMap.get(key)!.push(msg);
        });

        // Create conversation threads from legacy messages
        for (const [key, msgs] of legacyMessageMap.entries()) {
          const firstMsg = msgs[0];
          const otherUserId = firstMsg.recipient_id === userId ? firstMsg.sender_id : firstMsg.recipient_id;

          // Skip if already in new conversations table
          const existingConv = allConversations.find(
            (c) =>
              c.property_id === firstMsg.property_id &&
              ((c.user_1_id === userId && c.user_2_id === otherUserId) ||
                (c.user_1_id === otherUserId && c.user_2_id === userId))
          );

          if (!existingConv) {
            const { data: userData, error: userError } = await supabaseClient
              .from('user_profiles')
              .select('name, email')
              .eq('id', otherUserId)
              .maybeSingle();

            if (userError) {
              console.error('Error loading legacy conversation user:', userError);
            }

            const unreadCount = (msgs as any[]).filter(
              (m) => m.recipient_id === userId && !m.is_read
            ).length;

            const latestMsg = (msgs as any[]).reduce((latest, current) =>
              new Date(current.created_at).getTime() > new Date(latest.created_at).getTime()
                ? current
                : latest
            );
            const oldestMsg = (msgs as any[]).reduce((oldest, current) =>
              new Date(current.created_at).getTime() < new Date(oldest.created_at).getTime()
                ? current
                : oldest
            );

            allConversations.push({
              id: buildLegacyConversationId(firstMsg.property_id, otherUserId),
              property_id: firstMsg.property_id,
              property_title: firstMsg.property_title || 'Property',
              user_1_id: userId,
              user_2_id: otherUserId,
              other_user_name: userData?.name || firstMsg.sender_name || 'User',
              other_user_email: userData?.email || firstMsg.sender_email || '',
              last_message_preview: latestMsg.message?.trim() || 'No messages yet',
              created_at: oldestMsg.created_at,
              updated_at: latestMsg.created_at,
              last_message_at: latestMsg.created_at,
              unread_count: unreadCount,
            });
          }
        }
      }

      // Sort by last_message_at
      allConversations.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      console.log(`Total conversations loaded: ${allConversations.length}`);
      setConversations(allConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      // Preserve existing conversations on error instead of clearing
      if (conversations.length === 0) {
        setConversations([]);
      }
    } finally {
      if (shouldShowLoading) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user?.id, conversations.length]);

  useFocusEffect(
    React.useCallback(() => {
      // Clear any pending debounces when screen comes into focus
      if (loadDebounceRef.current) {
        clearTimeout(loadDebounceRef.current);
      }

      loadConversations();

      // Set up real-time subscriptions for persistent updates
      const userId = user?.id;
      if (userId) {
        const channels: ReturnType<typeof supabaseClient.channel>[] = [];

        // Debounced refresh function to avoid excessive reloads
        const debouncedRefresh = () => {
          if (loadDebounceRef.current) {
            clearTimeout(loadDebounceRef.current);
          }
          loadDebounceRef.current = setTimeout(() => {
            console.log('Debounced refresh triggered');
            loadConversations();
          }, 500);
        };

        // Subscribe to conversations table changes  
        const conversationChannel = supabaseClient
          .channel(`conversations:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversations',
              filter: `or(user_1_id=eq.${userId},user_2_id=eq.${userId})`,
            },
            (payload: any) => {
              console.log('Conversation update:', payload.eventType, payload.new?.id);
              debouncedRefresh();
            }
          )
          .subscribe();

        channels.push(conversationChannel);

        // Subscribe to new conversation_messages
        const convMessagesChannel = supabaseClient
          .channel(`conv_messages:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'conversation_messages',
            },
            (payload: any) => {
              console.log('New conversation message:', payload.new?.conversation_id);
              debouncedRefresh();
            }
          )
          .subscribe();

        channels.push(convMessagesChannel);

        // Subscribe to legacy messages
        const legacyMessagesChannel = supabaseClient
          .channel(`legacy_messages:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `or(recipient_id=eq.${userId},sender_id=eq.${userId})`,
            },
            (payload: any) => {
              console.log('New legacy message:', payload.new?.id);
              debouncedRefresh();
            }
          )
          .subscribe();

        channels.push(legacyMessagesChannel);

        subscriptionRef.current = {
          unsubscribe: () => {
            channels.forEach((ch) => ch.unsubscribe());
            if (loadDebounceRef.current) {
              clearTimeout(loadDebounceRef.current);
            }
          },
        };
      }

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    }, [loadConversations, user?.id])
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 365) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {isAuthenticated && (
          <Pressable style={styles.refreshButton} onPress={loadConversations} disabled={isLoading}>
            <RefreshCw
              size={20}
              color={Colors.light.primary}
              strokeWidth={isLoading ? 1 : 2}
            />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!isAuthenticated ? (
          <View style={styles.emptyState}>
            <MessageCircle size={56} color={Colors.light.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Sign in to chat</Text>
            <Text style={styles.emptyText}>
              Create or sign in to an account to manage listing conversations.
            </Text>
            <Pressable style={styles.signInButton} onPress={() => router.push('/login' as any)}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
          </View>
        ) : isLoading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.light.primary} size="large" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={56} color={Colors.light.border} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              When someone sends you a message about your property, it will appear here.
            </Text>
            <Pressable style={styles.myPropertiesButton} onPress={() => router.push("/my-properties" as any)}>
              <Text style={styles.myPropertiesButtonText}>View My Properties</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            renderItem={({ item }) => (
              <Pressable
                style={styles.conversationCard}
                onPress={() => router.push(`/conversation/${item.id}` as any)}
              >
                {/* Avatar Placeholder */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.other_user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Conversation Info */}
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{item.other_user_name}</Text>
                    <Text style={styles.conversationTime}>{formatTime(item.last_message_at)}</Text>
                  </View>
                  <Text style={styles.conversationProperty}>{item.property_title}</Text>
                  <Text style={styles.conversationPreview} numberOfLines={2}>
                    {item.last_message_preview}
                  </Text>
                  <Text style={styles.conversationEmail} numberOfLines={1}>
                    {item.other_user_email}
                  </Text>
                </View>

                {/* Unread Badge */}
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread_count}</Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 20,
  },
  signInButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  myPropertiesButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 20,
  },
  myPropertiesButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  conversationCard: {
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    marginRight: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  conversationTime: {
    color: Colors.light.subtext,
    fontSize: 12,
    marginLeft: 8,
  },
  conversationProperty: {
    color: Colors.light.text,
    fontSize: 13,
    marginBottom: 2,
  },
  conversationPreview: {
    color: Colors.light.subtext,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  conversationEmail: {
    color: Colors.light.subtext,
    fontSize: 12,
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 11,
  },
});