import React, { useState } from 'react';
import { 
  Modal,
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Link } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, verifySignupPin, resendSignupConfirmation, isLoading, error, signupMessage, clearError } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [verificationPin, setVerificationPin] = useState('');
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [verificationPinError, setVerificationPinError] = useState('');
  
  const validateName = () => {
    if (!name) {
      setNameError('Name is required');
      return false;
    }
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };
  
  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };
  
  const validatePhone = () => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    const phoneRegex = /^(\+?234|0)[7-9][0-1]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Please enter a valid Nigerian phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateVerificationPin = () => {
    const normalizedPin = verificationPin.trim();

    if (!normalizedPin) {
      setVerificationPinError('Verification PIN is required');
      return false;
    }

    if (!/^\d{6,8}$/.test(normalizedPin)) {
      setVerificationPinError('Enter the 6 to 8 digit PIN from your email');
      return false;
    }

    setVerificationPinError('');
    return true;
  };
  
  const handleSignup = async () => {
    clearError();
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isPhoneValid = validatePhone();
    
    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isPhoneValid) {
      const success = await signup(name, email, password, phone, whatsapp || phone);
      if (success) {
        setAwaitingVerification(true);
        Alert.alert(
          'Check your email',
          signupMessage || 'Your account has been created. Enter the verification PIN from your email to confirm your account. If you do not see it, check Spam, Promotions, and Updates folders.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleVerifyPin = async () => {
    clearError();

    if (!validateEmail() || !validateVerificationPin()) {
      return;
    }

    const success = await verifySignupPin(email, verificationPin.trim(), password);
    if (success) {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalOk = async () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)' as any);
  };

  const handleResendPin = async () => {
    clearError();

    if (!validateEmail()) {
      return;
    }

    const success = await resendSignupConfirmation(email);
    if (success) {
      Alert.alert('Verification PIN sent', 'A new email verification PIN has been sent. If it is not visible in Inbox, check Spam, Promotions, and Updates folders.');
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <Text style={styles.modalBadgeText}>Verified</Text>
            </View>
            <Text style={styles.modalTitle}>Account Confirmed</Text>
            <Text style={styles.modalText}>
              {signupMessage || 'Your email PIN has been verified successfully. Tap continue to enter Properavista.'}
            </Text>
            <Pressable
              style={styles.modalPrimaryButton}
              onPress={handleSuccessModalOk}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalPrimaryButtonText}>Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80' }}
            style={styles.logoBackground}
            contentFit="cover"
          />
          <View style={styles.overlay} />
          <Text style={styles.logoText}>Properavista</Text>
          <Text style={styles.tagline}>Find your perfect home</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {awaitingVerification ? (
            <View style={styles.verificationCard}>
              <Text style={styles.verificationTitle}>Verify your email</Text>
              <Text style={styles.verificationText}>
                Enter the PIN sent to {email.trim().toLowerCase()} to confirm your account and finish signing in.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email verification PIN</Text>
                <View style={[styles.inputContainer, verificationPinError ? styles.inputError : null]}>
                  <Mail size={20} color={Colors.light.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={verificationPin}
                    onChangeText={(value) => setVerificationPin(value.replace(/\D/g, ''))}
                    placeholder="Enter PIN"
                    placeholderTextColor={Colors.light.subtext}
                    keyboardType="number-pad"
                    maxLength={8}
                    onBlur={validateVerificationPin}
                  />
                </View>
                {verificationPinError ? <Text style={styles.errorText}>{verificationPinError}</Text> : null}
              </View>

              <Pressable
                style={styles.signupButton}
                onPress={handleVerifyPin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.signupButtonText}>Verify PIN</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={handleResendPin}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Resend PIN</Text>
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setAwaitingVerification(false);
                  setVerificationPin('');
                  setVerificationPinError('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.linkButtonText}>Edit signup details</Text>
              </Pressable>
            </View>
          ) : null}

          {!awaitingVerification ? (
            <>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputContainer, nameError ? styles.inputError : null]}>
              <User size={20} color={Colors.light.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.light.subtext}
                onBlur={validateName}
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
              <Mail size={20} color={Colors.light.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.light.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={validateEmail}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
              <Lock size={20} color={Colors.light.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={Colors.light.subtext}
                secureTextEntry={!showPassword}
                onBlur={validatePassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.light.subtext} />
                ) : (
                  <Eye size={20} color={Colors.light.subtext} />
                )}
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
              <Lock size={20} color={Colors.light.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.light.subtext}
                secureTextEntry={!showConfirmPassword}
                onBlur={validateConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.light.subtext} />
                ) : (
                  <Eye size={20} color={Colors.light.subtext} />
                )}
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, phoneError ? styles.inputError : null]}>
              <Phone size={20} color={Colors.light.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 08012345678"
                placeholderTextColor={Colors.light.subtext}
                keyboardType="phone-pad"
                onBlur={validatePhone}
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp Number (Optional)</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color={Colors.light.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="e.g. 08087654321"
                placeholderTextColor={Colors.light.subtext}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Pressable 
            style={styles.signupButton} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </Pressable>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href={"/login" as any} asChild replace>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.subtext,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  verificationCard: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 20, 38, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  modalBadge: {
    backgroundColor: 'rgba(52, 168, 83, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  modalBadgeText: {
    color: '#1E8E3E',
    fontSize: 13,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.subtext,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalPrimaryButton: {
    width: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 4,
  },
  signupButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 14,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkButtonText: {
    color: Colors.light.subtext,
    fontSize: 14,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
});