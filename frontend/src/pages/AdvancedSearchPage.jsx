import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, CheckSquare, Activity } from 'lucide-react';

const AdvancedSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ clientes: [], tareas: [], seguimientos: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) performSearch(initialQuery);
  }, [initialQuery]);

  const performSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults({ clientes: [], tareas: [], seguimientos: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const total = results.clientes.length + results.tareas.length + results.seguimientos.length;

  return (
    <>
      <Helmet><title>Búsqueda Avanzada - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Búsqueda Avanzada</h1>
              <p className="text-muted-foreground">Busca entre clientes, tareas y seguimientos</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-4 mb-8 max-w-2xl">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar clientes, tareas, seguimientos..."
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>

            {initialQuery && (
              <p className="text-sm text-muted-foreground mb-6">{total} resultado{total !== 1 ? 's' : ''} para "{initialQuery}"</p>
            )}

            <div className="space-y-8">
              {results.clientes.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" /> Clientes ({results.clientes.length})
                  </h2>
                  <div className="grid gap-3">
                    {results.clientes.map(c => (
                      <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clientes/${c.id}`)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{c.nombre}</p>
                            <p className="text-sm text-muted-foreground">{c.empresa} {c.empresa && c.email && '•'} {c.email}</p>
                          </div>
                          <Badge variant="outline">{c.estado}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {results.tareas.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" /> Tareas ({results.tareas.length})
                  </h2>
                  <div className="grid gap-3">
                    {results.tareas.map(t => (
                      <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tareas')}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t.titulo}</p>
                            {t.descripcion && <p className="text-sm text-muted-foreground line-clamp-1">{t.descripcion}</p>}
                          </div>
                          <Badge variant={t.estado === 'Completada' ? 'default' : 'secondary'}>{t.estado}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {results.seguimientos.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Seguimientos ({results.seguimientos.length})
                  </h2>
                  <div className="grid gap-3">
                    {results.seguimientos.map(s => (
                      <Card key={s.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{s.tipo} {s.Cliente?.nombre && `— ${s.Cliente.nombre}`}</p>
                            {s.notas && <p className="text-sm text-muted-foreground line-clamp-1">{s.notas}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {initialQuery && !loading && total === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No se encontraron resultados para "{initialQuery}"</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdvancedSearchPage;
