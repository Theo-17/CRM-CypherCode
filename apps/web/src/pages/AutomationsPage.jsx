import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Zap, Play } from 'lucide-react';

const AutomationsPage = () => {
  const { getCurrentUserRole } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);

  useEffect(() => {
    if (getCurrentUserRole() !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const records = await pb.collection('automatizaciones').getFullList({ $autoCancel: false });
      setRules(records);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const toggleRule = async (id, currentStatus) => {
    try {
      await pb.collection('automatizaciones').update(id, { activa: !currentStatus }, { $autoCancel: false });
      fetchRules();
    } catch (error) {
      toast.error('Error al actualizar regla');
    }
  };

  const executeAutomations = async () => {
    try {
      const res = await apiServerClient.fetch('/automations/execute-automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken: 'your_admin_token_here' }) // In real app, use proper auth
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Automatizaciones ejecutadas: ${data.executed} acciones`);
      }
    } catch (error) {
      toast.error('Error al ejecutar automatizaciones');
    }
  };

  return (
    <>
      <Helmet><title>Automatizaciones - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Automatizaciones</h1>
                <p className="text-muted-foreground">Configura reglas automáticas para tu CRM</p>
              </div>
              <Button onClick={executeAutomations} variant="secondary">
                <Play className="h-4 w-4 mr-2" /> Ejecutar Ahora
              </Button>
            </div>

            <div className="grid gap-4">
              {rules.map(rule => (
                <Card key={rule.id}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold text-lg">{rule.nombre}</h3>
                        <p className="text-sm text-muted-foreground">Si: {rule.condicion} → Entonces: {rule.accion}</p>
                      </div>
                    </div>
                    <Switch checked={rule.activa} onCheckedChange={() => toggleRule(rule.id, rule.activa)} />
                  </CardContent>
                </Card>
              ))}
              {rules.length === 0 && (
                <p className="text-muted-foreground">No hay reglas configuradas.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AutomationsPage;