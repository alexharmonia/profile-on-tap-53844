import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import { IconPicker } from '@/components/IconPicker';

interface LinksOrderSectionProps {
  userId: string;
}

export const LinksOrderSection = ({ userId }: LinksOrderSectionProps) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: 'globe',
    is_pulsing: false,
  });

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

  const handleSaveLink = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingLink) {
        const { error } = await supabase
          .from('custom_links')
          .update(formData)
          .eq('id', editingLink.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_links')
          .insert([
            {
              ...formData,
              user_id: userId,
              display_order: links.length,
            },
          ]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: editingLink ? "Link atualizado." : "Link adicionado.",
      });

      setDialogOpen(false);
      setEditingLink(null);
      setFormData({ title: '', url: '', icon: 'globe', is_pulsing: false });
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
    const { error } = await supabase
      .from('custom_links')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o link.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso!",
      description: "Link deletado.",
    });

    loadLinks();
  };

  const handleEditLink = (link: any) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon || 'globe',
      is_pulsing: link.is_pulsing || false,
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingLink(null);
    setFormData({ title: '', url: '', icon: 'globe', is_pulsing: false });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Arraste os links para reordenar como eles aparecerão no seu cartão.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              ADICIONAR LINK
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Editar Link' : 'Adicionar Link'}</DialogTitle>
              <DialogDescription>
                HOME &gt; LINKS &gt; LINKS
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título (máx. 50 caracteres)</Label>
                <Input
                  id="title"
                  placeholder="Título do link"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Link (URL, email ou telefone)</Label>
                <Input
                  id="url"
                  placeholder="https://exemplo.com"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Botão pulsante?</Label>
                <Select
                  value={formData.is_pulsing ? 'yes' : 'no'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_pulsing: value === 'yes' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveLink} disabled={loading}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {links.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum link personalizado ainda.</p>
            <p className="text-sm mt-2">Clique em "ADICIONAR LINK" para começar.</p>
          </div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <div className="flex-1">
                <p className="font-medium">{link.title}</p>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={link.show_icon_only} />
                <span className="text-sm text-muted-foreground">Exibir apenas ícone</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditLink(link)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteLink(link.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
