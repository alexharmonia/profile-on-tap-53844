import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  fullName: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres' }).optional(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationData = mode === 'signup' 
        ? { email, password, fullName }
        : { email, password };
      
      authSchema.parse(validationData);

      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este e-mail já está cadastrado');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Conta criada com sucesso!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error('E-mail ou senha incorretos');
        } else {
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-primary)]">
      <Card className="w-full max-w-md backdrop-blur-xl bg-card/90 border-border/50 shadow-[var(--shadow-card)]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
              <CreditCard className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'signin' ? 'Bem-vindo de volta' : 'Criar conta'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin' 
              ? 'Entre para gerenciar seu cartão digital' 
              : 'Crie seu cartão digital em minutos'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="João Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : mode === 'signin' ? 'Entrar' : 'Criar Conta'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-primary hover:underline font-medium"
                  >
                    Faça login
                  </button>
                </>
              )}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;