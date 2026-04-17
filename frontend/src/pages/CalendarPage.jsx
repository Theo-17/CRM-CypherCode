import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import esLocale from 'date-fns/locale/es';

const locales = {
  'es': esLocale,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tareas, seguimientos] = await Promise.all([
        pb.collection('tareas').getFullList({ filter: `usuario_id = "${currentUser.id}"`, $autoCancel: false }),
        pb.collection('seguimientos').getFullList({ filter: `usuario_id = "${currentUser.id}"`, $autoCancel: false })
      ]);

      const taskEvents = tareas.filter(t => t.fecha_vencimiento).map(t => ({
        id: t.id,
        title: `[Tarea] ${t.titulo}`,
        start: new Date(t.fecha_vencimiento),
        end: new Date(t.fecha_vencimiento),
        allDay: true,
        resource: t
      }));

      const segEvents = seguimientos.filter(s => s.fecha).map(s => ({
        id: s.id,
        title: `[${s.tipo}] Seguimiento`,
        start: new Date(s.fecha),
        end: new Date(s.fecha),
        allDay: true,
        resource: s
      }));

      setEvents([...taskEvents, ...segEvents]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  return (
    <>
      <Helmet><title>Calendario - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Calendario</h1>
              <p className="text-muted-foreground">Vista mensual de tareas y seguimientos</p>
            </div>
            <Card>
              <CardContent className="p-6 h-[700px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  culture="es"
                  messages={{
                    next: "Sig",
                    previous: "Ant",
                    today: "Hoy",
                    month: "Mes",
                    week: "Semana",
                    day: "Día"
                  }}
                  style={{ height: '100%' }}
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
};

export default CalendarPage;