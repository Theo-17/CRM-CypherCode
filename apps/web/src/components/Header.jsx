import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, ShieldAlert } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const Header = () => {
  const { currentUser, logout, getCurrentUserPlan, getCurrentUserRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const plan = getCurrentUserPlan();
  const role = getCurrentUserRole();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">CR</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
              CRM Pro
            </h1>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 ml-4 border-l pl-4">
            <Badge variant={plan === 'gratis' ? 'outline' : 'default'} className="capitalize">
              Plan {plan}
            </Badge>
            {role === 'admin' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Admin
              </Badge>
            )}
          </div>

          <div className="ml-8 flex-1 max-w-md">
            <SearchBar />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl ml-2">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                    {getInitials(currentUser?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/pricing')}>
                Mejorar Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;