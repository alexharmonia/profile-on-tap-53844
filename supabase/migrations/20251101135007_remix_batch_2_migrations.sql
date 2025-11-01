
-- Migration: 20251031214737

-- Migration: 20251031203008

-- Migration: 20251030165458
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  position TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create social_links table
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_links
CREATE POLICY "Anyone can view social links"
  ON public.social_links
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own social links"
  ON public.social_links
  FOR ALL
  USING (auth.uid() = user_id);

-- Create custom_links table
CREATE TABLE public.custom_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_links
CREATE POLICY "Anyone can view custom links"
  ON public.custom_links
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own custom links"
  ON public.custom_links
  FOR ALL
  USING (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251031000824
-- Add new fields to profiles table for MVP
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_key TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_beneficiary_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_beneficiary_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_search_on_catalog BOOLEAN DEFAULT false;

-- Add social media fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_reviews_url TEXT;

-- Create catalog_products table
CREATE TABLE IF NOT EXISTS catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on catalog_products
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for catalog_products
CREATE POLICY "Anyone can view visible products"
ON catalog_products FOR SELECT
USING (is_visible = true);

CREATE POLICY "Users can manage their own products"
ON catalog_products FOR ALL
USING (auth.uid() = user_id);

-- Create pix_keys table for extra PIX keys
CREATE TABLE IF NOT EXISTS pix_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  key_type TEXT NOT NULL,
  key_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on pix_keys
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for pix_keys
CREATE POLICY "Anyone can view pix keys"
ON pix_keys FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own pix keys"
ON pix_keys FOR ALL
USING (auth.uid() = user_id);

-- Add trigger for catalog_products updated_at
CREATE TRIGGER update_catalog_products_updated_at
BEFORE UPDATE ON catalog_products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update custom_links to add icon and pulsing fields
ALTER TABLE custom_links ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'globe';
ALTER TABLE custom_links ADD COLUMN IF NOT EXISTS is_pulsing BOOLEAN DEFAULT false;
ALTER TABLE custom_links ADD COLUMN IF NOT EXISTS show_icon_only BOOLEAN DEFAULT false;

-- Update social_links to add show_icon_only field
ALTER TABLE social_links ADD COLUMN IF NOT EXISTS show_icon_only BOOLEAN DEFAULT false;

-- Function to generate unique access key
CREATE OR REPLACE FUNCTION generate_access_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  key TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric key
    key := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE access_key = key) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN key;
END;
$$;

-- Update handle_new_user to generate access_key
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, access_key)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    generate_access_key()
  );
  RETURN new;
END;
$$;

-- Migration: 20251031000907
-- Fix security warning: Add search_path to generate_access_key function
CREATE OR REPLACE FUNCTION generate_access_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric key
    key := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE access_key = key) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN key;
END;
$$;


-- Migration: 20251031203211
-- Ensure catalog_products table exists with correct structure
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Users can create their own catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Users can update their own catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Users can delete their own catalog products" ON public.catalog_products;
DROP POLICY IF EXISTS "Anyone can view visible catalog products" ON public.catalog_products;

-- Create policies for user access
CREATE POLICY "Users can view their own catalog products" 
ON public.catalog_products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own catalog products" 
ON public.catalog_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catalog products" 
ON public.catalog_products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catalog products" 
ON public.catalog_products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public access for viewing visible products
CREATE POLICY "Anyone can view visible catalog products" 
ON public.catalog_products 
FOR SELECT 
USING (is_visible = true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_catalog_products_user_id ON public.catalog_products(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_display_order ON public.catalog_products(display_order);

-- Migration: 20251031203941
-- Add new columns to catalog_products table
ALTER TABLE catalog_products
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS button_text text DEFAULT 'Mais informações',
ADD COLUMN IF NOT EXISTS link_type text DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS link_url text,
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS show_images_above boolean DEFAULT false;

-- Add check constraint for link_type
ALTER TABLE catalog_products
DROP CONSTRAINT IF EXISTS catalog_products_link_type_check;

ALTER TABLE catalog_products
ADD CONSTRAINT catalog_products_link_type_check 
CHECK (link_type IN ('whatsapp', 'custom', 'pix'));


-- Migration: 20251031214828
-- Create contact_forms table to store form configurations
CREATE TABLE IF NOT EXISTS public.contact_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Fale Conosco',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  require_form_fill BOOLEAN NOT NULL DEFAULT false,
  send_email_notifications BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_submissions table to store form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.contact_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Contact forms policies
CREATE POLICY "Users can view their own contact forms"
  ON public.contact_forms
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact forms"
  ON public.contact_forms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact forms"
  ON public.contact_forms
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact forms"
  ON public.contact_forms
  FOR DELETE
  USING (auth.uid() = user_id);

-- Contact submissions policies
CREATE POLICY "Users can view submissions for their forms"
  ON public.contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_forms
      WHERE contact_forms.id = contact_submissions.form_id
      AND contact_forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit to active forms"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_forms_updated_at
  BEFORE UPDATE ON public.contact_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_contact_forms_user_id ON public.contact_forms(user_id);
CREATE INDEX idx_contact_submissions_form_id ON public.contact_submissions(form_id);
CREATE INDEX idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at DESC);
