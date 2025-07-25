import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Pedidos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
          <p className="text-muted-foreground">
            Gerencie os pedidos de merenda escolar
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta página está sendo desenvolvida e em breve terá todas as funcionalidades de gestão de pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Criar novos pedidos selecionando itens dos contratos</li>
            <li>Visualizar e editar pedidos existentes</li>
            <li>Acompanhar o status de entrega</li>
            <li>Gerar recibos de entrega com QR Code</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}