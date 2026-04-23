import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await api.get('/api/notificaciones');
      setNotifications(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchNotifications(); }, [currentUser]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}/leer`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notificaciones/leer-todas');
      setNotifications([]);
    } catch {}
  };

  const getColorClass = (tipo) => {
    const map = { vencida: 'bg-red-500', proxima_hoy: 'bg-yellow-500', proxima_manana: 'bg-blue-500' };
    return map[tipo] || 'bg-primary';
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificaciones</h4>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto text-xs px-2 py-1">Marcar todas leídas</Button>}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No tienes notificaciones nuevas</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-4 border-b hover:bg-muted/50 cursor-pointer" onClick={() => { markAsRead(n.id); setOpen(false); navigate('/tareas'); }}>
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${getColorClass(n.tipo)}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-tight">{n.mensaje}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(n.created), "d MMM, HH:mm", { locale: es })}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={e => { e.stopPropagation(); markAsRead(n.id); }}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
