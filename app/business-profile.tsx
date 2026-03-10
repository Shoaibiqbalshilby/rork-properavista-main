import React from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';
import { supabaseClient } from '@/lib/supabase';

export default function BusinessProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [companyName, setCompanyName] = React.useState(user?.companyName || '');
  const [description, setDescription] = React.useState(user?.description || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = React.useState(user?.whatsapp || '');
  const [address, setAddress] = React.useState(user?.address || '');

  React.useEffect(() => {
    setCompanyName(user?.companyName || '');
    setDescription(user?.description || '');
    setPhone(user?.phone || '');
    setWhatsapp(user?.whatsapp || '');
    setAddress(user?.address || '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in first.');
      return;
    }

    const { error } = await supabaseClient
      .from('user_profiles')
      .update({
        company_name: companyName || null,
        description: description || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        address: address || null,
      })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    updateProfile({
      companyName,
      description,
      phone,
      whatsapp,
      address,
    });

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

        <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
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
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});
