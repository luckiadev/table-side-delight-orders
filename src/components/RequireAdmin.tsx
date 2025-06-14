
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<null | boolean>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        if (isMounted) setAllowed(false);
        return;
      }
      // Comprobar rol
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();
      setAllowed(perfil?.rol === "admin");
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (allowed === false) {
      navigate("/auth");
    }
  }, [allowed, navigate]);

  if (allowed === null) {
    return <div className="w-full py-8 text-center">Comprobando acceso...</div>;
  }
  if (!allowed) {
    return null;
  }
  return <>{children}</>;
}
