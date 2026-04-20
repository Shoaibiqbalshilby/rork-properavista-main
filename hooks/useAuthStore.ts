import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseClient } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/trpc';
import { useLocationStore } from '@/hooks/useLocationStore';
import { usePropertyStore } from '@/hooks/usePropertyStore';
import { normalizeEmail } from '@/utils/password-reset';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  companyName?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

interface PasswordResetState {
  email: string | null;
  resetToken: string | null;
  step: 'request' | 'verify' | 'complete' | null; // Which step of reset flow
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signupMessage: string | null;
  passwordReset: PasswordResetState;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phone?: string, whatsapp?: string) => Promise<boolean>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
  clearError: () => void;
  updateProfile: (updates: Partial<User>) => void;
  resendSignupConfirmation: (email: string) => Promise<boolean>;
  
  // Password Reset Actions
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetPin: (email: string, pinCode: string) => Promise<boolean>;
  confirmPasswordReset: (email: string, pinCode: string, newPassword: string) => Promise<boolean>;
  cancelPasswordReset: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getPasswordResetErrorMessage = (error: unknown, fallback: string) => {
  const message = getErrorMessage(error, fallback);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Supabase password reset is being throttled. Configure custom SMTP and increase Auth rate limits in the Supabase dashboard, then try again.';
  }

  if (lowerMessage.includes('for security purposes') || lowerMessage.includes('wait')) {
    return 'Please wait a moment before requesting another reset code.';
  }

  return message;
};

const SIGNUP_CONFIRM_REDIRECT_URL = 'myapp://login?emailConfirmed=1';

const getSignupErrorMessage = (error: unknown, fallback: string) => {
  const message = getErrorMessage(error, fallback);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Supabase confirmation email sending is being throttled right now. Please wait a bit before trying again.';
  }

  if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('confirm your email')) {
    return 'Please confirm your email before signing in.';
  }

  return message;
};

const upsertOwnUserProfile = async (userId: string, email: string, name?: string, phone?: string, whatsapp?: string) => {
  const { error } = await supabaseClient
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        email,
        name: name || '',
        phone: phone || null,
        whatsapp: whatsapp || null,
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

const clearStoredSession = async () => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('refresh_token');
};

const clearLocalAppState = () => {
  usePropertyStore.getState().resetForSignOut();
  useLocationStore.getState().clearStoredLocation();
};

