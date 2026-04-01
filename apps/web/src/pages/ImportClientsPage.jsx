import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

const ImportClientsPage = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const response = await apiServerClient.fetch('/import/import-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: text, userId: currentUser.id })
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success(`Importación completada: ${data.imported} importados, ${data.skipped} omitidos.`);
      } else {
        toast.error('Error en la importación');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <>
      <Helmet><title>Importar Clientes - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Importar Clientes</h1>
              <p className="text-muted-foreground">Sube un archivo CSV para importar clientes masivamente</p>
            </div>

            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle>Subir Archivo CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-xl p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <Button onClick={handleImport} disabled={!file || loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Importar Datos
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Formato requerido: nombre, email, telefono, empresa, estado, notas
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
};

export default ImportClientsPage;