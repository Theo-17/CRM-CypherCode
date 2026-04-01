import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ClientAutocomplete from '@/components/ClientAutocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const VentasPage = () => {
  const { currentUser } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Sale State
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ventasData, prodData] = await Promise.all([
        pb.collection('ventas').getFullList({ 
          sort: '-fecha', 
          expand: 'cliente_id',
          $autoCancel: false 
        }),
        pb.collection('productos').getFullList({ sort: 'nombre', $autoCancel: false })
      ]);
      setVentas(ventasData);
      setProductos(prodData);
    } catch (error) {
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setSaleItems([...saleItems, { producto_id: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...saleItems];
    newItems.splice(index, 1);
    setSaleItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...saleItems];
    const item = newItems[index];
    
    if (field === 'producto_id') {
      const prod = productos.find(p => p.id === value);
      item.producto_id = value;
      item.precio_unitario = prod ? prod.precio : 0;
    } else if (field === 'cantidad') {
      item.cantidad = Number(value) || 1;
    }
    
    item.subtotal = item.cantidad * item.precio_unitario;
    setSaleItems(newItems);
  };

  const calculateTotal = () => saleItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedCliente) return toast.error('Selecciona un cliente');
    if (saleItems.length === 0) return toast.error('Agrega al menos un producto');
    if (saleItems.some(i => !i.producto_id)) return toast.error('Selecciona un producto en todas las líneas');

    // Validate stock
    for (const item of saleItems) {
      const prod = productos.find(p => p.id === item.producto_id);
      if (prod && prod.stock < item.cantidad) {
        return toast.error(`Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stock}`);
      }
    }

    setSubmitting(true);
    try {
      const total = calculateTotal();
      const venta = await pb.collection('ventas').create({
        usuario_id: currentUser.id,
        cliente_id: selectedCliente,
        fecha: new Date().toISOString(),
        total,
        estado: 'completada'
      }, { $autoCancel: false });

      for (const item of saleItems) {
        await pb.collection('items_venta').create({
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        }, { $autoCancel: false });

        // Update stock and create movement
        const prod = productos.find(p => p.id === item.producto_id);
        await pb.collection('productos').update(prod.id, {
          stock: prod.stock - item.cantidad
        }, { $autoCancel: false });

        await pb.collection('inventario_movimientos').create({
          producto_id: prod.id,
          tipo: 'salida',
          cantidad: item.cantidad,
          motivo: `Venta #${venta.id.slice(-6)}`,
          fecha: new Date().toISOString()
        }, { $autoCancel: false });
      }

      toast.success('Venta registrada exitosamente');
      setIsCreating(false);
      setSelectedCliente('');
      setSaleItems([]);
      fetchData();
    } catch (error) {
      toast.error('Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const openSaleDetail = async (venta) => {
    setSelectedSale(venta);
    setDetailModalOpen(true);
    try {
      const items = await pb.collection('items_venta').getFullList({
        filter: `venta_id = "${venta.id}"`,
        expand: 'producto_id',
        $autoCancel: false
      });
      setSaleDetails(items);
    } catch (error) {
      toast.error('Error al cargar detalles');
    }
  };

  const updateSaleStatus = async (status) => {
    try {
      await pb.collection('ventas').update(selectedSale.id, { estado: status }, { $autoCancel: false });
      toast.success('Estado actualizado');
      setSelectedSale({ ...selectedSale, estado: status });
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completada': return <Badge className="bg-[hsl(var(--status-completed))] hover:bg-[hsl(var(--status-completed))]/90">Completada</Badge>;
      case 'pendiente': return <Badge className="bg-[hsl(var(--status-pending))] hover:bg-[hsl(var(--status-pending))]/90 text-black">Pendiente</Badge>;
      case 'cancelada': return <Badge className="bg-[hsl(var(--status-cancelled))] hover:bg-[hsl(var(--status-cancelled))]/90">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Ventas - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Ventas</h1>
                <p className="text-muted-foreground">Gestiona tus ventas y facturación</p>
              </div>
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Nueva Venta
                </Button>
              )}
            </div>

            {isCreating ? (
              <Card className="mb-8 animate-fade-in">
                <CardHeader>
                  <CardTitle>Registrar Nueva Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitSale} className="space-y-6">
                    <div className="space-y-2 max-w-md">
                      <Label>Cliente *</Label>
                      <ClientAutocomplete value={selectedCliente} onChange={setSelectedCliente} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base">Productos</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                          <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                        </Button>
                      </div>
                      
                      {saleItems.length === 0 ? (
                        <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                          No hay productos en esta venta.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {saleItems.map((item, index) => (
                            <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-muted/10">
                              <div className="flex-1 space-y-2">
                                <Label className="text-xs">Producto</Label>
                                <Select value={item.producto_id} onValueChange={(v) => handleItemChange(index, 'producto_id', v)}>
                                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                  <SelectContent>
                                    {productos.map(p => (
                                      <SelectItem key={p.id} value={p.id} disabled={p.stock < 1}>
                                        {p.nombre} (${p.precio}) - Stock: {p.stock}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-24 space-y-2">
                                <Label className="text-xs">Cantidad</Label>
                                <Input type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} />
                              </div>
                              <div className="w-32 space-y-2">
                                <Label className="text-xs">Subtotal</Label>
                                <Input value={`$${item.subtotal.toFixed(2)}`} disabled className="bg-muted" />
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-2xl font-bold">Total: ${calculateTotal().toFixed(2)}</div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setSaleItems([]); setSelectedCliente(''); }}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting || saleItems.length === 0}>
                          {submitting ? 'Procesando...' : 'Completar Venta'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">ID Venta</th>
                          <th className="text-left p-4 font-medium">Fecha</th>
                          <th className="text-left p-4 font-medium">Cliente</th>
                          <th className="text-right p-4 font-medium">Total</th>
                          <th className="text-center p-4 font-medium">Estado</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan="6" className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                        ) : ventas.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-muted-foreground">
                              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              No hay ventas registradas
                            </td>
                          </tr>
                        ) : (
                          ventas.map((v) => (
                            <tr key={v.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-4 text-sm font-medium text-muted-foreground">#{v.id.slice(-6).toUpperCase()}</td>
                              <td className="p-4 text-sm">{format(new Date(v.fecha), 'dd MMM yyyy', { locale: es })}</td>
                              <td className="p-4 font-medium">{v.expand?.cliente_id?.nombre || 'Cliente eliminado'}</td>
                              <td className="p-4 text-right font-bold">${v.total.toFixed(2)}</td>
                              <td className="p-4 text-center">{getStatusBadge(v.estado)}</td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="sm" onClick={() => openSaleDetail(v)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Detalle de Venta #{selectedSale?.id.slice(-6).toUpperCase()}</span>
              {selectedSale && getStatusBadge(selectedSale.estado)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedSale.expand?.cliente_id?.nombre || 'Desconocido'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">{format(new Date(selectedSale.fecha), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 border-b pb-2">Productos</h4>
                <div className="space-y-2">
                  {saleDetails.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.cantidad}x</span>
                        <span>{item.expand?.producto_id?.nombre || 'Producto eliminado'}</span>
                      </div>
                      <span>${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t font-bold text-lg">
                  <span>Total</span>
                  <span>${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Label>Cambiar Estado:</Label>
                <Select value={selectedSale.estado} onValueChange={updateSaleStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VentasPage;