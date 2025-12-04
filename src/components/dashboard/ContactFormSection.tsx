import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Download, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface ContactFormSectionProps {
  userId: string;
}
interface FormField {
  type: 'name' | 'email' | 'phone' | 'message';
  label: string;
  required: boolean;
}
const defaultFields: FormField[] = [{
  type: 'name',
  label: 'Nome',
  required: false
}, {
  type: 'email',
  label: 'E-mail',
  required: false
}, {
  type: 'phone',
  label: 'Telefone',
  required: false
}, {
  type: 'message',
  label: 'Mensagem',
  required: false
}];
export const ContactFormSection = ({
  userId
}: ContactFormSectionProps) => {
  const [formConfig, setFormConfig] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formTitle, setFormTitle] = useState('Fale Conosco');
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [requireFormFill, setRequireFormFill] = useState(false);
  const [sendEmailNotifications, setSendEmailNotifications] = useState(false);
  const [newFieldType, setNewFieldType] = useState<'name' | 'email' | 'phone' | 'message'>('name');
  useEffect(() => {
    loadFormConfig();
    loadSubmissions();
  }, [userId]);
  const loadFormConfig = async () => {
    const {
      data,
      error
    } = await supabase.from('contact_forms').select('*').eq('user_id', userId).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error loading form config:', error);
      return;
    }
    if (data) {
      setFormConfig(data);
      setFormTitle(data.title);
      setFields(data.fields as any || defaultFields);
      setRequireFormFill(data.require_form_fill);
      setSendEmailNotifications(data.send_email_notifications);
    }
  };
  const loadSubmissions = async () => {
    const {
      data: formData
    } = await supabase.from('contact_forms').select('id').eq('user_id', userId).maybeSingle();
    if (!formData) return;
    const {
      data,
      error
    } = await supabase.from('contact_submissions').select('*').eq('form_id', formData.id).order('submitted_at', {
      ascending: false
    });
    if (error) {
      console.error('Error loading submissions:', error);
      return;
    }
    setSubmissions(data || []);
  };
  const handleSaveForm = async () => {
    setLoading(true);
    try {
      const formData = {
        title: formTitle,
        fields: fields as any,
        require_form_fill: requireFormFill,
        send_email_notifications: sendEmailNotifications
      };
      if (formConfig) {
        const {
          error
        } = await supabase.from('contact_forms').update(formData).eq('id', formConfig.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('contact_forms').insert([{
          ...formData,
          user_id: userId
        }]);
        if (error) throw error;
      }
      toast({
        title: "Sucesso!",
        description: "Formulário salvo com sucesso."
      });
      setEditDialogOpen(false);
      loadFormConfig();
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o formulário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleAddField = () => {
    const newField: FormField = {
      type: newFieldType,
      label: getFieldLabel(newFieldType),
      required: false
    };
    setFields([...fields, newField]);
  };
  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };
  const handleToggleRequired = (index: number) => {
    const newFields = [...fields];
    newFields[index].required = !newFields[index].required;
    setFields(newFields);
  };
  const getFieldLabel = (type: string) => {
    const labels: Record<string, string> = {
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      message: 'Mensagem'
    };
    return labels[type] || type;
  };
  const exportSubmissions = () => {
    const csv = [['Nome', 'E-mail', 'Telefone', 'Mensagem', 'Enviado em'].join(','), ...filteredSubmissions.map(s => [s.name || '', s.email || '', s.phone || '', (s.message || '').replace(/,/g, ';'), format(new Date(s.submitted_at), 'dd/MM/yyyy HH:mm', {
      locale: ptBR
    })].join(','))].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || submission.name?.toLowerCase().includes(searchTerm.toLowerCase()) || submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) || submission.phone?.includes(searchTerm) || submission.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const submittedDate = new Date(submission.submitted_at);
    const matchesStartDate = !startDate || submittedDate >= new Date(startDate);
    const matchesEndDate = !endDate || submittedDate <= new Date(endDate + 'T23:59:59');
    return matchesSearch && matchesStartDate && matchesEndDate;
  });
  return <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Formulário de Contatos
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">Use o formulário como ferramenta de Marketing para coletar
informações dos seus &quot;Leads&quot;</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportSubmissions} disabled={submissions.length === 0} className="gap-2 shadow-sm hover:shadow-md transition-shadow">
              <Download className="h-4 w-4" />
              Exportar contatos
            </Button>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all">
                  <Edit2 className="h-4 w-4" />
                  Editar formulário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto backdrop-blur-sm bg-card/95">
                <DialogHeader className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Edit2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <DialogTitle className="text-2xl text-center">Editar Formulário</DialogTitle>
                  <DialogDescription className="text-center">
                    Configure os campos e opções do seu formulário de contato
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="form-title" className="text-sm font-medium">Título</Label>
                    <Input id="form-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Fale Conosco" className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Campos do Formulário</Label>
                      <div className="flex gap-2">
                        <Select value={newFieldType} onValueChange={(val: any) => setNewFieldType(val)}>
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="message">Mensagem</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleAddField} className="h-9 gap-2 shadow-sm">
                          <Plus className="h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr,auto,auto] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 rounded-lg">
                        <div>Tipo</div>
                        <div>Campo obrigatório?</div>
                        <div>Ações</div>
                      </div>
                      {fields.map((field, index) => <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-center p-3 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors">
                          <div className="font-medium">{getFieldLabel(field.type)}</div>
                          <div className="flex justify-center">
                            <Checkbox checked={field.required} onCheckedChange={() => handleToggleRequired(index)} />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveField(index)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>)}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border border-border/50 p-4 bg-muted/20">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Deseja receber um e-mail informando sempre que alguém se cadastrar em seu formulário?
                      </Label>
                      <RadioGroup value={sendEmailNotifications ? 'yes' : 'no'} onValueChange={val => setSendEmailNotifications(val === 'yes')} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="email-yes" />
                          <Label htmlFor="email-yes" className="font-normal cursor-pointer">
                            Quero receber
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="email-no" />
                          <Label htmlFor="email-no" className="font-normal cursor-pointer">
                            Não quero receber
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/50">
                      <Label className="text-sm font-medium">
                        Exigir preenchimento do formulário para visualizar seu perfil
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Deseja solicitar que os visitantes preencham o formulário de contato antes de visualizar as informações do seu perfil?
                      </p>
                      <RadioGroup value={requireFormFill ? 'yes' : 'no'} onValueChange={val => setRequireFormFill(val === 'yes')} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="require-no" />
                          <Label htmlFor="require-no" className="font-normal cursor-pointer">
                            Não
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="require-yes" />
                          <Label htmlFor="require-yes" className="font-normal cursor-pointer">
                            Sim
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="h-11">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveForm} disabled={loading} className="h-11 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
                    Salvar formulário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-lg border border-border/50 bg-card/50">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Digite para pesquisar" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-10" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>}
        </div>
        <div className="flex gap-2 items-center">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Data inicial</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[150px] h-10" />
        </div>
        <div className="flex gap-2 items-center">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Data final</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[150px] h-10" />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden shadow-sm bg-card">
        {filteredSubmissions.length === 0 ? <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Nenhum contato registrado</p>
            <p className="text-sm mt-2">Quando alguém preencher seu formulário, aparecerá aqui.</p>
          </div> : <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">Ações</th>
                  <th className="text-left p-3 font-medium text-sm">Nome</th>
                  <th className="text-left p-3 font-medium text-sm">Telefone</th>
                  <th className="text-left p-3 font-medium text-sm">E-mail</th>
                  <th className="text-left p-3 font-medium text-sm">Mensagem</th>
                  <th className="text-left p-3 font-medium text-sm">Enviado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(submission => <tr key={submission.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 text-sm">
                      <Button variant="ghost" size="sm" onClick={async () => {
                  if (confirm('Tem certeza que deseja excluir esta submissão?')) {
                    const {
                      error
                    } = await supabase.from('contact_submissions').delete().eq('id', submission.id);
                    if (!error) {
                      toast({
                        title: "Sucesso",
                        description: "Submissão excluída com sucesso."
                      });
                      loadSubmissions();
                    } else {
                      toast({
                        title: "Erro",
                        description: "Não foi possível excluir a submissão.",
                        variant: "destructive"
                      });
                    }
                  }
                }} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="p-3 text-sm">{submission.name || '-'}</td>
                    <td className="p-3 text-sm">{submission.phone || '-'}</td>
                    <td className="p-3 text-sm">{submission.email || '-'}</td>
                    <td className="p-3 text-sm max-w-[300px] truncate">{submission.message || '-'}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', {
                  locale: ptBR
                })}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>
    </div>;
};