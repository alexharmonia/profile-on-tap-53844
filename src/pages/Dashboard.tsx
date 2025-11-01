import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, Share2, CreditCard } from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gerencie seu cartão digital NFC</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer" onClick={() => navigate('/editor')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Edit className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Editor de Perfil</CardTitle>
                    <CardDescription>Personalize suas informações</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Edite suas informações pessoais, adicione redes sociais e links personalizados.
                </p>
                <Button className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer" onClick={() => navigate(`/card/${user?.id}`)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Eye className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Visualizar Cartão</CardTitle>
                    <CardDescription>Veja como outros verão</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize seu cartão digital como ele aparecerá para outras pessoas.
                </p>
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Cartão
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Share2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Compartilhar</CardTitle>
                    <CardDescription>Envie seu cartão</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Compartilhe seu cartão digital através de um link único.
                </p>
                <Button variant="outline" className="w-full" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/card/${user?.id}`);
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <CreditCard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Meu Cartão NFC</CardTitle>
                    <CardDescription>Informações do cartão físico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Seu cartão físico NFC está vinculado a este perfil digital.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;