-- Create customization settings table
CREATE TABLE IF NOT EXISTS public.customization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item colors and styles
  item_color TEXT DEFAULT '#4F46E5',
  text_color TEXT DEFAULT '#FFFFFF',
  item_opacity NUMERIC DEFAULT 1.0 CHECK (item_opacity >= 0 AND item_opacity <= 1),
  item_corner_radius NUMERIC DEFAULT 12 CHECK (item_corner_radius >= 0 AND item_corner_radius <= 50),
  
  -- Background settings
  background_type TEXT DEFAULT 'color' CHECK (background_type IN ('color', 'image')),
  background_color TEXT DEFAULT '#1E40AF',
  background_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.customization_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own customization"
  ON public.customization_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customization"
  ON public.customization_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customization"
  ON public.customization_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customization_settings_updated_at
  BEFORE UPDATE ON public.customization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();