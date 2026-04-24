import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import ClientAutocomplete from '@/components/ClientAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Phone, Mail, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SeguimientosPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [seguimientos, setSeguimientos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeguimiento, setEditingSeguimiento] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seguimientoToDelete, setSeguimientoToDelete] = useState(null);
  const [formData, setFormData] = useState({ cliente_id: '', tipo: 'Llamada', notas: '', fecha: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!loading && location.state?.editId) {
      const seg = seguimientos.find(s => s.id === location.state.editId);
      if (seg) { handleOpenModal(seg); window.history.replaceState({}, ''); }
    }
  }, [loading, seguimientos]);

  const fetchData = async () => {
    try {
      const [seguimientosData, clientesData] = await Promise.all([
        api.get('/api/seguimientos'),
        api.get('/api/clientes')
      ]);
      setSeguimientos(seguimientosData);
      setClientes(clientesData);
    } catch {
      toast.error('Error al cargar los seguimientos');
    } finally {
      setLoading(false);
    }
  };

  const getFiltered = () => {
    let f = seguimientos;
    if (searchTerm) f = f.filter(s => s.notas?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterTipo !== 'all') f = f.filter(s => s.tipo === filterTipo);
    return f;
  };

  const handleOpenModal = (seg = null) => {
    if (seg) {
      setEditingSeguimiento(seg);
      setFormData({ cliente_id: seg.cliente_id, tipo: seg.tipo, notas: seg.notas || '', fecha: seg.fecha ? new Date(seg.fecha).toISOString().slice(0, 16) : '' });
    } else {
      setEditingSeguimiento(null);
      setFormData({ cliente_id: '', tipo: 'Llamada', notas: '', fecha: new Date().toISOString().slice(0, 16) });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id || !formData.fecha) return toast.error('Cliente y fecha son obligatorios');
    setSubmitting(true);
    try {
      if (editingSeguimiento) {
        await api.put(`/api/seguimientos/${editingSeguimiento.id}`, formData);
        toast.success('Seguimiento actualizado');
      } else {
        await api.post('/api/seguimientos', formData);
        toast.success('Seguimiento creado');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el seguimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/seguimientos/${seguimientoToDelete.id}`);
      toast.success('Seguimiento eliminado');
      setDeleteDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const getClienteName = (id) => clientes.find(c => c.id === id)?.nombre || 'Cliente desconocido';
  const getTypeIcon = (tipo) => ({ Llamada: <Phone className="h-5 w-5" />, Email: <Mail className="h-5 w-5" />, Reunion: <Users className="h-5 w-5" /> }[tipo] || null);
  const getTypeColor = (tipo) => ({ Llamada: 'bg-blue-100 text-blue-800', Email: 'bg-green-100 text-green-800', Reunion: 'bg-purple-100 text-purple-800' }[tipo] || 'bg-gray-100 text-gray-800');

  const filtered = getFiltered();

  return (
    <>
      <Helmet><title>Seguimientos - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Seguimientos</h1>
              <p className="text-muted-foreground">Registra y gestiona tus interacciones con clientes</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar en notas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Llamada">Llamada</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Reunion">Reunión</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" />Nuevo Seguimiento</Button>
            </div>

            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-16"><Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" /><p className="text-lg font-medium">No se encontraron seguimientos</p></CardContent></Card>
            ) : (
              <div className="space-y-6">
                {filtered.map((seg, index) => (
                  <div key={seg.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getTypeColor(seg.tipo)}`}>{getTypeIcon(seg.tipo)}</div>
                      {index < filtered.length - 1 && <div className="w-0.5 flex-1 bg-border mt-4" />}
                    </div>
                    <Card className="flex-1 hover:shadow-md transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{seg.tipo}</h3>
                              <span className="text-sm text-muted-foreground">{format(new Date(seg.fecha), 'dd MMM yyyy, HH:mm', { locale: es })}</span>
                            </div>
                            <p className="text-sm font-medium mb-2">Cliente: {getClienteName(seg.cliente_id)}</p>
                            {seg.notas && <p className="text-sm text-muted-foreground">{seg.notas}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(seg)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSeguimientoToDelete(seg); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editingSeguimiento ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Cliente *</Label><ClientAutocomplete value={formData.cliente_id} onChange={v => setFormData({...formData, cliente_id: v})} /></div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={formData.tipo} onValueChange={v => setFormData({...formData, tipo: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Llamada">Llamada</SelectItem><SelectItem value="Email">Email</SelectItem><SelectItem value="Reunion">Reunión</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Fecha y Hora *</Label><Input type="datetime-local" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Notas</Label><Textarea value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} rows={4} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Eliminar seguimiento" description="¿Eliminar este seguimiento?" onConfirm={handleDelete} />
    </>
  );
};

export default SeguimientosPage;
