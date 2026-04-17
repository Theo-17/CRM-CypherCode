import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ActivityFeed from '@/components/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ActivityTimelinePage = () => {
  return (
    <>
      <Helmet><title>Línea de Tiempo - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Línea de Tiempo de Actividad</h1>
              <p className="text-muted-foreground">Registro completo de acciones en el sistema</p>
            </div>
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
};

export default ActivityTimelinePage;