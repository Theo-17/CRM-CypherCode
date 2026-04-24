import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Building2, AlertCircle } from 'lucide-react';

const SetupPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { activateAccount } = useAuth();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [tokenError, setTokenError] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
      setLoadingInfo(false);
      return;
    }
    fetch(`http://localhost:3000/api/auth/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setInviteInfo(data))
      .catch(() => setTokenError(true))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await activateAccount(token, password);
      toast.success('¡Cuenta activada! Bienvenido.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Error al activar la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Activar Cuenta - CRM Pro</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xl">CR</span>
              </div>
            </div>

            {tokenError ? (
              <>
                <CardTitle className="text-2xl font-bold text-center text-destructive">Link inválido</CardTitle>
                <CardDescription className="text-center">
                  Este enlace de invitación no es válido o ha expirado. Pide al administrador que te reenvíe la invitación.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-bold text-center">Activar tu cuenta</CardTitle>
                <CardDescription className="text-center">
                  Crea tu contraseña para unirte a <strong>{inviteInfo?.companyName}</strong>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {tokenError ? (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <Link to="/login">
                  <Button variant="outline">Ir al inicio de sesión</Button>
                </Link>
              </div>
            ) : (
              <>
                {inviteInfo && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">Invitado como </span>
                      <strong>{inviteInfo.email}</strong>
                      <span className="text-muted-foreground"> a </span>
                      <strong>{inviteInfo.companyName}</strong>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <><LoadingSpinner size="sm" className="mr-2" />Activando cuenta...</>
                    ) : (
                      'Activar cuenta y entrar'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SetupPasswordPage;
