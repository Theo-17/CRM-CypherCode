import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';

const EmailTemplatesPage = () => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', asunto: '', contenido: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.get('/api/plantillas');
      setTemplates(data);
    } catch {
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ nombre: template.nombre, asunto: template.asunto, contenido: template.contenido });
    } else {
      setEditingTemplate(null);
      setFormData({ nombre: '', asunto: '', contenido: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTemplate) {
        await api.put(`/api/plantillas/${editingTemplate.id}`, formData);
        toast.success('Plantilla actualizada');
      } else {
        await api.post('/api/plantillas', formData);
        toast.success('Plantilla creada');
      }
      setModalOpen(false);
      fetchTemplates();
    } catch {
      toast.error('Error al guardar plantilla');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/plantillas/${templateToDelete.id}`);
      toast.success('Plantilla eliminada');
      setDeleteDialogOpen(false);
      fetchTemplates();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <Helmet><title>Plantillas de Email - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div><h1 className="text-3xl font-bold mb-2">Plantillas de Email</h1><p className="text-muted-foreground">Gestiona tus plantillas de correo</p></div>
              <Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" />Nueva Plantilla</Button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1,2].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>
            ) : templates.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-16"><Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-50" /><p className="text-lg font-medium">No hay plantillas</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">{template.nombre}</h3>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(template)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setTemplateToDelete(template); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">Asunto: {template.asunto}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.contenido}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nombre</Label><Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Asunto</Label><Input value={formData.asunto} onChange={e => setFormData({...formData, asunto: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Contenido</Label><Textarea value={formData.contenido} onChange={e => setFormData({...formData, contenido: e.target.value})} rows={6} required /></div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Eliminar plantilla" description="¿Eliminar esta plantilla?" onConfirm={handleDelete} />
    </>
  );
};

export default EmailTemplatesPage;
