import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
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
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import type { EmailOtpType } from '@supabase/supabase-js';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PasswordResetCard from '@/components/PasswordResetCard';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabaseClient } from '@/lib/supabase';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ emailConfirmed?: string; token_hash?: string; type?: string }>();
  const insets = useSafeAreaInsets();
  const { login, resendSignupConfirmation, isLoading, error, clearError, cancelPasswordReset } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const verifySignupConfirmation = async () => {
      if (!params.token_hash || !params.type) {
        if (params.emailConfirmed === '1') {
          const message = 'Congrests, email has been confirmed. Now you can login into the app using your credentials.';
          setConfirmationMessage(message);
          Alert.alert('Congrats', message);
        }
        return;
      }

      const { error } = await supabaseClient.auth.verifyOtp({
        token_hash: String(params.token_hash),
        type: String(params.type) as EmailOtpType,
      });

      if (cancelled) {
        return;
      }

      if (error) {
        setConfirmationMessage('This confirmation link is invalid or expired. Request a new confirmation email and try again.');
        return;
      }

      const message = 'Congrests, email has been confirmed. Now you can login into the app using your credentials.';
      setConfirmationMessage(message);
      Alert.alert('Congrats', message);
      router.replace('/login?emailConfirmed=1');
    };

    verifySignupConfirmation();

    return () => {
      cancelled = true;
    };
  }, [params.emailConfirmed, params.token_hash, params.type, router]);
  
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
  
  const handleLogin = async () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (isEmailValid && isPasswordValid) {
      const success = await login(email, password);
      if (success) {
        router.replace('/');
      }
    }
  };
  
  const handleDemoLogin = async () => {
    const success = await login('demo@example.com', 'password123');
    if (success) {
      router.replace('/');
    }
  };

  const shouldShowResendConfirmation = !!email && (error?.toLowerCase().includes('confirm your email') || false);

  const handleResendConfirmation = async () => {
    const isEmailValid = validateEmail();
    if (!isEmailValid) {
      return;
    }

    const success = await resendSignupConfirmation(email);
    if (success) {
      Alert.alert('Confirmation email sent', 'Check your inbox and spam folder for the new confirmation email.');
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {confirmationMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{confirmationMessage}</Text>
            </View>
          ) : null}
          
          {error && !showResetFlow && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
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
                placeholder="Enter your password"
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
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => {
              clearError();
              cancelPasswordReset();
              setShowResetFlow(true);
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {showResetFlow ? (
            <PasswordResetCard
              initialEmail={email}
              showTitle={false}
              onCancel={() => setShowResetFlow(false)}
              onComplete={() => setShowResetFlow(false)}
            />
          ) : (
            <>
              <Pressable 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={styles.demoButton} 
                onPress={handleDemoLogin}
                disabled={isLoading}
              >
                <Text style={styles.demoButtonText}>Demo Login</Text>
              </Pressable>

              {shouldShowResendConfirmation ? (
                <Pressable
                  style={styles.resendButton}
                  onPress={handleResendConfirmation}
                  disabled={isLoading}
                >
                  <Text style={styles.resendButtonText}>Resend Confirmation Email</Text>
                </Pressable>
              ) : null}
              
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don&apos;t have an account? </Text>
                <Link href={"/signup" as any} asChild replace>
                  <TouchableOpacity>
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          )}
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
    height: 220,
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
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  successText: {
    fontSize: 12,
    color: '#166534',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  demoButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  resendButtonText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
});