-- ============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- This script can be run multiple times safely
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLEANUP: Drop all existing objects
-- ============================================

-- Drop all triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;

-- Drop all functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop all tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE public.user_profiles (
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

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "user_profiles_select_policy"
  ON public.user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "user_profiles_insert_policy"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_policy"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete_policy"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_code VARCHAR(6) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "password_reset_tokens_select_policy"
  ON public.password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "password_reset_tokens_insert_policy"
  ON public.password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(30),
  property_id UUID,
  property_title VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "messages_select_policy"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "messages_insert_policy"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_policy"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "messages_delete_policy"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Indexes
CREATE INDEX idx_messages_recipient_created_at ON public.messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender_created_at ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_property_id ON public.messages(property_id);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE public.properties (
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

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "properties_select_policy"
  ON public.properties
  FOR SELECT
  USING (true);

CREATE POLICY "properties_insert_policy"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "properties_update_policy"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "properties_delete_policy"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX idx_properties_city_state ON public.properties(city, state);
CREATE INDEX idx_properties_location ON public.properties(latitude, longitude);
CREATE INDEX idx_properties_created_at ON public.properties(created_at DESC);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK after properties exists (safe for fresh and existing databases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_property_id_fkey'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_property_id_fkey
      FOREIGN KEY (property_id)
      REFERENCES public.properties(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- ============================================
-- STORAGE POLICIES CLEANUP
-- ============================================

-- Drop all existing storage policies (multiple attempts for all possible names)
DO $$ 
BEGIN
    -- Avatar images policies
    DROP POLICY IF EXISTS "Public can view avatar images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload avatar images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their avatar images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their avatar images" ON storage.objects;
    DROP POLICY IF EXISTS "avatar_images_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "avatar_images_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "avatar_images_update_policy" ON storage.objects;
    DROP POLICY IF EXISTS "avatar_images_delete_policy" ON storage.objects;
    
    -- Property images policies
    DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their property images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their property images" ON storage.objects;
    DROP POLICY IF EXISTS "property_images_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "property_images_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "property_images_update_policy" ON storage.objects;
    DROP POLICY IF EXISTS "property_images_delete_policy" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- AVATAR IMAGES STORAGE POLICIES
-- ============================================

CREATE POLICY "avatar_images_select_policy"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatar-images');

CREATE POLICY "avatar_images_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatar-images');

CREATE POLICY "avatar_images_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatar-images')
  WITH CHECK (bucket_id = 'avatar-images');

CREATE POLICY "avatar_images_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatar-images');

-- ============================================
-- PROPERTY IMAGES STORAGE POLICIES
-- ============================================

CREATE POLICY "property_images_select_policy"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "property_images_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "property_images_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-images')
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "property_images_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images');

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- IMPORTANT: Storage buckets created manually:
-- ✓ avatar-images (public)
-- ✓ property-images (public)
--
-- You can now:
-- 1. Sign up / Sign in
-- 2. Complete Business Profile
-- 3. Add properties with images
-- 4. Upload images will work automatically!
-- ============================================
