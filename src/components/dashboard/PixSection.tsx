import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
interface PixSectionProps {
  profile: any;
  onUpdate: () => void;
}
export const PixSection = ({
  profile,
  onUpdate
}: PixSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pix_key_type: profile?.pix_key_type || '',
    pix_key: profile?.pix_key || '',
    pix_beneficiary_name: profile?.pix_beneficiary_name || '',
    pix_beneficiary_city: profile?.pix_beneficiary_city || ''
  });
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update(formData).eq('id', profile.id);
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Configurações PIX atualizadas com sucesso."
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating PIX settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Cobre seus clientes com PIX QR Code ou PIX Copia e Cola</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pix-type">Tipo da chave PIX</Label>
            <Select value={formData.pix_key_type} onValueChange={value => handleChange('pix_key_type', value)}>
              <SelectTrigger id="pix-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Celular</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="random">Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <Input id="pix-key" placeholder="Digite sua chave PIX" value={formData.pix_key} onChange={e => handleChange('pix_key', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiary-name">Nome do beneficiário (até 25 letras)</Label>
            <Input id="beneficiary-name" placeholder="Nome completo" value={formData.pix_beneficiary_name} onChange={e => handleChange('pix_beneficiary_name', e.target.value)} maxLength={25} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiary-city">Cidade do beneficiário (até 15 letras)</Label>
            <Input id="beneficiary-city" placeholder="Cidade" value={formData.pix_beneficiary_city} onChange={e => handleChange('pix_beneficiary_city', e.target.value)} maxLength={15} />
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Configure sua chave PIX para permitir que seus clientes façam pagamentos diretamente pelo seu cartão digital.<strong></strong> ​
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>;
};