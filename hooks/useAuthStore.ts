import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session as SupabaseAuthSession, User as SupabaseAuthUser } from '@supabase/supabase-js';
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
  verifySignupPin: (email: string, pinCode: string, password: string) => Promise<boolean>;
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

const getSignupErrorMessage = (error: unknown, fallback: string) => {
  const message = getErrorMessage(error, fallback);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid api key')) {
    return 'The server-side signup key is invalid. The app can still use direct Supabase email verification, but the backend service-role key in .env.local must be replaced with a valid Supabase service-role key.';
  }

  if (lowerMessage.includes('email signups are disabled')) {
    return 'Email authentication is disabled in Supabase. Open Supabase Dashboard > Authentication > Sign In / Providers > Email, enable Email, and make sure new user signups are allowed.';
  }

  if (lowerMessage.includes('error sending confirmation email')) {
    return 'Supabase could not send the verification PIN email. Your project is still using an SMTP sender that is not verified. In Supabase Dashboard, either disable custom SMTP to use the default mailer, or fix the SendGrid sender identity for support@properavista.com.';
  }

  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Supabase verification email sending is being throttled right now. Please wait a bit before trying again.';
  }

  if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('confirm your email')) {
    return 'Please verify the email PIN before signing in.';
  }

  return message;
};

const isBackendSignupFallbackError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();

  return (
    message.includes('invalid api key') ||
    message.includes('service_role_key') ||
    message.includes('supabaseadmin requires')
  );
};

const isRecoverableSignupVerificationError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();

  return (
    isBackendSignupFallbackError(error) ||
    message.includes('account not found') ||
    message.includes('user not found') ||
    message.includes('signup verification failed')
  );
};

const sendWelcomeEmailForSession = async (accessToken: string) => {
  const response = await fetch(`${getApiBaseUrl()}/auth/signup/welcome`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({ success: false, message: 'Welcome email request failed' }));

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Welcome email request failed');
  }
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

const buildSession = (session: SupabaseAuthSession): Session => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  expiresIn: session.expires_in || 3600,
  expiresAt: (session.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000,
});

const hydrateAuthenticatedUser = async (
  authUser: SupabaseAuthUser,
  authSession: SupabaseAuthSession,
  fallbackEmail: string
) => {
  const email = authUser.email || fallbackEmail;

  const { data: profile } = await supabaseClient
    .from('user_profiles')
    .select('name, avatar_url, company_name, description, phone, whatsapp, address')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!profile) {
    await upsertOwnUserProfile(
      authUser.id,
      email,
      (authUser.user_metadata?.name as string | undefined) || 'User',
      authUser.user_metadata?.phone as string | undefined,
      authUser.user_metadata?.whatsapp as string | undefined,
    );
  }

  const session = buildSession(authSession);

  await AsyncStorage.setItem('auth_token', session.accessToken);
  await AsyncStorage.setItem('refresh_token', session.refreshToken);

  return {
    user: {
      id: authUser.id,
      email,
      name: profile?.name || authUser.user_metadata?.name || 'User',
      avatar: profile?.avatar_url || undefined,
      companyName: profile?.company_name || undefined,
      description: profile?.description || undefined,
      phone: profile?.phone || undefined,
      whatsapp: profile?.whatsapp || undefined,
      address: profile?.address || undefined,
    } satisfies User,
    session,
  };
};

