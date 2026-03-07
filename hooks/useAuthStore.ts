import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // For demo purposes, we'll simulate a successful login
          // In a real app, you would call your backend API
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Demo login credentials
          if (email === 'demo@example.com' && password === 'password123') {
            const user: User = {
              id: '1',
              name: 'Demo User',
              email: 'demo@example.com',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
            };
            
            set({ 
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return true;
          }
          
          // In a real app, you would use trpcClient to call your backend
          // const response = await trpcClient.auth.login.mutate({ email, password });
          // set({ user: response.user, isAuthenticated: true, isLoading: false });
          // return true;
          
          set({ 
            isLoading: false, 
            error: 'Invalid email or password. Try demo@example.com / password123' 
          });
          return false;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: 'Failed to login. Please try again.' 
          });
          return false;
        }
      },
      
      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // For demo purposes, we'll simulate a successful signup
          // In a real app, you would call your backend API
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Demo signup - always succeeds
          const user: User = {
            id: Date.now().toString(),
            name,
            email,
          };
          
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return true;
          
          // In a real app, you would use trpcClient to call your backend
          // const response = await trpcClient.auth.signup.mutate({ name, email, password });
          // set({ user: response.user, isAuthenticated: true, isLoading: false });
          // return true;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: 'Failed to create account. Please try again.' 
          });
          return false;
        }
      },
      
      logout: () => {
        set({ 
          user: null,
          isAuthenticated: false,
          error: null
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
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);