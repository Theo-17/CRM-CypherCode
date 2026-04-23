import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, Grid3x3, List, Edit, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const ClientesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', empresa: '', estado: 'Activo' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchClientes(); }, []);
  useEffect(() => { filterClientes(); }, [clientes, searchTerm, filterStatus]);

  const fetchClientes = async () => {
    try {
      const data = await api.get('/api/clientes');
      setClientes(data);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {
    let filtered = clientes;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter(c => c.estado === filterStatus);
    setFilteredClientes(filtered);
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ nombre: client.nombre, email: client.email || '', telefono: client.telefono || '', empresa: client.empresa || '', estado: client.estado || 'Activo' });
    } else {
      setEditingClient(null);
      setFormData({ nombre: '', email: '', telefono: '', empresa: '', estado: 'Activo' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) { toast.error('El nombre es obligatorio'); return; }
    setSubmitting(true);
    try {
      if (editingClient) {
        await api.put(`/api/clientes/${editingClient.id}`, formData);
        toast.success('Cliente actualizado');
      } else {
        await api.post('/api/clientes', formData);
        toast.success('Cliente creado');
      }
      setModalOpen(false);
      fetchClientes();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/clientes/${clientToDelete.id}`);
      toast.success('Cliente eliminado');
      setDeleteDialogOpen(false);
      fetchClientes();
    } catch {
      toast.error('Error al eliminar el cliente');
    }
  };

  return (
    <>
      <Helmet><title>Clientes - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Clientes</h1>
              <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><Grid3x3 className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              </div>
              <Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" />Nuevo Cliente</Button>
            </div>

            {loading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : filteredClientes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Search className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No se encontraron clientes</p>
                  {!searchTerm && filterStatus === 'all' && (
                    <Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" />Crear Cliente</Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClientes.map((cliente, index) => (
                  <motion.div key={cliente.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                    <Card className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{cliente.nombre}</h3>
                            {cliente.empresa && <p className="text-sm text-muted-foreground">{cliente.empresa}</p>}
                          </div>
                          <StatusBadge status={cliente.estado} type="client" />
                        </div>
                        {cliente.email && <p className="text-sm text-muted-foreground mb-1">{cliente.email}</p>}
                        {cliente.telefono && <p className="text-sm text-muted-foreground mb-4">{cliente.telefono}</p>}
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/clientes/${cliente.id}`)}><Eye className="h-4 w-4 mr-1" />Ver</Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenModal(cliente)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => { setClientToDelete(cliente); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Nombre</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Teléfono</th>
                        <th className="text-left p-4 font-medium">Empresa</th>
                        <th className="text-left p-4 font-medium">Estado</th>
                        <th className="text-right p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClientes.map(cliente => (
                        <tr key={cliente.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{cliente.nombre}</td>
                          <td className="p-4 text-muted-foreground">{cliente.email || '-'}</td>
                          <td className="p-4 text-muted-foreground">{cliente.telefono || '-'}</td>
                          <td className="p-4 text-muted-foreground">{cliente.empresa || '-'}</td>
                          <td className="p-4"><StatusBadge status={cliente.estado} type="client" /></td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/clientes/${cliente.id}`)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenModal(cliente)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setClientToDelete(cliente); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
          <div className="space-y-2"><Label>Empresa</Label><Input value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} /></div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={formData.estado} onValueChange={v => setFormData({...formData, estado: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Guardando...' : editingClient ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Eliminar cliente" description={`¿Eliminar a ${clientToDelete?.nombre}? Esta acción no se puede deshacer.`} onConfirm={handleDelete} confirmText="Eliminar" />
    </>
  );
};

export default ClientesPage;