const postAuthJson = async <T>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('The app could not reach the authentication API. Received a non-JSON response instead.');
  }

  const responseBody = await response.json().catch(() => {
    throw new Error('The app received an invalid response from the authentication API.');
  });

  if (!response.ok || responseBody.success === false) {
    throw new Error(responseBody.message || 'Request failed');
  }

  return responseBody as T;
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
              error: 'Please verify the email PIN before signing in.',
            });
            return false;
          }

          const authenticatedState = await hydrateAuthenticatedUser(data.user, data.session, email);

          set({
            user: authenticatedState.user,
            session: authenticatedState.session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

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
          let response: { message?: string } | null = null;

          try {
            response = await postAuthJson<{ message?: string }>(
              '/auth/signup/request',
              {
                name,
                email: normalizedEmail,
                password,
                phone,
                whatsapp,
              }
            );
          } catch (error) {
            if (!isBackendSignupFallbackError(error)) {
              throw error;
            }

            const { data, error: signupError } = await supabaseClient.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: {
                  name,
                  phone,
                  whatsapp,
                },
              },
            });

            if (signupError) {
              throw signupError;
            }

            if (!data.user) {
              throw new Error('Failed to create account');
            }

            response = {
              message: 'Your account has been created. We sent a verification PIN to your email. Enter that PIN to confirm your account and finish signing in.',
            };
          }

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            signupMessage: response?.message || 'Your account has been created. We sent a verification PIN to your email. Enter that PIN to confirm your account and finish signing in.',
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

      verifySignupPin: async (email: string, pinCode: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const normalizedEmail = normalizeEmail(email);
          let welcomeEmailSent = true;
          let signInData:
            | {
                user: SupabaseAuthUser;
                session: SupabaseAuthSession;
              }
            | null = null;

          if (pinCode.trim().length === 8) {
            try {
              await postAuthJson('/auth/signup/verify', {
                email: normalizedEmail,
                pinCode,
              });

              const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: normalizedEmail,
                password,
              });

              if (error || !data.user || !data.session) {
                throw new Error(error?.message || 'Account verified, but sign-in failed. Please sign in manually.');
              }

              signInData = {
                user: data.user,
                session: data.session,
              };
            } catch (error) {
              if (!isRecoverableSignupVerificationError(error)) {
                throw error;
              }

              // Some accounts are created through direct Supabase signup fallback.
              // In that case backend PIN verification may not find the account,
              // so continue with Supabase OTP verification below.
            }
          }

          if (!signInData) {
            const { data, error } = await supabaseClient.auth.verifyOtp({
              email: normalizedEmail,
              token: pinCode,
              type: 'signup',
            });

            if (error || !data.user || !data.session) {
              throw new Error(error?.message || 'Invalid or expired verification PIN');
            }

            await upsertOwnUserProfile(
              data.user.id,
              normalizedEmail,
              typeof data.user.user_metadata?.name === 'string' ? data.user.user_metadata.name : undefined,
              typeof data.user.user_metadata?.phone === 'string' ? data.user.user_metadata.phone : undefined,
              typeof data.user.user_metadata?.whatsapp === 'string' ? data.user.user_metadata.whatsapp : undefined,
            );

            signInData = {
              user: data.user,
              session: data.session,
            };
          }

          const authenticatedState = await hydrateAuthenticatedUser(signInData.user, signInData.session, normalizedEmail);

          try {
            await sendWelcomeEmailForSession(authenticatedState.session.accessToken);
          } catch (welcomeError) {
            welcomeEmailSent = false;
            console.error('Welcome email delivery failed after signup verification:', welcomeError);
          }

          set({
            user: authenticatedState.user,
            session: authenticatedState.session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            signupMessage: welcomeEmailSent
              ? 'User registration successful. Welcome email sent.'
              : 'User registration successful, but the welcome email could not be sent.',
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: getSignupErrorMessage(error, 'Invalid or expired verification PIN'),
          });
          return false;
        }
      },

      resendSignupConfirmation: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          const normalizedEmail = normalizeEmail(email);
          try {
            await postAuthJson('/auth/signup/resend', {
              email: normalizedEmail,
            });
          } catch (error) {
            if (!isBackendSignupFallbackError(error)) {
              throw error;
            }

            const { error: resendError } = await supabaseClient.auth.resend({
              type: 'signup',
              email: normalizedEmail,
            });

            if (resendError) {
              throw resendError;
            }
          }

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: getSignupErrorMessage(error, 'Failed to resend verification email'),
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