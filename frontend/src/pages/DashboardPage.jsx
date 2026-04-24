import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MetricCard from '@/components/MetricCard';
import ActivityFeed from '@/components/ActivityFeed';
import { Users, CheckSquare, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
  const { currentUser, checkFeatureLimit, getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ totalClientes: 0, tareasPendientes: 0, seguimientosEsteMes: 0, tasaConversion: 0 });
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limitInfo, setLimitInfo] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    checkFeatureLimit().then(setLimitInfo).catch(() => {});
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clientes, tareas, seguimientos] = await Promise.all([
        api.get('/api/clientes'),
        api.get('/api/tareas'),
        api.get('/api/seguimientos')
      ]);

      const tareasPendientes = tareas.filter(t => t.estado === 'Pendiente').length;
      const now = new Date();
      const overdue = tareas.filter(t => t.estado !== 'Completada' && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < now).length;
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const seguimientosEsteMes = seguimientos.filter(s => {
        const f = new Date(s.fecha);
        return f.getMonth() === currentMonth && f.getFullYear() === currentYear;
      }).length;

      const ganados = clientes.filter(c => c.estado_conversion === 'ganado').length;
      const tasaConversion = clientes.length > 0 ? Math.round((ganados / clientes.length) * 100) : 0;

      setMetrics({ totalClientes: clientes.length, tareasPendientes, seguimientosEsteMes, tasaConversion });
      setOverdueTasks(overdue);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      setActivityData(last7Days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = seguimientos.filter(s => format(new Date(s.fecha), 'yyyy-MM-dd') === dateStr).length;
        return { date: format(date, 'dd MMM', { locale: es }), interacciones: count };
      }));
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const role = getCurrentUserRole();

  return (
    <>
      <Helmet><title>Dashboard - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Bienvenido, {currentUser?.name || 'Usuario'}</h1>
                  <p className="text-muted-foreground">Aquí está un resumen de tu actividad</p>
                </div>
                {role === 'admin' && (
                  <Button variant="outline" onClick={() => navigate('/reports')}>Ver Reportes Globales</Button>
                )}
              </div>

              {limitInfo && limitInfo.limit !== -1 && (
                <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">Plan {limitInfo.plan}</p>
                    <p className="text-sm text-primary/80">{limitInfo.current} de {limitInfo.limit} clientes usados.</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/pricing')}>Mejorar Plan</Button>
                </div>
              )}

              {overdueTasks > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Tareas Vencidas</p>
                      <p className="text-sm text-destructive/80">{overdueTasks} tareas requieren atención.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => navigate('/tareas')}>Ver Tareas</Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title="Total Clientes" value={metrics.totalClientes} icon={Users} loading={loading} index={0} />
                <MetricCard title="Tareas Pendientes" value={metrics.tareasPendientes} icon={CheckSquare} loading={loading} index={1} />
                <MetricCard title="Seguimientos Este Mes" value={metrics.seguimientosEsteMes} icon={Calendar} loading={loading} index={2} />
                <MetricCard title="Tasa de Conversión" value={`${metrics.tasaConversion}%`} icon={TrendingUp} loading={loading} index={3} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={activityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="interacciones" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Feed de Actividad</CardTitle></CardHeader>
                  <CardContent className="h-[250px] overflow-y-auto">
                    <ActivityFeed />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
