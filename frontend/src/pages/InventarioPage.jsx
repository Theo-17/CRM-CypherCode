import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FormModal from '@/components/FormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Package, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const InventarioPage = () => {
  const { currentUser } = useAuth();
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', precio: '', costo: '', stock: '', sku: '', categoria: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodData, movData] = await Promise.all([
        api.get('/api/productos'),
        api.get('/api/productos/movimientos')
      ]);
      setProductos(prodData);
      setMovimientos(movData);
    } catch {
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ nombre: product.nombre, descripcion: product.descripcion || '', precio: product.precio, costo: product.costo || '', stock: product.stock, sku: product.sku || '', categoria: product.categoria || '' });
    } else {
      setEditingProduct(null);
      setFormData({ nombre: '', descripcion: '', precio: '', costo: '', stock: '', sku: '', categoria: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.put(`/api/productos/${editingProduct.id}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/api/productos', formData);
        toast.success('Producto creado');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Error al guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockProducts = productos.filter(p => p.stock < 5);

  return (
    <>
      <Helmet><title>Inventario - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div><h1 className="text-3xl font-bold mb-2">Inventario</h1><p className="text-muted-foreground">Gestiona tus productos y existencias</p></div>
              <Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" />Nuevo Producto</Button>
            </div>

            {lowStockProducts.length > 0 && (
              <Card className="mb-8 border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-2"><CardTitle className="text-destructive flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5" />Alertas de Stock Bajo</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.map(p => <Badge key={p.id} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{p.nombre} ({p.stock} unid.)</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Producto</th>
                        <th className="text-left p-4 font-medium">SKU</th>
                        <th className="text-left p-4 font-medium">Categoría</th>
                        <th className="text-right p-4 font-medium">Precio</th>
                        <th className="text-right p-4 font-medium">Stock</th>
                        <th className="text-right p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                      ) : productos.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" />No hay productos</td></tr>
                      ) : productos.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{p.nombre}</td>
                          <td className="p-4 text-sm text-muted-foreground">{p.sku || '-'}</td>
                          <td className="p-4 text-sm text-muted-foreground">{p.categoria || '-'}</td>
                          <td className="p-4 text-right">${Number(p.precio).toFixed(2)}</td>
                          <td className="p-4 text-right"><Badge variant="outline" className={p.stock < 5 ? 'bg-destructive/10 text-destructive' : ''}>{p.stock}</Badge></td>
                          <td className="p-4 text-right"><Button variant="ghost" size="sm" onClick={() => handleOpenModal(p)}><Edit className="h-4 w-4" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Últimos Movimientos</CardTitle></CardHeader>
                <CardContent>
                  {loading ? <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                  : movimientos.length === 0 ? <p className="text-center text-muted-foreground py-4">No hay movimientos</p>
                  : (
                    <div className="space-y-4">
                      {movimientos.slice(0, 10).map(m => (
                        <div key={m.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                          <div className={`mt-1 p-1.5 rounded-full ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {m.tipo === 'entrada' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{m.expand?.producto_id?.nombre || 'Producto eliminado'}</p>
                            <p className="text-xs text-muted-foreground">{m.motivo} • {format(new Date(m.fecha), 'dd MMM, HH:mm', { locale: es })}</p>
                          </div>
                          <span className={`text-sm font-bold ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label>Nombre *</Label><Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required /></div>
            <div className="space-y-2"><Label>SKU</Label><Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
            <div className="space-y-2"><Label>Categoría</Label><Input value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} /></div>
            <div className="space-y-2"><Label>Precio de Venta *</Label><Input type="number" step="0.01" min="0" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Costo</Label><Input type="number" step="0.01" min="0" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} /></div>
            <div className="space-y-2 col-span-2"><Label>Stock Actual *</Label><Input type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required /></div>
            <div className="space-y-2 col-span-2"><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </FormModal>
    </>
  );
};

export default InventarioPage;
