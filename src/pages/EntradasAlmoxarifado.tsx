import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NovaEntradaDialog } from "@/components/almoxarifado/NovaEntradaDialog";
import { Box } from "lucide-react";

export default function EntradasAlmoxarifado() {
    // A lógica para buscar e listar as entradas virá aqui no futuro
    const [entradas, setEntradas] = useState([]); 
    const handleSuccess = () => {
        // Lógica para recarregar a lista de entradas
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">
                        Entradas no Almoxarifado
                    </h2>
                    <p className="text-muted-foreground">
                        Registre e consulte as notas fiscais de insumos recebidos.
                    </p>
                </div>
                <NovaEntradaDialog onSuccess={handleSuccess} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Entradas Registradas</CardTitle>
                    <CardDescription>{entradas.length} registro(s) encontrado(s).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Nenhuma entrada encontrada</h3>
                        <p className="text-muted-foreground">Clique em "Registrar Entrada" para começar.</p>
                    </div>
                    {/* A tabela com a lista de entradas virá aqui */}
                </CardContent>
            </Card>
        </div>
    );
}