import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Share2, Edit, Sparkles, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Edit className="h-6 w-6" />,
      title: 'Editor Intuitivo',
      description: 'Personalize seu perfil digital com facilidade através do nosso editor visual.',
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: 'Compartilhamento Fácil',
      description: 'Compartilhe suas informações com um simples toque no cartão NFC.',
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: 'Totalmente Responsivo',
      description: 'Seu cartão digital fica perfeito em qualquer dispositivo.',
    },
  ];

  const benefits = [
    'Crie seu perfil em minutos',
    'Atualize suas informações quando quiser',
    'Adicione redes sociais e links personalizados',
    'Sem necessidade de impressão',
    'Ecológico e sustentável',
    'Sempre atualizado',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 bg-[image:var(--gradient-primary)]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex h-16 w-16 rounded-full bg-white/10 backdrop-blur-lg items-center justify-center mb-6 shadow-[var(--shadow-glow)]">
              <CreditCard className="h-8 w-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Seu Cartão de Visita{' '}
              <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                Digital
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Crie e gerencie seu perfil digital profissional com tecnologia NFC
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                className="text-lg bg-white text-primary hover:bg-white/90"
                onClick={() => navigate('/login')}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-muted-foreground">
              Tudo que você precisa em um só lugar
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-[var(--shadow-card)] transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mb-4 shadow-[var(--shadow-glow)]">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Por que escolher nosso sistema?
              </h2>
              <p className="text-xl text-muted-foreground">
                Modernize sua forma de compartilhar informações profissionais
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-background hover:shadow-md transition-shadow">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[image:var(--gradient-secondary)]">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Crie seu cartão digital em minutos e impressione seus contatos
            </p>
            <Button
              size="lg"
              className="text-lg bg-white text-primary hover:bg-white/90"
              onClick={() => navigate('/login')}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 NFC Cards. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;