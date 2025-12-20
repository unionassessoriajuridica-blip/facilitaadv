import * as React from "react";
import React from "react";
import { Lock, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.ts";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { FrontendMenu } from "./Menu.tsx";

const Header = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="w-full bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">
            <div className="flex items-center">
              <img src="/img/logosite.png" alt="FacilitaAdv Logo" className="h-10" />
            </div>
          </h1>
        </div>
        <FrontendMenu />
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Lock className="w-5 h-5 text-warning mr-2" />
            <span className="text-sm font-medium">SSL 256-bit Ativo</span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAuthAction}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleAuthAction}
              className="flex items-center gap-2 bg-gray-700"
            >
              <Lock className="w-4 h-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
