import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, CheckCircle2, Clock } from 'lucide-react';

const EmailHistoryPage = () => {
  const { currentUser } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const records = await pb.collection('emails_enviados').getFullList({
        filter: `usuario_id = "${currentUser.id}"`,
        sort: '-fecha_envio',
        expand: 'cliente_id',
        $autoCancel: false
      });
      setEmails(records);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Historial de Emails - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Historial de Emails</h1>
              <p className="text-muted-foreground">Registro de correos enviados a clientes</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
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
                          <td colSpan="4" className="p-8 text-center text-muted-foreground">
                            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No hay correos enviados
                          </td>
                        </tr>
                      ) : (
                        emails.map((email) => (
                          <tr key={email.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-medium">{email.expand?.cliente_id?.nombre || 'Desconocido'}</td>
                            <td className="p-4 text-muted-foreground">{email.asunto}</td>
                            <td className="p-4 text-muted-foreground">
                              {format(new Date(email.fecha_envio), 'dd MMM yyyy, HH:mm', { locale: es })}
                            </td>
                            <td className="p-4">
                              {email.abierto ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Abierto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                  <Clock className="h-3 w-3 mr-1" /> Enviado
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
};

export default EmailHistoryPage;