import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Calendar,
  DollarSign,
  Package,
  AlertTriangle
} from "lucide-react";
import { contratos } from "@/data/mockData";
import { ContratoDialog } from "@/components/contratos/ContratoDialog";
import { Contrato } from "@/types";

export default function Contratos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredContratos = contratos.filter(contrato =>
    contrato.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSaldoPercentual = (saldoAtual: number, quantidadeOriginal: number) => {
    return (saldoAtual / quantidadeOriginal) * 100;
  };

  const getSaldoStatus = (percentual: number) => {
    if (percentual < 20) return 'baixo';
    if (percentual < 50) return 'medio';
    return 'alto';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contratos</h2>
          <p className="text-muted-foreground">
            Gerencie os contratos de fornecimento de merenda
          </p>
        </div>
        <ContratoDialog onSuccess={handleSuccess} />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do contrato ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contratos */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos Cadastrados</CardTitle>
          <CardDescription>
            {filteredContratos.length} contrato(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContratos.map((contrato) => (
                <TableRow key={contrato.id}>
                  <TableCell className="font-medium">
                    {contrato.numero}
                  </TableCell>
                  <TableCell>{contrato.fornecedor.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')} - {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <DollarSign className="mr-1 h-3 w-3" />
                      R$ {contrato.valorTotal.toLocaleString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Package className="mr-1 h-3 w-3" />
                      {contrato.itens.length} itens
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedContrato(contrato)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Contrato</DialogTitle>
                            <DialogDescription>
                              Informações detalhadas e saldos do contrato
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedContrato && (
                            <div className="space-y-6">
                              {/* Informações Gerais */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Informações Gerais</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Número:</strong> {selectedContrato.numero}</p>
                                    <p><strong>Fornecedor:</strong> {selectedContrato.fornecedor.nome}</p>
                                    <p><strong>CNPJ:</strong> {selectedContrato.fornecedor.cnpj}</p>
                                    <p><strong>Status:</strong> {getStatusBadge(selectedContrato.status)}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Valores e Prazos</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Valor Total:</strong> R$ {selectedContrato.valorTotal.toLocaleString('pt-BR')}</p>
                                    <p><strong>Data Início:</strong> {new Date(selectedContrato.dataInicio).toLocaleDateString('pt-BR')}</p>
                                    <p><strong>Data Fim:</strong> {new Date(selectedContrato.dataFim).toLocaleDateString('pt-BR')}</p>
                                    <p><strong>Criado em:</strong> {new Date(selectedContrato.createdAt).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Itens do Contrato */}
                              <div>
                                <h4 className="font-semibold mb-3">Itens do Contrato</h4>
                                <div className="space-y-3">
                                  {selectedContrato.itens.map((item) => {
                                    const percentual = getSaldoPercentual(item.saldoAtual, item.quantidadeOriginal);
                                    const status = getSaldoStatus(percentual);
                                    
                                    return (
                                      <Card key={item.id} className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                          <div>
                                            <h5 className="font-medium">{item.nome}</h5>
                                            <p className="text-sm text-muted-foreground">
                                              Valor unitário: R$ {item.valorUnitario.toFixed(2)} / {item.unidadeMedida.sigla}
                                            </p>
                                          </div>
                                          {status === 'baixo' && (
                                            <AlertTriangle className="h-4 w-4 text-warning" />
                                          )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-sm">
                                            <span>Saldo atual</span>
                                            <span className={status === 'baixo' ? 'text-warning font-medium' : ''}>
                                              {item.saldoAtual} / {item.quantidadeOriginal} {item.unidadeMedida.sigla}
                                            </span>
                                          </div>
                                          <Progress 
                                            value={percentual} 
                                            className={`h-2 ${status === 'baixo' ? 'text-warning' : ''}`}
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            {percentual.toFixed(1)}% do saldo original
                                          </p>
                                        </div>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <ContratoDialog contrato={contrato} onSuccess={handleSuccess} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}