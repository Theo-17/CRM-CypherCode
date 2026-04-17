import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, User, CheckSquare, Mail } from 'lucide-react';

const ActivityFeed = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const records = await pb.collection('actividades').getList(1, 20, {
          filter: `usuario_id = "${currentUser.id}"`,
          sort: '-fecha',
          $autoCancel: false
        });
        setActivities(records.items);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };
    fetchActivities();
  }, [currentUser]);

  const getIcon = (tipo) => {
    if (tipo.includes('cliente')) return <User className="h-4 w-4" />;
    if (tipo.includes('tarea')) return <CheckSquare className="h-4 w-4" />;
    if (tipo.includes('email')) return <Mail className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente</p>
      ) : (
        activities.map((act) => (
          <div key={act.id} className="flex gap-3 items-start">
            <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary">
              {getIcon(act.tipo)}
            </div>
            <div>
              <p className="text-sm font-medium">{act.descripcion}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(act.fecha), "d MMM, HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActivityFeed;