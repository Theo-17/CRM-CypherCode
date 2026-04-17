import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon: Icon, loading = false, index = 0 }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {Icon && <Icon className="h-5 w-5 text-primary" />}
          </div>
          <p className="text-3xl font-bold">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;