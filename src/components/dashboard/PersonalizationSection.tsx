import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Upload } from 'lucide-react';

interface PersonalizationSectionProps {
  profile: any;
  onUpdate: () => void;
}

export const PersonalizationSection = ({ profile, onUpdate }: PersonalizationSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    profile_image_url: profile?.profile_image_url || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          profile_image_url: formData.profile_image_url,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = () => {
    setFormData(prev => ({ ...prev, profile_image_url: '' }));
  };

  const initials = formData.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografia</Label>
        <Textarea
          id="bio"
          placeholder="Conte um pouco sobre você..."
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="space-y-4">
        <Label>Imagem de Perfil</Label>
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-primary/10">
            <AvatarImage src={formData.profile_image_url} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="URL da imagem"
              value={formData.profile_image_url}
              onChange={(e) => handleChange('profile_image_url', e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Escolher Imagem
              </Button>
              {formData.profile_image_url && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" size="lg">
          Acessar personalização
        </Button>
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>
  );
};
