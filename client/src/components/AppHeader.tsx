import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Scale, Menu, X, User } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Processos", path: "/processos" },
  { label: "Audiencias", path: "/audiencias" },
  { label: "Financeiro", path: "/financeiro" },
  { label: "Configuracoes", path: "/user-management" },
];

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/processos") {
      return location.pathname === "/processos" || location.pathname.startsWith("/processo");
    }
    return location.pathname === path;
  };

  const getFuncaoLabel = (funcao?: string | null) => {
    switch (funcao) {
      case "administrador": return "Administrador";
      case "assessor_financeiro": return "Assessor Fin.";
      case "assessor_juridico": return "Assessor Jur.";
      default: return "Advogado(a)";
    }
  };

  return (
    <header className="w-full bg-slate-900 text-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg">Facilita ADV</span>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "text-white border-b-2 border-amber-400 pb-1"
                  : "text-amber-400 hover:text-amber-300"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/perfil")}
            data-testid="button-profile-desktop"
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.nome || "Avatar"} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-amber-400" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {user?.nome || user?.email?.split("@")[0] || "Usuario"}
              </span>
              <span className="text-xs text-gray-400">
                {getFuncaoLabel(user?.funcao)}
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
          >
            Sair
          </Button>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-amber-400" />
          ) : (
            <Menu className="w-6 h-6 text-amber-400" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-800 px-4 py-3 space-y-2 border-t border-slate-700">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              className={`block w-full text-left text-sm py-2 font-medium pl-3 ${
                isActive(item.path)
                  ? "text-white border-l-2 border-amber-400"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="border-t border-slate-700 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => { navigate("/perfil"); setMobileMenuOpen(false); }}
                data-testid="button-profile-mobile"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.nome || "Avatar"} 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-amber-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-white">{user?.nome || user?.email?.split("@")[0] || "Usuario"}</span>
                  <span className="text-xs text-gray-400">{getFuncaoLabel(user?.funcao)}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
