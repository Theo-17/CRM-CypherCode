import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsPage = () => {
  const { getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, clients: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [users, clients, tasks] = await Promise.all([
        pb.collection('users').getList(1, 1, { $autoCancel: false }),
        pb.collection('clientes').getList(1, 1, { $autoCancel: false }),
        pb.collection('tareas').getList(1, 1, { $autoCancel: false })
      ]);
      setStats({
        users: users.totalItems,
        clients: clients.totalItems,
        tasks: tasks.totalItems
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const mockChartData = [
    { name: 'Ene', clientes: 40, tareas: 24 },
    { name: 'Feb', clientes: 30, tareas: 13 },
    { name: 'Mar', clientes: 20, tareas: 98 },
    { name: 'Abr', clientes: 27, tareas: 39 },
    { name: 'May', clientes: 18, tareas: 48 },
    { name: 'Jun', clientes: 23, tareas: 38 },
  ];

  return (
    <>
      <Helmet>
        <title>Reportes Globales - CRM Pro</title>
      </Helmet>
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

            <div ref={reportRef} className="bg-background p-4 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{stats.users}</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{stats.clients}</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Tareas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{stats.tasks}</p>}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento (Últimos 6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="clientes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tareas" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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

export default ReportsPage;