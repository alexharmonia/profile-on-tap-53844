import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardAccordion, AccordionSection } from '@/components/DashboardAccordion';
import { 
  Share2, Palette, Link as LinkIcon, List, DollarSign, 
  ShoppingCart, MessageSquare, LogOut, User 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SocialLinksSection } from '@/components/dashboard/SocialLinksSection';
import { PersonalizationSection } from '@/components/dashboard/PersonalizationSection';
import { CustomLinkSection } from '@/components/dashboard/CustomLinkSection';
import { LinksOrderSection } from '@/components/dashboard/LinksOrderSection';
import { PixSection } from '@/components/dashboard/PixSection';
import { CatalogSection } from '@/components/dashboard/CatalogSection';
import { ContactFormSection } from '@/components/dashboard/ContactFormSection';
import { ShareDialog } from '@/components/ShareDialog';

const DashboardNew = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    setProfile(data);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-12 px-4 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.profile_image_url} />
                <AvatarFallback className="text-2xl font-bold bg-white text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">
                  Olá, {profile?.full_name || 'Usuário'}!
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  Gerencie seu cartão digital
                </p>
              </div>
            </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Meu perfil
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <DashboardAccordion>
          <AccordionSection
            value="social"
            title="REDES SOCIAIS"
            icon={Share2}
            iconColor="bg-yellow-500"
          >
            <SocialLinksSection profile={profile} onUpdate={loadProfile} />
          </AccordionSection>

          <AccordionSection
            value="personalization"
            title="PERSONALIZAÇÃO"
            icon={Palette}
            iconColor="bg-purple-500"
          >
            <PersonalizationSection profile={profile} onUpdate={loadProfile} />
          </AccordionSection>

          <AccordionSection
            value="custom-link"
            title="LINK PERSONALIZADO"
            icon={LinkIcon}
            iconColor="bg-green-500"
          >
            <CustomLinkSection profile={profile} onUpdate={loadProfile} />
          </AccordionSection>

          <AccordionSection
            value="links-order"
            title="ORDEM E OUTROS LINKS"
            icon={List}
            iconColor="bg-orange-500"
          >
            <LinksOrderSection userId={user.id} />
          </AccordionSection>

          <AccordionSection
            value="pix"
            title="COBRE COM PIX"
            icon={DollarSign}
            iconColor="bg-teal-500"
          >
            <PixSection profile={profile} onUpdate={loadProfile} />
          </AccordionSection>

          <AccordionSection
            value="catalog"
            title="CRIAÇÃO DE CATÁLOGO"
            icon={ShoppingCart}
            iconColor="bg-blue-500"
          >
            <CatalogSection userId={user.id} />
          </AccordionSection>

          <AccordionSection
            value="contacts"
            title="FORMULÁRIO DE CONTATOS"
            icon={MessageSquare}
            iconColor="bg-red-500"
          >
            <ContactFormSection userId={user.id} />
          </AccordionSection>
        </DashboardAccordion>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        profileUrl={`${window.location.origin}/profile`}
        userName={profile?.full_name || "Usuário"}
      />
    </div>
  );
};

export default DashboardNew;
