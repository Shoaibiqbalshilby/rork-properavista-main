import { Linking, Platform, Share } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import type { User } from '@/hooks/useAuthStore';

export type ShareableProfile = Pick<User, 'id' | 'name' | 'email' | 'companyName' | 'description' | 'phone' | 'whatsapp' | 'address' | 'avatar'>;

export const buildProfileUrl = (userId: string) => `https://properavista.com/profile/${encodeURIComponent(userId)}`;

export const buildAppProfileUrl = (userId: string) => ExpoLinking.createURL(`/profile/${encodeURIComponent(userId)}`);

export const buildProfileShareMessage = (profile: ShareableProfile) => {
  const displayName = profile.companyName || profile.name || 'Properavista profile';
  const lines = [
    `View ${displayName} on Properavista`,
    profile.description,
    profile.phone ? `Phone: ${profile.phone}` : null,
    profile.whatsapp ? `WhatsApp: ${profile.whatsapp}` : null,
    profile.address ? `Address: ${profile.address}` : null,
    '',
    buildProfileUrl(profile.id),
    buildAppProfileUrl(profile.id),
  ].filter((line): line is string => !!line);

  return lines.join('\n');
};

export const shareProfileNative = async (profile: ShareableProfile) => {
  const message = buildProfileShareMessage(profile);
  await Share.share(
    {
      title: `${profile.companyName || profile.name}'s Properavista profile`,
      message,
      url: Platform.OS === 'ios' ? buildProfileUrl(profile.id) : undefined,
    },
    {
      dialogTitle: 'Share Properavista profile',
      subject: `${profile.companyName || profile.name}'s Properavista profile`,
    }
  );
};

export const shareProfileToWhatsApp = async (profile: ShareableProfile) => {
  const message = encodeURIComponent(buildProfileShareMessage(profile));
  await Linking.openURL(`https://wa.me/?text=${message}`);
};

export const shareProfileToInstagram = async (profile: ShareableProfile) => {
  await shareProfileNative(profile);
};
