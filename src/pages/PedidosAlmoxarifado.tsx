import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShoppingCart } from "lucide-react";
import { apiService } from "@/services/api";
import { NovoPedidoAlmoxarifadoDialog } from "@/components/almoxarifado/NovoPedidoAlmoxarifadoDialog";

export interface PedidoAlmoxarifado {
    id: string;
    numero: string;
    dataPedido: string;
    status: string;
    valorTotal: number;
    contrato: { fornecedor: { nome: string } };
    _count: { itens: number };
}

export default function PedidosAlmoxarifado() {
    const [pedidos, setPedidos] = useState<PedidoAlmoxarifado[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        // Por enquanto, buscamos todos os pedidos sem filtros
        apiService.getPedidosAlmoxarifado("", "todos")
            .then(setPedidos)
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, [refreshKey]);
    
    const handleSuccess = () => setRefreshKey(prev => prev + 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Pedidos de Almoxarifado</h2>
                    <p className="text-muted-foreground">Gerencie os pedidos de insumos para as unidades.</p>
                </div>
                <NovoPedidoAlmoxarifadoDialog onSuccess={handleSuccess} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pedidos Realizados</CardTitle>
                    <CardDescription>{pedidos.length} pedido(s) encontrado(s).</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? <div className="text-center py-8"><Loader2 className="h-12 w-12 mx-auto animate-spin" /></div> :
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Itens</TableHead>
                                    <TableHead>Valor Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pedidos.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono">{p.numero}</TableCell>
                                        <TableCell>{p.contrato.fornecedor.nome}</TableCell>
                                        <TableCell>{new Date(p.dataPedido).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{p._count.itens}</TableCell>
                                        <TableCell>R$ {p.valorTotal.toFixed(2)}</TableCell>
                                        <TableCell>{p.status}</TableCell>
                                        <TableCell>{/* Botões de Ação (Ver, etc) */}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    }
                </CardContent>
            </Card>
        </div>
    )
}