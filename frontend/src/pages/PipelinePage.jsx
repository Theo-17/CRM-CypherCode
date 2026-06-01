import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Building2, Mail, DollarSign, Users, Calendar, Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DEFAULT_STAGES = [
  { id: 'prospecto', label: 'Prospecto', color: 'bg-slate-100 dark:bg-slate-800', badge: 'secondary' },
  { id: 'en_negociacion', label: 'En Negociación', color: 'bg-yellow-50 dark:bg-yellow-900/20', badge: 'outline' },
  { id: 'ganado', label: 'Ganado', color: 'bg-green-50 dark:bg-green-900/20', badge: 'default' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-50 dark:bg-red-900/20', badge: 'destructive' }
];

const loadCustomColumns = () => {
  try {
    const raw = localStorage.getItem('pipeline_custom_columns');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveCustomColumns = (cols) => {
  localStorage.setItem('pipeline_custom_columns', JSON.stringify(cols));
};

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

const SeguimientoCard = ({ seg }) => (
  <div className="bg-background border rounded-lg p-3">
    <div className="flex items-center gap-2 mb-1">
      <Calendar className="h-3 w-3 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{format(new Date(seg.fecha), 'dd MMM yyyy', { locale: es })}</p>
    </div>
    <p className="text-sm font-medium">{seg.tipo}</p>
    {seg.notas && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{seg.notas}</p>}
  </div>
);

const PipelinePage = () => {
  const { getCurrentUserRole } = useAuth();
  const isAdmin = getCurrentUserRole() === 'admin';
  const [viewMode, setViewMode] = useState('clientes');
  const [stages, setStages] = useState(() => [...DEFAULT_STAGES, ...loadCustomColumns()]);
  const [columns, setColumns] = useState({});
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editColsOpen, setEditColsOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const dragClientId = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    const allStageIds = stages.reduce((acc, s) => { acc[s.id] = []; return acc; }, {});

    if (viewMode === 'clientes') {
      setSeguimientos([]);
      setLoading(true);
      api.get('/api/clientes')
        .then(data => {
          const grouped = { ...allStageIds };
          data.forEach(c => {
            const stage = c.estado_conversion || 'prospecto';
            if (grouped[stage]) grouped[stage].push(c);
            else grouped.prospecto.push(c);
          });
          setColumns(grouped);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setColumns({});
      setLoading(true);
      api.get('/api/seguimientos')
        .then(data => setSeguimientos(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [viewMode, stages.length]);

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
      next[targetStage] = [...(prev[targetStage] || []), { ...client, estado_conversion: targetStage }];
      return next;
    });

    try {
      await api.put(`/api/clientes/${clientId}`, { estado_conversion: targetStage });
      toast.success(`${client.nombre} movido a ${stages.find(s => s.id === targetStage)?.label}`);
    } catch {
      toast.error('Error al actualizar el cliente');
      setColumns(prev => {
        const next = { ...prev };
        next[targetStage] = (prev[targetStage] || []).filter(c => c.id !== clientId);
        next[sourceStage] = [...(prev[sourceStage] || []), client];
        return next;
      });
    }
  };

  const handleAddColumn = () => {
    if (!newColLabel.trim()) return;
    const id = newColLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (stages.find(s => s.id === id)) {
      toast.error('Ya existe una columna con ese nombre');
      return;
    }
    const newCol = { id, label: newColLabel.trim(), color: 'bg-purple-50 dark:bg-purple-900/20', badge: 'outline' };
    const customCols = loadCustomColumns();
    customCols.push(newCol);
    saveCustomColumns(customCols);
    setStages([...DEFAULT_STAGES, ...customCols]);
    setNewColLabel('');
    toast.success(`Columna "${newCol.label}" añadida`);
  };

  const segColumns = useMemo(() => {
    const tipos = [...new Set(seguimientos.map(s => s.tipo).filter(Boolean))];
    return tipos.map(tipo => ({ id: tipo, label: tipo, color: 'bg-blue-50 dark:bg-blue-900/20', badge: 'outline' }));
  }, [seguimientos]);

  const groupedSeguimientos = segColumns.reduce((acc, s) => {
    acc[s.id] = seguimientos.filter(seg => seg.tipo === s.id);
    return acc;
  }, {});

  const totalItems = viewMode === 'clientes'
    ? Object.values(columns).reduce((s, arr) => s + arr.length, 0)
    : seguimientos.length;

  return (
    <>
      <Helmet><title>Pipeline de Ventas - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 overflow-x-auto">
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">Pipeline de Ventas</h1>
                <p className="text-muted-foreground">
                  {totalItems} {viewMode === 'clientes' ? 'cliente' : 'seguimiento'}{totalItems !== 1 ? 's' : ''}
                  {viewMode === 'clientes' && ' — arrastra las tarjetas para cambiar etapa'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border overflow-hidden">
                  <Button
                    variant={viewMode === 'clientes' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode('clientes')}
                  >
                    <Users className="h-4 w-4 mr-1" />Clientes
                  </Button>
                  <Button
                    variant={viewMode === 'seguimientos' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode('seguimientos')}
                  >
                    <Calendar className="h-4 w-4 mr-1" />Seguimientos
                  </Button>
                </div>
                {isAdmin && viewMode === 'clientes' && (
                  <Button variant="outline" size="sm" onClick={() => setEditColsOpen(true)}>
                    <Settings className="h-4 w-4 mr-1" />Columnas
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-[500px] rounded-xl" />)}
              </div>
            ) : (
              <div className="flex gap-4 min-w-max">
                {(viewMode === 'clientes' ? stages : segColumns).map(stage => {
                  const items = viewMode === 'clientes' ? (columns[stage.id] || []) : (groupedSeguimientos[stage.id] || []);
                  const isOver = dragOverCol === stage.id;
                  return (
                    <div
                      key={stage.id}
                      onDragOver={e => handleDragOver(e, stage.id)}
                      onDragLeave={() => setDragOverCol(null)}
                      onDrop={e => handleDrop(e, stage.id)}
                      className={`rounded-xl p-3 w-64 min-h-[500px] transition-colors ${stage.color} ${isOver ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                        <Badge variant={stage.badge} className="text-xs">{items.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {viewMode === 'clientes'
                          ? items.map(client => <ClientCard key={client.id} client={client} onDragStart={handleDragStart} />)
                          : items.map(seg => <SeguimientoCard key={seg.id} seg={seg} />)
                        }
                        {items.length === 0 && (
                          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center text-xs text-muted-foreground">
                            {viewMode === 'clientes' ? 'Arrastra clientes aquí' : 'Sin seguimientos'}
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

      <Dialog open={editColsOpen} onOpenChange={setEditColsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Columnas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Columnas actuales</p>
              <div className="space-y-1">
                {stages.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                    <span>{s.label}</span>
                    {!DEFAULT_STAGES.find(d => d.id === s.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          const custom = loadCustomColumns().filter(c => c.id !== s.id);
                          saveCustomColumns(custom);
                          setStages([...DEFAULT_STAGES, ...custom]);
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nueva columna</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de la columna"
                  value={newColLabel}
                  onChange={e => setNewColLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                />
                <Button onClick={handleAddColumn}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PipelinePage;
