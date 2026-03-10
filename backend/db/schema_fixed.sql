-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  avatar_url TEXT,
  company_name VARCHAR(255),
  description TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow public to read user profiles" ON public.user_profiles;

-- RLS Policies for user_profiles - READ
CREATE POLICY "user_profiles_select_policy"
  ON public.user_profiles
  FOR SELECT
  USING (true);  -- Allow anyone to read profiles (needed for property listings)

-- RLS Policies for user_profiles - INSERT
CREATE POLICY "user_profiles_insert_policy"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);  -- Users can only insert their own profile

-- RLS Policies for user_profiles - UPDATE
CREATE POLICY "user_profiles_update_policy"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)  -- Users can only update their own profile
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_profiles - DELETE
CREATE POLICY "user_profiles_delete_policy"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_code VARCHAR(6) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON public.password_reset_tokens;

-- RLS Policies for password_reset_tokens
CREATE POLICY "password_reset_tokens_select_policy"
  ON public.password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "password_reset_tokens_insert_policy"
  ON public.password_reset_tokens
  FOR INSERT
  WITH CHECK (true);  -- Backend can insert

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  price NUMERIC NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  zip_code VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  square_feet INTEGER NOT NULL DEFAULT 0,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  property_type VARCHAR(30) NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  year_built INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  listing_type VARCHAR(20) NOT NULL,
  payment_frequency JSONB,
  listing_status VARCHAR(20) NOT NULL DEFAULT 'available',
  land_details JSONB,
  lister JSONB,
  nearby_facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for properties
DROP POLICY IF EXISTS "Allow public to read properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- RLS Policies for properties - READ (public can read all)
CREATE POLICY "properties_select_policy"
  ON public.properties
  FOR SELECT
  USING (true);  -- Anyone can read properties

-- RLS Policies for properties - INSERT (only authenticated users can insert their own)
CREATE POLICY "properties_insert_policy"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);  -- Authenticated users can insert if user_id matches their auth.uid()

-- RLS Policies for properties - UPDATE (only owner can update)
CREATE POLICY "properties_update_policy"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)  -- Only owner can update
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for properties - DELETE (only owner can delete)
CREATE POLICY "properties_delete_policy"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);  -- Only owner can delete

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON public.properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- Update trigger for properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS AND POLICIES
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-images', 'avatar-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Public can view avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property images" ON storage.objects;

-- ============================================
-- AVATAR IMAGES STORAGE POLICIES
-- ============================================

-- SELECT: Public can view
CREATE POLICY "avatar_images_select_policy"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatar-images');

-- INSERT: Only authenticated users uploading to their own folder
CREATE POLICY "avatar_images_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatar-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Only owner
CREATE POLICY "avatar_images_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatar-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatar-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Only owner
CREATE POLICY "avatar_images_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatar-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- PROPERTY IMAGES STORAGE POLICIES
-- ============================================

-- SELECT: Public can view
CREATE POLICY "property_images_select_policy"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');

-- INSERT: Only authenticated users uploading to their own folder
CREATE POLICY "property_images_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Only owner
CREATE POLICY "property_images_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Only owner
CREATE POLICY "property_images_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- CONFIRMATION MESSAGE
-- ============================================
-- Schema setup complete!
-- All tables and RLS policies configured.
-- Ready for property listings with image uploads.
