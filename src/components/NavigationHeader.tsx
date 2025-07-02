import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Package, 
  Settings, 
  LogOut, 
  ChefHat,
  MoreHorizontal,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/use-mobile';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Descomenta si tienes AuthContext

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  showAdminControls?: boolean;
}

export const NavigationHeader = ({ 
  title, 
  subtitle, 
  showAdminControls = false 
}: NavigationHeaderProps) => {
  const { isMobile } = useBreakpoint();
  const location = useLocation();
  const { logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigationItems = [
    {
      to: "/",
      icon: Home,
      label: "Inicio",
      description: "Dashboard principal"
    },
    ...(showAdminControls ? [
      {
        to: "/admin_pedidos",
        icon: ChefHat,
        label: "Pedidos",
        description: "Gestionar pedidos"
      },
      {
        to: "/admin-productos",
        icon: Package,
        label: "Productos", 
        description: "Administrar menú"
      }
    ] : []),
  ];

  const isActivePath = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Mobile Menu Component
  const MobileMenu = () => (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${
      showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowMobileMenu(false)}
      />
      
      {/* Menu Panel */}
      <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ${
        showMobileMenu ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/2f0ddaac-7367-4d4d-9a58-363eb7056a4f.png" 
              alt="Logo"
              className="h-8 w-8 rounded-full"
            />
            <span className="font-semibold text-gray-900">Menú</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileMenu(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${
                    isActive ? 'text-primary-foreground/70' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
                {isActive && <Badge variant="secondary" className="text-xs">Actual</Badge>}
              </Link>
            );
          })}
          
          {/* Separator */}
          <div className="my-4 border-t" />
          
          {/* Logout */}
          {showAdminControls && (
            <button
              onClick={() => {
                logout();
                setShowMobileMenu(false);
              }}
              className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <div>
                <div className="font-medium">Cerrar Sesión</div>
                <div className="text-xs text-red-500">Salir del panel admin</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Desktop Navigation
  const DesktopNavigation = () => (
    <div className="flex items-center space-x-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(item.to);
        
        return (
          <Link key={item.to} to={item.to}>
            <Button
              variant={isActive ? "default" : "outline"}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                isActive 
                  ? 'shadow-md ring-2 ring-primary/20' 
                  : 'hover:shadow-md hover:scale-105'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {isActive && <Badge variant="secondary" className="text-xs ml-1">•</Badge>}
            </Button>
          </Link>
        );
      })}
      
      {showAdminControls && (
        <Button
          variant="outline"
          onClick={logout}
          className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-md transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Main Navigation Card */}
      <Card className="w-full shadow-lg border-0 bg-gradient-to-r from-white via-white to-gray-50">
        <div className="p-4 sm:p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src="/lovable-uploads/2f0ddaac-7367-4d4d-9a58-363eb7056a4f.png" 
                  alt="Logo Casino"
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-full shadow-md ring-4 ring-white bg-white"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between sm:justify-end">
              {/* Desktop Navigation */}
              {!isMobile && <DesktopNavigation />}
              
              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="outline"
                  onClick={() => setShowMobileMenu(true)}
                  className="flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Menu className="h-4 w-4" />
                  <span>Menú</span>
                  <Badge variant="secondary" className="text-xs">
                    {navigationItems.length + (showAdminControls ? 1 : 0)}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          {/* Breadcrumb Indicator */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema activo</span>
            </div>
            <span>•</span>
            <span>
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Mobile Menu Overlay */}
      {isMobile && <MobileMenu />}
    </>
  );
};