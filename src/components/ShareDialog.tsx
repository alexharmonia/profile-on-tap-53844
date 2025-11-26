import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Send, Mail, Copy, Check, X, Instagram } from "lucide-react";
import { Facebook, MessageCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileUrl: string;
  userName: string;
}

export const ShareDialog = ({ open, onOpenChange, profileUrl, userName }: ShareDialogProps) => {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleInstagramShare = async () => {
    // Tenta usar Web Share API se disponível
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cartão Digital - ${userName}`,
          text: `Confira o cartão digital de ${userName}`,
          url: profileUrl,
        });
        toast.success("Compartilhado com sucesso!");
      } catch (error) {
        // Usuário cancelou ou erro - fallback para copiar
        handleCopy();
        toast.info("Link copiado! Abra o Instagram e cole no seu post/story.");
      }
    } else {
      // Fallback: copia link
      handleCopy();
      toast.info("Link copiado! Abra o Instagram e cole no seu post/story.");
    }
  };

  const shareOptions = [
    {
      icon: QrCode,
      label: "Abrir QR Code",
      color: "bg-gray-900",
      onClick: () => setShowQR(!showQR),
    },
    {
      icon: Instagram,
      label: "Compartilhar no Instagram",
      color: "bg-gradient-to-br from-[#405DE6] via-[#E1306C] to-[#FFDC80]",
      onClick: handleInstagramShare,
    },
    {
      icon: MessageCircle,
      label: "Enviar via Whats Direct",
      color: "bg-[#25D366]",
      onClick: () => {
        const message = `Confira meu cartão digital: ${profileUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      },
    },
    {
      icon: Facebook,
      label: "Compartilhar no Facebook",
      color: "bg-[#1877F2]",
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
          "_blank"
        );
      },
    },
    {
      icon: Send,
      label: "Compartilhar no Telegram",
      color: "bg-[#0088cc]",
      onClick: () => {
        const message = `Confira o cartão digital de ${userName}: ${profileUrl}`;
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(message)}`,
          "_blank"
        );
      },
    },
    {
      icon: MessageCircle,
      label: "Compartilhar no WhatsApp",
      color: "bg-[#25D366]",
      onClick: () => {
        const message = `Confira o cartão digital de ${userName}: ${profileUrl}`;
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      },
    },
    {
      icon: Mail,
      label: "Compartilhar via Email",
      color: "bg-slate-700",
      onClick: () => {
        const subject = `Cartão Digital - ${userName}`;
        const body = `Confira meu cartão digital: ${profileUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Compartilhe este perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 sm:space-y-3 py-3 sm:py-4">
          {shareOptions.map((option, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between h-12 sm:h-14 px-3 sm:px-4 hover:bg-muted/50 transition-all duration-200 group"
              onClick={option.onClick}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`${option.color} w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0`}
                >
                  <option.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="font-medium text-foreground text-sm sm:text-base text-left truncate">{option.label}</span>
              </div>
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          ))}
        </div>

        {showQR && (
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 sm:right-2 top-1 sm:top-2 z-10"
              onClick={() => setShowQR(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-2 border-primary/20">
              <QRCode
                value={profileUrl}
                size={200}
                className="w-full h-auto max-w-[200px] sm:max-w-[256px] mx-auto"
                level="H"
              />
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Escaneie para acessar o perfil
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t">
          <div className="flex gap-2">
            <Input
              value={profileUrl}
              readOnly
              className="font-mono text-sm bg-muted/50"
            />
            <Button
              onClick={handleCopy}
              className="shrink-0 min-w-[100px]"
              variant={copied ? "default" : "secondary"}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
