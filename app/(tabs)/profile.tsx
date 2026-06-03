import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
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
  Building2,
  Share2,
  Instagram,
  MoreHorizontal,
  X
} from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';
import { uploadImageToBucket } from '@/lib/storage';
import { supabaseClient } from '@/lib/supabase';
import { shareProfileNative, shareProfileToInstagram, shareProfileToWhatsApp } from '@/utils/profile-share';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [sharingProfile, setSharingProfile] = React.useState(false);
  const [showShareSheet, setShowShareSheet] = React.useState(false);
  
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

  const runShareAction = async (shareAction: () => Promise<void>) => {
    if (!user || sharingProfile) return;

    setShowShareSheet(false);
    setSharingProfile(true);
    try {
      await shareAction();
    } catch (error) {
      Alert.alert(
        'Share Failed',
        error instanceof Error ? error.message : 'Unable to share this profile right now.'
      );
    } finally {
      setSharingProfile(false);
    }
  };

  const handleShareProfile = () => {
    if (!user) return;

    setShowShareSheet(true);
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
    <>
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

            <Pressable
              style={[styles.shareButton, sharingProfile && styles.shareButtonDisabled]}
              onPress={handleShareProfile}
              disabled={sharingProfile}
            >
              {sharingProfile ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Share2 size={18} color="white" />
                  <Text style={styles.shareButtonText}>Share Profile</Text>
                </>
              )}
            </Pressable>

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

    <Modal
      visible={showShareSheet}
      transparent
      animationType="fade"
      onRequestClose={() => setShowShareSheet(false)}
    >
      <View style={styles.shareSheetOverlay}>
        <Pressable style={styles.shareSheetBackdrop} onPress={() => setShowShareSheet(false)} />
        <View style={styles.shareSheet}>
          <View style={styles.shareSheetHandle} />
          <View style={styles.shareSheetHeader}>
            <View>
              <Text style={styles.shareSheetTitle}>Share Profile</Text>
              <Text style={styles.shareSheetSubtitle}>Send your Properavista profile</Text>
            </View>
            <Pressable
              style={styles.shareSheetCloseButton}
              onPress={() => setShowShareSheet(false)}
            >
              <X size={20} color={Colors.light.subtext} />
            </Pressable>
          </View>

          <View style={styles.shareOptions}>
            <Pressable
              style={styles.shareOption}
              onPress={() => user && void runShareAction(() => shareProfileToWhatsApp(user))}
              disabled={sharingProfile}
            >
              <View style={[styles.shareOptionIcon, styles.whatsappOptionIcon]}>
                <MessageCircle size={24} color="white" />
              </View>
              <Text style={styles.shareOptionTitle}>WhatsApp</Text>
            </Pressable>

            <Pressable
              style={styles.shareOption}
              onPress={() => user && void runShareAction(() => shareProfileToInstagram(user))}
              disabled={sharingProfile}
            >
              <View style={[styles.shareOptionIcon, styles.instagramOptionIcon]}>
                <Instagram size={24} color="white" />
              </View>
              <Text style={styles.shareOptionTitle}>Instagram</Text>
            </Pressable>

            <Pressable
              style={styles.shareOption}
              onPress={() => user && void runShareAction(() => shareProfileNative(user))}
              disabled={sharingProfile}
            >
              <View style={[styles.shareOptionIcon, styles.moreOptionIcon]}>
                <MoreHorizontal size={24} color="white" />
              </View>
              <Text style={styles.shareOptionTitle}>More</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 150,
    minHeight: 44,
    marginTop: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  shareButtonDisabled: {
    opacity: 0.75,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
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
  shareSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 42, 55, 0.42)',
  },
  shareSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 18,
  },
  shareSheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  shareSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shareSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  shareSheetSubtitle: {
    fontSize: 13,
    color: Colors.light.subtext,
    marginTop: 4,
  },
  shareSheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shareOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareOption: {
    flex: 1,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 8,
  },
  shareOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  whatsappOptionIcon: {
    backgroundColor: Colors.light.success,
  },
  instagramOptionIcon: {
    backgroundColor: Colors.light.secondary,
  },
  moreOptionIcon: {
    backgroundColor: Colors.light.primary,
  },
  shareOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
});
