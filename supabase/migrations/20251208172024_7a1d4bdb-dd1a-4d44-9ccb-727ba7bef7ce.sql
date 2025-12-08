-- Add link_type column to custom_links table to differentiate between url links and wifi password links
ALTER TABLE public.custom_links 
ADD COLUMN link_type text DEFAULT 'url';

-- Add comment for clarity
COMMENT ON COLUMN public.custom_links.link_type IS 'Type of link: url (opens URL) or wifi (copies password to clipboard)';