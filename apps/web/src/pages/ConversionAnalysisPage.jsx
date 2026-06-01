import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { differenceInDays } from 'date-fns';

const ConversionAnalysisPage = () => {
  const { currentUser, getCurrentUserRole } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendedorFilter, setVendedorFilter] = useState('all');
  const [vendedores, setVendedores] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const role = getCurrentUserRole();
      const filter = role === 'admin' ? '' : `usuario_id = "${currentUser.id}"`;
      
      const [clientesData, usersData] = await Promise.all([
        pb.collection('clientes').getFullList({ filter, expand: 'usuario_id', $autoCancel: false }),
        role === 'admin' ? pb.collection('users').getFullList({ $autoCancel: false }) : Promise.resolve([currentUser])
      ]);
      
      setClientes(clientesData);
      setVendedores(usersData);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = vendedorFilter === 'all' 
    ? clientes 
    : clientes.filter(c => c.usuario_id === vendedorFilter);

  const prospectos = filteredClientes.filter(c => c.estado_conversion === 'prospecto').length;
  const negociacion = filteredClientes.filter(c => c.estado_conversion === 'en_negociacion').length;
  const ganados = filteredClientes.filter(c => c.estado_conversion === 'ganado');
  const perdidos = filteredClientes.filter(c => c.estado_conversion === 'perdido');

  const total = filteredClientes.length;
  const conversionRate = total > 0 ? ((ganados.length / total) * 100).toFixed(1) : 0;
  const avgDealValue = ganados.length > 0 ? (ganados.reduce((sum, c) => sum + (c.valor_venta || 0), 0) / ganados.length).toFixed(2) : 0;
  
  const avgCloseTime = ganados.length > 0 
    ? (ganados.reduce((sum, c) => sum + differenceInDays(new Date(c.updated), new Date(c.created)), 0) / ganados.length).toFixed(0)
    : 0;

  const funnelData = [
    { name: 'Prospectos', value: prospectos, color: 'hsl(var(--muted-foreground))' },
    { name: 'En Negociación', value: negociacion, color: 'hsl(var(--secondary))' },
    { name: 'Ganados', value: ganados.length, color: 'hsl(var(--primary))' },
    { name: 'Perdidos', value: perdidos.length, color: 'hsl(var(--destructive))' }
  ];

  return (
    <>
      <Helmet><title>Análisis de Conversión - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Análisis de Conversión</h1>
                <p className="text-muted-foreground">Métricas detalladas del embudo de ventas</p>
              </div>
              {getCurrentUserRole() === 'admin' && (
                <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar Vendedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                    {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Tasa de Conversión</p><p className="text-3xl font-bold">{conversionRate}%</p></CardContent></Card>
              <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Valor Promedio</p><p className="text-3xl font-bold">${avgDealValue}</p></CardContent></Card>
              <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Tiempo Promedio Cierre</p><p className="text-3xl font-bold">{avgCloseTime} días</p></CardContent></Card>
              <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Ganados / Perdidos</p><p className="text-3xl font-bold">{ganados.length} / {perdidos.length}</p></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader><CardTitle>Embudo de Ventas</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Detalle de Cierres Recientes</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Estado</th><th className="p-3 text-right">Valor/Motivo</th></tr>
                      </thead>
                      <tbody>
                        {[...ganados, ...perdidos].sort((a,b) => new Date(b.updated) - new Date(a.updated)).slice(0, 10).map(c => (
                          <tr key={c.id} className="border-b">
                            <td className="p-3 font-medium">{c.nombre}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${c.estado_conversion === 'ganado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {c.estado_conversion}
                              </span>
                            </td>
                            <td className="p-3 text-right text-muted-foreground">
                              {c.estado_conversion === 'ganado' ? `$${c.valor_venta || 0}` : c.motivo_perdida || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ConversionAnalysisPage;