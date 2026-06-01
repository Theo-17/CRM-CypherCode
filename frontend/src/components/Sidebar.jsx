import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, CheckSquare, Calendar, ChevronLeft, ChevronRight,
  Shield, BarChart3, CreditCard, Mail, Activity, Upload, Zap, Link as LinkIcon,
  PieChart, Package, ShoppingCart, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  );
  const location = useLocation();
  const { getCurrentUserRole } = useAuth();
  const role = getCurrentUserRole();

  const baseNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clientes', label: 'Clientes', icon: Users },
    { path: '/tareas', label: 'Tareas', icon: CheckSquare },
    { path: '/calendar', label: 'Calendario', icon: Calendar },
    { path: '/seguimientos', label: 'Seguimientos', icon: Activity },
    { path: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { path: '/inventario', label: 'Inventario', icon: Package },
    { path: '/emails', label: 'Emails', icon: Mail },
    { path: '/pipeline', label: 'Pipeline', icon: GitBranch },
    { path: '/conversion-analysis', label: 'Conversión', icon: PieChart },
    { path: '/timeline', label: 'Actividad', icon: Activity },
    { path: '/pricing', label: 'Suscripción', icon: CreditCard },
  ];

  const adminNavItems = [
    { path: '/users', label: 'Usuarios', icon: Shield },
    { path: '/reports', label: 'Reportes', icon: BarChart3 },
    { path: '/import', label: 'Importar', icon: Upload },
    { path: '/automations', label: 'Automatizaciones', icon: Zap },
    { path: '/integrations', label: 'Integraciones', icon: LinkIcon },
  ];

  const navItems = role === 'admin' ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="sticky top-16 h-[calc(100vh-4rem)] border-r bg-card z-30"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end p-4">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(v => { localStorage.setItem('sidebar_collapsed', String(!v)); return !v; })} className="h-8 w-8">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start transition-all duration-200 mb-1',
                    active && 'bg-primary/10 text-primary hover:bg-primary/20',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
};

export default React.memo(Sidebar);