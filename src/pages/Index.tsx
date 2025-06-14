
import { Link } from "react-router-dom";
import logo from "/placeholder.svg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

// Intenta importar el logo, si no existe muestra el nombre en texto plano
let logoSrc: string | undefined;
try {
  logoSrc = require("/placeholder.svg").default ?? "/placeholder.svg";
} catch {
  logoSrc = undefined;
}

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between p-6 shadow">
        <div className="flex items-center space-x-3">
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className="h-12 w-12" />
          ) : (
            <span className="h-12 w-12 flex items-center justify-center font-bold text-2xl bg-gray-100 rounded">CE</span>
          )}
          <span className="text-3xl font-semibold">Casino EATS</span>
        </div>
        <nav className="space-x-2">
          <Link to="/pedidos">
            <Button variant="outline">Realizar Pedido</Button>
          </Link>
          <Link to="/admin-productos">
            <Button variant="outline">Administrar</Button>
          </Link>
        </nav>
      </header>
      <main className="container mx-auto p-6 flex-grow flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Bienvenido a Casino EATS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-600">
              ¡Ordene sus platos favoritos desde la comodidad de su mesa!
            </p>
            <Link to="/pedidos">
              <Button className="mt-4">Realizar Pedido</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <footer className="text-center p-4 text-gray-500">
        <p>&copy; {new Date().getFullYear()} Casino EATS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
