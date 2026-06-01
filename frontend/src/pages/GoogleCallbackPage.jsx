import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      toast.error('No se pudo iniciar sesión con Google');
      navigate('/login');
      return;
    }

    loginWithToken(token)
      .then(() => {
        toast.success('Sesión iniciada con Google');
        navigate('/dashboard');
      })
      .catch(() => {
        toast.error('Error al procesar la sesión');
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
};

export default GoogleCallbackPage;
