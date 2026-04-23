import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { Download, Loader2, Users, UserCheck, CheckSquare, ShoppingCart, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatCard = ({ label, value, icon: Icon, loading }) => (
  <Card>
    <CardContent className="p-6 flex items-center gap-4">
      <div className="p-3 rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-3xl font-bold">{value}</p>}
      </div>
    </CardContent>
  </Card>
);

const ReportsPage = () => {
  const { getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') { navigate('/dashboard'); return; }
    Promise.all([
      api.get('/api/reports/stats'),
      api.get('/api/reports/monthly'),
      api.get('/api/reports/vendedores'),
    ]).then(([s, m, v]) => {
      setStats(s);
      setMonthly(m);
      setVendedores(v);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('CRM_Reporte_Global.pdf');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Helmet><title>Reportes Globales - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Reportes Globales</h1>
                <p className="text-muted-foreground">Visión general del rendimiento del sistema</p>
              </div>
              <Button onClick={handleExportPDF} disabled={exporting || loading}>
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Descargar PDF
              </Button>
            </div>

            <div ref={reportRef} className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Usuarios" value={stats?.users ?? 0} icon={Users} loading={loading} />
                <StatCard label="Clientes" value={stats?.clientes ?? 0} icon={UserCheck} loading={loading} />
                <StatCard label="Tareas" value={stats?.tareas ?? 0} icon={CheckSquare} loading={loading} />
                <StatCard label="Ventas" value={stats?.ventas ?? 0} icon={ShoppingCart} loading={loading} />
                <StatCard label="Ingresos" value={`$${(stats?.ingresoTotal ?? 0).toLocaleString()}`} icon={DollarSign} loading={loading} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento Últimos 6 Meses</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-[300px] w-full" /> : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="clientes" name="Clientes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="tareas" name="Tareas" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Mes ($)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-[250px] w-full" /> : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="ventas" name="Ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {vendedores.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Rendimiento por Vendedor</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-4 text-left font-medium">Vendedor</th>
                          <th className="p-4 text-right font-medium">Clientes</th>
                          <th className="p-4 text-right font-medium">Ventas</th>
                          <th className="p-4 text-right font-medium">Ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendedores.map(v => (
                          <tr key={v.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 font-medium">{v.nombre}</td>
                            <td className="p-4 text-right">{v.clientes}</td>
                            <td className="p-4 text-right">{v.ventas}</td>
                            <td className="p-4 text-right text-primary font-medium">${v.ingresos.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ReportsPage;
