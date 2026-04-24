import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, Edit, Send, ShoppingCart } from 'lucide-react';
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
  const [ventas, setVentas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ templateId: 'custom', asunto: '', contenido: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => { fetchClientData(); }, [id]);

  const fetchClientData = async () => {
    try {
      const [clienteData, tareasData, seguimientosData, emailsData, ventasData, templatesData] = await Promise.all([
        api.get(`/api/clientes/${id}`),
        api.get(`/api/tareas/cliente/${id}`),
        api.get(`/api/seguimientos/cliente/${id}`),
        api.get(`/api/emails/cliente/${id}`),
        api.get(`/api/ventas?cliente_id=${id}`),
        api.get('/api/plantillas')
      ]);
      setCliente(clienteData);
      setTareas(tareasData);
      setSeguimientos(seguimientosData);
      setEmails(emailsData);
      setVentas(ventasData);
      setTemplates(templatesData);
    } catch {
      toast.error('Error al cargar los datos del cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.put(`/api/clientes/${id}`, editFormData);
      setCliente(updated);
      setEditModalOpen(false);
      toast.success('Cliente actualizado');
    } catch {
      toast.error('Error al actualizar cliente');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailData.asunto || !emailData.contenido) return toast.error('Asunto y contenido requeridos');
    setSendingEmail(true);
    try {
      await api.post('/api/emails', { cliente_id: id, asunto: emailData.asunto, contenido: emailData.contenido });
      toast.success('Email registrado');
      setEmailModalOpen(false);
      fetchClientData();
    } catch {
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

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9+\-\s]/g, '');
    setEditFormData({ ...editFormData, telefono: val });
  };

  if (loading) return <div className="min-h-screen bg-background p-8"><Skeleton className="h-8 w-64 mb-8" /></div>;
  if (!cliente) return null;

  const daysSinceLastEmail = emails.length > 0 ? differenceInDays(new Date(), new Date(emails[0].fecha_envio)) : null;
  const totalVentasCliente = ventas.reduce((sum, v) => sum + Number(v.monto_total || 0), 0);

  return (
    <>
      <Helmet><title>{`${cliente.nombre} - CRM Pro`}</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <Button variant="ghost" onClick={() => navigate('/clientes')} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />Volver a Clientes
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
                  <p className="text-sm text-muted-foreground mt-2">Último email: hace {daysSinceLastEmail} días</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditFormData(cliente); setEditModalOpen(true); }}>
                  <Edit className="h-4 w-4 mr-2" />Editar
                </Button>
                <Button onClick={() => setEmailModalOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />Enviar Email
                </Button>
              </div>
            </div>

            <Tabs defaultValue="info">
              <TabsList className="mb-6">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="ventas">
                  Ventas {ventas.length > 0 && <span className="ml-1 text-xs">({ventas.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="seguimientos">
                  Seguimientos {seguimientos.length > 0 && <span className="ml-1 text-xs">({seguimientos.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="tareas">
                  Tareas {tareas.length > 0 && <span className="ml-1 text-xs">({tareas.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="emails">
                  Emails {emails.length > 0 && <span className="ml-1 text-xs">({emails.length})</span>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
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
                    {cliente.notas && (
                      <div><p className="text-sm text-muted-foreground mb-1">Notas</p><p className="text-sm">{cliente.notas}</p></div>
                    )}
                    {cliente.estado_conversion === 'ganado' && cliente.valor_venta && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-400 font-medium">Valor de Venta</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-300">${Number(cliente.valor_venta).toLocaleString()}</p>
                      </div>
                    )}
                    {cliente.estado_conversion === 'perdido' && cliente.motivo_perdida && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-400 font-medium">Motivo de Pérdida</p>
                        <p className="text-sm text-red-900 dark:text-red-300">{cliente.motivo_perdida}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ventas">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Historial de Ventas
                      {ventas.length > 0 && (
                        <span className="ml-auto text-sm font-normal text-muted-foreground">
                          Total: <strong>${totalVentasCliente.toLocaleString('es', { minimumFractionDigits: 2 })}</strong>
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ventas.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No hay ventas registradas para este cliente</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left pb-2 font-medium">Fecha</th>
                            <th className="text-right pb-2 font-medium">Subtotal</th>
                            <th className="text-right pb-2 font-medium">IVA (15%)</th>
                            <th className="text-right pb-2 font-medium">Total</th>
                            <th className="text-left pb-2 font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventas.map(v => (
                            <tr key={v.id} className="border-b last:border-0 hover:bg-muted/40">
                              <td className="py-3 text-muted-foreground">
                                {format(new Date(v.fecha || v.created), 'dd MMM yyyy', { locale: es })}
                              </td>
                              <td className="py-3 text-right">${Number(v.monto_sin_iva || 0).toFixed(2)}</td>
                              <td className="py-3 text-right text-muted-foreground">${Number(v.iva_monto || 0).toFixed(2)}</td>
                              <td className="py-3 text-right font-semibold">${Number(v.monto_total || 0).toFixed(2)}</td>
                              <td className="py-3">
                                <Badge variant={v.estado === 'completada' ? 'default' : 'outline'} className="capitalize">
                                  {v.estado}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seguimientos">
                <Card>
                  <CardHeader><CardTitle>Seguimientos</CardTitle></CardHeader>
                  <CardContent>
                    {seguimientos.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No hay seguimientos registrados</p>
                    ) : (
                      <div className="space-y-4">
                        {seguimientos.map(seg => (
                          <div key={seg.id} className="flex gap-4 border-b pb-4 last:border-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                              {seg.tipo[0]}
                            </div>
                            <div>
                              <p className="font-medium">{seg.tipo}
                                <span className="text-sm text-muted-foreground font-normal ml-2">
                                  {format(new Date(seg.fecha), 'dd MMM yyyy, HH:mm', { locale: es })}
                                </span>
                              </p>
                              {seg.notas && <p className="text-sm mt-1">{seg.notas}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tareas">
                <Card>
                  <CardHeader><CardTitle>Tareas</CardTitle></CardHeader>
                  <CardContent>
                    {tareas.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No hay tareas asociadas</p>
                    ) : (
                      <div className="space-y-3">
                        {tareas.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <PriorityBadge priority={t.prioridad} />
                              <span className="font-medium">{t.titulo}</span>
                            </div>
                            <StatusBadge status={t.estado} type="task" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emails">
                <Card>
                  <CardHeader><CardTitle>Historial de Emails</CardTitle></CardHeader>
                  <CardContent>
                    {emails.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No hay emails registrados</p>
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
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <FormModal open={editModalOpen} onOpenChange={setEditModalOpen} title="Editar Cliente">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Nombre</Label>
              <Input value={editFormData.nombre || ''} onChange={e => setEditFormData({...editFormData, nombre: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={editFormData.telefono || ''}
                onChange={handlePhoneChange}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado Conversión</Label>
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
              <div className="space-y-2">
                <Label>Valor de Venta</Label>
                <Input type="number" value={editFormData.valor_venta || ''} onChange={e => setEditFormData({...editFormData, valor_venta: Number(e.target.value)})} />
              </div>
            )}
            {editFormData.estado_conversion === 'perdido' && (
              <div className="space-y-2 col-span-2">
                <Label>Motivo de Pérdida</Label>
                <Input value={editFormData.motivo_perdida || ''} onChange={e => setEditFormData({...editFormData, motivo_perdida: e.target.value})} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
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
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setEmailModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={sendingEmail}>{sendingEmail ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </form>
      </FormModal>
    </>
  );
};

export default ClientDetailPage;
