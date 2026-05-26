// src/components/WebpayRedirect.tsx
// Formulario hidden que hace POST automático a Transbank
// Transbank requiere un POST con token_ws en el body (no se puede hacer con fetch)

import { useEffect, useRef } from 'react';

interface WebpayRedirectProps {
  url: string;    // URL de Transbank (viene de webpay-create)
  token: string;  // Token de la transacción
}

const WebpayRedirect = ({ url, token }: WebpayRedirectProps) => {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Auto-submit del formulario al montar el componente
    // Esto redirige al navegador al formulario de pago de Transbank
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-4 sm:border-8 border-gray-300 border-t-blue-600 mx-auto"></div>
        <p className="text-lg sm:text-2xl text-gray-700 font-medium">
          Redirigiendo a Webpay...
        </p>
        <p className="text-sm text-gray-400">
          Serás redirigido al formulario de pago de Transbank
        </p>
      </div>

      {/* Formulario hidden — Transbank requiere POST con token_ws */}
      <form
        ref={formRef}
        method="POST"
        action={url}
        style={{ display: 'none' }}
      >
        <input type="hidden" name="token_ws" value={token} />
      </form>
    </div>
  );
};

export default WebpayRedirect;
