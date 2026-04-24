import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Mail, ArrowLeft, Clock } from 'lucide-react';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { login, checkEmail } = useAuth();
  const navigate = useNavigate();

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor ingresa tu email');
      return;
    }
    setLoading(true);
    try {
      const result = await checkEmail(email);
      if (!result.exists) {
        toast.error('No encontramos una cuenta con ese email');
        return;
      }
      if (result.isPending) {
        setIsPending(true);
        setStep(2);
        return;
      }
      setStep(2);
    } catch {
      toast.error('Error al verificar email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Por favor ingresa tu contraseña');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      navigate('/dashboard');
    } catch (error) {
      if (error.needsVerification) {
        setNeedsVerification(true);
      } else {
        toast.error(error.message || 'Credenciales inválidas');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - CRM Pro</title>
        <meta name="description" content="Inicia sesión en tu cuenta de CRM Pro" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xl">CR</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Bienvenido de nuevo</CardTitle>
            <CardDescription className="text-center">
              {step === 1 ? 'Ingresa tu email para continuar' : isPending ? 'Cuenta pendiente de activación' : `Ingresa tu contraseña para ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="text-foreground"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><LoadingSpinner size="sm" className="mr-2" />Verificando...</>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </form>
            )}

            {step === 2 && isPending && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Clock className="h-8 w-8 text-amber-500" />
                  <div className="text-center">
                    <p className="font-medium text-amber-800 dark:text-amber-300">Cuenta pendiente de activación</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Revisa tu correo <strong>{email}</strong> y haz clic en el enlace de invitación para activar tu cuenta.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setStep(1); setIsPending(false); setEmail(''); }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Usar otro email
                </Button>
              </div>
            )}

            {needsVerification && (
              <div className="space-y-4 mb-4">
                <div className="flex flex-col items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Mail className="h-8 w-8 text-blue-500" />
                  <div className="text-center">
                    <p className="font-medium text-blue-800 dark:text-blue-300">Verifica tu cuenta</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Tu cuenta aún no ha sido verificada. Revisa tu correo y haz clic en el link de verificación.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setNeedsVerification(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Volver
                </Button>
              </div>
            )}

            {step === 2 && !isPending && !needsVerification && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{email}</span>
                  <button
                    type="button"
                    className="ml-auto text-xs text-primary hover:underline shrink-0"
                    onClick={() => { setStep(1); setPassword(''); }}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="text-foreground"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><LoadingSpinner size="sm" className="mr-2" />Iniciando sesión...</>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">¿No tienes una cuenta? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Regístrate aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
