import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  normalizeEmail,
  SUPABASE_PASSWORD_RESET_PIN_MAX_LENGTH,
  validateSupabasePasswordResetOtp,
} from '@/utils/password-reset';

type PasswordResetCardProps = {
  initialEmail?: string;
  onCancel?: () => void;
  onComplete?: () => void;
  showTitle?: boolean;
};

export default function PasswordResetCard({
  initialEmail,
  onCancel,
  onComplete,
  showTitle = true,
}: PasswordResetCardProps) {
  const {
    requestPasswordReset,
    verifyResetPin,
    confirmPasswordReset,
    cancelPasswordReset,
    clearError,
    passwordReset,
    isLoading,
    error,
  } = useAuthStore();

  const [email, setEmail] = useState(initialEmail ? normalizeEmail(initialEmail) : '');
  const [pinCode, setPinCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [sentToEmail, setSentToEmail] = useState('');

  const currentStep = passwordReset.step || 'request';

  useEffect(() => {
    if (initialEmail && currentStep === 'request') {
      setEmail(normalizeEmail(initialEmail));
    }
  }, [currentStep, initialEmail]);

  const resetLocalState = () => {
    setPinCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setEmailError('');
    setPinError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setSentToEmail('');
  };

  const validateEmail = () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setEmailError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmail(normalizedEmail);
    setEmailError('');
    return true;
  };

  const validatePin = () => {
    if (!validateSupabasePasswordResetOtp(pinCode)) {
      setPinError('Enter the 6-digit or 8-digit code from your email');
      return false;
    }

    setPinError('');
    return true;
  };

  const validateNewPassword = () => {
    if (newPassword.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      return false;
    }

    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = () => {
    if (confirmNewPassword !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  const handleRequestPin = async () => {
    clearError();

    if (!validateEmail()) {
      return;
    }

    const success = await requestPasswordReset(email);
    if (!success) {
      return;
    }

    setSentToEmail(normalizeEmail(email));

    Alert.alert(
      'Code sent',
      'Enter the reset code sent to your registered email address.'
    );
  };

  const handleVerifyPin = async () => {
    clearError();

    if (!validateEmail() || !validatePin()) {
      return;
    }

    const success = await verifyResetPin(email, pinCode);
    if (!success) {
      return;
    }

    Alert.alert('Code verified', 'Create your new password to finish the reset.');
  };

  const handleConfirmReset = async () => {
    clearError();

    if (!validateEmail() || !validatePin() || !validateNewPassword() || !validateConfirmPassword()) {
      return;
    }

    const success = await confirmPasswordReset(email, pinCode, newPassword);
    if (!success) {
      return;
    }

    Alert.alert('Password updated', 'You can now sign in with your new password.', [
      {
        text: 'OK',
        onPress: () => {
          resetLocalState();
          cancelPasswordReset();
          onComplete?.();
        },
      },
    ]);
  };

  const handleCancel = () => {
    clearError();
    resetLocalState();
    cancelPasswordReset();
    onCancel?.();
  };

  const renderStep = () => {
    if (currentStep === 'request') {
      return (
        <>
          <Text style={styles.description}>
            Enter your registered email address to receive a reset code.
          </Text>

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

          <Pressable style={styles.primaryButton} onPress={handleRequestPin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Send Code</Text>}
          </Pressable>
        </>
      );
    }

    if (currentStep === 'verify') {
      return (
        <>
          <Text style={styles.description}>
            Enter the reset code Supabase sent to {email}.
          </Text>

          {sentToEmail ? (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Code sent to {sentToEmail}</Text>
              <Text style={styles.infoText}>
                Enter the latest code from your inbox. The app accepts both 6-digit and 8-digit numeric codes.
              </Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pass Code</Text>
            <View style={[styles.inputContainer, pinError ? styles.inputError : null]}>
              <TextInput
                style={styles.pinInput}
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="Enter reset code"
                placeholderTextColor={Colors.light.subtext}
                keyboardType="number-pad"
                maxLength={SUPABASE_PASSWORD_RESET_PIN_MAX_LENGTH}
                onBlur={validatePin}
              />
            </View>
            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
          </View>

          <Pressable style={styles.primaryButton} onPress={handleVerifyPin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Verify Code</Text>}
          </Pressable>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRequestPin}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.description}>Create a new password for your account.</Text>

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
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword((value) => !value)}>
              {showNewPassword ? <EyeOff size={20} color={Colors.light.subtext} /> : <Eye size={20} color={Colors.light.subtext} />}
            </TouchableOpacity>
          </View>
          {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
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
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword((value) => !value)}>
              {showConfirmPassword ? <EyeOff size={20} color={Colors.light.subtext} /> : <Eye size={20} color={Colors.light.subtext} />}
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>

        <Pressable style={styles.primaryButton} onPress={handleConfirmReset} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Reset Password</Text>}
        </Pressable>
      </>
    );
  };

  return (
    <View style={styles.card}>
      {showTitle ? <Text style={styles.title}>Reset Password</Text> : null}

      <View style={styles.stepIndicator}>
        {['Request', 'Verify', 'Reset'].map((step, index) => {
          const stepIndex = currentStep === 'request' ? 0 : currentStep === 'verify' ? 1 : 2;
          const isActive = index <= stepIndex;

          return (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepCircle, isActive ? styles.stepCircleActive : null]}>
                <Text style={[styles.stepNumber, isActive ? styles.stepNumberActive : null]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : null]}>{step}</Text>
            </View>
          );
        })}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {renderStep()}

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isLoading}>
        <Text style={styles.cancelButtonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: Colors.light.primary,
  },
  stepNumber: {
    fontSize: 14,
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
    color: Colors.light.text,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.18)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.subtext,
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
    backgroundColor: Colors.light.background,
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
    marginTop: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonTextDisabled: {
    color: Colors.light.subtext,
  },
  cancelButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
});