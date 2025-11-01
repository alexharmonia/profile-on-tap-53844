import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('E-mail inválido').max(255),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

const Editor = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    company: '',
    position: '',
    website: '',
  });
  const [socialLinks, setSocialLinks] = useState<Array<{ id?: string; platform: string; url: string }>>([]);
  const [customLinks, setCustomLinks] = useState<Array<{ id?: string; title: string; url: string }>>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      loadProfile();
    }
  }, [user, loading, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        company: profileData.company || '',
        position: profileData.position || '',
        website: profileData.website || '',
      });
    }

    const { data: socialData } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (socialData) {
      setSocialLinks(socialData);
    }

    const { data: customData } = await supabase
      .from('custom_links')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (customData) {
      setCustomLinks(customData);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      profileSchema.parse(profile);

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Save social links
      for (const link of socialLinks) {
        if (link.id) {
          await supabase
            .from('social_links')
            .update({ platform: link.platform, url: link.url })
            .eq('id', link.id);
        } else if (link.platform && link.url) {
          await supabase
            .from('social_links')
            .insert({ user_id: user.id, platform: link.platform, url: link.url, display_order: socialLinks.indexOf(link) });
        }
      }

      // Save custom links
      for (const link of customLinks) {
        if (link.id) {
          await supabase
            .from('custom_links')
            .update({ title: link.title, url: link.url })
            .eq('id', link.id);
        } else if (link.title && link.url) {
          await supabase
            .from('custom_links')
            .insert({ user_id: user.id, title: link.title, url: link.url, display_order: customLinks.indexOf(link) });
        }
      }

      toast.success('Perfil salvo com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error('Erro ao salvar perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '' }]);
  };

  const removeSocialLink = async (index: number) => {
    const link = socialLinks[index];
    if (link.id) {
      await supabase.from('social_links').delete().eq('id', link.id);
    }
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const addCustomLink = () => {
    setCustomLinks([...customLinks, { title: '', url: '' }]);
  };

  const removeCustomLink = async (index: number) => {
    const link = customLinks[index];
    if (link.id) {
      await supabase.from('custom_links').delete().eq('id', link.id);
    }
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Editor de Perfil</h1>
            <p className="text-muted-foreground">Personalize suas informações de contato</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Informações básicas do seu perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://seusite.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Nome da Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    placeholder="Desenvolvedor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Redes Sociais</CardTitle>
                  <CardDescription>Adicione links para suas redes sociais</CardDescription>
                </div>
                <Button onClick={addSocialLink} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Plataforma (ex: Instagram)"
                    value={link.platform}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index].platform = e.target.value;
                      setSocialLinks(newLinks);
                    }}
                  />
                  <Input
                    placeholder="URL (ex: https://instagram.com/seu-perfil)"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index].url = e.target.value;
                      setSocialLinks(newLinks);
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeSocialLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {socialLinks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma rede social adicionada ainda
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Links Personalizados</CardTitle>
                  <CardDescription>Adicione links customizados</CardDescription>
                </div>
                <Button onClick={addCustomLink} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {customLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Título (ex: Portfólio)"
                    value={link.title}
                    onChange={(e) => {
                      const newLinks = [...customLinks];
                      newLinks[index].title = e.target.value;
                      setCustomLinks(newLinks);
                    }}
                  />
                  <Input
                    placeholder="URL (ex: https://meuportfolio.com)"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...customLinks];
                      newLinks[index].url = e.target.value;
                      setCustomLinks(newLinks);
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeCustomLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {customLinks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum link personalizado adicionado ainda
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;