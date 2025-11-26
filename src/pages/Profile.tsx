import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  Phone, Mail, MessageCircle, Share2, MapPin, Briefcase,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Music,
  Globe, QrCode, ShoppingBag, Download, Copy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QRCodeComponent from 'react-qr-code';
import { generatePixPayload } from '@/lib/pixUtils';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [customLinks, setCustomLinks] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixAmount, setPixAmount] = useState('');
  const [pixQRData, setPixQRData] = useState('');
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
      {/* Header - Sem botões */}
      <div className="container mx-auto max-w-2xl px-3 sm:px-4 py-4 sm:py-6">
        {/* Profile Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] mb-4 sm:mb-6 overflow-hidden">
          <div className="bg-gradient-to-br from-white/20 to-transparent p-4 sm:p-6 md:p-8 text-center">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 mx-auto border-4 border-white shadow-[var(--shadow-elegant)] mb-4">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl font-bold bg-white text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-2 px-2">
              {profile?.full_name}
            </h1>
            
            {profile?.bio && (
              <p className="text-primary-foreground/90 italic text-base sm:text-lg mb-4 px-2">
                "{profile.bio}"
              </p>
            )}

            {(profile?.company || profile?.position) && (
              <div className="flex items-center justify-center gap-2 text-primary-foreground/80 mb-4 px-2 flex-wrap">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base text-center">
                  {profile?.position}{profile?.position && profile?.company ? ' - ' : ''}{profile?.company}
                </span>
              </div>
            )}

            {profile?.location && (
              <div className="flex items-center justify-center gap-2 text-primary-foreground/80 mb-4 px-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base">{profile.location}</span>
              </div>
            )}

            <p className="text-primary-foreground/70 text-xs sm:text-sm italic mb-4 px-2">
              Tecnologia que funciona de verdade!
            </p>

            {/* Botões de ação no perfil */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Button
                onClick={handleSaveContact}
                className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-primary-foreground border-2 border-white/30 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                size="lg"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Salvar Agenda
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-primary-foreground border-2 border-white/30 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                size="lg"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </Card>

        {/* Contact Buttons */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {profile?.phone && (
            <Button
              className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground text-sm sm:text-base"
              variant="outline"
              onClick={() => window.open(`tel:${profile.phone}`)}
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              Telefone
            </Button>
          )}

          {profile?.whatsapp_number && (
            <Button
              className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground text-sm sm:text-base"
              variant="outline"
              onClick={() => window.open(`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`)}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              WhatsApp
            </Button>
          )}

          {profile?.email && (
            <Button
              className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground text-sm sm:text-base"
              variant="outline"
              onClick={() => window.open(`mailto:${profile.email}`)}
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              E-mail
            </Button>
          )}
        </div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {socialLinks.map((link) => {
              const Icon = getSocialIcon(link.platform);
              return (
                <Button
                  key={link.id}
                  className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground capitalize text-sm sm:text-base"
                  variant="outline"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                  {link.platform}
                </Button>
              );
            })}
          </div>
        )}

        {/* Custom Links */}
        {customLinks.length > 0 && (
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {customLinks.map((link) => (
              <Button
                key={link.id}
                className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground text-sm sm:text-base"
                variant="outline"
                onClick={() => window.open(link.url, '_blank')}
              >
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                {link.title}
              </Button>
            ))}
          </div>
        )}

        {/* PIX Information */}
        {profile?.pix_key && (
          <Button
            className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-primary-foreground mb-4 sm:mb-6 text-sm sm:text-base"
            variant="outline"
            onClick={() => setPixDialogOpen(true)}
          >
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
            PIX QR Code
          </Button>
        )}

        {/* Catalog Products */}
        {catalogProducts.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] mb-4 sm:mb-6 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              Catálogo de Produtos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {catalogProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-primary-foreground mb-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-primary-foreground/80 text-xs sm:text-sm mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {product.price && (
                    <p className="text-primary-foreground font-bold text-sm sm:text-base">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Contact Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-4 sm:mb-6">
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

      {/* PIX QR Code Dialog */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-gradient-to-br from-card/95 to-card/90 border-border/50 shadow-[var(--shadow-elegant)]">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
              <QrCode className="h-7 w-7 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl text-center font-bold">PIX QR Code</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Digite o valor do PIX para gerar o QR Code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="pix-amount" className="text-sm font-medium">Digite o valor do PIX</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm shadow-sm">
                  R$
                </div>
                <Input
                  id="pix-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={pixAmount}
                  onChange={(e) => setPixAmount(e.target.value)}
                  className="pl-16 h-12 text-lg border-border/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (!pixAmount || parseFloat(pixAmount) <= 0) {
                  toast({
                    title: "Valor inválido",
                    description: "Por favor, digite um valor válido.",
                    variant: "destructive",
                  });
                  return;
                }

                // Gera payload PIX válido
                const amount = parseFloat(pixAmount);
                const pixPayload = generatePixPayload(
                  profile.pix_key,
                  profile.pix_beneficiary_name || profile.full_name,
                  profile.pix_beneficiary_city || 'SAO PAULO',
                  amount,
                  `TXN${Date.now()}`
                );
                setPixQRData(pixPayload);
              }}
              className="w-full h-12 text-base font-semibold shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              size="lg"
            >
              Gerar QR Code
            </Button>

            {pixQRData && (
              <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-center p-6 bg-white rounded-xl shadow-inner">
                  <QRCodeComponent value={pixQRData} size={200} level="H" />
                </div>
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/30">
                  <p className="text-sm font-medium text-foreground">Informações do PIX:</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p><span className="font-semibold">Chave:</span> {profile.pix_key}</p>
                    <p><span className="font-semibold">Beneficiário:</span> {profile.pix_beneficiary_name || profile.full_name}</p>
                    <p><span className="font-semibold">Valor:</span> R$ {parseFloat(pixAmount).toFixed(2)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(pixQRData);
                      toast({
                        title: "Copiado!",
                        description: "Código PIX copiado para a área de transferência",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
