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
import { iconOptions } from '@/components/IconPicker';
import { ShareDialog } from '@/components/ShareDialog';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [customLinks, setCustomLinks] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [customization, setCustomization] = useState<any>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixAmount, setPixAmount] = useState('');
  const [pixQRData, setPixQRData] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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

      // Setup realtime listeners
      const profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            loadProfileData();
          }
        )
        .subscribe();

      const customizationChannel = supabase
        .channel('customization-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customization_settings',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadProfileData();
          }
        )
        .subscribe();

      const catalogChannel = supabase
        .channel('catalog-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'catalog_products',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadProfileData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(customizationChannel);
        supabase.removeChannel(catalogChannel);
      };
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

    // Load customization settings
    const { data: customizationData } = await supabase
      .from('customization_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setCustomization(customizationData);

    // Load social links (for display_order and show_icon_only settings)
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

  // Build unified links list combining social links from profile with custom links
  const buildUnifiedLinks = () => {
    if (!profile) return [];

    const socialLinkConfig: Record<string, { title: string; icon: any; getUrl: () => string | null }> = {
      phone: { title: 'Telefone', icon: Phone, getUrl: () => profile?.phone ? `tel:${profile.phone}` : null },
      whatsapp: { title: 'WhatsApp', icon: MessageCircle, getUrl: () => profile?.whatsapp_number ? `https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}` : null },
      email: { title: 'E-mail', icon: Mail, getUrl: () => profile?.email ? `mailto:${profile.email}` : null },
      google_reviews: { title: 'Avaliações no Google', icon: Globe, getUrl: () => profile?.google_reviews_url || null },
      instagram: { title: 'Instagram', icon: Instagram, getUrl: () => profile?.instagram_handle ? `https://instagram.com/${profile.instagram_handle}` : null },
      website: { title: 'Website', icon: Globe, getUrl: () => profile?.website || null },
    };

    const unifiedLinks: Array<{
      id: string;
      title: string;
      url: string;
      icon: any;
      display_order: number;
      show_icon_only: boolean;
      type: 'social' | 'custom';
      link_type?: 'url' | 'wifi';
    }> = [];

    // Add profile-based social links
    Object.entries(socialLinkConfig).forEach(([key, config], index) => {
      const url = config.getUrl();
      if (url) {
        const socialLink = socialLinks.find(s => s.platform === key);
        unifiedLinks.push({
          id: `profile-${key}`,
          title: config.title,
          url: url,
          icon: config.icon,
          display_order: socialLink?.display_order ?? 100 + index,
          show_icon_only: socialLink?.show_icon_only || false,
          type: 'social',
        });
      }
    });

    // Add custom links
    customLinks.forEach(link => {
      unifiedLinks.push({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: getCustomLinkIcon(link.icon),
        display_order: link.display_order,
        show_icon_only: link.show_icon_only || false,
        type: 'custom',
        link_type: (link.link_type as 'url' | 'wifi') || 'url',
      });
    });

  // Sort by display_order
    return unifiedLinks.sort((a, b) => a.display_order - b.display_order);
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

  const getCustomLinkIcon = (iconId: string) => {
    if (!iconOptions || !Array.isArray(iconOptions)) return Globe;
    const iconOption = iconOptions.find(opt => opt.id === iconId);
    return iconOption?.icon || Globe;
  };

  // Build unified links - must be after profile check
  const unifiedLinks = profile ? buildUnifiedLinks() : [];

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

  // Build background style from customization settings
  const backgroundStyle: React.CSSProperties = customization?.background_type === 'image' && customization?.background_image_url
    ? {
        backgroundImage: `url(${customization.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1E40AF' // fallback color while image loads
      }
    : customization?.background_type === 'gradient' && customization?.background_color?.startsWith('linear-gradient')
    ? {
        background: customization.background_color
      }
    : {
        backgroundColor: customization?.background_color || '#1E40AF'
      };

  // Build item style from customization settings
  const itemStyle: React.CSSProperties = {
    backgroundColor: customization?.item_color ? `${customization.item_color}` : undefined,
    color: customization?.text_color || undefined,
    opacity: customization?.item_opacity ?? 1,
    borderRadius: customization?.item_corner_radius ? `${customization.item_corner_radius}px` : undefined,
  };

  // Text color for profile sections
  const textColor = customization?.text_color || '#FFFFFF';

  return (
    <div 
      className="min-h-screen"
      style={backgroundStyle}
    >
      {/* Header - Sem botões */}
      <div className="container mx-auto max-w-2xl px-3 sm:px-4 py-4 sm:py-6">
        {/* Profile Card */}
        <Card 
          className="backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] mb-4 sm:mb-6 overflow-hidden"
          style={{
            backgroundColor: customization?.item_color ? `${customization.item_color}${Math.round((customization?.item_opacity ?? 1) * 255).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.1)',
            borderRadius: customization?.item_corner_radius ? `${customization.item_corner_radius}px` : undefined,
          }}
        >
          <div className="p-4 sm:p-6 md:p-8 text-center">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 mx-auto border-4 border-white/50 shadow-[var(--shadow-elegant)] mb-4">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl font-bold bg-white text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2 px-2"
              style={{ color: textColor }}
            >
              {profile?.full_name}
            </h1>
            
            {profile?.bio && (
              <p 
                className="italic text-base sm:text-lg mb-4 px-2 opacity-90"
                style={{ color: textColor }}
              >
                "{profile.bio}"
              </p>
            )}

            {(profile?.company || profile?.position) && (
              <div 
                className="flex items-center justify-center gap-2 mb-4 px-2 flex-wrap opacity-80"
                style={{ color: textColor }}
              >
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base text-center">
                  {profile?.position}{profile?.position && profile?.company ? ' - ' : ''}{profile?.company}
                </span>
              </div>
            )}

            {profile?.location && (
              <div 
                className="flex items-center justify-center gap-2 mb-4 px-2 opacity-80"
                style={{ color: textColor }}
              >
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base">{profile.location}</span>
              </div>
            )}

            {/* Botões de ação no perfil */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Button
                onClick={handleSaveContact}
                className="border border-white/20 shadow-sm hover:shadow-md transition-all duration-300 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto hover:opacity-80 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: textColor,
                }}
                size="lg"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Salvar Agenda
              </Button>
              <Button
                onClick={() => setShareDialogOpen(true)}
                variant="outline"
                className="border border-white/20 shadow-sm hover:shadow-md transition-all duration-300 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto hover:opacity-80 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: textColor,
                }}
                size="lg"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </Card>

        {/* Icon-only links - horizontal row */}
        {unifiedLinks.filter(l => l.show_icon_only).length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {unifiedLinks.filter(l => l.show_icon_only).map((link) => {
              const Icon = link.icon;
              const handleClick = () => {
                if (link.link_type === 'wifi') {
                  navigator.clipboard.writeText(link.url);
                  toast({
                    title: "Senha copiada!",
                    description: "A senha do Wi-Fi foi copiada para a área de transferência.",
                  });
                } else {
                  window.open(link.url, '_blank');
                }
              };
              return (
                <Button
                  key={link.id}
                  className="w-12 h-12 sm:w-14 sm:h-14 p-0 backdrop-blur-md border-white/20 hover:opacity-80 transition-all"
                  variant="outline"
                  style={itemStyle}
                  onClick={handleClick}
                  title={link.link_type === 'wifi' ? `${link.title} - Clique para copiar` : link.title}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              );
            })}
          </div>
        )}

        {/* Links with text - vertical list */}
        {unifiedLinks.filter(l => !l.show_icon_only).length > 0 && (
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
            {unifiedLinks.filter(l => !l.show_icon_only).map((link) => {
              const Icon = link.icon;
              const handleClick = () => {
                if (link.link_type === 'wifi') {
                  navigator.clipboard.writeText(link.url);
                  toast({
                    title: "Senha copiada!",
                    description: "A senha do Wi-Fi foi copiada para a área de transferência.",
                  });
                } else {
                  window.open(link.url, '_blank');
                }
              };
              return (
                <Button
                  key={link.id}
                  className="w-full h-12 sm:h-14 px-4 sm:px-6 backdrop-blur-md border-white/20 hover:opacity-80 text-sm sm:text-base transition-all"
                  variant="outline"
                  style={itemStyle}
                  onClick={handleClick}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                  {link.title}
                </Button>
              );
            })}
          </div>
        )}

        {/* PIX Information */}
        {profile?.pix_key && (
          <Button
            className="w-full h-12 sm:h-14 backdrop-blur-md border-white/20 hover:opacity-80 mb-4 sm:mb-6 text-sm sm:text-base transition-all"
            variant="outline"
            style={itemStyle}
            onClick={() => setPixDialogOpen(true)}
          >
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
            PIX QR Code
          </Button>
        )}

        {/* Catalog Products */}
        {catalogProducts.length > 0 && (
          <div className="space-y-4 mb-4 sm:mb-6">
            <h2 
              className="text-xl sm:text-2xl font-bold flex items-center gap-2"
              style={{ color: textColor }}
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              Catálogo de Produtos
            </h2>
            <div className="space-y-4">
              {catalogProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="overflow-hidden shadow-lg backdrop-blur-md"
                  style={{
                    backgroundColor: customization?.item_color ? `${customization.item_color}${Math.round((customization?.item_opacity ?? 1) * 255).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.9)',
                    borderRadius: customization?.item_corner_radius ? `${customization.item_corner_radius}px` : undefined,
                  }}
                >
                  {/* Product Images - Show above title if show_images_above is true */}
                  {product.show_images_above && product.images && product.images.length > 0 && (
                    <div className="w-full">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 
                      className="text-lg sm:text-xl font-bold mb-2"
                      style={{ color: textColor }}
                    >
                      {product.name}
                    </h3>

                    {/* Product Images - Show below title if show_images_above is false */}
                    {!product.show_images_above && product.images && product.images.length > 0 && (
                      <div className="w-full mb-3 -mx-4">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-48 sm:h-56 object-cover"
                        />
                      </div>
                    )}

                    {product.description && (
                      <p 
                        className="text-sm mb-3 opacity-80"
                        style={{ color: textColor }}
                      >
                        {product.description}
                      </p>
                    )}
                    {product.price && (
                      <p 
                        className="text-xl font-bold mb-4"
                        style={{ color: textColor }}
                      >
                        R$ {parseFloat(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                    <Button 
                      className="w-full bg-white hover:bg-gray-50 border border-gray-200 font-semibold"
                      style={{ color: '#647498' }}
                      onClick={() => {
                        if (product.link_type === 'whatsapp' && product.link_url) {
                          window.open(`https://wa.me/${product.link_url}`, '_blank');
                        } else if (product.link_type === 'pix') {
                          setPixDialogOpen(true);
                        } else if (product.link_url) {
                          window.open(product.link_url, '_blank');
                        }
                      }}
                    >
                      {product.button_text || 'Mais informações'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        <Card 
          className="backdrop-blur-md border-white/20 shadow-[var(--shadow-glow)] p-4 sm:p-6"
          style={{
            backgroundColor: customization?.item_color ? `${customization.item_color}${Math.round((customization?.item_opacity ?? 1) * 255).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.1)',
            borderRadius: customization?.item_corner_radius ? `${customization.item_corner_radius}px` : undefined,
          }}
        >
          <h2 
            className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
            style={{ color: textColor }}
          >
            Fale Conosco
          </h2>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" style={{ color: textColor }}>Nome</Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                className="bg-white/10 border-white/20"
                style={{ color: textColor }}
              />
            </div>
            <div>
              <Label htmlFor="email" style={{ color: textColor }}>E-mail</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
                className="bg-white/10 border-white/20"
                style={{ color: textColor }}
              />
            </div>
            <div>
              <Label htmlFor="message" style={{ color: textColor }}>Mensagem</Label>
              <Input
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                className="bg-white/10 border-white/20"
                style={{ color: textColor }}
              />
            </div>
            <Button
              type="submit"
              className="w-full border border-white/30 hover:opacity-80"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: textColor,
              }}
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

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        profileUrl={`${window.location.origin}/card/${user?.id}`}
        userName={profile?.full_name || 'Usuário'}
      />
    </div>
  );
};

export default Profile;
