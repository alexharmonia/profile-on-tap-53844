-- Allow anyone to view customization settings (for public card pages)
CREATE POLICY "Anyone can view customization settings"
ON public.customization_settings
FOR SELECT
USING (true);