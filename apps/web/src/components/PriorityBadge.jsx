import React from 'react';
import { Badge } from '@/components/ui/badge';

const PriorityBadge = ({ priority }) => {
  const variants = {
    Alta: 'bg-red-100 text-red-800 hover:bg-red-100',
    Media: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    Baja: 'bg-green-100 text-green-800 hover:bg-green-100'
  };

  return (
    <Badge className={variants[priority] || 'bg-gray-100 text-gray-800'}>
      {priority}
    </Badge>
  );
};

export default PriorityBadge;