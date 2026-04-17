import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import CheckoutModal from '@/components/CheckoutModal';

const PricingPage = () => {
  const { getCurrentUserPlan } = useAuth();
  const currentPlan = getCurrentUserPlan();
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  const plans = [
    {
      id: 'gratis',
      name: 'Gratis',
      price: 0,
      description: 'Para empezar a organizar tus ventas.',
      features: ['Hasta 5 clientes', 'Hasta 10 tareas', 'Soporte básico'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      description: 'Para profesionales y pequeños equipos.',
      features: ['Hasta 50 clientes', 'Hasta 100 tareas', 'Seguimientos ilimitados', 'Soporte prioritario'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      description: 'Para empresas en crecimiento.',
      features: ['Clientes ilimitados', 'Tareas ilimitadas', 'Seguimientos ilimitados', 'Reportes avanzados', 'Soporte 24/7'],
    }
  ];

  return (
    <>
      <Helmet>
        <title>Planes y Precios - CRM Pro</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Planes simples y transparentes</h1>
                <p className="text-xl text-muted-foreground">Elige el plan que mejor se adapte a tus necesidades</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Recomendado
                        </span>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mb-6">
                        <span className="text-4xl font-extrabold">${plan.price}</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {currentPlan === plan.id ? (
                        <Button className="w-full" variant="outline" disabled>
                          Plan Actual
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          variant={plan.popular ? 'default' : 'outline'}
                          onClick={() => setCheckoutPlan(plan)}
                        >
                          {plan.price === 0 ? 'Contactar Soporte' : 'Mejorar Plan'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      <CheckoutModal 
        open={!!checkoutPlan} 
        onOpenChange={(open) => !open && setCheckoutPlan(null)}
        plan={checkoutPlan}
      />
    </>
  );
};

export default PricingPage;