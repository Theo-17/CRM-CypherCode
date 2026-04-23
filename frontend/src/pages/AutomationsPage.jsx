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
import { Zap, Play, Plus, Trash2 } from 'lucide-react';

const AutomationsPage = () => {
  const { getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, rule: null });
  const [form, setForm] = useState({ nombre: '', trigger: '', accion: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') { navigate('/dashboard'); return; }
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await api.get('/api/automatizaciones');
      setRules(data);
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
    setSubmitting(true);
    try {
      const rule = await api.post('/api/automatizaciones', form);
      setRules(prev => [rule, ...prev]);
      setModalOpen(false);
      setForm({ nombre: '', trigger: '', accion: '' });
      toast.success('Automatización creada');
    } catch {
      toast.error('Error al crear automatización');
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

  const executeAutomations = async () => {
    try {
      const data = await api.post('/api/automatizaciones/ejecutar', {});
      toast.success(data.message);
    } catch {
      toast.error('Error al ejecutar automatizaciones');
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
              <div className="flex gap-3">
                <Button variant="secondary" onClick={executeAutomations}>
                  <Play className="h-4 w-4 mr-2" /> Ejecutar Ahora
                </Button>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Nueva Regla
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {rules.map(rule => (
                <Card key={rule.id}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{rule.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          Si: <span className="font-medium">{rule.condicion}</span> → Entonces: <span className="font-medium">{rule.accion}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.activa ?? false} onCheckedChange={() => toggleRule(rule.id, rule.activa)} />
                      <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, rule })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rules.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay reglas configuradas. Crea la primera automatización.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="Nueva Automatización">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Notificar clientes inactivos" required />
          </div>
          <div className="space-y-2">
            <Label>Condición (Si...)</Label>
            <Input value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} placeholder="Ej: cliente_sin_seguimiento_30_dias" required />
          </div>
          <div className="space-y-2">
            <Label>Acción (Entonces...)</Label>
            <Input value={form.accion} onChange={e => setForm({ ...form, accion: e.target.value })} placeholder="Ej: crear_tarea_seguimiento" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creando...' : 'Crear'}</Button>
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
