import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card as CardUI, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Globe, Building2, Briefcase, ExternalLink, User, MessageCircle, QrCode, Send, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import QRCodeComponent from 'react-qr-code';
import { generatePixPayload } from '@/lib/pixUtils';
import { toast } from 'sonner';

interface Profile {
  full_name: string;
  email: string;
  phone?: string;
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  profile_image_url?: string;
  pix_key?: string;
  pix_beneficiary_name?: string;
  pix_beneficiary_city?: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface CustomLink {
  title: string;
  url: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number | null;
  is_visible: boolean;
  description?: string | null;
  button_text?: string | null;
  link_type?: string | null;
  link_url?: string | null;
  show_images_above?: boolean | null;
  images?: string[] | null;
}

interface ContactFormField {
  type: 'name' | 'email' | 'phone' | 'message';
  label: string;
  required: boolean;
}

interface ContactForm {
  id: string;
  title: string;
  fields: ContactFormField[];
  require_form_fill: boolean;
  is_active: boolean;
}

const Card = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [contactForm, setContactForm] = useState<ContactForm | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixAmount, setPixAmount] = useState('');
  const [pixQRData, setPixQRData] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [customization, setCustomization] = useState({
    item_color: '#4F46E5',
    text_color: '#FFFFFF',
    item_opacity: 1.0,
    item_corner_radius: 12,
    background_type: 'color' as 'color' | 'image' | 'gradient',
    background_color: '#1E40AF',
    background_image_url: '',
  });

  useEffect(() => {
    loadProfile();

    // Setup realtime listeners
    const profileChannel = supabase
      .channel('card-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.new && (payload.new as any).id === userId) {
            loadProfile();
          }
        }
      )
      .subscribe();

    const customizationChannel = supabase
      .channel('card-customization-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customization_settings'
        },
        (payload) => {
          if (payload.new && (payload.new as any).user_id === userId) {
            loadProfile();
          }
        }
      )
      .subscribe();

    const catalogChannel = supabase
      .channel('card-catalog-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'catalog_products'
        },
        (payload) => {
          if (payload.new && (payload.new as any).user_id === userId) {
            loadProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(customizationChannel);
      supabase.removeChannel(catalogChannel);
    };
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (socialData) {
        setSocialLinks(socialData);
      }

      const { data: customData } = await supabase
        .from('custom_links')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (customData) {
        setCustomLinks(customData);
      }

      const { data: productsData } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('user_id', userId)
        .eq('is_visible', true)
        .order('display_order');

      if (productsData) {
        setCatalogProducts(productsData);
      }

      const { data: contactData } = await supabase
        .from('contact_forms')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (contactData) {
        setContactForm({
          ...contactData,
          fields: (contactData.fields as any) || [],
        });
        setShowContactForm(contactData.require_form_fill);
      }

      // Carregar configurações de personalização
      const { data: customizationData } = await supabase
        .from('customization_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (customizationData) {
        setCustomization({
          item_color: customizationData.item_color || '#4F46E5',
          text_color: customizationData.text_color || '#FFFFFF',
          item_opacity: customizationData.item_opacity || 1.0,
          item_corner_radius: customizationData.item_corner_radius || 12,
          background_type: (customizationData.background_type === 'image' ? 'image' : customizationData.background_type === 'gradient' ? 'gradient' : 'color') as 'color' | 'image' | 'gradient',
          background_color: customizationData.background_color || '#1E40AF',
          background_image_url: customizationData.background_image_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          form_id: contactForm.id,
          user_id: userId!,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        }]);

      if (error) throw error;

      setFormData({ name: '', email: '', phone: '', message: '' });
      setShowContactForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-primary)]">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-primary)]">
        <CardUI className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Perfil não encontrado</p>
          </CardContent>
        </CardUI>
      </div>
    );
  }

  if (showContactForm && contactForm) {
    return (
      <div className="min-h-screen bg-[image:var(--gradient-primary)] py-12 px-4 flex items-center justify-center">
        <CardUI className="max-w-md w-full backdrop-blur-xl bg-card/95 border-border/50 shadow-[var(--shadow-card)]">
          <CardContent className="pt-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {contactForm.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                Preencha o formulário abaixo para continuar
              </p>
            </div>

            <form onSubmit={handleSubmitContact} className="space-y-4">
              {contactForm.fields.map((field: any, index: number) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={field.type} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === 'message' ? (
                    <Textarea
                      id={field.type}
                      required={field.required}
                      value={formData[field.type as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.type]: e.target.value })}
                      className="min-h-[100px] resize-none transition-all duration-200 focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <Input
                      id={field.type}
                      type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                      required={field.required}
                      value={formData[field.type as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.type]: e.target.value })}
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              ))}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              >
                {submitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Enviar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </CardUI>
      </div>
    );
  }

  const containerStyle = {
    backgroundColor: customization.background_type === 'color' ? customization.background_color : undefined,
    backgroundImage: customization.background_type === 'image' && customization.background_image_url 
      ? `url(${customization.background_image_url})` 
      : undefined,
    background: customization.background_type === 'gradient' && customization.background_color?.startsWith('linear-gradient')
      ? customization.background_color
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const itemStyle = {
    backgroundColor: customization.item_color,
    color: customization.text_color,
    opacity: customization.item_opacity,
    borderRadius: `${customization.item_corner_radius}px`,
  };

  return (
    <div className="min-h-screen py-12 px-4" style={containerStyle}>
      <div className="max-w-2xl mx-auto space-y-6">
        <CardUI className="backdrop-blur-xl bg-card/90 border-border/50 shadow-[var(--shadow-card)]">
          <CardContent className="pt-8">
            <div className="text-center mb-6">
              <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary items-center justify-center mb-4 shadow-[var(--shadow-glow)]">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.full_name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-foreground" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
              {(profile.position || profile.company) && (
                <p className="text-muted-foreground">
                  {profile.position && profile.position}
                  {profile.position && profile.company && ' • '}
                  {profile.company && profile.company}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-3 p-3 transition-all duration-300 hover:scale-[1.02]"
                  style={itemStyle}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm">{profile.email}</span>
                </a>
              )}

              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-3 p-3 transition-all duration-300 hover:scale-[1.02]"
                  style={itemStyle}
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-sm">{profile.phone}</span>
                </a>
              )}

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 transition-all duration-300 hover:scale-[1.02]"
                  style={itemStyle}
                >
                  <Globe className="h-5 w-5" />
                  <span className="text-sm">{profile.website}</span>
                </a>
              )}
            </div>
          </CardContent>
        </CardUI>

        {socialLinks.length > 0 && (
          <CardUI className="backdrop-blur-xl bg-card/90 border-border/50 shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Redes Sociais</h2>
              <div className="space-y-3">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                  >
                    <span className="font-medium">{link.platform}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </CardUI>
        )}

        {customLinks.length > 0 && (
          <CardUI className="backdrop-blur-xl bg-card/90 border-border/50 shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Links</h2>
              <div className="space-y-3">
                {customLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                  >
                    <span className="font-medium">{link.title}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </CardUI>
        )}

        {catalogProducts.length > 0 && (
          <div className="space-y-6">
            {catalogProducts.map((product) => {
              const handleProductAction = () => {
                if (!product.link_type) return;

                if (product.link_type === 'whatsapp' && product.link_url) {
                  window.open(`https://wa.me/${product.link_url}`, '_blank');
                } else if (product.link_type === 'pix') {
                  setSelectedProduct(product);
                  setPixDialogOpen(true);
                  setPixAmount('');
                  setPixQRData('');
                } else if (product.link_url) {
                  window.open(product.link_url, '_blank');
                }
              };

              const buttonText = product.button_text || 'Mais informações';
              const hasImages = product.images && product.images.length > 0;
              
              let icon = <ExternalLink className="h-4 w-4" />;
              if (product.link_type === 'whatsapp') icon = <MessageCircle className="h-4 w-4" />;
              if (product.link_type === 'pix') icon = <QrCode className="h-4 w-4" />;

              return (
                <CardUI
                  key={product.id}
                  className="backdrop-blur-xl bg-card/95 border-border/50 shadow-[var(--shadow-card)] overflow-hidden group hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
                >
                  <CardContent className="p-0">
                    {/* Imagem do produto */}
                    {hasImages && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={product.images![0]} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      {/* Título */}
                      <h3 className="text-2xl font-bold text-foreground">
                        {product.name}
                      </h3>

                      {/* Descrição */}
                      {product.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {product.description}
                        </p>
                      )}
                      
                      {/* Observação */}
                      {product.description && product.description.includes('Obs:') && (
                        <p className="text-xs text-muted-foreground italic">
                          {product.description.split('Obs:')[1]}
                        </p>
                      )}

                      {/* Preço e botão */}
                      <div className="flex items-end justify-between pt-4">
                        {product.price && (
                          <div className="text-4xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(product.price)}
                          </div>
                        )}
                        
                        {(product.link_type && (product.link_url || product.link_type === 'pix')) && (
                          <Button
                            onClick={handleProductAction}
                            size="lg"
                            className="h-12 px-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {buttonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CardUI>
              );
            })}
          </div>
        )}

        {contactForm && !contactForm.require_form_fill && (
          <CardUI className="backdrop-blur-xl bg-card/95 border-border/50 shadow-[var(--shadow-card)]">
            <CardContent className="pt-8 space-y-6">
              <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {contactForm.title}
              </h2>

              <form onSubmit={handleSubmitContact} className="space-y-4">
                {contactForm.fields.map((field: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={field.type} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'message' ? (
                      <Textarea
                        id={field.type}
                        required={field.required}
                        value={formData[field.type as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.type]: e.target.value })}
                        className="min-h-[100px] resize-none transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <Input
                        id={field.type}
                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        required={field.required}
                        value={formData[field.type as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.type]: e.target.value })}
                        className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    )}
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-base shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
                >
                  {submitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </CardUI>
        )}

        <div className="text-center text-sm text-white/70 pt-4">
          <p>Criado com NFC Cards</p>
        </div>
      </div>
      
      {/* PIX QR Code Dialog para produtos */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-gradient-to-br from-card/95 to-card/90 border-border/50 shadow-[var(--shadow-elegant)]">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
              <QrCode className="h-7 w-7 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl text-center font-bold">
              Pagar com PIX
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="pix-amount" className="text-sm font-medium">
                Valor do PIX
              </Label>
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
              {selectedProduct?.price && (
                <p className="text-xs text-muted-foreground">
                  Preço sugerido: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(selectedProduct.price)}
                </p>
              )}
            </div>

            <Button
              onClick={() => {
                if (!pixAmount || parseFloat(pixAmount) <= 0) {
                  toast.error("Por favor, digite um valor válido.");
                  return;
                }

                const amount = parseFloat(pixAmount);
                const pixPayload = generatePixPayload(
                  profile?.pix_key || '',
                  profile?.pix_beneficiary_name || profile?.full_name || '',
                  profile?.pix_beneficiary_city || 'SAO PAULO',
                  amount,
                  `PROD${Date.now()}`
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
                    <p><span className="font-semibold">Produto:</span> {selectedProduct?.name}</p>
                    <p><span className="font-semibold">Chave:</span> {profile?.pix_key}</p>
                    <p><span className="font-semibold">Beneficiário:</span> {profile?.pix_beneficiary_name || profile?.full_name}</p>
                    <p><span className="font-semibold">Valor:</span> R$ {parseFloat(pixAmount).toFixed(2)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(pixQRData);
                      toast.success("Código PIX copiado!");
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

export default Card;