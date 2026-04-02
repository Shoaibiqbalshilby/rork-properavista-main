import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';
import { supabaseClient } from '@/lib/supabase';

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
  phoneNumber: string | null;
  resetToken: string | null;
  step: 'request' | 'verify' | 'complete' | null; // Which step of reset flow
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  passwordReset: PasswordResetState;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phone?: string, whatsapp?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<User>) => void;
  
  // Password Reset Actions
  requestPasswordReset: (email: string, phoneNumber: string) => Promise<boolean>;
  verifyResetPin: (email: string, pinCode: string) => Promise<boolean>;
  confirmPasswordReset: (email: string, pinCode: string, newPassword: string) => Promise<boolean>;
  cancelPasswordReset: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const shouldUseSupabaseFallback = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return (
    message.includes('json parse error') ||
    message.includes('unexpected character') ||
    message.includes('not found') ||
    message.includes('network request failed') ||
    message.includes('fetch failed')
  );
};

const syncSupabaseClientSession = async (session: Session) => {
  if (!session.accessToken || !session.refreshToken) {
    return;
  }

  const { error } = await supabaseClient.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });

  if (error) {
    throw new Error(`Supabase session sync failed: ${error.message}`);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      passwordReset: {
        email: null,
        phoneNumber: null,
        resetToken: null,
        step: null,
      },
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await trpcClient.auth.login.mutate({ 
            email, 
            password 
          });
          
          if (response.success) {
            const session: Session = {
              accessToken: response.session.accessToken || '',
              refreshToken: response.session.refreshToken || '',
              expiresIn: response.session.expiresIn || 3600,
              expiresAt: response.session.expiresAt || Date.now() + 3600000,
            };
            
            set({ 
              user: response.user,
              session,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            await syncSupabaseClientSession(session);
            
            // Store tokens in secure storage
            await AsyncStorage.setItem('auth_token', session.accessToken);
            await AsyncStorage.setItem('refresh_token', session.refreshToken);
            
            return true;
          }
          
          return false;
        } catch (error) {
          if (!shouldUseSupabaseFallback(error)) {
            set({ 
              isLoading: false, 
              error: getErrorMessage(error, 'Login failed')
            });
            return false;
          }

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

            const { data: profile } = await supabaseClient
              .from('user_profiles')
              .select('name, avatar_url, company_name, description, phone, whatsapp, address')
              .eq('id', data.user.id)
              .maybeSingle();

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
          } catch (fallbackError) {
            set({
              isLoading: false,
              error: getErrorMessage(fallbackError, 'Login failed'),
            });
            return false;
          }
        }
      },
      
      signup: async (name: string, email: string, password: string, phone?: string, whatsapp?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await trpcClient.auth.signup.mutate({ 
            name, 
            email, 
            password,
            phone,
            whatsapp,
          });
          
          if (response.success) {
            const session: Session = {
              accessToken: response.session.accessToken || '',
              refreshToken: response.session.refreshToken || '',
              expiresIn: response.session.expiresIn || 3600,
              expiresAt: response.session.expiresAt || Date.now() + 3600000,
            };
            
            set({ 
              user: response.user,
              session,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // Store tokens in secure storage
            await AsyncStorage.setItem('auth_token', session.accessToken);
            await AsyncStorage.setItem('refresh_token', session.refreshToken);
            
            return true;
          }
          
          return false;
        } catch (error) {
          if (!shouldUseSupabaseFallback(error)) {
            set({ 
              isLoading: false, 
              error: getErrorMessage(error, 'Signup failed')
            });
            return false;
          }

          try {
            const { data, error: signupError } = await supabaseClient.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: 'myapp://login',
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
                error: signupError?.message || 'Signup failed',
              });
              return false;
            }

            const establishSession = async (sessionData: any) => {
              await supabaseClient.from('user_profiles').upsert(
                {
                  id: data.user!.id,
                  email,
                  name,
                  phone,
                  whatsapp,
                },
                { onConflict: 'id' }
              );

              const session: Session = {
                accessToken: sessionData.access_token,
                refreshToken: sessionData.refresh_token,
                expiresIn: sessionData.expires_in || 3600,
                expiresAt: (sessionData.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000,
              };

              set({
                user: {
                  id: data.user!.id,
                  email,
                  name,
                  phone,
                  whatsapp,
                },
                session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });

              await syncSupabaseClientSession(session);

              await AsyncStorage.setItem('auth_token', session.accessToken);
              await AsyncStorage.setItem('refresh_token', session.refreshToken);
            };

            if (data.session) {
              await establishSession(data.session);
              return true;
            }

            const { data: loginData, error: loginAfterSignupError } = await supabaseClient.auth.signInWithPassword({
              email,
              password,
            });

            if (loginAfterSignupError || !loginData.session) {
              set({
                isLoading: false,
                error: loginAfterSignupError?.message || 'Account created, but login failed. Please sign in again.',
              });
              return false;
            }

            await establishSession(loginData.session);
            return true;
          } catch (fallbackError) {
            set({
              isLoading: false,
              error: getErrorMessage(fallbackError, 'Signup failed'),
            });
            return false;
          }
        }
      },
      
      logout: () => {
        supabaseClient.auth.signOut().catch(() => {
          // Ignore sign-out errors here and continue clearing local state.
        });
        AsyncStorage.removeItem('auth_token');
        AsyncStorage.removeItem('refresh_token');
        set({ 
          user: null,
          session: null,
          isAuthenticated: false,
          error: null,
          passwordReset: {
            email: null,
            phoneNumber: null,
            resetToken: null,
            step: null,
          }
        });
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
      
      clearError: () => set({ error: null }),
      
      // Password Reset - Step 1: Request PIN
      requestPasswordReset: async (email: string, phoneNumber: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await trpcClient.auth.passwordReset.mutate({
            email,
            phoneNumber,
          });
          
          if (response.success) {
            set({
              isLoading: false,
              passwordReset: {
                email,
                phoneNumber,
                resetToken: null,
                step: 'verify', // Move to PIN verification step
              },
            });
            return true;
          }
          
          return false;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to request password reset';
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
          const response = await trpcClient.auth.verifyPin.mutate({
            email,
            pinCode,
          });
          
          if (response.success) {
            set((state) => ({
              isLoading: false,
              passwordReset: {
                ...state.passwordReset,
                resetToken: response.resetToken,
                step: 'complete', // Move to password reset step
              },
            }));
            return true;
          }
          
          return false;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Invalid or expired PIN';
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
          const response = await trpcClient.auth.confirmReset.mutate({
            email,
            pinCode,
            newPassword,
          });
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
              passwordReset: {
                email: null,
                phoneNumber: null,
                resetToken: null,
                step: null,
              },
            });
            return true;
          }
          
          return false;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to reset password';
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },
      
      // Cancel password reset flow
      cancelPasswordReset: () => {
        set((state) => ({
          passwordReset: {
            email: null,
            phoneNumber: null,
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