import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SendEmailModal from '@/components/SendEmailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, CheckCircle2, Clock, Plus } from 'lucide-react';

const EmailHistoryPage = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEmails = () =>
    api.get('/api/emails').then(setEmails).catch(() => {});

  useEffect(() => { fetchEmails().finally(() => setLoading(false)); }, []);

  const handleModalClose = (open) => {
    setModalOpen(open);
    if (!open) fetchEmails();
  };

  return (
    <>
      <Helmet><title>Historial de Emails - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Historial de Emails</h1>
                <p className="text-muted-foreground">Registro de correos enviados a clientes</p>
              </div>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nuevo Email
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Cliente</th>
                      <th className="text-left p-4 font-medium">Asunto</th>
                      <th className="text-left p-4 font-medium">Fecha de Envío</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="4" className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                    ) : emails.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-muted-foreground">
                          <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium mb-1">No hay correos enviados</p>
                          <p className="text-sm">Usa el botón "Nuevo Email" para enviar el primero</p>
                        </td>
                      </tr>
                    ) : emails.map(email => (
                      <tr key={email.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{email.expand?.cliente_id?.nombre || '—'}</td>
                        <td className="p-4 text-muted-foreground">{email.asunto}</td>
                        <td className="p-4 text-muted-foreground">{format(new Date(email.fecha_envio), 'dd MMM yyyy, HH:mm', { locale: es })}</td>
                        <td className="p-4">
                          {email.abierto ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Abierto
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />Enviado
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <SendEmailModal open={modalOpen} onOpenChange={handleModalClose} />
    </>
  );
};

export default EmailHistoryPage;
