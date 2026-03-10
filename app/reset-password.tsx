import React, { useState } from 'react';
import { 
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
import { useRouter } from 'expo-router';
import { Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { 
    requestPasswordReset, 
    verifyResetPin, 
    confirmPasswordReset, 
    cancelPasswordReset,
    passwordReset,
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();
  
  // Step 1: Request PIN
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Step 2: Verify PIN
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Step 3: Set New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Determine current step based on passwordReset state
  const currentStep = passwordReset.step || 'request';
  
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
  
  const validatePhone = () => {
    if (!phoneNumber) {
      setPhoneError('Phone number is required');
      return false;
    }
    const phoneRegex = /^(\+?234|0)[7-9][0-1]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setPhoneError('Please enter a valid Nigerian phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };
  
  const validatePin = () => {
    if (!pinCode) {
      setPinError('PIN is required');
      return false;
    }
    if (pinCode.length !== 6) {
      setPinError('PIN must be 6 digits');
      return false;
    }
    if (!/^\d+$/.test(pinCode)) {
      setPinError('PIN must contain only numbers');
      return false;
    }
    setPinError('');
    return true;
  };
  
  const validateNewPassword = () => {
    if (!newPassword) {
      setNewPasswordError('New password is required');
      return false;
    }
    if (newPassword.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      return false;
    }
    setNewPasswordError('');
    return true;
  };
  
  const validateConfirmPassword = () => {
    if (!confirmNewPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmNewPassword !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };
  
  const handleRequestPin = async () => {
    clearError();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    
    if (isEmailValid && isPhoneValid) {
      const success = await requestPasswordReset(email, phoneNumber);
      if (success) {
        Alert.alert(
          'PIN Sent!',
          'A 6-digit PIN has been sent to your phone number and email. Please check and enter it below.\n\nNote: In test mode, the PIN is logged in the browser console.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  const handleVerifyPin = async () => {
    clearError();
    const isPinValid = validatePin();
    
    if (isPinValid) {
      const success = await verifyResetPin(email, pinCode);
      if (success) {
        Alert.alert(
          'PIN Verified!',
          'Your PIN has been verified. You can now set a new password.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  const handleConfirmReset = async () => {
    clearError();
    const isNewPasswordValid = validateNewPassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    if (isNewPasswordValid && isConfirmPasswordValid) {
      const success = await confirmPasswordReset(email, pinCode, newPassword);
      if (success) {
        Alert.alert(
          'Password Reset Successful!',
          'Your password has been reset successfully. You can now login with your new password.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                cancelPasswordReset();
                router.replace('/login' as any);
              }
            }
          ]
        );
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep === 'request') {
      router.back();
    } else {
      cancelPasswordReset();
      router.back();
    }
  };
  
  const renderStepIndicator = () => {
    const steps = ['Request', 'Verify', 'Reset'];
    const stepIndex = currentStep === 'request' ? 0 : currentStep === 'verify' ? 1 : 2;
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= stepIndex && styles.stepCircleActive
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= stepIndex && styles.stepNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              index <= stepIndex && styles.stepLabelActive
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderRequestStep = () => (
    <>
      <Text style={styles.description}>
        Enter your registered email and phone number to receive a PIN code for password reset.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
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
        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputContainer, phoneError ? styles.inputError : null]}>
          <Phone size={20} color={Colors.light.subtext} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. 08012345678"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="phone-pad"
            onBlur={validatePhone}
          />
        </View>
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      </View>
      
      <Pressable 
        style={styles.primaryButton} 
        onPress={handleRequestPin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Send PIN</Text>
        )}
      </Pressable>
    </>
  );
  
  const renderVerifyStep = () => (
    <>
      <Text style={styles.description}>
        Enter the 6-digit PIN sent to your phone number ({phoneNumber}) and email ({email}).
      </Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🔍 Testing Mode: Check the browser console for the PIN code
        </Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>6-Digit PIN</Text>
        <View style={[styles.inputContainer, pinError ? styles.inputError : null]}>
          <TextInput
            style={styles.pinInput}
            value={pinCode}
            onChangeText={setPinCode}
            placeholder="000000"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="number-pad"
            maxLength={6}
            onBlur={validatePin}
          />
        </View>
        {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
      </View>
      
      <Pressable 
        style={styles.primaryButton} 
        onPress={handleVerifyPin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify PIN</Text>
        )}
      </Pressable>
      
      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={handleRequestPin}
        disabled={isLoading}
      >
        <Text style={styles.secondaryButtonText}>Resend PIN</Text>
      </TouchableOpacity>
    </>
  );
  
  const renderResetStep = () => (
    <>
      <Text style={styles.description}>
        Create a new password for your account.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>New Password</Text>
        <View style={[styles.inputContainer, newPasswordError ? styles.inputError : null]}>
          <Lock size={20} color={Colors.light.subtext} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={Colors.light.subtext}
            secureTextEntry={!showNewPassword}
            onBlur={validateNewPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeIcon}
          >
            {showNewPassword ? (
              <EyeOff size={20} color={Colors.light.subtext} />
            ) : (
              <Eye size={20} color={Colors.light.subtext} />
            )}
          </TouchableOpacity>
        </View>
        {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
          <Lock size={20} color={Colors.light.subtext} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            placeholder="Confirm new password"
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
      
      <Pressable 
        style={styles.primaryButton} 
        onPress={handleConfirmReset}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </Pressable>
    </>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
            style={styles.headerImage}
            contentFit="cover"
          />
          <View style={styles.overlay} />
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Password</Text>
          
          {renderStepIndicator()}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {currentStep === 'request' && renderRequestStep()}
          {currentStep === 'verify' && renderVerifyStep()}
          {currentStep === 'complete' && renderResetStep()}
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
  header: {
    height: 200,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 24,
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: Colors.light.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.subtext,
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  stepLabelActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 18,
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
  pinInput: {
    flex: 1,
    height: 48,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
