import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';

interface CatalogSectionProps {
  userId: string;
}

export const CatalogSection = ({ userId }: CatalogSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    button_text: 'Mais informações',
    link_type: 'custom',
    link_url: '',
  });

  useEffect(() => {
    loadProducts();
  }, [userId]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    setProducts(data || []);
    setShowSearch((data?.length || 0) >= 5);
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome do produto.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        price: formData.price ? parseFloat(formData.price) : null,
        description: formData.description || null,
        button_text: formData.button_text,
        link_type: formData.link_type,
        link_url: formData.link_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('catalog_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('catalog_products')
          .insert([
            {
              ...productData,
              user_id: userId,
              display_order: products.length,
            },
          ]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: editingProduct ? "Produto atualizado." : "Produto adicionado.",
      });

      setDialogOpen(false);
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        price: '', 
        description: '', 
        button_text: 'Mais informações',
        link_type: 'custom',
        link_url: '',
      });
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('catalog_products')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o produto.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso!",
      description: "Produto deletado.",
    });

    loadProducts();
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    const { error } = await supabase
      .from('catalog_products')
      .update({ is_visible: !currentVisibility })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a visibilidade.",
        variant: "destructive",
      });
      return;
    }

    loadProducts();
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price?.toString() || '',
      description: product.description || '',
      button_text: product.button_text || 'Mais informações',
      link_type: product.link_type || 'custom',
      link_url: product.link_url || '',
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      price: '', 
      description: '', 
      button_text: 'Mais informações',
      link_type: 'custom',
      link_url: '',
    });
    setDialogOpen(true);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Checkbox checked={showSearch} onCheckedChange={(checked) => setShowSearch(checked as boolean)} />
          <Label className="text-sm">
            Exibir campo de busca quando tiver 5 ou mais itens
          </Label>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} size="sm" className="gap-2 shadow-[var(--shadow-glow)]">
              <Plus className="h-4 w-4" />
              Adicionar produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] backdrop-blur-sm bg-card/95">
            <DialogHeader className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl text-center">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription className="text-center">
                Preencha as informações do produto para adicionar ao catálogo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-sm font-medium">
                  Nome do Produto *
                </Label>
                <Input
                  id="product-name"
                  placeholder="Digite o nome do produto"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description" className="text-sm font-medium">
                  Descrição
                  <span className="text-xs text-muted-foreground ml-2">
                    {formData.description.length}/1500
                  </span>
                </Label>
                <Textarea
                  id="product-description"
                  placeholder="Digite uma breve descrição do produto (se tiver)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value.slice(0, 1500) }))}
                  className="min-h-[100px] resize-none transition-all duration-200 focus:ring-2 focus:ring-primary"
                  maxLength={1500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-sm font-medium">
                  Preço (R$)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="h-11 pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-text" className="text-sm font-medium">
                  Texto do Botão
                </Label>
                <Input
                  id="button-text"
                  placeholder="Ex: Mais informações"
                  value={formData.button_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Tipo de Link para o Botão
                </Label>
                <RadioGroup 
                  value={formData.link_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, link_type: value }))}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="flex-1 cursor-pointer font-normal">
                      WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer font-normal">
                      Link customizado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer font-normal">
                      Cobre com PIX
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.link_type !== 'pix' && (
                <div className="space-y-2">
                  <Label htmlFor="link-url" className="text-sm font-medium">
                    {formData.link_type === 'whatsapp' ? 'Número do WhatsApp' : 'URL do Link'}
                  </Label>
                  <Input
                    id="link-url"
                    placeholder={
                      formData.link_type === 'whatsapp' 
                        ? '5511999999999' 
                        : 'https://exemplo.com'
                    }
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                  {formData.link_type === 'whatsapp' && (
                    <p className="text-xs text-muted-foreground">
                      Digite apenas números, incluindo código do país e DDD
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="h-11"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProduct} 
                disabled={loading}
                className="h-11 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Plus className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Produto'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum produto no catálogo ainda.</p>
            <p className="text-sm mt-2">Clique em "Adicionar produto" para começar.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-12 p-2"></th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Preço</th>
                  <th className="text-center p-3">Ações</th>
                  <th className="text-center p-3">Ocultar</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-muted/30">
                    <td className="p-2 text-center">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move inline-block" />
                    </td>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3 text-muted-foreground">{formatPrice(product.price)}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Switch
                          checked={!product.is_visible}
                          onCheckedChange={() => handleToggleVisibility(product.id, product.is_visible)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
