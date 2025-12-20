import * as React from "react";
// src/components/GooglePermissionsDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Shield, Check } from "lucide-react";

export const GooglePermissionsDialog = ({ open, onOpenChange, onConfirm }) => {
  const permissions = [
    {
      icon: Mail,
      title: "Enviar e-mails",
      description: "Permite que o sistema envie e-mails em seu nome",
      required: true
    },
    {
      icon: Calendar,
      title: "Gerenciar agenda",
      description: "Permite criar e editar eventos em seu calendário",
      required: true
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permissões Necessárias</DialogTitle>
          <DialogDescription>
            Para usar todas as funcionalidades, precisamos das seguintes permissões:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {permissions.map((perm, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <perm.icon className="w-5 h-5 mt-0.5 text-blue-600" />
              <div>
                <h4 className="font-medium">{perm.title}</h4>
                <p className="text-sm text-muted-foreground">{perm.description}</p>
              </div>
              {perm.required && <Check className="w-5 h-5 text-green-500" />}
            </div>
          ))}

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              Suas informações são protegidas e usadas apenas para as funcionalidades solicitadas.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Conceder Permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};