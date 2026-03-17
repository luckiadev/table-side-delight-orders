import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="text-center space-y-6 sm:space-y-8 w-full max-w-2xl">
        <div className="flex justify-center">
          <img
            src="/lovable-uploads/2f0ddaac-7367-4d4d-9a58-363eb7056a4f.png"
            alt="Logo Casino"
            className="h-24 w-24 sm:h-32 sm:w-32 object-contain rounded-full bg-white shadow-lg"
          />
        </div>

        <div className="space-y-3 sm:space-y-4 px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
            Sistema de Pedidos
          </h1>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center w-full max-w-md mx-auto px-4">
          <Link to="/login" className="w-full">
            <Button size="lg" className="flex items-center justify-center space-x-3 w-full h-12 sm:h-14">
              <i className="fi fi-rr-settings text-lg"></i>
              <span>Administrar</span>
            </Button>
          </Link>

          <Link to="/pedidos" className="w-full">
            <Button variant="outline" size="lg" className="flex items-center justify-center space-x-3 w-full h-12 sm:h-14">
              <i className="fi fi-rr-apps text-lg"></i>
              <span>Hacer Pedido</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;