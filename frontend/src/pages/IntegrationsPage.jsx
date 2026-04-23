import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, MessageSquare } from 'lucide-react';

const IntegrationsPage = () => {
  const { currentUser } = useAuth();
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    api.get('/api/integraciones').then(setIntegrations).catch(() => {});
  }, [currentUser]);

  const handleGoogleConnect = () => {
    toast.info('Integración con Google Calendar próximamente');
  };

  const isConnected = (type) => integrations.some(i => i.proveedor === type && i.activa);

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
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Google Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Sincroniza tus tareas y seguimientos con tu calendario de Google.</p>
                  {isConnected('google_calendar') ? (
                    <Button variant="outline" className="text-green-600 border-green-200 bg-green-50">Conectado</Button>
                  ) : (
                    <Button onClick={handleGoogleConnect}>Conectar Google Calendar</Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" /> Slack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Recibe notificaciones de tareas y crea seguimientos desde Slack.</p>
                  {isConnected('slack') ? (
                    <Button variant="outline" className="text-green-600 border-green-200 bg-green-50">Conectado</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => toast.info('Configura el webhook de Slack en el panel de Slack')}>Configurar Webhook</Button>
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
