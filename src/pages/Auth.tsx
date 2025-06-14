
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Redirige a /admin-productos si es admin, si no a la página principal
        checkIsAdminAndRedirect(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        checkIsAdminAndRedirect(data.session.user.id);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkIsAdminAndRedirect = async (userId: string) => {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", userId)
      .single();
    if (perfil?.rol === "admin") {
      navigate("/admin-productos");
    } else {
      navigate("/");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (mode === "login") {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      // SIGNUP
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
          emailRedirectTo: `${window.location.origin}/auth` // para confirmar correo
        },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Por favor revisa tu correo y confirma tu cuenta antes de iniciar sesión."
        });
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAuth}>
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {mode === "signup" && (
              <Input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarse"}
            </Button>
          </form>
          <div className="text-center mt-4">
            {mode === "login" ? (
              <span>
                ¿No tienes cuenta?{" "}
                <button
                  className="underline text-blue-700"
                  onClick={() => setMode("signup")}
                  type="button"
                >
                  Crear cuenta
                </button>
              </span>
            ) : (
              <span>
                ¿Ya tienes cuenta?{" "}
                <button
                  className="underline text-blue-700"
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Iniciar sesión
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
