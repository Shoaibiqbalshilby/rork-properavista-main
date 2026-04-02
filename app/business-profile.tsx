import React from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';
import { supabaseClient } from '@/lib/supabase';

// Mirrors the website: website saves to business_profiles table (user_id, company_name,
// description, contact_phone, whatsapp_number, address). When that table is missing
// the website falls back to Supabase auth user_metadata.business_profile with the
// same keys. This mobile screen uses the same priority order so both platforms
// always read and write the same single record.

interface BusinessProfileRow {
  company_name: string | null;
  description: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
}

interface MetaBP {
  company_name?: string;
  description?: string;
  contact_phone?: string;
  whatsapp_number?: string;
  address?: string;
}

export default function BusinessProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [address, setAddress] = React.useState('');

  // Apply a loaded row to form state + auth store
  const applyProfile = React.useCallback((row: BusinessProfileRow) => {
    const cn = row.company_name ?? '';
    const desc = row.description ?? '';
    const ph = row.contact_phone ?? '';
    const wa = row.whatsapp_number ?? '';
    const addr = row.address ?? '';
    setCompanyName(cn);
    setDescription(desc);
    setPhone(ph);
    setWhatsapp(wa);
    setAddress(addr);
    updateProfile({ companyName: cn, description: desc, phone: ph, whatsapp: wa, address: addr });
  }, [updateProfile]);

  const loadBusinessProfile = React.useCallback(async () => {
    const { data: authData } = await supabaseClient.auth.getUser();
    const authUser = authData?.user;
    const authUserId = authUser?.id ?? user?.id;
    if (!authUserId) return;

    setIsLoadingProfile(true);

    // 1. Try the shared business_profiles table (same as website primary path)
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .select('company_name, description, contact_phone, whatsapp_number, address')
      .eq('user_id', authUserId)
      .maybeSingle<BusinessProfileRow>();

    const tableMissing = error?.message?.includes("Could not find the table");

    if (!tableMissing && !error && data) {
      // Found row in business_profiles → display it
      applyProfile(data);
      setIsLoadingProfile(false);
      return;
    }

    if (!tableMissing && error) {
      setIsLoadingProfile(false);
      Alert.alert('Error loading profile', error.message);
      return;
    }

    // 2. Table missing OR no row yet → read from auth metadata (same fallback as website)
    const meta = (authUser?.user_metadata?.business_profile ?? null) as MetaBP | null;
    if (meta) {
      applyProfile({
        company_name: meta.company_name ?? null,
        description: meta.description ?? null,
        contact_phone: meta.contact_phone ?? null,
        whatsapp_number: meta.whatsapp_number ?? null,
        address: meta.address ?? null,
      });
    }

    setIsLoadingProfile(false);
  }, [user?.id, applyProfile]);

  useFocusEffect(
    React.useCallback(() => {
      loadBusinessProfile();
    }, [loadBusinessProfile])
  );

  const handleSaveProfile = async () => {
    const { data: authData } = await supabaseClient.auth.getUser();
    const authUser = authData?.user;
    const authUserId = authUser?.id ?? user?.id;

    if (!authUserId) {
      Alert.alert('Sign In Required', 'Please sign in first.');
      return;
    }

    setIsSaving(true);

    const payload = {
      user_id: authUserId,
      company_name: companyName.trim() || null,
      description: description.trim() || null,
      contact_phone: phone.trim() || null,
      whatsapp_number: whatsapp.trim() || null,
      address: address.trim() || null,
    };

    // 1. Try saving to business_profiles (same as website primary path)
    const { error } = await supabaseClient
      .from('business_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    const tableMissing = error?.message?.includes("Could not find the table");

    if (tableMissing) {
      // 2. Table missing → save to auth metadata (same fallback as website)
      const metaPayload: MetaBP = {
        company_name: companyName.trim(),
        description: description.trim(),
        contact_phone: phone.trim(),
        whatsapp_number: whatsapp.trim(),
        address: address.trim(),
      };

      const { error: metaError } = await supabaseClient.auth.updateUser({
        data: {
          ...(authUser?.user_metadata ?? {}),
          business_profile: metaPayload,
        },
      });

      setIsSaving(false);

      if (metaError) {
        Alert.alert('Error saving profile', metaError.message);
        return;
      }

      // Reload so form shows confirmed values
      await loadBusinessProfile();
      Alert.alert('Saved', 'Business profile updated successfully.');
      return;
    }

    setIsSaving(false);

    if (error) {
      Alert.alert('Error saving profile', error.message);
      return;
    }

    await loadBusinessProfile();
    Alert.alert('Saved', 'Business profile updated successfully.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter company name"
            placeholderTextColor={Colors.light.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell clients about your company"
            placeholderTextColor={Colors.light.subtext}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +2348012345678"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>WhatsApp Number</Text>
          <TextInput
            style={styles.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="e.g. +2348012345678"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Company address"
            placeholderTextColor={Colors.light.subtext}
          />
        </View>

        <Pressable
          style={[styles.saveButton, (isSaving || isLoadingProfile) && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving || isLoadingProfile}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : isLoadingProfile ? 'Refreshing...' : 'Save Profile'}
          </Text>
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
    paddingBottom: 28,
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});
