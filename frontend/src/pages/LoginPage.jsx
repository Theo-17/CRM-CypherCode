import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Mail, ArrowLeft, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { login, checkEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_auth_failed') toast.error('No se pudo iniciar sesión con Google');
    else if (error === 'google_not_configured') toast.error('Google Sign-In no está configurado aún');
    else if (error === 'account_removed') toast.error('Esta cuenta ha sido eliminada');
  }, []);

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

            {step === 1 && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>
                <a href={`${API_URL}/api/auth/google`} className="w-full">
                  <Button type="button" variant="outline" className="w-full gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </Button>
                </a>
              </>
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
