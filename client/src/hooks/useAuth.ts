import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface User {
  id: string;
  email: string;
  nome: string | null;
  role: string | null;
  funcao: string | null;
  avatar_url: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          nome: session.user.user_metadata?.nome || session.user.user_metadata?.full_name || null,
          role: session.user.user_metadata?.role || 'user',
          funcao: session.user.user_metadata?.funcao || 'advogado',
          avatar_url: session.user.user_metadata?.avatar_url || null,
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            nome: session.user.user_metadata?.nome || session.user.user_metadata?.full_name || null,
            role: session.user.user_metadata?.role || 'user',
            funcao: session.user.user_metadata?.funcao || 'advogado',
            avatar_url: session.user.user_metadata?.avatar_url || null,
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const signOut = async () => {
    try {
      const result = await Swal.fire({
        title: "Encerrar sessão?",
        text: "Você está prestes a sair do sistema.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, sair",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Encerrando o sistema...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await supabase.auth.signOut();
        setUser(null);

        await Swal.fire({
          icon: "success",
          title: "Sessão encerrada!",
          text: "Você foi desconectado com segurança.",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Ocorreu um problema ao encerrar a sessão",
      });
    }
  };

  return { user, loading, signOut, isAuthenticated: !!user, refetch: fetchUser };
};
