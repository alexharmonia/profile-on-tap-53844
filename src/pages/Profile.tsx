import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  Phone, Mail, MessageCircle, Share2, MapPin, Briefcase,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Music,
  Globe, QrCode, ShoppingBag, ArrowLeft, Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [customLinks, setCustomLinks] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    // Load social links
    const { data: socialData } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    setSocialLinks(socialData || []);

    // Load custom links
    const { data: customData } = await supabase
      .from('custom_links')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    setCustomLinks(customData || []);

    // Load catalog products
    const { data: catalogData } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_visible', true)
      .order('display_order');

    setCatalogProducts(catalogData || []);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: formData } = await supabase
      .from('contact_forms')
      .select('id')
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .single();

    if (!formData) {
      toast({
        title: "Erro",
        description: "Formulário de contato não configurado",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        form_id: formData.id,
        user_id: user?.id,
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso!",
      description: "Mensagem enviada com sucesso"
    });

    setContactForm({ name: '', email: '', message: '' });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/card/${user?.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link do seu perfil foi copiado"
    });
  };

  const handleSaveContact = () => {
    // Criar vCard
    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    vcard += `FN:${profile?.full_name || 'Contato'}\n`;
    
    if (profile?.company) {
      vcard += `ORG:${profile.company}\n`;
    }
    
    if (profile?.position) {
      vcard += `TITLE:${profile.position}\n`;
    }
    
    if (profile?.phone) {
      vcard += `TEL;TYPE=WORK,VOICE:${profile.phone}\n`;
    }
    
    if (profile?.whatsapp_number) {
      vcard += `TEL;TYPE=CELL:${profile.whatsapp_number}\n`;
    }
    
    if (profile?.email) {
      vcard += `EMAIL:${profile.email}\n`;
    }
    
    if (profile?.website) {
      vcard += `URL:${profile.website}\n`;
    }
    
    if (profile?.location) {
      vcard += `ADR:;;${profile.location};;;;\n`;
    }
    
    vcard += 'END:VCARD\n';

    // Criar blob e fazer download
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile?.full_name || 'contato'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sucesso!",
      description: "Contato salvo com sucesso"
    });
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'linkedin': return Linkedin;
      case 'youtube': return Youtube;
      case 'spotify': return Music;
      default: return Globe;
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary">
        <p className="text-primary-foreground">Carregando...</p>
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary">
      {/* Header with Back Button */}
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-primary-foreground hover:bg-white/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] mb-6 overflow-hidden">
          <div className="bg-gradient-to-br from-white/20 to-transparent p-8 text-center">
            <Avatar className="h-32 w-32 mx-auto border-4 border-white shadow-[var(--shadow-elegant)] mb-4">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="text-4xl font-bold bg-white text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">
              {profile?.full_name}
            </h1>
            
            {profile?.bio && (
              <p className="text-primary-foreground/90 italic text-lg mb-4">
                "{profile.bio}"
              </p>
            )}

            {(profile?.company || profile?.position) && (
              <div className="flex items-center justify-center gap-2 text-primary-foreground/80 mb-4">
                <Briefcase className="h-4 w-4" />
                <span>
                  {profile?.position}{profile?.position && profile?.company ? ' - ' : ''}{profile?.company}
                </span>
              </div>
            )}

            {profile?.location && (
              <div className="flex items-center justify-center gap-2 text-primary-foreground/80 mb-4">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}

            <p className="text-primary-foreground/70 text-sm italic mb-4">
              Tecnologia que funciona de verdade!
            </p>

            <Button
              onClick={handleSaveContact}
              className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-primary-foreground border-2 border-white/30 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold px-8 py-6 text-lg"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Salvar Agenda
            </Button>
          </div>
        </Card>

        {/* Contact Buttons */}
        <div className="space-y-3 mb-6">
          {profile?.phone && (
            <Button
              className="w-full h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground"
              variant="outline"
              onClick={() => window.open(`tel:${profile.phone}`)}
            >
              <Phone className="h-5 w-5 mr-3" />
              Telefone
            </Button>
          )}

          {profile?.whatsapp_number && (
            <Button
              className="w-full h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground"
              variant="outline"
              onClick={() => window.open(`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`)}
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              WhatsApp
            </Button>
          )}

          {profile?.email && (
            <Button
              className="w-full h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground"
              variant="outline"
              onClick={() => window.open(`mailto:${profile.email}`)}
            >
              <Mail className="h-5 w-5 mr-3" />
              E-mail
            </Button>
          )}
        </div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="space-y-3 mb-6">
            {socialLinks.map((link) => {
              const Icon = getSocialIcon(link.platform);
              return (
                <Button
                  key={link.id}
                  className="w-full h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground capitalize"
                  variant="outline"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {link.platform}
                </Button>
              );
            })}
          </div>
        )}

        {/* Custom Links */}
        {customLinks.length > 0 && (
          <div className="space-y-3 mb-6">
            {customLinks.map((link) => (
              <Button
                key={link.id}
                className="w-full h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground"
                variant="outline"
                onClick={() => window.open(link.url, '_blank')}
              >
                <Globe className="h-5 w-5 mr-3" />
                {link.title}
              </Button>
            ))}
          </div>
        )}

        {/* PIX Information */}
        {profile?.pix_key && (
          <Button
            className="w-full h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground mb-6"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(profile.pix_key);
              toast({
                title: "Copiado!",
                description: "Chave PIX copiada para a área de transferência"
              });
            }}
          >
            <QrCode className="h-5 w-5 mr-3" />
            PIX QR Code
          </Button>
        )}

        {/* Catalog Products */}
        {catalogProducts.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] mb-6 p-6">
            <h2 className="text-2xl font-bold text-primary-foreground mb-4 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Catálogo de Produtos
            </h2>
            <div className="space-y-4">
              {catalogProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                >
                  <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-primary-foreground/80 text-sm mb-2">
                      {product.description}
                    </p>
                  )}
                  {product.price && (
                    <p className="text-primary-foreground font-bold">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Contact Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] p-6">
          <h2 className="text-2xl font-bold text-primary-foreground mb-6">
            Fale Conosco
          </h2>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-primary-foreground">Nome</Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-primary-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-primary-foreground">Mensagem</Label>
              <Input
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border border-white/30"
            >
              Enviar Mensagem
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
