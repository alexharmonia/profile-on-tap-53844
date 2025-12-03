-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Enable realtime for customization_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.customization_settings;

-- Enable realtime for catalog_products table
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_products;