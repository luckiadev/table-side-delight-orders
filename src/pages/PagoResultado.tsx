// src/pages/PagoResultado.tsx
// Página que muestra el resultado del pago después de retornar de Transbank
// Lee los query params que webpay-confirm puso en la URL

import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/formatNumber';
import { CheckCircle2, XCircle, Clock, Ban, AlertTriangle } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useEffect, useState } from 'react';

const PagoResultado = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { crearPedido } = usePedidos();
  const [pedidoCreado, setPedidoCreado] = useState(false);

  const status = searchParams.get('status');
  const order = searchParams.get('order');
  const mesa = searchParams.get('mesa');
  const amount = searchParams.get('amount');
  const code = searchParams.get('code');
  const reason = searchParams.get('reason');

  // Si el pago fue exitoso, crear el pedido usando datos guardados en sessionStorage
  // (el carrito se guarda ahí antes de redirigir a Transbank)
  useEffect(() => {
    if (status === 'success' && !pedidoCreado) {
      try {
        const savedCart = sessionStorage.getItem('webpay_cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          crearPedido({
            numero_mesa: cartData.numero_mesa,
            productos: cartData.productos,
            total: cartData.total,
            nota: cartData.nota
              ? `[PAGADO WEBPAY] ${cartData.nota}`
              : '[PAGADO WEBPAY]',
          });
          setPedidoCreado(true);
          sessionStorage.removeItem('webpay_cart');
        }
      } catch (e) {
        console.error('Error creando pedido post-pago:', e);
      }
    }
  }, [status, pedidoCreado, crearPedido]);

  // Configuración visual por estado
  const statusConfig = {
    success: {
      icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
      title: 'Pago exitoso',
      message: mesa && amount
        ? `Tu pedido para la Mesa ${mesa} por $${formatNumber(Number(amount))} ha sido confirmado.`
        : 'Tu pago ha sido procesado correctamente.',
      subtitle: 'Tu pedido fue enviado a cocina.',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    failed: {
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      title: 'Pago rechazado',
      message: 'Tu banco rechazó la transacción. No se ha cobrado nada.',
      subtitle: code ? `Código de respuesta: ${code}` : null,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    timeout: {
      icon: <Clock className="h-16 w-16 text-amber-500" />,
      title: 'Tiempo agotado',
      message: 'No se completó el pago dentro del tiempo límite.',
      subtitle: 'No se ha cobrado nada.',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    cancelled: {
      icon: <Ban className="h-16 w-16 text-gray-500" />,
      title: 'Pago cancelado',
      message: 'Cancelaste el pago en el formulario de Transbank.',
      subtitle: 'No se ha cobrado nada.',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
    error: {
      icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
      title: 'Error en el pago',
      message: reason || 'Ocurrió un error procesando tu pago.',
      subtitle: 'Intenta nuevamente o contacta a un garzón.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
  const mesaNum = mesa || searchParams.get('mesa');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ícono */}
        <div className="flex justify-center">{config.icon}</div>

        {/* Título */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {config.title}
        </h1>

        {/* Mensaje principal */}
        <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4`}>
          <p className="text-base sm:text-lg text-gray-700">{config.message}</p>
          {config.subtitle && (
            <p className="text-sm text-gray-500 mt-2">{config.subtitle}</p>
          )}
        </div>

        {/* Referencia del pedido */}
        {order && (
          <p className="text-xs text-gray-400">
            Orden: {order}
          </p>
        )}

        {/* Botones de acción */}
        <div className="space-y-3 pt-4">
          {status === 'success' ? (
            <Button
              onClick={() => navigate(mesaNum ? `/pedidos?mesa=${mesaNum}` : '/pedidos')}
              className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
            >
              Volver al menú
            </Button>
          ) : (
            <>
              <Button
                onClick={() => navigate(mesaNum ? `/pedidos?mesa=${mesaNum}` : '/pedidos')}
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700"
              >
                Intentar de nuevo
              </Button>
              <p className="text-xs text-gray-400">
                Si el problema persiste, solicita asistencia a un garzón.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagoResultado;
