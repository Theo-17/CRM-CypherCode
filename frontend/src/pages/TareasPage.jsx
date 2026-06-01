import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import PriorityBadge from '@/components/PriorityBadge';
import StatusBadge from '@/components/StatusBadge';
import ClientAutocomplete from '@/components/ClientAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TareasPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [tareas, setTareas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterPrioridad, setFilterPrioridad] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', cliente_id: '', fecha_vencimiento: '', prioridad: 'Media', estado: 'Pendiente' });
  const [reminders, setReminders] = useState({ dayBefore: false, hourBefore: false, halfHourBefore: false, custom: false, customMinutes: 15 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!loading && location.state?.editId) {
      const tarea = tareas.find(t => t.id === location.state.editId);
      if (tarea) { handleOpenModal(tarea); window.history.replaceState({}, ''); }
    }
  }, [loading, tareas]);

  const fetchData = async () => {
    try {
      const [tareasData, clientesData] = await Promise.all([
        api.get('/api/tareas'),
        api.get('/api/clientes')
      ]);
      setTareas(tareasData);
      setClientes(clientesData);
    } catch {
      toast.error('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTareas = () => {
    let filtered = tareas;
    if (filterEstado !== 'all') filtered = filtered.filter(t => t.estado === filterEstado);
    if (filterPrioridad !== 'all') filtered = filtered.filter(t => t.prioridad === filterPrioridad);
    return filtered;
  };

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        titulo: task.titulo, descripcion: task.descripcion || '',
        cliente_id: task.cliente_id || '', prioridad: task.prioridad || 'Media', estado: task.estado,
        fecha_vencimiento: task.fecha_vencimiento ? (() => {
          const d = new Date(task.fecha_vencimiento);
          const pad = n => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        })() : ''
      });
    } else {
      setEditingTask(null);
      setFormData({ titulo: '', descripcion: '', cliente_id: '', fecha_vencimiento: '', prioridad: 'Media', estado: 'Pendiente' });
    }
    setReminders({ dayBefore: false, hourBefore: false, halfHourBefore: false, custom: false, customMinutes: 15 });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo) return toast.error('El título es obligatorio');
    setSubmitting(true);
    try {
      const reminderList = [];
      if (formData.fecha_vencimiento) {
        if (reminders.dayBefore) reminderList.push(24 * 60);
        if (reminders.hourBefore) reminderList.push(60);
        if (reminders.halfHourBefore) reminderList.push(30);
        if (reminders.custom && reminders.customMinutes > 0) reminderList.push(Number(reminders.customMinutes));
      }
      const payload = { ...formData, reminders: reminderList };
      if (editingTask) {
        await api.put(`/api/tareas/${editingTask.id}`, payload);
        toast.success('Tarea actualizada');
      } else {
        await api.post('/api/tareas', payload);
        toast.success('Tarea creada');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Error al guardar la tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tareas/${taskId}/estado`, { estado: newStatus });
      toast.success('Estado actualizado');
      fetchData();
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/tareas/${taskToDelete.id}`);
      toast.success('Tarea eliminada');
      setDeleteDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Error al eliminar la tarea');
    }
  };

  const getClienteName = (clienteId) => {
    if (!clienteId) return 'Sin cliente asignado';
    return clientes.find(c => c.id === clienteId)?.nombre || 'Cliente desconocido';
  };

  const filteredTareas = getFilteredTareas();

  return (
    <>
      <Helmet><title>Tareas - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Tareas</h1>
              <p className="text-muted-foreground">Organiza y gestiona tus tareas</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filtrar por prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" />Nueva Tarea</Button>
            </div>

            <Tabs value={filterEstado} onValueChange={setFilterEstado}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="Pendiente">Pendientes</TabsTrigger>
                <TabsTrigger value="En Progreso">En Progreso</TabsTrigger>
                <TabsTrigger value="Completada">Completadas</TabsTrigger>
              </TabsList>
              <TabsContent value={filterEstado}>
                {loading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
                ) : filteredTareas.length === 0 ? (
                  <Card><CardContent className="flex flex-col items-center justify-center py-16"><CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" /><p className="text-lg font-medium">No hay tareas</p></CardContent></Card>
                ) : (
                  <div className="space-y-4">
                    {filteredTareas.map(tarea => (
                      <Card key={tarea.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{tarea.titulo}</h3>
                                <PriorityBadge priority={tarea.prioridad} />
                                <StatusBadge status={tarea.estado} type="task" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">Cliente: {getClienteName(tarea.cliente_id)}</p>
                              {tarea.descripcion && <p className="text-sm text-muted-foreground mb-3">{tarea.descripcion}</p>}
                              {tarea.fecha_vencimiento && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  Vence: {format(new Date(tarea.fecha_vencimiento), 'dd MMM yyyy, HH:mm', { locale: es })}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleOpenModal(tarea)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => { setTaskToDelete(tarea); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {tarea.estado !== 'Pendiente' && <Button variant="outline" size="sm" onClick={() => handleStatusChange(tarea.id, 'Pendiente')}>Marcar Pendiente</Button>}
                            {tarea.estado !== 'En Progreso' && <Button variant="outline" size="sm" onClick={() => handleStatusChange(tarea.id, 'En Progreso')}>En Progreso</Button>}
                            {tarea.estado !== 'Completada' && <Button variant="outline" size="sm" onClick={() => handleStatusChange(tarea.id, 'Completada')}>Completada</Button>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Título *</Label><Input value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Cliente (Opcional)</Label><ClientAutocomplete value={formData.cliente_id} onChange={v => setFormData({...formData, cliente_id: v})} /></div>
          <div className="space-y-2"><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} rows={3} /></div>
          <div className="space-y-2"><Label>Fecha y Hora de Vencimiento</Label><Input type="datetime-local" value={formData.fecha_vencimiento} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} /></div>
          {formData.fecha_vencimiento && !editingTask && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <Label className="flex items-center gap-2 text-primary"><Bell className="h-4 w-4" />Recordatorios</Label>
              {[{id:'r1',label:'1 día antes',key:'dayBefore'},{id:'r2',label:'1 hora antes',key:'hourBefore'},{id:'r3',label:'30 min antes',key:'halfHourBefore'}].map(r => (
                <div key={r.id} className="flex items-center space-x-2">
                  <Checkbox id={r.id} checked={reminders[r.key]} onCheckedChange={c => setReminders({...reminders, [r.key]: c})} />
                  <label htmlFor={r.id} className="text-sm font-medium">{r.label}</label>
                </div>
              ))}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="r4" checked={reminders.custom} onCheckedChange={c => setReminders({...reminders, custom: c})} />
                <label htmlFor="r4" className="text-sm font-medium">Personalizado (min):</label>
                <Input type="number" className="w-20 h-8" min="1" value={reminders.customMinutes} onChange={e => setReminders({...reminders, customMinutes: e.target.value})} disabled={!reminders.custom} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={formData.prioridad} onValueChange={v => setFormData({...formData, prioridad: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={v => setFormData({...formData, estado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pendiente">Pendiente</SelectItem><SelectItem value="En Progreso">En Progreso</SelectItem><SelectItem value="Completada">Completada</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Eliminar tarea" description="¿Eliminar esta tarea?" onConfirm={handleDelete} />
    </>
  );
};

export default TareasPage;
