import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';

type EulaModalProps = {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export default function EulaModal({ visible, onAccept, onDecline }: EulaModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = React.useState(false);

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>End User License Agreement</Text>
          <Text style={styles.headerSubtitle}>Please read and accept to continue</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
        >
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.body}>
            By downloading, installing, or using the Properavista mobile application ("App"), you agree to be bound by this End User License Agreement ("EULA"). If you do not agree to these terms, do not use the App.
          </Text>

          <Text style={styles.sectionTitle}>2. License Grant</Text>
          <Text style={styles.body}>
            Properavista grants you a limited, non-exclusive, non-transferable, revocable license to use the App for your personal, non-commercial purposes, subject to these terms.
          </Text>

          <Text style={styles.sectionTitle}>3. User-Generated Content</Text>
          <Text style={styles.body}>
            The App allows users to submit property listings, images, descriptions, and other content ("User Content"). By submitting User Content, you represent and warrant that:{'\n\n'}
            (a) You own or have the necessary rights to submit such content;{'\n'}
            (b) Your content does not violate any third-party rights, including intellectual property or privacy rights;{'\n'}
            (c) Your content is accurate, not misleading, and complies with all applicable laws;{'\n'}
            (d) Your content does not contain harmful, obscene, defamatory, or fraudulent material.{'\n\n'}
            Properavista reserves the right to remove any User Content at its sole discretion, without notice, if it violates these terms or applicable laws.
          </Text>

          <Text style={styles.sectionTitle}>4. Prohibited Conduct</Text>
          <Text style={styles.body}>
            You agree not to:{'\n\n'}
            • Post false, misleading, or fraudulent property listings;{'\n'}
            • Harass, threaten, or harm other users;{'\n'}
            • Use the App for any unlawful purpose;{'\n'}
            • Attempt to gain unauthorized access to any part of the App;{'\n'}
            • Scrape, copy, or reproduce App content without authorization;{'\n'}
            • Impersonate any person or entity.
          </Text>

          <Text style={styles.sectionTitle}>5. Privacy Policy</Text>
          <Text style={styles.body}>
            Your use of the App is also governed by our Privacy Policy, which is incorporated into this EULA by reference. We collect, use, and share information as described in the Privacy Policy. By using the App, you consent to such practices.
          </Text>

          <Text style={styles.sectionTitle}>6. Property Listings Disclaimer</Text>
          <Text style={styles.body}>
            Properavista acts as a platform connecting property seekers with listers. We do not verify the accuracy of listings, and we are not responsible for any transactions, disputes, or damages arising from interactions between users. Always exercise due diligence before entering into any property agreement.
          </Text>

          <Text style={styles.sectionTitle}>7. Reporting & Moderation</Text>
          <Text style={styles.body}>
            Users can report listings they believe are fraudulent, misleading, or inappropriate. Properavista will review reports and take appropriate action. Repeated violations may result in account suspension or termination.
          </Text>

          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.body}>
            All content, features, and functionality of the App — excluding User Content — are owned by Properavista and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without written permission.
          </Text>

          <Text style={styles.sectionTitle}>9. Termination</Text>
          <Text style={styles.body}>
            Properavista may terminate or suspend your access to the App at any time, with or without cause or notice. Upon termination, all rights granted to you under this EULA will immediately cease.
          </Text>

          <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
          <Text style={styles.body}>
            To the fullest extent permitted by law, Properavista shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App or any User Content, even if advised of the possibility of such damages.
          </Text>

          <Text style={styles.sectionTitle}>11. Governing Law</Text>
          <Text style={styles.body}>
            This EULA shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>12. Changes to This Agreement</Text>
          <Text style={styles.body}>
            Properavista reserves the right to modify this EULA at any time. We will notify you of significant changes through the App. Your continued use of the App after changes constitutes acceptance of the updated EULA.
          </Text>

          <Text style={styles.sectionTitle}>13. Contact</Text>
          <Text style={styles.body}>
            If you have questions about this EULA, please contact us through the Help & Support section of the App.
          </Text>

          <Text style={styles.version}>Last updated: April 2026 · Version 1.0</Text>
        </ScrollView>

        <View style={styles.footer}>
          {!scrolledToBottom && (
            <Text style={styles.scrollHint}>Scroll down to read the full agreement</Text>
          )}
          <Pressable
            style={[styles.acceptButton, !scrolledToBottom && styles.acceptButtonDisabled]}
            onPress={onAccept}
            disabled={!scrolledToBottom}
          >
            <Text style={styles.acceptButtonText}>I Accept</Text>
          </Pressable>
          <Pressable style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineButtonText}>Decline & Exit</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 22,
  },
  version: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 32,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  scrollHint: {
    fontSize: 13,
    color: Colors.light.subtext,
    textAlign: 'center',
    marginBottom: 4,
  },
  acceptButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.4,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: Colors.light.subtext,
    fontSize: 15,
  },
});
