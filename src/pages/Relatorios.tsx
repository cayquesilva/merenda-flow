import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">
            Gere relatórios e análises do sistema
          </p>
        </div>
        <Button>
          <BarChart3 className="mr-2 h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta página está sendo desenvolvida e em breve terá todos os relatórios disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá gerar relatórios de:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Saldos de contratos por período</li>
            <li>Entregas realizadas por unidade educacional</li>
            <li>Conformidade das entregas</li>
            <li>Valor gasto por fornecedor</li>
            <li>Análise de consumo por item</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}