const resetAuthState = () => ({
  user: null,
  session: null,
  isAuthenticated: false,
  error: null,
  signupMessage: null,
  passwordReset: {
    email: null,
    resetToken: null,
    step: null,
  },
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      signupMessage: null,
      passwordReset: {
        email: null,
        resetToken: null,
        step: null,
      },
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });

          if (loginError || !data.user || !data.session) {
            set({
              isLoading: false,
              error: loginError?.message || 'Login failed',
            });
            return false;
          }

          if (!data.user.email_confirmed_at) {
            await supabaseClient.auth.signOut({ scope: 'local' }).catch(() => {
              // Ignore local cleanup failures after blocked login.
            });
            set({
              isLoading: false,
              error: 'Please confirm your email before signing in.',
            });
            return false;
          }

          const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select('name, avatar_url, company_name, description, phone, whatsapp, address')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!profile) {
            await upsertOwnUserProfile(
              data.user.id,
              data.user.email || email,
              (data.user.user_metadata?.name as string | undefined) || 'User',
              data.user.user_metadata?.phone as string | undefined,
              data.user.user_metadata?.whatsapp as string | undefined,
            );
          }

          const session: Session = {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in || 3600,
            expiresAt: (data.session.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000,
          };

          set({
            user: {
              id: data.user.id,
              email: data.user.email || email,
              name: profile?.name || data.user.user_metadata?.name || 'User',
              avatar: profile?.avatar_url || undefined,
              companyName: profile?.company_name || undefined,
              description: profile?.description || undefined,
              phone: profile?.phone || undefined,
              whatsapp: profile?.whatsapp || undefined,
              address: profile?.address || undefined,
            },
            session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          await AsyncStorage.setItem('auth_token', session.accessToken);
          await AsyncStorage.setItem('refresh_token', session.refreshToken);

          return true;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: getErrorMessage(error, 'Login failed')
          });
          return false;
        }
      },
      
      signup: async (name: string, email: string, password: string, phone?: string, whatsapp?: string) => {
        set({ isLoading: true, error: null, signupMessage: null });
        
        try {
          const normalizedEmail = normalizeEmail(email);
          const { data, error: signupError } = await supabaseClient.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: SIGNUP_CONFIRM_REDIRECT_URL,
              data: {
                name,
                phone,
                whatsapp,
              },
            },
          });

          if (signupError || !data.user) {
            set({
              isLoading: false,
              error: getSignupErrorMessage(signupError, 'Signup failed'),
              signupMessage: null,
            });
            return false;
          }

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            signupMessage: 'Your account has been created. Open the confirmation email, confirm your address, then sign in with your credentials.',
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: getSignupErrorMessage(error, 'Signup failed'),
            signupMessage: null,
          });
          return false;
        }
      },

      resendSignupConfirmation: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          const normalizedEmail = normalizeEmail(email);
          const { error } = await supabaseClient.auth.resend({
            type: 'signup',
            email: normalizedEmail,
            options: {
              emailRedirectTo: SIGNUP_CONFIRM_REDIRECT_URL,
            },
          });

          if (error) {
            throw error;
          }

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: getSignupErrorMessage(error, 'Failed to resend confirmation email'),
          });
          return false;
        }
      },
      
      logout: () => {
        supabaseClient.auth.signOut().catch(() => {
          // Ignore sign-out errors here and continue clearing local state.
        });
        clearStoredSession().catch(() => {
          // Ignore local storage cleanup errors on logout.
        });
        clearLocalAppState();
        set(resetAuthState());
      },

      deleteAccount: async () => {
        const session = get().session;

        if (!session?.accessToken) {
          set({ error: 'You must be signed in to delete your account.' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${getApiBaseUrl()}/auth/account`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          const payload = await response.json().catch(() => ({ success: false, message: 'Account deletion failed' }));

          if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'Account deletion failed');
          }

          await supabaseClient.auth.signOut({ scope: 'local' }).catch(() => {
            // Ignore sign-out failures after the server removes the account.
          });

          await clearStoredSession();
          clearLocalAppState();

          set({
            ...resetAuthState(),
            isLoading: false,
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: getErrorMessage(error, 'Account deletion failed'),
          });
          return false;
        }
      },

      updateProfile: (updates) => set((state) => {
        if (!state.user) return state;

        return {
          user: {
            ...state.user,
            ...updates,
          }
        };
      }),
      
      clearError: () => set({ error: null, signupMessage: null }),
      
      // Password Reset - Step 1: Request PIN
      requestPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const normalizedEmail = normalizeEmail(email);
          const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: 'myapp://reset-password',
          });

          if (error) {
            throw error;
          }

          set({
            isLoading: false,
            passwordReset: {
              email: normalizedEmail,
              resetToken: null,
              step: 'verify',
            },
          });

          return true;
        } catch (error) {
          const message = getPasswordResetErrorMessage(error, 'Failed to request password reset');
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },
      
      // Password Reset - Step 2: Verify PIN
      verifyResetPin: async (email: string, pinCode: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const normalizedEmail = normalizeEmail(email);
          const { data, error } = await supabaseClient.auth.verifyOtp({
            email: normalizedEmail,
            token: pinCode,
            type: 'recovery',
          });

          if (error) {
            throw error;
          }

          if (!data.session) {
            throw new Error('Verification failed. Please request a new code.');
          }

          await AsyncStorage.setItem('auth_token', data.session.access_token);
          await AsyncStorage.setItem('refresh_token', data.session.refresh_token);

          set({
            isLoading: false,
            passwordReset: {
              email: normalizedEmail,
              resetToken: data.session.access_token,
              step: 'complete',
            },
          });

          return true;
        } catch (error) {
          const message = getPasswordResetErrorMessage(error, 'Invalid or expired PIN');
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },
      
      // Password Reset - Step 3: Confirm with new password
      confirmPasswordReset: async (email: string, pinCode: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabaseClient.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            throw error;
          }

          await supabaseClient.auth.signOut({ scope: 'local' }).catch(() => {
            // Ignore cleanup failures after successful password update.
          });

          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('refresh_token');

          set({
            isLoading: false,
            error: null,
            passwordReset: {
              email: null,
              resetToken: null,
              step: null,
            },
          });

          return true;
        } catch (error) {
          const message = getPasswordResetErrorMessage(error, 'Failed to reset password');
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },
      
      // Cancel password reset flow
      cancelPasswordReset: () => {
        supabaseClient.auth.signOut({ scope: 'local' }).catch(() => {
          // Ignore local-only cleanup failures.
        });
        clearStoredSession().catch(() => {
          // Ignore local-only cleanup failures.
        });
        set(() => ({
          passwordReset: {
            email: null,
            resetToken: null,
            step: null,
          },
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);