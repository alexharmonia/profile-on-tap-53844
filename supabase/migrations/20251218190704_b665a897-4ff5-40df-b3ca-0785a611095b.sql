-- Remove old constraint and add new one with 'gradient' option
ALTER TABLE public.customization_settings 
DROP CONSTRAINT IF EXISTS customization_settings_background_type_check;

ALTER TABLE public.customization_settings 
ADD CONSTRAINT customization_settings_background_type_check 
CHECK (background_type = ANY (ARRAY['color'::text, 'image'::text, 'gradient'::text]));