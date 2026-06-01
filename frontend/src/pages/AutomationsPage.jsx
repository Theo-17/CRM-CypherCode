import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Plus, Trash2, Clock, Bell, CheckSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TEMPLATE_META = {
  cliente_sin_seguimiento_30d: {
    descripcion: 'Notifica cuando un cliente lleva 30 días sin ningún seguimiento registrado.',
    icono: Clock,
    tag: 'Clientes inactivos',
  },
  tarea_vencida: {
    descripcion: 'Notifica cuando una tarea supera su fecha de vencimiento sin completarse.',
    icono: CheckSquare,
    tag: 'Tareas',
  },
  cliente_nuevo: {
    descripcion: 'Crea automáticamente una tarea de bienvenida al añadir un nuevo cliente.',
    icono: Users,
    tag: 'Clientes nuevos',
  },
  cliente_ganado: {
    descripcion: 'Notifica al equipo cuando un cliente pasa a estado "Ganado".',
    icono: Bell,
    tag: 'Conversión',
  },
};

const AutomationsPage = () => {
  const { getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, rule: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') { navigate('/dashboard'); return; }
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const [data, tmpl] = await Promise.all([
        api.get('/api/automatizaciones'),
        api.get('/api/automatizaciones/plantillas')
      ]);
      setRules(data);
      setTemplates(tmpl);
    } catch {
      toast.error('Error al cargar automatizaciones');
    }
  };

  const toggleRule = async (id, current) => {
    try {
      await api.put(`/api/automatizaciones/${id}`, { activa: !current });
      setRules(prev => prev.map(r => r.id === id ? { ...r, activa: !current } : r));
    } catch {
      toast.error('Error al actualizar regla');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return toast.error('Selecciona una plantilla');
    setSubmitting(true);
    try {
      await api.post('/api/automatizaciones', { templateId: selectedTemplateId });
      setModalOpen(false);
      setSelectedTemplateId('');
      toast.success('Automatización creada');
      fetchRules();
    } catch (error) {
      toast.error(error.message || 'Error al crear automatización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/automatizaciones/${deleteDialog.rule.id}`);
      setRules(prev => prev.filter(r => r.id !== deleteDialog.rule.id));
      setDeleteDialog({ open: false, rule: null });
      toast.success('Automatización eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <Helmet><title>Automatizaciones - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Automatizaciones</h1>
                <p className="text-muted-foreground">Configura reglas automáticas para tu CRM</p>
              </div>
              <Button onClick={() => setModalOpen(true)} disabled={templates.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Nueva Regla
              </Button>
            </div>

            <div className="grid gap-4">
              {rules.map(rule => {
                const meta = TEMPLATE_META[rule.condicion] || {};
                const Icon = meta.icono || Zap;
                return (
                  <Card key={rule.id} className={!rule.activa ? 'opacity-60' : ''}>
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-full shrink-0 ${rule.activa ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${rule.activa ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{rule.nombre}</h3>
                            {meta.tag && <Badge variant="outline" className="text-xs">{meta.tag}</Badge>}
                            {rule.activa
                              ? <Badge variant="secondary" className="text-xs text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200">Activa</Badge>
                              : <Badge variant="outline" className="text-xs text-muted-foreground">Pausada</Badge>
                            }
                          </div>
                          <p className="text-sm text-muted-foreground">{meta.descripcion || 'Automatización personalizada'}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Se ejecuta automáticamente en segundo plano</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Switch checked={rule.activa ?? false} onCheckedChange={() => toggleRule(rule.id, rule.activa)} />
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, rule })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {rules.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="mb-1">No hay automatizaciones activas.</p>
                  <p className="text-sm">Activa una plantilla para que el CRM trabaje solo.</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-6">Las automatizaciones activas se comprueban automáticamente cada minuto en el servidor.</p>
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="Nueva Automatización">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar plantilla..." /></SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div>
                      <p className="font-medium">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">{t.descripcion}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">Todas las plantillas disponibles ya están activas.</p>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting || !selectedTemplateId}>{submitting ? 'Creando...' : 'Activar'}</Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog({ open, rule: deleteDialog.rule })}
        title="Eliminar automatización"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AutomationsPage;
