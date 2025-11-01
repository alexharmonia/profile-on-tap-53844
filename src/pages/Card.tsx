import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card as CardUI, CardContent } from '@/components/ui/card';
import { Mail, Phone, Globe, Building2, Briefcase, ExternalLink, User, MessageCircle, QrCode, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Profile {
  full_name: string;
  email: string;
  phone?: string;
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  profile_image_url?: string;
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

  useEffect(() => {
    loadProfile();
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

      const { data: formData } = await supabase
        .from('contact_forms')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (formData) {
        setContactForm({
          ...formData,
          fields: (formData.fields as any) || [],
        });
        setShowContactForm(formData.require_form_fill);
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

  return (
    <div className="min-h-screen bg-[image:var(--gradient-primary)] py-12 px-4">
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
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-sm">{profile.email}</span>
                </a>
              )}

              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-sm">{profile.phone}</span>
                </a>
              )}

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  <Globe className="h-5 w-5 text-primary" />
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
          <CardUI className="backdrop-blur-xl bg-card/90 border-border/50 shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Catálogo de Produtos
              </h2>
              <div className="grid gap-6">
                {catalogProducts.map((product) => {
                  const getActionButton = () => {
                    if (!product.link_type || !product.link_url) return null;

                    const buttonText = product.button_text || 'Mais informações';
                    let href = '';
                    let icon = <ExternalLink className="h-4 w-4" />;

                    if (product.link_type === 'whatsapp') {
                      href = `https://wa.me/${product.link_url}`;
                      icon = <MessageCircle className="h-4 w-4" />;
                    } else if (product.link_type === 'pix') {
                      // PIX QR Code or payment link would go here
                      href = '#';
                      icon = <QrCode className="h-4 w-4" />;
                    } else {
                      href = product.link_url;
                    }

                    return (
                      <Button
                        asChild
                        className="w-full h-11 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
                      >
                        <a 
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          {icon}
                          {buttonText}
                        </a>
                      </Button>
                    );
                  };

                  return (
                    <div
                      key={product.id}
                      className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {product.description}
                            </p>
                          )}
                          {product.price && (
                            <p className="text-3xl font-bold text-primary">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(product.price)}
                            </p>
                          )}
                        </div>
                        {getActionButton()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CardUI>
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
    </div>
  );
};

export default Card;