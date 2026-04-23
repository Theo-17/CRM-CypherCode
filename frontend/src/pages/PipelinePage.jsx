import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, Mail, DollarSign } from 'lucide-react';

const STAGES = [
  { id: 'prospecto', label: 'Prospecto', color: 'bg-slate-100 dark:bg-slate-800', badge: 'secondary' },
  { id: 'en_negociacion', label: 'En Negociación', color: 'bg-yellow-50 dark:bg-yellow-900/20', badge: 'outline' },
  { id: 'ganado', label: 'Ganado', color: 'bg-green-50 dark:bg-green-900/20', badge: 'default' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-50 dark:bg-red-900/20', badge: 'destructive' },
];

const ClientCard = ({ client, onDragStart }) => {
  const navigate = useNavigate();
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, client.id)}
      onClick={() => navigate(`/clientes/${client.id}`)}
      className="bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
    >
      <p className="font-medium text-sm mb-1.5 line-clamp-1">{client.nombre}</p>
      {client.empresa && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <Building2 className="h-3 w-3 shrink-0" /> {client.empresa}
        </p>
      )}
      {client.email && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <Mail className="h-3 w-3 shrink-0" /> {client.email}
        </p>
      )}
      {client.valor_venta && Number(client.valor_venta) > 0 && (
        <p className="text-xs font-medium text-primary flex items-center gap-1 mt-2">
          <DollarSign className="h-3 w-3" /> {Number(client.valor_venta).toLocaleString()}
        </p>
      )}
    </div>
  );
};

const PipelinePage = () => {
  const [columns, setColumns] = useState({ prospecto: [], en_negociacion: [], ganado: [], perdido: [] });
  const [loading, setLoading] = useState(true);
  const dragClientId = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    api.get('/api/clientes')
      .then(data => {
        const grouped = { prospecto: [], en_negociacion: [], ganado: [], perdido: [] };
        data.forEach(c => {
          const stage = c.estado_conversion || 'prospecto';
          if (grouped[stage]) grouped[stage].push(c);
          else grouped.prospecto.push(c);
        });
        setColumns(grouped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDragStart = (e, clientId) => {
    dragClientId.current = clientId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(stageId);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverCol(null);
    const clientId = dragClientId.current;
    if (!clientId) return;

    let sourceStage = null;
    let client = null;
    for (const [stage, clients] of Object.entries(columns)) {
      const found = clients.find(c => c.id === clientId);
      if (found) { sourceStage = stage; client = found; break; }
    }

    if (!sourceStage || sourceStage === targetStage) return;

    setColumns(prev => {
      const next = { ...prev };
      next[sourceStage] = prev[sourceStage].filter(c => c.id !== clientId);
      next[targetStage] = [...prev[targetStage], { ...client, estado_conversion: targetStage }];
      return next;
    });

    try {
      await api.put(`/api/clientes/${clientId}`, { estado_conversion: targetStage });
      toast.success(`${client.nombre} movido a ${STAGES.find(s => s.id === targetStage)?.label}`);
    } catch {
      toast.error('Error al actualizar el cliente');
      setColumns(prev => {
        const next = { ...prev };
        next[targetStage] = prev[targetStage].filter(c => c.id !== clientId);
        next[sourceStage] = [...prev[sourceStage], client];
        return next;
      });
    }
  };

  const totalClients = Object.values(columns).reduce((s, arr) => s + arr.length, 0);

  return (
    <>
      <Helmet><title>Pipeline de Ventas - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 overflow-x-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Pipeline de Ventas</h1>
              <p className="text-muted-foreground">
                {totalClients} cliente{totalClients !== 1 ? 's' : ''} — arrastra las tarjetas para cambiar etapa
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-4 gap-4">
                {STAGES.map(s => <Skeleton key={s.id} className="h-[500px] rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[800px]">
                {STAGES.map(stage => {
                  const clients = columns[stage.id] || [];
                  const isOver = dragOverCol === stage.id;
                  return (
                    <div
                      key={stage.id}
                      onDragOver={e => handleDragOver(e, stage.id)}
                      onDragLeave={() => setDragOverCol(null)}
                      onDrop={e => handleDrop(e, stage.id)}
                      className={`rounded-xl p-3 min-h-[500px] transition-colors ${stage.color} ${isOver ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                        <Badge variant={stage.badge} className="text-xs">{clients.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {clients.map(client => (
                          <ClientCard key={client.id} client={client} onDragStart={handleDragStart} />
                        ))}
                        {clients.length === 0 && (
                          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center text-xs text-muted-foreground">
                            Arrastra clientes aquí
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default PipelinePage;
