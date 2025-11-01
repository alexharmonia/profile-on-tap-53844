import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CustomLinkSectionProps {
  profile: any;
  onUpdate: () => void;
}

export const CustomLinkSection = ({ profile, onUpdate }: CustomLinkSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState(profile?.custom_slug || '');

  const handleSave = async () => {
    if (!slug.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um slug válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_slug: slug.toLowerCase().trim() })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Link personalizado atualizado com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating custom link:', error);
      toast({
        title: "Erro",
        description: "Este slug já está em uso ou ocorreu um erro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Crie um link personalizado para compartilhar seu perfil de forma mais fácil e profissional.
        </p>

        <div className="space-y-2">
          <Label htmlFor="slug">Seu Link Personalizado</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
              airgo.bio/
            </span>
            <Input
              id="slug"
              placeholder="seunome"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              className="flex-1"
            />
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Use este link em sua bio do Instagram e outras redes sociais para facilitar o acesso ao seu cartão digital.
          </p>
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
