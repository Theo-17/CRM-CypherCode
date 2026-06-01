import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Token no encontrado en la URL.'); return; }
    fetch(`${API_URL}/api/auth/verify-email/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.message && !data.message.toLowerCase().includes('inválido') && !data.message.toLowerCase().includes('error')) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'El link es inválido o ha expirado.');
        }
      })
      .catch(() => { setStatus('error'); setMessage('Error al verificar. Intenta de nuevo.'); });
  }, [token]);

  return (
    <>
      <Helmet><title>Verificación de cuenta - CRM CypherCode</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 px-8">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Verificando tu cuenta...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Cuenta verificada!</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Link to="/login"><Button className="w-full">Iniciar sesión</Button></Link>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Link inválido</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="space-y-2">
                  <Link to="/signup"><Button variant="outline" className="w-full">Crear nueva cuenta</Button></Link>
                  <Link to="/login"><Button variant="ghost" className="w-full">Ir al inicio de sesión</Button></Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VerifyEmailPage;
