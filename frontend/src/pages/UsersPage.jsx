import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShieldAlert, User, UserPlus, RotateCcw, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

const UsersPage = () => {
  const { getCurrentUserRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = () => {
    api.get('/api/usuarios')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') { navigate('/dashboard'); return; }
    fetchUsers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }
    setInviting(true);
    try {
      await api.post('/api/usuarios/invite', inviteForm);
      toast.success(`Invitación enviada a ${inviteForm.email}`);
      setInviteModalOpen(false);
      setInviteForm({ name: '', email: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al enviar invitación');
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/usuarios/${deleteDialog.user.id}`);
      toast.success('Usuario eliminado');
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  const handleResend = async (userId, userEmail) => {
    setResendingId(userId);
    try {
      await api.post(`/api/usuarios/${userId}/resend-invite`, {});
      toast.success(`Invitación reenviada a ${userEmail}`);
    } catch (error) {
      toast.error('Error al reenviar invitación');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <>
      <Helmet><title>Gestión de Usuarios - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Usuarios</h1>
                <p className="text-muted-foreground">Gestiona los vendedores y administradores de tu empresa</p>
              </div>
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invitar Usuario
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Usuario</th>
                      <th className="text-left p-4 font-medium">Rol</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-left p-4 font-medium">Registro</th>
                      <th className="text-left p-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                    ) : users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name || 'Sin nombre'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                            {user.role === 'admin' && <ShieldAlert className="h-3 w-3 mr-1" />}
                            {user.role || 'seller'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {user.status === 'pending' ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {user.created ? format(new Date(user.created), 'dd MMM yyyy', { locale: es }) : '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {user.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResend(user.id, user.email)}
                                disabled={resendingId === user.id}
                              >
                                <RotateCcw className={`h-4 w-4 mr-1 ${resendingId === user.id ? 'animate-spin' : ''}`} />
                                Reenviar
                              </Button>
                            )}
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, user })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && users.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-muted-foreground">
                          No hay usuarios en tu empresa todavía
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog({ open, user: deleteDialog.user })}
        title="Eliminar usuario"
        description={`¿Eliminar a ${deleteDialog.user?.name || deleteDialog.user?.email}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
      />

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nombre</Label>
              <Input
                id="invite-name"
                placeholder="Juan Pérez"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                disabled={inviting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="vendedor@empresa.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                disabled={inviting}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)} disabled={inviting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersPage;
