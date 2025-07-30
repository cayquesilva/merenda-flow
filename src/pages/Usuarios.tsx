import { useState, useEffect } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Plus, 
  Edit, 
  Users,
  Mail,
  Shield
} from "lucide-react";
import { User, UserCategory, USER_CATEGORIES } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";


interface UserDialogProps {
  user?: User;
  onSuccess: () => void;
}

function UserDialog({ user, onSuccess }: UserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    senha: "",
    categoria: user?.categoria || "comissao_recebimento" as UserCategory,
    ativo: user?.ativo ?? true
  });
  const { toast } = useToast();

  const isEdicao = !!user;

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!isEdicao && !formData.senha.trim()) {
      toast({
        title: "Erro",
        description: "A senha é obrigatória para novos usuários",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dadosEnvio = { ...formData };
      if (isEdicao && !dadosEnvio.senha) {
        delete dadosEnvio.senha;
      }

      if (isEdicao) {
        await apiService.updateUsuario(user!.id, dadosEnvio);
      } else {
        await apiService.createUsuario(dadosEnvio);
      }

      toast({
        title: isEdicao ? "Usuário atualizado!" : "Usuário cadastrado!",
        description: `${formData.nome} foi ${isEdicao ? 'atualizado' : 'cadastrado'} com sucesso`,
      });

      setOpen(false);
      if (!isEdicao) {
        setFormData({
          nome: "",
          email: "",
          senha: "",
          categoria: "comissao_recebimento",
          ativo: true
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdicao ? "outline" : "default"} size={isEdicao ? "sm" : "default"}>
          {isEdicao ? <Edit className="h-3 w-3" /> : <Plus className="mr-2 h-4 w-4" />}
          {isEdicao ? "" : "Novo Usuário"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite as informações do usuário" : "Cadastre um novo usuário no sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="usuario@sistema.gov.br"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="senha">{isEdicao ? "Nova Senha (deixe em branco para manter)" : "Senha *"}</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              placeholder={isEdicao ? "Digite apenas se quiser alterar" : "Digite a senha"}
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria de Usuário *</Label>
            <Select value={formData.categoria} onValueChange={(value: UserCategory) => setFormData({...formData, categoria: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
            />
            <Label htmlFor="ativo">Usuário ativo</Label>
          </div>

          {/* Mostrar permissões da categoria selecionada */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Permissões da Categoria:</h4>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{USER_CATEGORIES[formData.categoria].label}</p>
              <div className="mt-2 space-y-1">
                {Object.entries(USER_CATEGORIES[formData.categoria].permissions).map(([module, permission]) => (
                  <div key={module} className="flex justify-between">
                    <span className="capitalize">{module.replace('_', ' ')}</span>
                    <span className="text-xs">{permission.actions.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : (isEdicao ? "Atualizar" : "Cadastrar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsuarios(searchTerm);
      setUsuarios(data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, [searchTerm]);

  const handleSuccess = () => {
    loadUsuarios();
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${nome}?`)) {
      return;
    }

    try {
      await apiService.deleteUsuario(id);
      toast({
        title: "Usuário deletado!",
        description: `${nome} foi removido com sucesso`,
      });
      loadUsuarios();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o usuário",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (categoria: UserCategory) => {
    const categoryInfo = USER_CATEGORIES[categoria];
    return (
      <Badge variant="outline">
        {categoryInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários e suas permissões no sistema
          </p>
        </div>
        <UserDialog onSuccess={handleSuccess} />
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
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            {loading ? "Carregando..." : `${usuarios.length} usuário(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {user.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(user.categoria)}</TableCell>
                    <TableCell>
                      <Badge variant={user.ativo ? "default" : "secondary"}>
                        {user.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserDialog user={user} onSuccess={handleSuccess} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.nome)}
                          className="text-destructive hover:text-destructive"
                        >
                          Deletar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Informações sobre Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Categorias de Usuário
          </CardTitle>
          <CardDescription>
            Entenda as permissões de cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(USER_CATEGORIES).map(([key, category]) => (
              <Card key={key} className="p-4">
                <h4 className="font-medium mb-2">{category.label}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {Object.entries(category.permissions).map(([module, permission]) => (
                    <div key={module} className="flex justify-between">
                      <span className="capitalize">{module.replace('_', ' ')}</span>
                      <span className="text-xs">{permission.actions.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}