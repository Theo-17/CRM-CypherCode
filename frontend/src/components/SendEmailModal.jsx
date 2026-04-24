import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClientAutocomplete from '@/components/ClientAutocomplete';
import api from '@/lib/apiServerClient';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

// cliente prop is optional — if not passed, user picks one inside the modal
const SendEmailModal = ({ open, onOpenChange, cliente: clienteProp }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clienteId, setClienteId] = useState(clienteProp?.id || '');
  const [clienteEmail, setClienteEmail] = useState(clienteProp?.email || '');
  const [formData, setFormData] = useState({ templateId: 'custom', asunto: '', contenido: '' });

  useEffect(() => {
    if (open) {
      setFormData({ templateId: 'custom', asunto: '', contenido: '' });
      setClienteId(clienteProp?.id || '');
      setClienteEmail(clienteProp?.email || '');
      api.get('/api/plantillas').then(setTemplates).catch(() => {});
    }
  }, [open, clienteProp]);

  // When client changes via autocomplete, fetch their email
  const handleClienteChange = async (id) => {
    setClienteId(id);
    setClienteEmail('');
    if (!id) return;
    try {
      const c = await api.get(`/api/clientes/${id}`);
      setClienteEmail(c.email || '');
    } catch {}
  };

  const handleTemplateChange = (templateId) => {
    if (templateId === 'custom') {
      setFormData({ templateId, asunto: '', contenido: '' });
    } else {
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) setFormData({ templateId, asunto: tpl.asunto, contenido: tpl.contenido });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!clienteId) { toast.error('Selecciona un cliente'); return; }
    if (!clienteEmail) { toast.error('El cliente no tiene email registrado'); return; }
    if (!formData.asunto || !formData.contenido) { toast.error('Asunto y contenido son requeridos'); return; }
    setLoading(true);
    try {
      await api.post('/api/emails', {
        cliente_id: clienteId,
        plantilla_id: formData.templateId !== 'custom' ? formData.templateId : null,
        asunto: formData.asunto,
        contenido: formData.contenido,
      });
      const mailtoUrl = `mailto:${encodeURIComponent(clienteEmail)}?subject=${encodeURIComponent(formData.asunto)}&body=${encodeURIComponent(formData.contenido)}`;
      window.open(mailtoUrl, '_blank');
      toast.success('Abriendo cliente de correo...');
      onOpenChange(false);
    } catch {
      toast.error('No se pudo registrar el email');
    } finally {
      setLoading(false);
    }
  };

  const titulo = clienteProp ? `Enviar Email a ${clienteProp.nombre}` : 'Nuevo Email';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4 py-2">
          {!clienteProp && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <ClientAutocomplete value={clienteId} onChange={handleClienteChange} placeholder="Buscar cliente..." />
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Plantilla</Label>
              <Select value={formData.templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar plantilla" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Personalizado</SelectItem>
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Asunto</Label>
            <Input value={formData.asunto} onChange={e => setFormData({ ...formData, asunto: e.target.value })} placeholder="Asunto del correo" required />
          </div>

          <div className="space-y-2">
            <Label>Contenido</Label>
            <Textarea value={formData.contenido} onChange={e => setFormData({ ...formData, contenido: e.target.value })} placeholder="Escribe tu mensaje aquí..." rows={6} required />
          </div>

          {clienteId && !clienteEmail && (
            <p className="text-sm text-destructive">Este cliente no tiene email registrado.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || (!!clienteId && !clienteEmail)}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Abrir en correo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;
