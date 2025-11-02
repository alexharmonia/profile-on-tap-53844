import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Send, Mail, Copy, Check, X } from "lucide-react";
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

  const shareOptions = [
    {
      icon: QrCode,
      label: "Abrir QR Code",
      color: "bg-gray-900",
      onClick: () => setShowQR(!showQR),
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Compartilhe este perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {shareOptions.map((option, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between h-14 px-4 hover:bg-muted/50 transition-all duration-200 group"
              onClick={option.onClick}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`${option.color} w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
                >
                  <option.icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-foreground">{option.label}</span>
              </div>
              <svg
                className="h-5 w-5 text-muted-foreground"
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
              className="absolute right-2 top-2 z-10"
              onClick={() => setShowQR(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary/20">
              <QRCode
                value={profileUrl}
                size={256}
                className="w-full h-auto"
                level="H"
              />
              <p className="text-center text-sm text-muted-foreground mt-4">
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
