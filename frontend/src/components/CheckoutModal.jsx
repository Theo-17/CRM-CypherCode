import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/apiServerClient';
import { toast } from 'sonner';
import { Loader2, CreditCard } from 'lucide-react';

const CheckoutModal = ({ open, onOpenChange, plan }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const data = await api.post('/api/payments/session', {
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
      });
      // Redirige al checkout de PlaceToPay
      window.location.href = data.processUrl;
    } catch (error) {
      toast.error(error.message || 'No se pudo iniciar el proceso de pago. Intenta nuevamente.');
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
              <span className="font-bold text-lg">${plan?.price}.00 / mes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Facturado mensualmente. Puedes cancelar en cualquier momento.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded p-3">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span>Serás redirigido a PlaceToPay para completar el pago de forma segura.</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirigiendo...</>
              : 'Ir al pago'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
