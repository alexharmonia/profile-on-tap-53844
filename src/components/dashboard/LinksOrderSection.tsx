import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  display_order: number;
}

function SortableItem({ link, onEdit, onDelete }: { 
  link: CustomLink; 
  onEdit: (link: CustomLink) => void;
  onDelete: (id: string) => void;
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
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{link.title}</p>
        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(link)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(link.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const LinksOrderSection = ({ userId }: LinksOrderSectionProps) => {
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomLink | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: 'globe',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadLinks();
  }, [userId]);

  const loadLinks = async () => {
    const { data, error } = await supabase
      .from('custom_links')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading links:', error);
      return;
    }

    setLinks(data || []);
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
      const updates = newLinks.map((link, index) => ({
        id: link.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('custom_links')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast({
        title: "Sucesso!",
        description: "Ordem dos links atualizada.",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ordem.",
        variant: "destructive",
      });
      loadLinks(); // Reload to get correct order
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
            display_order: links.length,
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Link adicionado com sucesso.",
        });
      }

      setDialogOpen(false);
      setFormData({ title: '', url: '', icon: 'globe' });
      setEditingLink(null);
      loadLinks();
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
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o link.",
        variant: "destructive",
      });
    }
  };

  const handleEditLink = (link: CustomLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon,
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingLink(null);
    setFormData({ title: '', url: '', icon: 'globe' });
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
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://exemplo.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={links.map(link => link.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum link adicionado ainda.
              </p>
            ) : (
              links.map((link) => (
                <SortableItem
                  key={link.id}
                  link={link}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
