
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, ShoppingCart } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <img 
            src="/lovable-uploads/2f0ddaac-7367-4d4d-9a58-363eb7056a4f.png" 
            alt="Logo Casino"
            className="h-32 w-32 object-contain rounded-full bg-white shadow-lg"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-800">
            Sistema de Pedidos Casino
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Gestión completa de pedidos para mesas del casino
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="flex items-center space-x-2 min-w-48">
              <Settings className="h-5 w-5" />
              <span>Administrar Pedidos</span>
            </Button>
          </Link>
          
          <Link to="/pedidos">
            <Button variant="outline" size="lg" className="flex items-center space-x-2 min-w-48">
              <ShoppingCart className="h-5 w-5" />
              <span>Ver Pedidos Cliente</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
