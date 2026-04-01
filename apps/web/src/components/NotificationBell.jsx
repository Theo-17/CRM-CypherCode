import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('notificaciones').getFullList({
        filter: `usuario_id = "${currentUser.id}" && leida = false`,
        sort: '-created',
        expand: 'tarea_id',
        $autoCancel: false
      });
      setNotifications(records);
      setUnreadCount(records.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Set up real-time subscription here if needed
  }, [currentUser]);

  const markAsRead = async (id) => {
    try {
      await pb.collection('notificaciones').update(id, { leida: true }, { $autoCancel: false });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map(n => pb.collection('notificaciones').update(n.id, { leida: true }, { $autoCancel: false }))
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setOpen(false);
    navigate('/tareas'); // Or specific task detail if route exists
  };

  const getColorClass = (tipo) => {
    switch (tipo) {
      case 'vencida': return 'bg-[hsl(var(--notification-overdue))]';
      case 'proxima_hoy': return 'bg-[hsl(var(--notification-today))]';
      case 'proxima_manana': return 'bg-[hsl(var(--notification-tomorrow))]';
      default: return 'bg-primary';
    }
  };

  const getMessage = (notification) => {
    const taskTitle = notification.expand?.tarea_id?.titulo || 'Tarea';
    switch (notification.tipo) {
      case 'vencida': return `La tarea "${taskTitle}" está vencida.`;
      case 'proxima_hoy': return `La tarea "${taskTitle}" vence hoy.`;
      case 'proxima_manana': return `La tarea "${taskTitle}" vence mañana.`;
      case 'proxima_3dias': return `La tarea "${taskTitle}" vence en los próximos 3 días.`;
      default: return `Notificación sobre "${taskTitle}".`;
    }
  };

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
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto text-xs px-2 py-1">
              Marcar todas leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No tienes notificaciones nuevas</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${getColorClass(notification.tipo)}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-tight">{getMessage(notification)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.created), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
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