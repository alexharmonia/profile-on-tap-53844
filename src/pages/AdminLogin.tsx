import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, User } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as admin
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    if (isAdminLoggedIn === 'true') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Simulate a brief loading delay for UX
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        toast({
          title: "Login realizado!",
          description: "Bem-vindo, administrador.",
        });
        navigate('/login');
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 800);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu email",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o email de recuperação. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      
      setDialogOpen(false);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-primary)] p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-elegant)] backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Acesso Admin
          </CardTitle>
          <CardDescription className="text-base">
            Entre com suas credenciais de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors text-center w-full mb-4"
                >
                  Esqueceu sua Senha?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Recuperar Senha</DialogTitle>
                  <DialogDescription>
                    Digite seu email para receber instruções de recuperação de senha.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={resetLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Email de Recuperação'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
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

export default AdminLogin;
