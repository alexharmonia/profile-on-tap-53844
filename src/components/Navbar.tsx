import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <CreditCard className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            NFC Cards
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Fazer Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};