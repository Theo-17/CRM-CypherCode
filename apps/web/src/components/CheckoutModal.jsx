import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const CheckoutModal = ({ open, onOpenChange, plan }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price,
          productName: `Plan ${plan.name}`,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      });
      
      if (!response.ok) throw new Error('Error al crear sesión de pago');
      
      const data = await response.json();
      window.open(data.url, '_blank');
      onOpenChange(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('No se pudo iniciar el proceso de pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Suscripción</DialogTitle>
          <DialogDescription>
            Estás a punto de suscribirte al plan <strong>{plan?.name}</strong> por ${plan?.price}/mes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Plan {plan?.name}</span>
              <span className="font-bold">${plan?.price}.00</span>
            </div>
            <p className="text-sm text-muted-foreground">Facturado mensualmente. Puedes cancelar en cualquier momento.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Proceder al Pago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;