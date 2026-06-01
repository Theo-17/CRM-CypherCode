import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Loader2, FileText } from 'lucide-react';

const ImportClientsPage = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const csvContent = await file.text();
      const data = await api.post('/import/import-clients', { csvContent, userId: currentUser.id });
      toast.success(`Importación completada: ${data.imported} importados, ${data.skipped} omitidos.`);
      setFile(null);
    } catch (err) {
      toast.error(err.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl">
              <Card>
                <CardHeader><CardTitle>Subir Archivo CSV</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <label className="border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors">
                    {file ? <FileText className="h-8 w-8 text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">{file ? file.name : 'Haz clic o arrastra tu archivo CSV'}</span>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  </label>
                  <Button onClick={handleImport} disabled={!file || loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Importar Datos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Formato Requerido</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">El CSV debe tener las siguientes columnas:</p>
                  <div className="space-y-2">
                    {['nombre (requerido)', 'email', 'telefono', 'empresa', 'estado', 'notas'].map(col => (
                      <div key={col} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{col}</code>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">La primera fila debe ser el encabezado.</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ImportClientsPage;
