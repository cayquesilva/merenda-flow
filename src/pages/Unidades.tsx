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
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Phone,
  Mail,
  MapPin,
  Building2
} from "lucide-react";
import { unidadesEducacionais } from "@/data/mockData";

export default function Unidades() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUnidades = unidadesEducacionais.filter(unidade =>
    unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Unidades Educacionais</h2>
          <p className="text-muted-foreground">
            Gerencie as unidades educacionais do sistema
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
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
              placeholder="Buscar por nome, código ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Unidades */}
      <Card>
        <CardHeader>
          <CardTitle>Unidades Cadastradas</CardTitle>
          <CardDescription>
            {filteredUnidades.length} unidade(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnidades.map((unidade) => (
                <TableRow key={unidade.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      {unidade.nome}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {unidade.codigo}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-1 h-3 w-3" />
                        {unidade.telefone}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="mr-1 h-3 w-3" />
                        {unidade.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-1 h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {unidade.endereco}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={unidade.ativo ? "default" : "secondary"}>
                      {unidade.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
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