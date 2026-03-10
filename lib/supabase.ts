import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Validate Supabase configuration
const validateSupabaseConfig = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('[Supabase] Missing configuration:', {
      hasUrl: !!url,
      hasKey: !!key,
    });
  } else {
    console.log('[Supabase] Configuration loaded:', {
      url: url.substring(0, 30) + '...',
      keyPrefix: key.substring(0, 20) + '...',
    });
  }
};

validateSupabaseConfig();

// Client-side Supabase client with AsyncStorage for React Native
export const supabaseClient = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

const createUnavailableAdminClient = () =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          'supabaseAdmin requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Use it only in backend runtime.'
        );
      },
    }
  );

// Server-side Supabase admin client (use in backend only)
export const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : (createUnavailableAdminClient() as any);

// Test database connection and table existence
export const testSupabaseConnection = async () => {
  console.log('[Supabase] Testing connection...');
  
  try {
    // Test properties table
    const { data: propertiesData, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('count')
      .limit(1);
    
    if (propertiesError) {
      console.error('[Supabase] Properties table error:', propertiesError);
      return {
        success: false,
        error: `Properties table not accessible: ${propertiesError.message}. Have you run the SQL schema?`,
      };
    }
    
    console.log('[Supabase] Properties table exists ✓');
    
    // Check if user is authenticated (needed for uploads)
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      console.warn('[Supabase] User not authenticated');
      return {
        success: true,
        message: 'Supabase connection successful (awaiting login)',
      };
    }
    
    console.log('[Supabase] User authenticated ✓');
    console.log('[Supabase] All checks passed ✓');
    return {
      success: true,
      message: 'Supabase connection successful',
    };
  } catch (error: any) {
    console.error('[Supabase] Connection test failed:', error);
    return {
      success: false,
      error: error?.message || 'Unknown connection error',
    };
  }
};
