import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import esLocale from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { es: esLocale };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getPrioridadColor = (p) => p === 'Alta' ? 'destructive' : p === 'Media' ? 'secondary' : 'outline';

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      api.get('/api/tareas'),
      api.get('/api/seguimientos')
    ]).then(([tareas, seguimientos]) => {
      const taskEvents = tareas
        .filter(t => t.fecha_vencimiento)
        .map(t => ({
          id: t.id,
          title: `[Tarea] ${t.titulo}`,
          start: new Date(t.fecha_vencimiento),
          end: new Date(t.fecha_vencimiento),
          allDay: true,
          resource: { ...t, _type: 'tarea' }
        }));

      const segEvents = seguimientos
        .filter(s => s.fecha)
        .map(s => ({
          id: s.id,
          title: `[${s.tipo}] Seguimiento`,
          start: new Date(s.fecha),
          end: new Date(s.fecha),
          allDay: true,
          resource: { ...s, _type: 'seguimiento' }
        }));

      setEvents([...taskEvents, ...segEvents]);
    }).catch(console.error);
  }, [currentUser]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setEventModalOpen(true);
  };

  const handleMonthChange = (monthIndex) => {
    const d = new Date(currentDate);
    d.setMonth(parseInt(monthIndex));
    setCurrentDate(d);
  };

  const handleYearChange = (year) => {
    const d = new Date(currentDate);
    d.setFullYear(parseInt(year));
    setCurrentDate(d);
  };

  const isTarea = selectedEvent?._type === 'tarea';

  return (
    <>
      <Helmet><title>Calendario - CRM Pro</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Calendario</h1>
              <p className="text-muted-foreground">Vista mensual de tareas y seguimientos</p>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Select value={String(currentDate.getMonth())} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(currentDate.getFullYear())} onValueChange={handleYearChange}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
            </div>

            <Card>
              <CardContent className="p-6 h-[680px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  culture="es"
                  date={currentDate}
                  onNavigate={(date) => setCurrentDate(date)}
                  onSelectEvent={handleSelectEvent}
                  messages={{ next: 'Sig', previous: 'Ant', today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
                  style={{ height: '100%' }}
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isTarea ? 'Detalle de Tarea' : 'Detalle de Seguimiento'}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              {isTarea ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Título</p>
                    <p className="font-medium">{selectedEvent.titulo}</p>
                  </div>
                  {selectedEvent.descripcion && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm">{selectedEvent.descripcion}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estado</p>
                      <Badge variant="outline">{selectedEvent.estado}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prioridad</p>
                      <Badge variant={getPrioridadColor(selectedEvent.prioridad)}>{selectedEvent.prioridad}</Badge>
                    </div>
                  </div>
                  {selectedEvent.fecha_vencimiento && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fecha de vencimiento</p>
                      <p className="text-sm">{format(new Date(selectedEvent.fecha_vencimiento), 'dd MMM yyyy', { locale: esLocale })}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                    <Badge variant="secondary">{selectedEvent.tipo}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                    <p className="text-sm">{format(new Date(selectedEvent.fecha), 'dd MMM yyyy', { locale: esLocale })}</p>
                  </div>
                  {selectedEvent.notas && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notas</p>
                      <p className="text-sm">{selectedEvent.notas}</p>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => {
                  setEventModalOpen(false);
                  navigate(isTarea ? '/tareas' : '/seguimientos', { state: { editId: selectedEvent.id } });
                }}>
                  Ir a editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarPage;
