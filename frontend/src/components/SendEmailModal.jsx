import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SendEmailModal = ({ open, onOpenChange, cliente }) => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    templateId: 'custom',
    asunto: '',
    contenido: ''
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setFormData({ templateId: 'custom', asunto: '', contenido: '' });
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const records = await pb.collection('plantillas_email').getFullList({
        filter: `usuario_id = "${currentUser.id}"`,
        $autoCancel: false
      });
      setTemplates(records);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateChange = (templateId) => {
    if (templateId === 'custom') {
      setFormData({ templateId, asunto: '', contenido: '' });
    } else {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          templateId,
          asunto: template.asunto,
          contenido: template.contenido
        });
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.asunto || !formData.contenido) {
      toast.error('Asunto y contenido son requeridos');
      return;
    }

    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/emails/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          templateId: formData.templateId === 'custom' ? null : formData.templateId,
          asunto: formData.asunto,
          contenido: formData.contenido,
          destinatario: cliente.email
        })
      });

      if (!response.ok) throw new Error('Error al enviar email');
      
      toast.success('Email enviado correctamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('No se pudo enviar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Email a {cliente?.nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={formData.templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Personalizado</SelectItem>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Asunto</Label>
            <Input 
              value={formData.asunto}
              onChange={(e) => setFormData({...formData, asunto: e.target.value})}
              placeholder="Asunto del correo"
            />
          </div>

          <div className="space-y-2">
            <Label>Contenido</Label>
            <Textarea 
              value={formData.contenido}
              onChange={(e) => setFormData({...formData, contenido: e.target.value})}
              placeholder="Escribe tu mensaje aquí..."
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !cliente?.email}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Email
            </Button>
          </div>
          {!cliente?.email && (
            <p className="text-sm text-destructive text-right">El cliente no tiene email registrado.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;