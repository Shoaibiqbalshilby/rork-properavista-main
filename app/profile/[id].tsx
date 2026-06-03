import React from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, MapPin, MessageCircle, Phone, Share2, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabaseClient } from '@/lib/supabase';
import { normalizePhone, whatsappUrl } from '@/utils/contact';
import { shareProfileNative, shareProfileToWhatsApp } from '@/utils/profile-share';
import type { ShareableProfile } from '@/utils/profile-share';

type PublicProfile = ShareableProfile;

type UserProfileRow = {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  company_name: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
};

type BusinessProfileRow = {
  company_name: string | null;
  description: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
};

export default function SharedProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = React.useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSharing, setIsSharing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!id) {
        setIsLoading(false);
        setErrorMessage('This profile link is missing a user ID.');
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const [{ data: userRow, error: userError }, { data: businessRow, error: businessError }] = await Promise.all([
        supabaseClient
          .from('user_profiles')
          .select('name, email, avatar_url, company_name, description, phone, whatsapp, address')
          .eq('id', id)
          .maybeSingle<UserProfileRow>(),
        supabaseClient
          .from('business_profiles')
          .select('company_name, description, contact_phone, whatsapp_number, address')
          .eq('user_id', id)
          .maybeSingle<BusinessProfileRow>(),
      ]);

      if (cancelled) return;

      const businessTableMissing = businessError?.message?.includes('Could not find the table');
      const hasUnexpectedError = userError || (!businessTableMissing && businessError);

      if (hasUnexpectedError) {
        setErrorMessage(userError?.message || businessError?.message || 'Unable to load this profile.');
        setProfile(null);
        setIsLoading(false);
        return;
      }

      if (!userRow && !businessRow) {
        setErrorMessage('This Properavista profile could not be found.');
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const mergedProfile: PublicProfile = {
        id,
        name: userRow?.name || 'Properavista User',
        email: userRow?.email || '',
        avatar: userRow?.avatar_url || undefined,
        companyName: businessRow?.company_name || userRow?.company_name || undefined,
        description: businessRow?.description || userRow?.description || undefined,
        phone: businessRow?.contact_phone || userRow?.phone || undefined,
        whatsapp: businessRow?.whatsapp_number || userRow?.whatsapp || undefined,
        address: businessRow?.address || userRow?.address || undefined,
      };

      setProfile(mergedProfile);
      setIsLoading(false);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const runShareAction = async (shareAction: () => Promise<void>) => {
    if (!profile || isSharing) return;

    setIsSharing(true);
    try {
      await shareAction();
    } catch (error) {
      Alert.alert('Share Failed', error instanceof Error ? error.message : 'Unable to share this profile.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCall = () => {
    const phone = normalizePhone(profile?.phone);
    if (!phone) {
      Alert.alert('Phone not available', 'This profile has not added a phone number yet.');
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const url = whatsappUrl(profile?.whatsapp || profile?.phone, 'Hi, I found your profile on Properavista.');
    if (!url) {
      Alert.alert('WhatsApp not available', 'This profile has not added a WhatsApp number yet.');
      return;
    }

    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Profile' }} />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.light.primary} />
          <Text style={styles.centerText}>Loading profile...</Text>
        </View>
      ) : errorMessage || !profile ? (
        <View style={styles.centerState}>
          <User size={42} color={Colors.light.subtext} />
          <Text style={styles.errorTitle}>Profile unavailable</Text>
          <Text style={styles.centerText}>{errorMessage}</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/' as any)}>
            <Text style={styles.primaryButtonText}>Go Home</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={44} color={Colors.light.primary} />
              </View>
            )}

            <Text style={styles.name}>{profile.companyName || profile.name}</Text>
            {profile.companyName ? <Text style={styles.subtitle}>{profile.name}</Text> : null}
            {profile.description ? <Text style={styles.description}>{profile.description}</Text> : null}
          </View>

          <View style={styles.details}>
            {profile.companyName ? (
              <View style={styles.detailRow}>
                <Building2 size={20} color={Colors.light.primary} />
                <Text style={styles.detailText}>{profile.companyName}</Text>
              </View>
            ) : null}
            {profile.phone ? (
              <View style={styles.detailRow}>
                <Phone size={20} color={Colors.light.primary} />
                <Text style={styles.detailText}>{profile.phone}</Text>
              </View>
            ) : null}
            {profile.whatsapp ? (
              <View style={styles.detailRow}>
                <MessageCircle size={20} color={Colors.light.primary} />
                <Text style={styles.detailText}>{profile.whatsapp}</Text>
              </View>
            ) : null}
            {profile.address ? (
              <View style={styles.detailRow}>
                <MapPin size={20} color={Colors.light.primary} />
                <Text style={styles.detailText}>{profile.address}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={handleCall}>
              <Phone size={18} color="white" />
              <Text style={styles.primaryButtonText}>Call</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleWhatsApp}>
              <MessageCircle size={18} color={Colors.light.primary} />
              <Text style={styles.secondaryButtonText}>WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, isSharing && styles.disabledButton]}
              onPress={() => void runShareAction(() => shareProfileNative(profile))}
              disabled={isSharing}
            >
              {isSharing ? <ActivityIndicator color={Colors.light.primary} /> : <Share2 size={18} color={Colors.light.primary} />}
              <Text style={styles.secondaryButtonText}>Share</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.whatsappShareButton, isSharing && styles.disabledButton]}
            onPress={() => void runShareAction(() => shareProfileToWhatsApp(profile))}
            disabled={isSharing}
          >
            <MessageCircle size={18} color="white" />
            <Text style={styles.primaryButtonText}>Share to WhatsApp</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    maxWidth: 280,
    textAlign: 'center',
    color: Colors.light.subtext,
    fontSize: 15,
    lineHeight: 22,
  },
  errorTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(110, 158, 207, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.light.subtext,
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
  description: {
    color: Colors.light.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
  details: {
    paddingVertical: 20,
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.background,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  whatsappShareButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.success,
  },
  disabledButton: {
    opacity: 0.75,
  },
});
