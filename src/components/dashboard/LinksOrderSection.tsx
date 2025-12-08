import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IconPicker } from '@/components/IconPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LinksOrderSectionProps {
  userId: string;
  profile: any;
  onUpdate: () => void;
}

interface UnifiedLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  display_order: number;
  show_icon_only: boolean;
  type: 'custom' | 'social';
  platform?: string;
  link_type?: 'url' | 'wifi';
}

const socialLinkConfig: Record<string, { title: string; icon: string; getUrl: (profile: any) => string | null }> = {
  phone: { title: 'Telefone', icon: 'phone', getUrl: (p) => p?.phone ? `tel:${p.phone}` : null },
  whatsapp: { title: 'WhatsApp', icon: 'whatsapp', getUrl: (p) => p?.whatsapp_number ? `https://wa.me/${p.whatsapp_number.replace(/\D/g, '')}` : null },
  email: { title: 'E-mail', icon: 'mail', getUrl: (p) => p?.email ? `mailto:${p.email}` : null },
  google_reviews: { title: 'Avaliações no Google', icon: 'star', getUrl: (p) => p?.google_reviews_url || null },
  instagram: { title: 'Instagram', icon: 'instagram', getUrl: (p) => p?.instagram_handle ? `https://instagram.com/${p.instagram_handle}` : null },
  website: { title: 'Website', icon: 'globe', getUrl: (p) => p?.website || null },
};

