import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const AdvancedSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ clientes: [], tareas: [] });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery) return;
    try {
      const [clientes, tareas] = await Promise.all([
        pb.collection('clientes').getFullList({
          filter: `usuario_id = "${currentUser.id}" && (nombre ~ "${searchQuery}" || email ~ "${searchQuery}" || empresa ~ "${searchQuery}")`,
          $autoCancel: false
        }),
        pb.collection('tareas').getFullList({
          filter: `usuario_id = "${currentUser.id}" && (titulo ~ "${searchQuery}" || descripcion ~ "${searchQuery}")`,
          $autoCancel: false
        })
      ]);
      setResults({ clientes, tareas });
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

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
            </div>

            <form onSubmit={handleSearch} className="flex gap-4 mb-8 max-w-2xl">
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Buscar clientes, tareas..." 
                className="flex-1"
              />
              <Button type="submit"><Search className="h-4 w-4 mr-2" /> Buscar</Button>
            </form>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Clientes ({results.clientes.length})</h2>
                <div className="grid gap-4">
                  {results.clientes.map(c => (
                    <Card key={c.id}><CardContent className="p-4">{c.nombre} - {c.empresa}</CardContent></Card>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Tareas ({results.tareas.length})</h2>
                <div className="grid gap-4">
                  {results.tareas.map(t => (
                    <Card key={t.id}><CardContent className="p-4">{t.titulo}</CardContent></Card>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdvancedSearchPage;