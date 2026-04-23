import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    api.get(`/stripe/session/${sessionId}`)
      .then(data => { setDetails(data); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  return (
    <>
      <Helmet><title>Pago Exitoso - CRM Pro</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle className="text-2xl">Estado del Pago</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Verificando tu pago...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">¡Pago Completado!</h2>
                <p className="text-muted-foreground mb-6">
                  Tu suscripción al plan <strong className="capitalize">{details?.plan}</strong> ha sido activada.
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">Ir al Dashboard</Button>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <span className="text-destructive text-2xl font-bold">!</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Error de Verificación</h2>
                <p className="text-muted-foreground mb-6">No pudimos verificar tu pago. Si el cargo se realizó, tu cuenta se actualizará en breve.</p>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">Volver al Dashboard</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SuccessPage;
