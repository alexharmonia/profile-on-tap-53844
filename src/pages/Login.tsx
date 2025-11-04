import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    if (!isAdminLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira sua chave de acesso",
        variant: "destructive",
      });
      return;
    }

    // Check if access key is 123456
    if (accessKey.toUpperCase() !== '123456') {
      toast({
        title: "Chave inválida",
        description: "Use a chave 123456 para acessar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Try to sign in with demo credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@cartaonfc.com',
        password: 'demo123456',
      });

      if (signInError) {
        // If user doesn't exist, create it
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@cartaonfc.com',
          password: 'demo123456',
          options: {
            data: {
              full_name: 'Usuário Demo',
            }
          }
        });

        if (signUpError) {
          toast({
            title: "Erro ao criar conta",
            description: "Não foi possível criar a conta demo. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        // Try to sign in again after signup
        const { error: retrySignInError } = await supabase.auth.signInWithPassword({
          email: 'demo@cartaonfc.com',
          password: 'demo123456',
        });

        if (retrySignInError) {
          toast({
            title: "Erro ao fazer login",
            description: "Conta criada, mas não foi possível fazer login. Tente novamente.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo à plataforma de gerenciamento.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
          <CardDescription className="text-base">
            Digite sua chave de acesso para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accessKey" className="text-sm font-medium">
                Chave de Acesso
              </Label>
              <Input
                id="accessKey"
                type="text"
                placeholder="Digite sua chave"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                className="h-12 text-center text-lg font-mono tracking-wider"
                maxLength={8}
                disabled={loading}
              />
            </div>


            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
