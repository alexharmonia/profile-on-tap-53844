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
import { GripVertical, Edit, Trash2, Plus, X, Upload } from 'lucide-react';
import { applyCurrencyMask, parseCurrencyToNumber } from '@/lib/pixUtils';
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
interface CatalogSectionProps {
  userId: string;
}
export const CatalogSection = ({
  userId
}: CatalogSectionProps) => {
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
    show_images_above: false,
    images: [] as string[]
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  useEffect(() => {
    loadProducts();
  }, [userId]);
  const loadProducts = async () => {
    const {
      data,
      error
    } = await supabase.from('catalog_products').select('*').eq('user_id', userId).order('display_order', {
      ascending: true
    });
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
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const productData = {
        name: formData.name,
        price: formData.price ? parseCurrencyToNumber(formData.price) : null,
        description: formData.description || null,
        button_text: formData.button_text,
        link_type: formData.link_type,
        link_url: formData.link_url || null,
        show_images_above: formData.show_images_above,
        images: formData.images
      };
      if (editingProduct) {
        const {
          error
        } = await supabase.from('catalog_products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('catalog_products').insert([{
          ...productData,
          user_id: userId,
          display_order: products.length
        }]);
        if (error) throw error;
      }
      toast({
        title: "Sucesso!",
        description: editingProduct ? "Produto atualizado." : "Produto adicionado."
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
        show_images_above: false,
        images: []
      });
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteProduct = async (id: string) => {
    const {
      error
    } = await supabase.from('catalog_products').delete().eq('id', id);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o produto.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Sucesso!",
      description: "Produto deletado."
    });
    loadProducts();
  };
  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    const {
      error
    } = await supabase.from('catalog_products').update({
      is_visible: !currentVisibility
    }).eq('id', id);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a visibilidade.",
        variant: "destructive"
      });
      return;
    }
    loadProducts();
  };

  const handleReorderProducts = async (oldIndex: number, newIndex: number) => {
    const reorderedProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(reorderedProducts);

    // Update display_order in database
    const updates = reorderedProducts.map((product, index) => ({
      id: product.id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase
        .from('catalog_products')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    toast({
      title: "Sucesso!",
      description: "Ordem dos produtos atualizada."
    });
  };
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price ? applyCurrencyMask((product.price * 100).toString()) : '',
      description: product.description || '',
      button_text: product.button_text || 'Mais informações',
      link_type: product.link_type || 'custom',
      link_url: product.link_url || '',
      show_images_above: product.show_images_above || false,
      images: product.images || []
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
      show_images_above: false,
      images: []
    });
    setDialogOpen(true);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`;
        const {
          error: uploadError,
          data
        } = await supabase.storage.from('profile-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('profile-images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      toast({
        title: "Sucesso!",
        description: `${uploadedUrls.length} imagem(ns) adicionada(s).`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload das imagens.",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  };
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Checkbox checked={showSearch} onCheckedChange={checked => setShowSearch(checked as boolean)} />
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
                <Input id="product-name" placeholder="Digite o nome do produto" value={formData.name} onChange={e => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))} className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description" className="text-sm font-medium">
                  Descrição
                  <span className="text-xs text-muted-foreground ml-2">
                    {formData.description.length}/1500
                  </span>
                </Label>
                <Textarea id="product-description" value={formData.description} onChange={e => setFormData(prev => ({
                ...prev,
                description: e.target.value.slice(0, 1500)
              }))} className="min-h-[100px] resize-none transition-all duration-200 focus:ring-2 focus:ring-primary" maxLength={1500} placeholder="Digite uma breve descri\xE7\xE3o do produto." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-sm font-medium text-muted-foreground">
                  PREÇO
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted rounded-lg px-4 py-3 text-muted-foreground font-medium">
                    Real (R$)
                  </div>
                  <Input id="product-price" placeholder="0,00" value={formData.price} onChange={e => {
                  const masked = applyCurrencyMask(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    price: masked
                  }));
                }} className="flex-1 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-text" className="text-sm font-medium text-muted-foreground">
                  TEXTO DO BOTÃO
                </Label>
                <Input id="button-text" placeholder="Mais informações" value={formData.button_text} onChange={e => setFormData(prev => ({
                ...prev,
                button_text: e.target.value
              }))} className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary" />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  TIPO DE LINK PARA O BOTÃO
                </Label>
                <RadioGroup value={formData.link_type} onValueChange={value => setFormData(prev => ({
                ...prev,
                link_type: value
              }))} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="cursor-pointer font-normal">
                      WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer font-normal">
                      Link customizado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer font-normal">
                      Cobre com PIX
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.link_type !== 'pix' && <div className="space-y-2">
                  <Label htmlFor="link-url" className="text-sm font-medium">
                    {formData.link_type === 'whatsapp' ? 'Número do WhatsApp' : 'URL do Link'}
                  </Label>
                  <Input id="link-url" placeholder={formData.link_type === 'whatsapp' ? '5511999999999' : 'https://exemplo.com'} value={formData.link_url} onChange={e => setFormData(prev => ({
                ...prev,
                link_url: e.target.value
              }))} className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary" />
                  {formData.link_type === 'whatsapp' && <p className="text-xs text-muted-foreground">
                      Digite apenas números, incluindo código do país e DDD
                    </p>}
                </div>}
              
              {/* Seção de imagens */}
              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-medium text-muted-foreground">
                  IMAGENS DO PRODUTO
                </Label>
                <p className="text-xs text-muted-foreground">
                  Você pode arrastar as imagens para ordenar da maneira que desejar
                </p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="show-images-above" checked={formData.show_images_above} onCheckedChange={checked => setFormData(prev => ({
                  ...prev,
                  show_images_above: checked as boolean
                }))} />
                  <Label htmlFor="show-images-above" className="text-sm font-normal cursor-pointer">
                    Exibir as imagens acima do título e descrição
                  </Label>
                </div>

                <div className="space-y-3">
                  {formData.images.length > 0 && <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((img, index) => <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group">
                          <img src={img} alt={`Produto ${index + 1}`} className="w-full h-full object-cover" />
                          <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(index)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>)}
                    </div>}

                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input type="file" id="product-images" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                    <Label htmlFor="product-images" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-sm">
                          {uploadingImages ? <span className="text-primary">Enviando imagens...</span> : <>
                              <span className="font-medium text-primary">Clique para adicionar</span>
                              <span className="text-muted-foreground"> ou arraste imagens aqui</span>
                            </>}
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Preview do Produto */}
              <div className="pt-4 border-t space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  PREVIEW DO PRODUTO
                </Label>
                <div className="border-2 border-border rounded-xl overflow-hidden bg-card shadow-lg">
                  {formData.images.length > 0 && <div className="aspect-video w-full overflow-hidden">
                      <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                    </div>}
                  
                  <div className="p-4 space-y-3">
                    <h4 className="font-bold text-base font-sans">
                      {formData.name || 'Nome do Produto'}
                    </h4>
                    
                    {formData.description && <p className="text-sm text-muted-foreground line-clamp-2">
                        {formData.description}
                      </p>}
                    
                    <div className="flex items-end justify-between pt-2">
                      {formData.price && <div className="text-3xl font-bold text-primary">
                          {formData.price}
                        </div>}
                      
                      <Button 
                        size="lg" 
                        className="bg-white hover:bg-gray-50 border border-gray-200"
                        style={{ color: '#647498' }}
                      >
                        {formData.button_text || 'Mais informações'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-11">
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct} disabled={loading} className="h-11 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
                {loading ? <>
                    <Plus className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </> : 'Salvar Produto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ProductList 
        products={products}
        formatPrice={formatPrice}
        handleEditProduct={handleEditProduct}
        handleDeleteProduct={handleDeleteProduct}
        handleToggleVisibility={handleToggleVisibility}
        onReorder={handleReorderProducts}
      />
    </div>;
};

// Sortable Product Row Component
const SortableProductRow = ({ 
  product, 
  formatPrice, 
  handleEditProduct, 
  handleDeleteProduct, 
  handleToggleVisibility 
}: { 
  product: any;
  formatPrice: (price: number | null) => string;
  handleEditProduct: (product: any) => void;
  handleDeleteProduct: (id: string) => void;
  handleToggleVisibility: (id: string, currentVisibility: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t hover:bg-muted/30">
      <td className="p-2 text-center">
        <GripVertical 
          className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing inline-block" 
          {...attributes}
          {...listeners}
        />
      </td>
      <td className="p-3 font-medium">{product.name}</td>
      <td className="p-3 text-muted-foreground">{formatPrice(product.price)}</td>
      <td className="p-3">
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
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
  );
};

// Product List Component with Drag and Drop
const ProductList = ({ 
  products, 
  formatPrice, 
  handleEditProduct, 
  handleDeleteProduct, 
  handleToggleVisibility,
  onReorder 
}: { 
  products: any[];
  formatPrice: (price: number | null) => string;
  handleEditProduct: (product: any) => void;
  handleDeleteProduct: (id: string) => void;
  handleToggleVisibility: (id: string, currentVisibility: boolean) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  if (products.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum produto no catálogo ainda.</p>
          <p className="text-sm mt-2">Clique em "Adicionar produto" para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
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
              <SortableContext
                items={products.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {products.map(product => (
                  <SortableProductRow
                    key={product.id}
                    product={product}
                    formatPrice={formatPrice}
                    handleEditProduct={handleEditProduct}
                    handleDeleteProduct={handleDeleteProduct}
                    handleToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
};