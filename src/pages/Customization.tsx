import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette, ImageIcon, ArrowLeft, Save, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, MapPin, Instagram, Facebook, Linkedin } from 'lucide-react';

const Customization = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [backgroundDialogOpen, setBackgroundDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [customization, setCustomization] = useState({
    item_color: '#4F46E5',
    text_color: '#FFFFFF',
    item_opacity: 1.0,
    item_corner_radius: 12,
    background_type: 'color' as 'color' | 'image' | 'gradient',
    background_color: '#1E40AF',
    background_image_url: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadData();
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Load customization settings
    const { data: customData } = await supabase
      .from('customization_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customData) {
      setCustomization({
        item_color: customData.item_color || '#4F46E5',
        text_color: customData.text_color || '#FFFFFF',
        item_opacity: customData.item_opacity || 1.0,
        item_corner_radius: customData.item_corner_radius || 12,
        background_type: (customData.background_type === 'image' ? 'image' : customData.background_type === 'gradient' ? 'gradient' : 'color') as 'color' | 'image' | 'gradient',
        background_color: customData.background_color || '#1E40AF',
        background_image_url: customData.background_image_url || '',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customization_settings')
        .upsert({
          user_id: user.id,
          ...customization,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Personalização salva com sucesso! As alterações aparecerão automaticamente no seu perfil.');
    } catch (error) {
      console.error('Error saving customization:', error);
      toast.error('Erro ao salvar personalização');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5MB.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `backgrounds/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const newCustomization = { 
        ...customization, 
        background_image_url: publicUrl,
        background_type: 'image' as const
      };
      
      setCustomization(newCustomization);

      // Auto-save after upload
      const { error: saveError } = await supabase
        .from('customization_settings')
        .upsert({
          user_id: user.id,
          ...newCustomization,
        }, {
          onConflict: 'user_id'
        });

      if (saveError) throw saveError;

      toast.success('Imagem carregada e salva com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Não foi possível fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const previewStyle: React.CSSProperties = customization.background_type === 'image' && customization.background_image_url 
    ? {
        backgroundImage: `url(${customization.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : customization.background_type === 'gradient' && customization.background_color?.startsWith('linear-gradient')
    ? {
        background: customization.background_color,
      }
    : {
        backgroundColor: customization.background_color || '#1E40AF',
      };

  const itemStyle = {
    backgroundColor: customization.item_color,
    color: customization.text_color,
    opacity: customization.item_opacity,
    borderRadius: `${customization.item_corner_radius}px`,
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-6 px-4 shadow-lg">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard-new')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Personalização Visual</h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Section */}
          <div className="space-y-4">
            <Card className="p-6 shadow-xl border-2 border-primary/10">
              <h2 className="text-xl font-semibold mb-4">Controles de Personalização</h2>
              
              <div className="space-y-4">
                <Button
                  onClick={() => setStyleDialogOpen(true)}
                  className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Palette className="h-5 w-5" />
                  Editar Estilo
                </Button>

                <Button
                  onClick={() => setBackgroundDialogOpen(true)}
                  className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ImageIcon className="h-5 w-5" />
                  Editar Fundo
                </Button>
              </div>
            </Card>

            <Card className="p-6 shadow-lg border border-muted">
              <h3 className="text-lg font-semibold mb-3">Configurações Atuais</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cor dos itens:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: customization.item_color }}
                    />
                    <span className="font-mono">{customization.item_color}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cor dos textos:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: customization.text_color }}
                    />
                    <span className="font-mono">{customization.text_color}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opacidade:</span>
                  <span className="font-semibold">{(customization.item_opacity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cantos:</span>
                  <span className="font-semibold">{customization.item_corner_radius}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de fundo:</span>
                  <span className="font-semibold capitalize">{customization.background_type === 'color' ? 'Cor' : customization.background_type === 'gradient' ? 'Degradê' : 'Imagem'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <Card className="p-6 shadow-xl border-2 border-primary/10">
              <h2 className="text-xl font-semibold mb-4">Pré-visualização</h2>
              
              <div 
                className="rounded-2xl p-6 min-h-[500px] shadow-2xl"
                style={previewStyle}
              >
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                    <AvatarImage src={profile?.profile_image_url} />
                    <AvatarFallback className="text-2xl font-bold bg-white text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <h3 className="text-white text-2xl font-bold drop-shadow-lg">
                      {profile?.full_name || 'Seu Nome'}
                    </h3>
                    {profile?.bio && (
                      <p className="text-white/90 text-sm mt-2 drop-shadow">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <div className="w-full space-y-3 mt-6">
                    <div
                      className="w-full px-6 py-3 flex items-center justify-center gap-2 font-medium shadow-lg transition-all duration-300 hover:scale-105"
                      style={itemStyle}
                    >
                      <Phone className="h-4 w-4" />
                      Telefone
                    </div>

                    <div
                      className="w-full px-6 py-3 flex items-center justify-center gap-2 font-medium shadow-lg transition-all duration-300 hover:scale-105"
                      style={itemStyle}
                    >
                      <Mail className="h-4 w-4" />
                      E-mail
                    </div>

                    <div
                      className="w-full px-6 py-3 flex items-center justify-center gap-2 font-medium shadow-lg transition-all duration-300 hover:scale-105"
                      style={itemStyle}
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </div>

                    <div
                      className="w-full px-6 py-3 flex items-center justify-center gap-2 font-medium shadow-lg transition-all duration-300 hover:scale-105"
                      style={itemStyle}
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Style Dialog */}
      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              Estilo dos itens do seu cartão
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Escolha a cor dos itens</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={customization.item_color}
                  onChange={(e) => setCustomization(prev => ({ ...prev, item_color: e.target.value }))}
                  className="h-12 w-20 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={customization.item_color}
                  onChange={(e) => setCustomization(prev => ({ ...prev, item_color: e.target.value }))}
                  className="flex-1 h-12 px-4 rounded border border-border font-mono"
                  placeholder="#4F46E5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Escolha a cor dos textos</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={customization.text_color}
                  onChange={(e) => setCustomization(prev => ({ ...prev, text_color: e.target.value }))}
                  className="h-12 w-20 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={customization.text_color}
                  onChange={(e) => setCustomization(prev => ({ ...prev, text_color: e.target.value }))}
                  className="flex-1 h-12 px-4 rounded border border-border font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Opacidade: {(customization.item_opacity * 100).toFixed(0)}%</Label>
              <Slider
                value={[customization.item_opacity * 100]}
                onValueChange={([value]) => setCustomization(prev => ({ ...prev, item_opacity: value / 100 }))}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <Label>Cantos (bordas): {customization.item_corner_radius}px</Label>
              <Slider
                value={[customization.item_corner_radius]}
                onValueChange={([value]) => setCustomization(prev => ({ ...prev, item_corner_radius: value }))}
                max={50}
                min={0}
                step={2}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStyleDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              handleSave();
              setStyleDialogOpen(false);
            }}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Dialog */}
      <Dialog open={backgroundDialogOpen} onOpenChange={setBackgroundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              Editar fundo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Upload className="h-5 w-5 animate-pulse" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-sm font-semibold">
                {uploading ? 'Enviando...' : 'Carregar imagem'}
              </span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Gradient Options */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Escolha um fundo degradê</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  'linear-gradient(135deg, #667eea 0%, #00c9ff 100%)',
                  'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
                  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                ].map((gradient, index) => (
                  <button
                    key={index}
                    className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      customization.background_type === 'gradient' && customization.background_color === gradient 
                        ? 'border-primary ring-2 ring-primary ring-offset-2' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ background: gradient }}
                    onClick={() => setCustomization(prev => ({ 
                      ...prev, 
                      background_type: 'gradient',
                      background_color: gradient,
                      background_image_url: ''
                    }))}
                    title={`Gradiente ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {customization.background_type === 'color' && (
              <div className="space-y-4">
                <Label>Escolha a cor do fundo</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={customization.background_color}
                    onChange={(e) => setCustomization(prev => ({ ...prev, background_color: e.target.value }))}
                    className="h-12 w-20 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.background_color}
                    onChange={(e) => setCustomization(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1 h-12 px-4 rounded border border-border font-mono"
                    placeholder="#1E40AF"
                  />
                </div>
              </div>
            )}

            {customization.background_type === 'gradient' && (
              <div className="space-y-2">
                <Label>Gradiente selecionado</Label>
                <div 
                  className="w-full h-16 rounded-lg border border-border"
                  style={{ background: customization.background_color }}
                />
              </div>
            )}

            {customization.background_type === 'image' && customization.background_image_url && (
              <div className="space-y-2">
                <Label>Imagem do fundo</Label>
                <div className="relative w-full h-32 rounded border border-border overflow-hidden">
                  <img 
                    src={customization.background_image_url} 
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setCustomization(prev => ({ 
                    ...prev, 
                    background_image_url: '',
                    background_type: 'color'
                  }))}
                >
                  Remover imagem
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBackgroundDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              handleSave();
              setBackgroundDialogOpen(false);
            }}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customization;