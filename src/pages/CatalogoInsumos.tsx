// src/pages/almoxarifado/CatalogoInsumos.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, BookOpen } from "lucide-react";
// Importaremos o InsumoDialog que criaremos a seguir
// import { InsumoDialog } from "@/components/almoxarifado/InsumoDialog";

export default function CatalogoInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica para buscar os insumos do catálogo virá aqui
  useEffect(() => { setIsLoading(false); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Catálogo de Insumos</h2>
          <p className="text-muted-foreground">Gerencie a lista mestre de todos os insumos.</p>
        </div>
        {/* <InsumoDialog onSuccess={() => {}} /> */}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Insumos Cadastrados</CardTitle>
          <CardDescription>{insumos.length} insumo(s) no catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Catálogo em construção</h3>
                <p className="text-muted-foreground">A tabela de insumos aparecerá aqui.</p>
            </div>
            {/* A tabela de insumos virá aqui */}
        </CardContent>
      </Card>
    </div>
  );
}