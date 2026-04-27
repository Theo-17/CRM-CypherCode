import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, RefreshCw, Unlink, CheckCircle } from 'lucide-react';

const IntegrationsPage = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success === 'google_calendar') {
      toast.success('Google Calendar conectado correctamente');
      setCalendarConnected(true);
      setSearchParams({}, { replace: true });
    } else if (error === 'google_calendar_failed') {
      toast.error('No se pudo conectar Google Calendar');
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    api.get('/api/google-calendar/status')
      .then(data => setCalendarConnected(data.connected))
      .catch(() => {});
  }, [currentUser]);

  const handleGoogleConnect = async () => {
    setConnecting(true);
    try {
      const data = await api.get('/api/google-calendar/auth');
      window.location.href = data.authUrl;
    } catch {
      toast.error('Error al iniciar la conexión con Google Calendar');
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await api.post('/api/google-calendar/sync', {});
      toast.success(`${data.synced} de ${data.total} tareas sincronizadas con Google Calendar`);
    } catch (err) {
      toast.error(err.message || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.delete('/api/google-calendar/disconnect');
      setCalendarConnected(false);
      toast.success('Google Calendar desconectado');
    } catch {
      toast.error('Error al desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Helmet><title>Integraciones - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Integraciones</h1>
              <p className="text-muted-foreground">Conecta tu CRM con otras herramientas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Google Calendar
                    </span>
                    {calendarConnected && (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 gap-1">
                        <CheckCircle className="h-3 w-3" /> Conectado
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sincroniza tus tareas con fecha de vencimiento directamente en tu Google Calendar.
                  </p>
                  {calendarConnected ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={syncing}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Sincronizar tareas'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4" />
                        {disconnecting ? 'Desconectando...' : 'Desconectar'}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleGoogleConnect} disabled={connecting} className="gap-2">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {connecting ? 'Redirigiendo...' : 'Conectar Google Calendar'}
                    </Button>
                  )}
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default IntegrationsPage;
