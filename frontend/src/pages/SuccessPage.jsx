import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';

const PLAN_NAMES = { pro: 'Pro', enterprise: 'Enterprise', gratis: 'Gratis' };

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState('loading');
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    if (!requestId) {
      setStatus('error');
      return;
    }
    api.post(`/api/payments/verify/${requestId}`, {})
      .then(data => {
        if (data.status === 'APPROVED') {
          setPlanId(data.planId);
          setStatus('success');
          const token = localStorage.getItem('auth_token');
          if (token) loginWithToken(token).catch(() => {});
        } else if (data.status === 'PENDING') {
          setStatus('pending');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [requestId]);

  return (
    <>
      <Helmet><title>Estado del Pago - CRM Pro</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Estado del Pago</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 gap-4">

            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <p className="text-muted-foreground">Verificando tu pago...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold mb-2">¡Pago Completado!</h2>
                  <p className="text-muted-foreground">
                    Tu suscripción al plan{' '}
                    <strong>{PLAN_NAMES[planId] || planId}</strong>{' '}
                    ha sido activada correctamente.
                  </p>
                </div>
                <Button onClick={() => navigate('/dashboard')} className="w-full mt-2">
                  Ir al Dashboard
                </Button>
              </>
            )}

            {status === 'pending' && (
              <>
                <Clock className="h-16 w-16 text-yellow-500" />
                <div>
                  <h2 className="text-xl font-bold mb-2">Pago en Proceso</h2>
                  <p className="text-muted-foreground">
                    Tu pago está siendo procesado. El plan se activará automáticamente cuando se confirme.
                  </p>
                </div>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full mt-2">
                  Volver al Dashboard
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-destructive" />
                <div>
                  <h2 className="text-xl font-bold mb-2">Pago No Completado</h2>
                  <p className="text-muted-foreground">
                    El pago fue rechazado o cancelado. No se realizó ningún cobro.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button onClick={() => navigate('/pricing')}>Intentar de nuevo</Button>
                  <Button onClick={() => navigate('/dashboard')} variant="outline">Volver al Dashboard</Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SuccessPage;
