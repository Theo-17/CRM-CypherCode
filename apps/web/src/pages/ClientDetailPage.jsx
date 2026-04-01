import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import FormModal from '@/components/FormModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, Building2, Calendar, CheckSquare, Edit, Send } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [emails, setEmails] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Client State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // Send Email State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ templateId: 'custom', asunto: '', contenido: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      const [clienteData, tareasData, seguimientosData, emailsData, templatesData] = await Promise.all([
        pb.collection('clientes').getOne(id, { $autoCancel: false }),
        pb.collection('tareas').getFullList({ filter: `cliente_id = "${id}"`, sort: '-created', $autoCancel: false }),
        pb.collection('seguimientos').getFullList({ filter: `cliente_id = "${id}"`, sort: '-fecha', $autoCancel: false }),
        pb.collection('emails_enviados').getFullList({ filter: `cliente_id = "${id}"`, sort: '-fecha_envio', $autoCancel: false }),
        pb.collection('plantillas_email').getFullList({ filter: `usuario_id = "${currentUser.id}"`, $autoCancel: false })
      ]);

      setCliente(clienteData);
      setTareas(tareasData);
      setSeguimientos(seguimientosData);
      setEmails(emailsData);
      setTemplates(templatesData);
    } catch (error) {
      toast.error('Error al cargar los datos del cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await pb.collection('clientes').update(id, editFormData, { $autoCancel: false });
      setCliente(updated);
      setEditModalOpen(false);
      toast.success('Cliente actualizado');
    } catch (error) {
      toast.error('Error al actualizar cliente');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailData.asunto || !emailData.contenido) return toast.error('Asunto y contenido requeridos');
    setSendingEmail(true);
    try {
      await pb.collection('emails_enviados').create({
        usuario_id: currentUser.id,
        cliente_id: id,
        asunto: emailData.asunto,
        contenido: emailData.contenido,
        fecha_envio: new Date().toISOString(),
        abierto: false
      }, { $autoCancel: false });
      toast.success('Email registrado exitosamente');
      setEmailModalOpen(false);
      fetchClientData();
    } catch (error) {
      toast.error('Error al registrar email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleTemplateChange = (tid) => {
    if (tid === 'custom') {
      setEmailData({ templateId: tid, asunto: '', contenido: '' });
    } else {
      const t = templates.find(x => x.id === tid);
      if (t) setEmailData({ templateId: tid, asunto: t.asunto, contenido: t.contenido });
    }
  };

  if (loading) return <div className="min-h-screen bg-background p-8"><Skeleton className="h-8 w-64 mb-8" /></div>;

  const daysSinceLastEmail = emails.length > 0 
    ? differenceInDays(new Date(), new Date(emails[0].fecha_envio)) 
    : null;

  return (
    <>
      <Helmet><title>{`${cliente.nombre} - CRM Pro`}</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <Button variant="ghost" onClick={() => navigate('/clientes')} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Clientes
            </Button>

            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{cliente.nombre}</h1>
                  <StatusBadge status={cliente.estado} type="client" />
                  {cliente.estado_conversion && (
                    <Badge variant="outline" className="capitalize">{cliente.estado_conversion.replace('_', ' ')}</Badge>
                  )}
                </div>
                {cliente.empresa && <p className="text-muted-foreground">{cliente.empresa}</p>}
                {daysSinceLastEmail !== null && (
                  <p className="text-sm text-muted-foreground mt-2">Último email enviado: hace {daysSinceLastEmail} días</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setEditFormData(cliente);
                  setEditModalOpen(true);
                }}><Edit className="h-4 w-4 mr-2" /> Editar</Button>
                <Button onClick={() => setEmailModalOpen(true)}><Send className="h-4 w-4 mr-2" /> Enviar Email</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Información</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {cliente.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{cliente.email}</p></div>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{cliente.telefono}</p></div>
                    </div>
                  )}
                  {cliente.estado_conversion === 'ganado' && cliente.valor_venta && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Valor de Venta</p>
                      <p className="text-lg font-bold text-green-900">${cliente.valor_venta}</p>
                    </div>
                  )}
                  {cliente.estado_conversion === 'perdido' && cliente.motivo_perdida && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">Motivo de Pérdida</p>
                      <p className="text-sm text-red-900">{cliente.motivo_perdida}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Historial de Emails</CardTitle></CardHeader>
                <CardContent>
                  {emails.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay emails registrados</p>
                  ) : (
                    <div className="space-y-3">
                      {emails.map(email => (
                        <div key={email.id} className="p-3 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{email.asunto}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(email.fecha_envio), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                          </div>
                          <Badge variant={email.abierto ? 'default' : 'secondary'}>{email.abierto ? 'Abierto' : 'Enviado'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Seguimientos</CardTitle></CardHeader>
                <CardContent>
                  {seguimientos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay seguimientos</p>
                  ) : (
                    <div className="space-y-4">
                      {seguimientos.map(seg => (
                        <div key={seg.id} className="flex gap-4 border-b pb-4 last:border-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {seg.tipo[0]}
                          </div>
                          <div>
                            <p className="font-medium">{seg.tipo} <span className="text-sm text-muted-foreground font-normal ml-2">{format(new Date(seg.fecha), 'dd MMM yyyy, HH:mm', { locale: es })}</span></p>
                            <p className="text-sm mt-1">{seg.notas}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <FormModal open={editModalOpen} onOpenChange={setEditModalOpen} title="Editar Cliente">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label>Nombre</Label><Input value={editFormData.nombre || ''} onChange={e => setEditFormData({...editFormData, nombre: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={editFormData.telefono || ''} onChange={e => setEditFormData({...editFormData, telefono: e.target.value})} /></div>
            <div className="space-y-2"><Label>Estado Conversión</Label>
              <Select value={editFormData.estado_conversion || 'prospecto'} onValueChange={v => setEditFormData({...editFormData, estado_conversion: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                  <SelectItem value="en_negociacion">En Negociación</SelectItem>
                  <SelectItem value="ganado">Ganado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editFormData.estado_conversion === 'ganado' && (
              <div className="space-y-2"><Label>Valor de Venta</Label><Input type="number" value={editFormData.valor_venta || ''} onChange={e => setEditFormData({...editFormData, valor_venta: Number(e.target.value)})} /></div>
            )}
            {editFormData.estado_conversion === 'perdido' && (
              <div className="space-y-2 col-span-2"><Label>Motivo de Pérdida</Label><Input value={editFormData.motivo_perdida || ''} onChange={e => setEditFormData({...editFormData, motivo_perdida: e.target.value})} /></div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </FormModal>

      <FormModal open={emailModalOpen} onOpenChange={setEmailModalOpen} title="Enviar Email">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={emailData.templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Personalizado</SelectItem>
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Asunto</Label><Input value={emailData.asunto} onChange={e => setEmailData({...emailData, asunto: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Contenido</Label><Textarea value={emailData.contenido} onChange={e => setEmailData({...emailData, contenido: e.target.value})} rows={6} required /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEmailModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={sendingEmail}>{sendingEmail ? 'Enviando...' : 'Enviar'}</Button></div>
        </form>
      </FormModal>
    </>
  );
};

export default ClientDetailPage;