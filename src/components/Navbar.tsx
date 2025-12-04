import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, LogOut, User, Share2 } from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const profileUrl = user ? `${window.location.origin}/card/${user.id}` : '';

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-xl font-bold">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              INTEGRETY Cards
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShareDialogOpen(true)}
                  title="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="sm:hidden">
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:flex">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="sm:hidden">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {user && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          profileUrl={profileUrl}
          userName="Meu Cartão"
        />
      )}
    </>
  );
};