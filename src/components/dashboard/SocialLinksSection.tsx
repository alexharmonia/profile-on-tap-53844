import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SocialLinksSectionProps {
  profile: any;
  onUpdate: () => void;
}

export const SocialLinksSection = ({ profile, onUpdate }: SocialLinksSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    facebook_url: profile?.facebook_url || '',
    instagram_handle: profile?.instagram_handle || '',
    twitter_handle: profile?.twitter_handle || '',
    linkedin_url: profile?.linkedin_url || '',
    whatsapp_number: profile?.whatsapp_number || '',
    spotify_url: profile?.spotify_url || '',
    youtube_url: profile?.youtube_url || '',
    tiktok_handle: profile?.tiktok_handle || '',
    email: profile?.email || '',
    website: profile?.website || '',
    location: profile?.location || '',
    google_reviews_url: profile?.google_reviews_url || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Redes sociais atualizadas com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating social links:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="+55 (11) 99999-9999"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            placeholder="+55 (11) 99999-9999"
            value={formData.whatsapp_number}
            onChange={(e) => handleChange('whatsapp_number', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="https://seusite.com"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              @
            </span>
            <Input
              id="instagram"
              className="rounded-l-none"
              placeholder="seuusuario"
              value={formData.instagram_handle}
              onChange={(e) => handleChange('instagram_handle', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            placeholder="https://facebook.com/..."
            value={formData.facebook_url}
            onChange={(e) => handleChange('facebook_url', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">X / Twitter</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              @
            </span>
            <Input
              id="twitter"
              className="rounded-l-none"
              placeholder="seuusuario"
              value={formData.twitter_handle}
              onChange={(e) => handleChange('twitter_handle', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            placeholder="https://linkedin.com/in/..."
            value={formData.linkedin_url}
            onChange={(e) => handleChange('linkedin_url', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spotify">Spotify</Label>
          <Input
            id="spotify"
            placeholder="https://open.spotify.com/..."
            value={formData.spotify_url}
            onChange={(e) => handleChange('spotify_url', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube">YouTube</Label>
          <Input
            id="youtube"
            placeholder="https://youtube.com/..."
            value={formData.youtube_url}
            onChange={(e) => handleChange('youtube_url', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiktok">TikTok</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              @
            </span>
            <Input
              id="tiktok"
              className="rounded-l-none"
              placeholder="seuusuario"
              value={formData.tiktok_handle}
              onChange={(e) => handleChange('tiktok_handle', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            placeholder="São Paulo, Brasil"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="google-reviews">Avaliações no Google</Label>
          <Input
            id="google-reviews"
            placeholder="https://g.page/..."
            value={formData.google_reviews_url}
            onChange={(e) => handleChange('google_reviews_url', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>
  );
};
