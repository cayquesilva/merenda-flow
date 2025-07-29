import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText, TrendingUp } from "lucide-react";
import { RelatorioConsolidadoPedidos } from "@/components/relatorios/RelatorioConsolidadoPedidos";
import { RelatorioEntregas } from "@/components/relatorios/RelatorioEntregas";
import { RelatorioConformidade } from "@/components/relatorios/RelatorioConformidade";
import { RelatorioGastosFornecedor } from "@/components/relatorios/RelatorioGastosFornecedor";
import { RelatorioEstoque } from "@/components/relatorios/RelatorioEstoque";
import RelatorioMovimentacaoResponsavel from "@/components/relatorios/RelatorioMovimentacaoResponsavel";

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
      </div>

      <Tabs defaultValue="consolidado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consolidado">
            <BarChart3 className="mr-2 h-4 w-4" />
            Consolidado de Pedidos
          </TabsTrigger>
          <TabsTrigger value="entregas">
            <TrendingUp className="mr-2 h-4 w-4" />
            Relatório de Entregas
          </TabsTrigger>
          <TabsTrigger value="conformidade">
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatório de Conformidade
          </TabsTrigger>
          <TabsTrigger value="gastos">
            <FileText className="mr-2 h-4 w-4" />
            Gastos por Fornecedor
          </TabsTrigger>
          <TabsTrigger value="estoque">
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatório de Estoque
          </TabsTrigger>
          <TabsTrigger value="movimentacao">
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatório de Movimentação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consolidado">
          <RelatorioConsolidadoPedidos />
        </TabsContent>

        <TabsContent value="entregas">
          <RelatorioEntregas />
        </TabsContent>

        <TabsContent value="conformidade">
          <RelatorioConformidade />
        </TabsContent>

        <TabsContent value="gastos">
          <RelatorioGastosFornecedor />
        </TabsContent>

        <TabsContent value="estoque">
          <RelatorioEstoque />
        </TabsContent>

        <TabsContent value="movimentacao">
          <RelatorioMovimentacaoResponsavel />
        </TabsContent>
      </Tabs>
    </div>
  );
}