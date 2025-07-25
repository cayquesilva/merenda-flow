import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function Confirmacoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Confirmações de Recebimento</h2>
          <p className="text-muted-foreground">
            Acompanhe as confirmações de recebimento das entregas
          </p>
        </div>
        <Button>
          <CheckCircle className="mr-2 h-4 w-4" />
          Nova Confirmação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta página está sendo desenvolvida e em breve terá todas as funcionalidades de confirmação de recebimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Visualizar todas as confirmações pendentes</li>
            <li>Acompanhar entregas conformes e não conformes</li>
            <li>Gerar relatórios de conformidade</li>
            <li>Rastrear ajustes de saldo automáticos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}