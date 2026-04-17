import React from 'react';
import { Badge } from '@/components/ui/badge';

const StatusBadge = ({ status, type = 'client' }) => {
  const clientVariants = {
    Activo: 'bg-green-100 text-green-800 hover:bg-green-100',
    Inactivo: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  };

  const taskVariants = {
    Pendiente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    'En Progreso': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    Completada: 'bg-green-100 text-green-800 hover:bg-green-100'
  };

  const variants = type === 'client' ? clientVariants : taskVariants;

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

export default StatusBadge;