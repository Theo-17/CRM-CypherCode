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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShieldAlert, User } from 'lucide-react';

const UsersPage = () => {
  const { getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') { navigate('/dashboard'); return; }
    api.get('/api/usuarios')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>Gestión de Usuarios - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8"><h1 className="text-3xl font-bold mb-2">Usuarios</h1><p className="text-muted-foreground">Gestiona los vendedores y administradores</p></div>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Usuario</th>
                      <th className="text-left p-4 font-medium">Rol</th>
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-left p-4 font-medium">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="4" className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                    ) : users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                            <div><p className="font-medium">{user.name || 'Sin nombre'}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                            {user.role === 'admin' && <ShieldAlert className="h-3 w-3 mr-1" />}
                            {user.role || 'vendedor'}
                          </Badge>
                        </td>
                        <td className="p-4"><Badge variant="outline" className="capitalize">{user.plan || 'gratis'}</Badge></td>
                        <td className="p-4 text-muted-foreground">{format(new Date(user.created), 'dd MMM yyyy', { locale: es })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
};

export default UsersPage;
