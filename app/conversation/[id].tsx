import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, ChevronLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabaseClient } from '@/lib/supabase';

type ConversationMessage = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  delivered_at: string | null;
  read_at: string | null;
  sender_name?: string;
  sender_email?: string;
  property_id?: string;
  source?: 'conversation' | 'legacy'; // Track source table
};

type Conversation = {
  id: string;
  property_id: string;
  user_1_id: string;
  user_2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

const LEGACY_CONVERSATION_PREFIX = 'legacy-';

const parseLegacyConversationId = (threadId: string) => {
  if (!threadId.startsWith(LEGACY_CONVERSATION_PREFIX)) {
    return null;
  }

  const payload = threadId.slice(LEGACY_CONVERSATION_PREFIX.length);
  if (payload.length < 73) {
    return null;
  }

  const propertyId = payload.slice(0, 36);
  const otherUserId = payload.slice(37);

  if (!propertyId || !otherUserId) {
    return null;
  }

  return { propertyId, otherUserId };
};

export default function ConversationScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [conversation, setConversation] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');
  const [otherUserName, setOtherUserName] = React.useState('User');
  const [propertyTitle, setPropertyTitle] = React.useState('');
  const [resolvedConversationId, setResolvedConversationId] = React.useState<string | null>(null);
  const flatListRef = React.useRef<FlatList>(null);
  const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null);

  const markMessagesAsRead = React.useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    const { error } = await supabaseClient
      .from('conversation_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', messageIds);

    if (error?.code === 'PGRST204' && error.message?.includes("'read_at' column")) {
      const { error: fallbackError } = await supabaseClient
        .from('conversation_messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (fallbackError) {
        console.error('Error marking messages as read:', fallbackError);
      }

      return;
    }

    if (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  const setupRealtimeSubscription = React.useCallback(
    (convId: string | null, propertyId: string, otherUserId: string) => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      // Subscribe to new messages in conversation_messages table with ALL events
      const channel1 = convId
        ? supabaseClient
            .channel(`conversation:${convId}`, {
              config: {
                broadcast: { self: true },
              },
            })
            .on(
              'postgres_changes',
              {
                event: '*', // Listen to ALL events: INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'conversation_messages',
                filter: `conversation_id=eq.${convId}`,
              },
              (payload: any) => {
                console.log('Real-time message event:', payload.eventType, payload.new?.id);

                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  const incomingMessage = payload.new as ConversationMessage;
                  incomingMessage.source = 'conversation';
                  incomingMessage.delivered_at = incomingMessage.created_at || null;
                  incomingMessage.read_at = incomingMessage.is_read ? incomingMessage.created_at : null;

                  setMessages((prev) => {
                    // Check if message already exists
                    const messageIndex = prev.findIndex((msg) => msg.id === incomingMessage.id);

                    if (messageIndex >= 0) {
                      // Update existing message
                      const updated = [...prev];
                      updated[messageIndex] = incomingMessage;
                      return updated;
                    }

                    // Add new message
                    const updated = [...prev, incomingMessage];
                    updated.sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    return updated;
                  });

                  // Auto-mark message as read if it's from the other user
                  if (
                    incomingMessage.sender_id !== user?.id &&
                    !incomingMessage.is_read
                  ) {
                    setTimeout(() => {
                      markMessagesAsRead([incomingMessage.id]);
                    }, 300);
                  }

                  // Scroll to bottom to show new message
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }
              }
            )
            .subscribe()
        : null;

      // Also subscribe to old messages table for backward compatibility
      const channel2 = supabaseClient
        .channel(`legacy-messages:${propertyId}:${otherUserId}`, {
          config: {
            broadcast: { self: true },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `property_id=eq.${propertyId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as any;
              const isRelevantMessage =
                (newMessage.sender_id === user?.id &&
                  newMessage.recipient_id === otherUserId) ||
                (newMessage.sender_id === otherUserId &&
                  newMessage.recipient_id === user?.id);

              if (!isRelevantMessage) {
                return;
              }

              const messageObj: ConversationMessage = {
                id: newMessage.id,
                sender_id: newMessage.sender_id,
                message: newMessage.message,
                created_at: newMessage.created_at,
                is_read: newMessage.is_read,
                delivered_at: newMessage.created_at,
                read_at: newMessage.is_read ? newMessage.created_at : null,
                sender_name: newMessage.sender_name,
                sender_email: newMessage.sender_email,
                property_id: newMessage.property_id,
                source: 'legacy',
              };

              setMessages((prev) => {
                const existingMessage = prev.find(
                  (message) => message.id === messageObj.id
                );
                if (existingMessage) {
                  return prev;
                }

                const updated = [...prev, messageObj];
                updated.sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
                return updated;
              });

              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        )
        .subscribe();

      subscriptionRef.current = {
        unsubscribe: () => {
          channel1?.unsubscribe();
          channel2.unsubscribe();
        },
      };
      return subscriptionRef.current;
    },
    [user?.id, markMessagesAsRead]
  );

  const findConversationId = React.useCallback(
    async (propertyId: string, otherUserId: string) => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('property_id', propertyId)
        .or(
          `and(user_1_id.eq.${user.id},user_2_id.eq.${otherUserId}),and(user_1_id.eq.${otherUserId},user_2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (error) {
        console.error('Error resolving conversation:', error);
        return null;
      }

      return data;
    },
    [user?.id]
  );

  const loadConversation = React.useCallback(async () => {
    if (!conversationId || !user?.id) return;

    setIsLoading(true);

    // Check if this is a legacy conversation ID
    const isLegacyId = (conversationId as string).startsWith('legacy-');

    let convData: any = null;
    let otherUserId: string;
    let activeConversationId: string | null = null;

    if (isLegacyId) {
      const legacyConversation = parseLegacyConversationId(conversationId as string);

      if (!legacyConversation) {
        setIsLoading(false);
        return;
      }

      otherUserId = legacyConversation.otherUserId;

      const existingConversation = await findConversationId(
        legacyConversation.propertyId,
        otherUserId
      );

      activeConversationId = existingConversation?.id || null;
      setResolvedConversationId(activeConversationId);

      convData =
        existingConversation || {
          id: conversationId,
          property_id: legacyConversation.propertyId,
          user_1_id: user.id,
          user_2_id: otherUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        };
    } else {
      const { data: newConvData, error: convError } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !newConvData) {
        setIsLoading(false);
        return;
      }

      convData = newConvData;
      activeConversationId = newConvData.id;
      setResolvedConversationId(newConvData.id);
      otherUserId = convData.user_1_id === user.id ? convData.user_2_id : convData.user_1_id;
    }

    setConversation(convData as Conversation);

    // Load property title
    const { data: propData } = await supabaseClient
      .from('properties')
      .select('title')
      .eq('id', convData.property_id)
      .single();

    if (propData) {
      setPropertyTitle(propData.title);
    }

    // Load other user's profile for display name
    const { data: userData } = await supabaseClient
      .from('user_profiles')
      .select('name')
      .eq('id', otherUserId)
      .single();

    if (userData?.name) {
      setOtherUserName(userData.name);
    }

    // Load messages from BOTH tables for complete history
    const allMessages: ConversationMessage[] = [];

    // 1. Load from new conversation_messages table when a canonical conversation exists
    if (activeConversationId) {
      const { data: convMessagesData, error: convError } = await supabaseClient
        .from('conversation_messages')
        .select('id, conversation_id, sender_id, message, is_read, created_at')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (convError) {
        console.error('Error loading conversation messages:', convError);
      }

      if (convMessagesData) {
        const conversationMsgs = (convMessagesData as any[]).map((msg) => ({
          ...msg,
          delivered_at: msg.created_at || null,
          read_at: msg.is_read ? msg.created_at : null,
          source: 'conversation' as const,
        }));
        allMessages.push(...conversationMsgs);
      }
    }

    // 2. Load from legacy messages table for backward compatibility
    const { data: legacyMessagesData, error: legacyError } = await supabaseClient
      .from('messages')
      .select('id, sender_id, recipient_id, message, is_read, created_at, sender_name, sender_email, property_id')
      .eq('property_id', convData.property_id)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (legacyError) {
      console.error('Error loading legacy messages:', legacyError);
    }

    if (legacyMessagesData) {
      const legacyMsgs = (legacyMessagesData as any[])
        .filter(
          (msg) =>
            (msg.sender_id === user.id && msg.recipient_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.recipient_id === user.id)
        )
        .map((msg) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          message: msg.message,
          created_at: msg.created_at,
          is_read: msg.is_read,
          delivered_at: msg.created_at,
          read_at: msg.is_read ? msg.created_at : null,
          sender_name: msg.sender_name,
          sender_email: msg.sender_email,
          property_id: msg.property_id,
          source: 'legacy' as const,
        }));
      allMessages.push(...legacyMsgs);
    }

    // Sort all messages by created_at
    allMessages.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Deduplicate by ID (in case there are any duplicates)
    const uniqueMessages = Array.from(
      new Map(allMessages.map((msg) => [msg.id, msg])).values()
    );

    setMessages(uniqueMessages);

    // Mark unread messages as read for current user (from conversation_messages only)
    if (activeConversationId) {
      const { data: convMessagesData } = await supabaseClient
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', activeConversationId);

      const unreadMessageIds = (convMessagesData as any[])
        ?.filter((msg) => msg.sender_id !== user.id && !msg.is_read)
        ?.map((msg) => msg.id) || [];

      if (unreadMessageIds.length > 0) {
        await markMessagesAsRead(unreadMessageIds);
      }
    }

    // Scroll to bottom after loading
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setupRealtimeSubscription(activeConversationId, convData.property_id, otherUserId);

    setIsLoading(false);
  }, [conversationId, user?.id, markMessagesAsRead, setupRealtimeSubscription, findConversationId]);

  useFocusEffect(
    React.useCallback(() => {
      loadConversation();

      // Cleanup subscription on unmount
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    }, [loadConversation])
  );

  const handleSendReply = async () => {
    if (!conversationId || !user?.id || !replyText.trim()) return;

    setIsSending(true);

    let targetConversationId = resolvedConversationId;

    if (!targetConversationId && conversation?.property_id) {
      const otherUserId = conversation.user_1_id === user.id ? conversation.user_2_id : conversation.user_1_id;
      const existingConversation = await findConversationId(conversation.property_id, otherUserId);

      if (existingConversation?.id) {
        targetConversationId = existingConversation.id;
      } else {
        const { data: newConversation, error: conversationError } = await supabaseClient
          .from('conversations')
          .insert({
            property_id: conversation.property_id,
            user_1_id: user.id,
            user_2_id: otherUserId,
          })
          .select('*')
          .single();

        if (conversationError || !newConversation?.id) {
          setIsSending(false);
          console.error('Failed to create conversation:', conversationError);
          return;
        }

        targetConversationId = newConversation.id;
        setResolvedConversationId(newConversation.id);
        setConversation(newConversation as Conversation);
      }
    }

    if (!targetConversationId) {
      setIsSending(false);
      return;
    }

    const { error } = await supabaseClient.from('conversation_messages').insert({
      conversation_id: targetConversationId,
      sender_id: user.id,
      message: replyText.trim(),
      is_read: false,
    });

    setIsSending(false);

    if (error) {
      console.error('Failed to send reply:', error);
      return;
    }

    setReplyText('');

    if ((conversationId as string).startsWith(LEGACY_CONVERSATION_PREFIX)) {
      await loadConversation();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  if (isLoading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.light.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButtonContainer}>
          <ChevronLeft size={24} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
          <Text style={styles.headerSubtitle}>{propertyTitle}</Text>
        </View>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isSentByMe = item.sender_id === user?.id;
            const showSenderName = !isSentByMe;

            // Determine tick status
            let ticks = '✓'; // Single tick (sent)
            let tickColor = 'rgba(255,255,255,0.6)';
            
            if (item.read_at) {
              ticks = '✓✓'; // Double tick in blue (read)
              tickColor = Colors.light.primary;
            } else if (item.delivered_at) {
              ticks = '✓✓'; // Double tick (delivered)
              tickColor = 'rgba(255,255,255,0.6)';
            }

            return (
              <View
                style={[
                  styles.messageRow,
                  isSentByMe ? styles.sentMessageRow : styles.receivedMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isSentByMe ? styles.sentBubble : styles.receivedBubble,
                  ]}
                >
                  {showSenderName && (
                    <Text style={styles.senderName}>{otherUserName}</Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      isSentByMe ? styles.sentText : styles.receivedText,
                    ]}
                  >
                    {item.message}
                  </Text>
                  <View style={styles.messageFooter}>
                    <Text
                      style={[
                        styles.messageTime,
                        isSentByMe ? styles.sentTime : styles.receivedTime,
                      ]}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                    {isSentByMe && (
                      <Text style={[styles.messageTick, { color: tickColor }]}>
                        {ticks}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Input Area - Fixed above keyboard */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type message..."
            placeholderTextColor={Colors.light.subtext}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendButton, (isSending || !replyText.trim()) && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={isSending || !replyText.trim()}
          >
            <Send
              size={22}
              color={replyText.trim() ? Colors.light.primary : Colors.light.subtext}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButtonContainer: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
    display: 'flex',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 8,
  },
  messageRow: {
    marginVertical: 4,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  sentMessageRow: {
    alignItems: 'flex-end',
  },
  receivedMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sentBubble: {
    backgroundColor: Colors.light.primary,
  },
  receivedBubble: {
    backgroundColor: '#e5e5ea',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.subtext,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: 'white',
  },
  receivedText: {
    color: Colors.light.text,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  sentTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  receivedTime: {
    color: '#999',
  },
  messageTick: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  inputArea: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