function SortableRow({ 
  link, 
  onEdit, 
  onDelete,
  onToggleIconOnly 
}: { 
  link: UnifiedLink; 
  onEdit: (link: UnifiedLink) => void;
  onDelete: (id: string) => void;
  onToggleIconOnly: (link: UnifiedLink, checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[40px_1fr_120px_80px] items-center gap-2 p-3 bg-card border-b border-border hover:bg-accent/5 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none flex justify-center"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="min-w-0">
        <p className="font-medium truncate text-sm">{link.title}</p>
      </div>

      <div className="flex justify-center">
        <Checkbox
          checked={link.show_icon_only}
          onCheckedChange={(checked) => onToggleIconOnly(link, checked === true)}
        />
      </div>

      <div className="flex gap-1 justify-center">
        {link.type === 'custom' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(link)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(link.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export const LinksOrderSection = ({ userId, profile, onUpdate }: LinksOrderSectionProps) => {
  const [links, setLinks] = useState<UnifiedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<UnifiedLink | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: 'globe',
    link_type: 'url' as 'url' | 'wifi',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadLinks();
  }, [userId, profile]);

  const loadLinks = async () => {
    // Load custom links
    const { data: customLinks, error: customError } = await supabase
      .from('custom_links')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (customError) {
      console.error('Error loading custom links:', customError);
    }

    // Load social links
    const { data: socialLinks, error: socialError } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (socialError) {
      console.error('Error loading social links:', socialError);
    }

    // Build unified list from profile-based social links
    const profileSocialLinks: UnifiedLink[] = [];
    
    Object.entries(socialLinkConfig).forEach(([key, config], index) => {
      const url = config.getUrl(profile);
      if (url) {
        // Check if there's an existing social_link entry for this platform
        const existingSocial = socialLinks?.find(s => s.platform === key);
        profileSocialLinks.push({
          id: existingSocial?.id || `profile-${key}`,
          title: config.title,
          url: url,
          icon: config.icon,
          display_order: existingSocial?.display_order ?? 100 + index,
          show_icon_only: existingSocial?.show_icon_only || false,
          type: 'social',
          platform: key,
        });
      }
    });

    // Convert custom links
    const customUnified: UnifiedLink[] = (customLinks || []).map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon || 'globe',
      display_order: link.display_order,
      show_icon_only: link.show_icon_only || false,
      type: 'custom' as const,
      link_type: (link.link_type as 'url' | 'wifi') || 'url',
    }));

    // Combine and sort by display_order
    const allLinks = [...profileSocialLinks, ...customUnified].sort((a, b) => a.display_order - b.display_order);
    setLinks(allLinks);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);

    const newLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(newLinks);

    // Update display_order in database
    try {
      for (let i = 0; i < newLinks.length; i++) {
        const link = newLinks[i];
        if (link.type === 'custom') {
          await supabase
            .from('custom_links')
            .update({ display_order: i })
            .eq('id', link.id);
        } else if (link.type === 'social' && link.platform) {
          // Check if social_link exists, if not create it
          const { data: existing } = await supabase
            .from('social_links')
            .select('id')
            .eq('user_id', userId)
            .eq('platform', link.platform)
            .single();

          if (existing) {
            await supabase
              .from('social_links')
              .update({ display_order: i })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('social_links')
              .insert({
                user_id: userId,
                platform: link.platform,
                url: link.url,
                display_order: i,
                show_icon_only: link.show_icon_only,
              });
          }
        }
      }

      toast({
        title: "Sucesso!",
        description: "Ordem dos links atualizada.",
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ordem.",
        variant: "destructive",
      });
      loadLinks();
    }
  };

  const handleToggleIconOnly = async (link: UnifiedLink, checked: boolean) => {
    try {
      if (link.type === 'custom') {
        await supabase
          .from('custom_links')
          .update({ show_icon_only: checked })
          .eq('id', link.id);
      } else if (link.type === 'social' && link.platform) {
        // Check if social_link exists
        const { data: existing } = await supabase
          .from('social_links')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', link.platform)
          .single();

        if (existing) {
          await supabase
            .from('social_links')
            .update({ show_icon_only: checked })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('social_links')
            .insert({
              user_id: userId,
              platform: link.platform,
              url: link.url,
              display_order: link.display_order,
              show_icon_only: checked,
            });
        }
      }

      // Update local state
      setLinks(prev => prev.map(l => 
        l.id === link.id ? { ...l, show_icon_only: checked } : l
      ));

      toast({
        title: "Sucesso!",
        description: "Configuração atualizada.",
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating icon only:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLink = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingLink) {
        const { error } = await supabase
          .from('custom_links')
          .update({
            title: formData.title,
            url: formData.url,
            icon: formData.icon,
            link_type: formData.link_type,
          })
          .eq('id', editingLink.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Link atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('custom_links')
          .insert([{
            user_id: userId,
            title: formData.title,
            url: formData.url,
            icon: formData.icon,
            link_type: formData.link_type,
            show_icon_only: false,
            display_order: links.length,
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Link adicionado com sucesso.",
        });
      }

      setDialogOpen(false);
      setFormData({ title: '', url: '', icon: 'globe', link_type: 'url' });
      setEditingLink(null);
      loadLinks();
      onUpdate();
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Deseja realmente excluir este link?')) return;

    try {
      const { error } = await supabase
        .from('custom_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Link excluído com sucesso.",
      });

      loadLinks();
      onUpdate();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o link.",
        variant: "destructive",
      });
    }
  };

  const handleEditLink = (link: UnifiedLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon,
      link_type: link.link_type || 'url',
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingLink(null);
    setFormData({ title: '', url: '', icon: 'globe', link_type: 'url' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Arraste os links para reordenar como eles aparecerão no seu cartão.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? 'Editar Link' : 'Adicionar Link'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do link personalizado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Ex: Meu Site"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">
                  {formData.icon === 'wifi' ? 'Senha do Wi-Fi' : 'URL'}
                </Label>
                <Input
                  id="url"
                  placeholder={formData.icon === 'wifi' ? 'Digite a senha do Wi-Fi' : 'https://exemplo.com'}
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  type={formData.icon === 'wifi' ? 'text' : 'url'}
                />
                {formData.icon === 'wifi' && (
                  <p className="text-xs text-muted-foreground">
                    Ao clicar neste link, a senha será copiada para a área de transferência.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => {
                    // Se mudar para wifi, automaticamente define o tipo como wifi
                    const newLinkType = icon === 'wifi' ? 'wifi' : 'url';
                    setFormData({ ...formData, icon, link_type: newLinkType });
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveLink} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLink ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[40px_1fr_120px_80px] items-center gap-2 p-3 bg-muted/50 border border-border rounded-t-lg text-sm font-medium text-muted-foreground">
        <div className="text-center">Arraste</div>
        <div>Título</div>
        <div className="text-center">Exibir apenas ícone</div>
        <div className="text-center">Ações</div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={links.map(link => link.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="border border-t-0 border-border rounded-b-lg overflow-hidden">
            {links.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum link disponível. Adicione redes sociais ou links personalizados.
              </p>
            ) : (
              links.map((link) => (
                <SortableRow
                  key={link.id}
                  link={link}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                  onToggleIconOnly={handleToggleIconOnly}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
