import { 
  Globe, ShoppingBag, UtensilsCrossed, MapPin, DollarSign, Plane, Trophy,
  Facebook, Instagram, Mail, Info, Wifi, Phone, Scale,
  Home, Music, Binoculars, Wallet, Scissors, Calendar, FileText,
  Gift, Clock, Star, Camera, Linkedin, Youtube, MessageCircle,
  Twitter, HeartPulse, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const iconOptions = [
  { id: 'none', label: 'Sem ícone', icon: null },
  { id: 'globe', label: 'Globo', icon: Globe },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'spotify', label: 'Spotify', icon: Music },
  { id: 'deezer', label: 'Deezer', icon: Music },
  { id: 'canva', label: 'Canva', icon: Palette },
  { id: 'first-aid', label: 'Primeiros Socorros', icon: HeartPulse },
  { id: 'shopping-bag', label: 'Sacola', icon: ShoppingBag },
  { id: 'utensils', label: 'Garfo/Faca', icon: UtensilsCrossed },
  { id: 'map-pin', label: 'Pin', icon: MapPin },
  { id: 'dollar', label: 'Dólar', icon: DollarSign },
  { id: 'plane', label: 'Avião', icon: Plane },
  { id: 'trophy', label: 'Troféu', icon: Trophy },
  { id: 'mail', label: 'Email', icon: Mail },
  { id: 'info', label: 'Info', icon: Info },
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'phone', label: 'Telefone', icon: Phone },
  { id: 'scale', label: 'Balança', icon: Scale },
  { id: 'home', label: 'Casa', icon: Home },
  { id: 'music', label: 'Música', icon: Music },
  { id: 'binoculars', label: 'Binóculo', icon: Binoculars },
  { id: 'wallet', label: 'Carteira', icon: Wallet },
  { id: 'scissors', label: 'Tesoura', icon: Scissors },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'file', label: 'Documento', icon: FileText },
  { id: 'gift', label: 'Presente', icon: Gift },
  { id: 'clock', label: 'Relógio', icon: Clock },
  { id: 'star', label: 'Estrela', icon: Star },
  { id: 'camera', label: 'Câmera', icon: Camera },
];

interface IconPickerProps {
  value: string;
  onChange: (iconId: string) => void;
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  return (
    <div className="grid grid-cols-8 gap-2">
      {iconOptions.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.id}
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12",
              value === option.id && "border-primary border-2 bg-primary/10"
            )}
            onClick={() => onChange(option.id)}
            title={option.label}
          >
            {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs">Sem</span>}
          </Button>
        );
      })}
    </div>
  );
};
