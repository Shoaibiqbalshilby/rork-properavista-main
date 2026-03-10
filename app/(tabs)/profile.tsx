import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { 
  User, 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Home,
  Heart,
  MessageCircle,
  Shield,
  Building2
} from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';
import { uploadImageToBucket } from '@/lib/storage';
import { supabaseClient } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  
  const handleLogin = () => {
    router.push('/login' as any);
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => {
            logout();
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleAvatarUpload = async () => {
    if (!user) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploadingAvatar(true);
      const uploadedUrl = await uploadImageToBucket(result.assets[0].uri, 'avatar-images', user.id);

      const { error } = await supabaseClient
        .from('user_profiles')
        .update({ avatar_url: uploadedUrl })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Upload Failed', error.message);
        return;
      }

      updateProfile({ avatar: uploadedUrl });
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (error) {
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unable to upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const accountMenuItems = [
    { icon: <Home size={22} color={Colors.light.text} />, title: 'My Properties', route: '/my-properties' },
    { icon: <Heart size={22} color={Colors.light.text} />, title: 'Saved Properties', route: '/favorites' },
    { icon: <MessageCircle size={22} color={Colors.light.text} />, title: 'Messages', route: '/messages', badge: 3 },
  ];
  
  const settingsMenuItems = [
    { icon: <Building2 size={22} color={Colors.light.text} />, title: 'Business Profile', route: '/business-profile' },
    { icon: <Settings size={22} color={Colors.light.text} />, title: 'Settings', route: '/settings' },
    { icon: <Bell size={22} color={Colors.light.text} />, title: 'Notifications', route: '/notifications' },
    { icon: <Shield size={22} color={Colors.light.text} />, title: 'Privacy & Security', route: '/privacy' },
    { icon: <HelpCircle size={22} color={Colors.light.text} />, title: 'Help & Support', route: '/help' },
    { icon: <LogOut size={22} color={Colors.light.error} />, title: 'Log Out', onPress: handleLogout, isDestructive: true },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.profileImageContainer}
          onPress={isAuthenticated ? handleAvatarUpload : undefined}
          disabled={uploadingAvatar}
        >
          {isAuthenticated && user ? (
            <Image
              source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
              style={styles.profileImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <User size={40} color={Colors.light.primary} />
            </View>
          )}
          {uploadingAvatar ? (
            <View style={styles.avatarLoadingOverlay}>
              <ActivityIndicator color="white" />
            </View>
          ) : null}
        </Pressable>
        
        {isAuthenticated && user ? (
          <>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.phone ? <Text style={styles.metaText}>Phone: {user.phone}</Text> : null}
            {user.whatsapp ? <Text style={styles.metaText}>WhatsApp: {user.whatsapp}</Text> : null}
            <Text style={styles.avatarHint}>Tap profile picture to change</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Properties</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.id === '1' ? '5' : '0'}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.id === '1' ? '3' : '0'}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>Guest User</Text>
            <Text style={styles.email}>Sign in to access your profile</Text>
            
            <View style={styles.buttonContainer}>
              <Pressable style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign In</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
      
      {isAuthenticated && (
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            {accountMenuItems.map((item, index) => (
              <Pressable 
                key={index} 
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuItemLeft}>
                  {item.icon}
                  <Text style={styles.menuItemText}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={20} color={Colors.light.subtext} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Settings</Text>
        <View style={styles.menuContainer}>
          {settingsMenuItems.map((item, index) => {
            // Skip logout if not authenticated
            if (item.title === 'Log Out' && !isAuthenticated) return null;
            
            return (
              <Pressable 
                key={index} 
                style={styles.menuItem}
                onPress={item.onPress || (() => router.push(item.route as any))}
              >
                <View style={styles.menuItemLeft}>
                  {item.icon}
                  <Text 
                    style={[
                      styles.menuItemText,
                      item.isDestructive && styles.destructiveText
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.light.subtext} />
              </Pressable>
            );
          })}
        </View>
      </View>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(110, 158, 207, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.subtext,
    marginBottom: 2,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.light.border,
  },
  buttonContainer: {
    width: '60%',
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 24,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  menuContainer: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  badge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  destructiveText: {
    color: Colors.light.error,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
    fontSize: 12,
    color: Colors.light.subtext,
  },
});