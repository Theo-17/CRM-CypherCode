import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SendEmailModal from '@/components/SendEmailModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, CheckCircle2, Clock, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const EstadoBadge = ({ estado }) =>
  estado === 'enviado' ? (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
      <CheckCircle2 className="h-3 w-3 mr-1" /> Enviado
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
      <Clock className="h-3 w-3 mr-1" /> Pendiente
    </Badge>
  );

const EmailHistoryPage = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchEmails = () =>
    api.get('/api/emails').then(setEmails).catch(() => {});

  useEffect(() => { fetchEmails().finally(() => setLoading(false)); }, []);

  const handleModalClose = (open) => {
    setModalOpen(open);
    if (!open) fetchEmails();
  };

  const handleRowClick = (email) => {
    setSelected(email);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!selected) return;
    const clienteEmail = selected.expand?.cliente_id?.email || '';
    const text = `Para: ${clienteEmail}\nAsunto: ${selected.asunto}\n\n${selected.contenido || selected.cuerpo || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Contenido copiado al portapapeles');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleMarcarEnviado = async () => {
    if (!selected) return;
    setMarking(true);
    try {
      await api.patch(`/api/emails/${selected.id}/estado`, { estado: 'enviado' });
      toast.success('Marcado como enviado');
      await fetchEmails();
      setSelected(prev => ({ ...prev, estado: 'enviado' }));
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setMarking(false);
    }
  };

  const handleMarcarPendiente = async () => {
    if (!selected) return;
    setMarking(true);
    try {
      await api.patch(`/api/emails/${selected.id}/estado`, { estado: 'pendiente' });
      toast.success('Marcado como pendiente');
      await fetchEmails();
      setSelected(prev => ({ ...prev, estado: 'pendiente' }));
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setMarking(false);
    }
  };

  const clienteEmail = selected?.expand?.cliente_id?.email || '';

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
                <p className="text-muted-foreground">Correos guardados para enviar a clientes</p>
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
                      <th className="text-left p-4 font-medium">Fecha</th>
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
                          <p className="font-medium mb-1">No hay correos guardados</p>
                          <p className="text-sm">Usa el botón "Nuevo Email" para crear el primero</p>
                        </td>
                      </tr>
                    ) : emails.map(email => (
                      <tr
                        key={email.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(email)}
                      >
                        <td className="p-4 font-medium">{email.expand?.cliente_id?.nombre || '—'}</td>
                        <td className="p-4 text-muted-foreground">{email.asunto}</td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {format(new Date(email.fecha_envio), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </td>
                        <td className="p-4"><EstadoBadge estado={email.estado} /></td>
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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && <EstadoBadge estado={selected.estado} />}
              <span className="truncate">{selected?.asunto}</span>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Para:</span>
                  <span className="font-medium">{selected.expand?.cliente_id?.nombre || '—'}</span>
                  {clienteEmail && <span className="text-muted-foreground">({clienteEmail})</span>}
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Asunto:</span>
                  <span>{selected.asunto}</span>
                </div>
              </div>

              <div className="rounded-lg border p-4 text-sm whitespace-pre-wrap min-h-[120px] bg-background">
                {selected.contenido || selected.cuerpo || <span className="text-muted-foreground italic">Sin contenido</span>}
              </div>

              <p className="text-xs text-muted-foreground">
                Copia el contenido, pégalo en tu cliente de correo y envíalo. Luego márcalo como enviado.
              </p>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar contenido'}
                </Button>

                {selected.estado !== 'enviado' ? (
                  <Button onClick={handleMarcarEnviado} disabled={marking} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {marking ? 'Guardando...' : 'Marcar como enviado'}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleMarcarPendiente} disabled={marking}>
                    {marking ? 'Guardando...' : 'Marcar como pendiente'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmailHistoryPage;
