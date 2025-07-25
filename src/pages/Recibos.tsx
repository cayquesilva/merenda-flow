import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export default function Recibos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recibos de Entrega</h2>
          <p className="text-muted-foreground">
            Gerencie os recibos de entrega com QR Code
          </p>
        </div>
        <Button>
          <QrCode className="mr-2 h-4 w-4" />
          Gerar Recibo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta página está sendo desenvolvida e em breve terá todas as funcionalidades de gestão de recibos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Visualizar todos os recibos gerados</li>
            <li>Gerar novos recibos com QR Code</li>
            <li>Acompanhar status de confirmação</li>
            <li>Reimprimir recibos existentes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}