import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Plus,
  Edit,
  Users,
  Mail,
  Check,
  ChevronsUpDown,
  Home,
  X,
} from "lucide-react";
// ALTERAÇÃO: A interface User agora inclui as unidades educacionais vinculadas.
import {
  UnidadeEducacional,
  User,
  UserCategory,
  USER_CATEGORIES,
} from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface UserDialogProps {
  user?: User & {
    unidadesEducacionais?: UnidadeEducacional[];
    _count?: { unidadesEducacionais?: number };
  };
  onSuccess: () => void;
}

// ALTERAÇÃO: O componente UserDialog foi extensivamente modificado para gerenciar a vinculação de unidades.
function UserDialog({ user, onSuccess }: UserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // NOVO: Estado para armazenar todas as unidades educacionais disponíveis para seleção.
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState<
    UnidadeEducacional[]
  >([]);
  const [fullUserData, setFullUserData] =
    useState<UserDialogProps["user"]>(null);

  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    senha: "",
    categoria: user?.categoria || ("comissao_recebimento" as UserCategory),
    ativo: user?.ativo ?? true,
    // NOVO: Campo para armazenar os IDs das unidades selecionadas.
    unidadeIds: user?.unidadesEducacionais?.map((unidade) => unidade.id) || [],
  });
  const { toast } = useToast();

  const isEdicao = !!user;

  // ALTERAÇÃO: O useEffect agora busca os dados completos do usuário ao abrir para edição.
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      // Carrega a lista de todas as unidades para o seletor.
      try {
        const data = await apiService.getUnidadesAtivas();
        setUnidadesDisponiveis(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar unidades",
          description: error.message,
          variant: "destructive",
        });
      }

      if (isEdicao && user?.id) {
        // Se for edição, busca os dados completos do usuário.
        try {
          setLoading(true);
          const dataCompleta = await apiService.getUsuario(user.id);
          setFullUserData(dataCompleta); // Guarda os dados completos no novo estado.
          // Popula o formulário com os dados completos.
          setFormData({
            nome: dataCompleta.nome || "",
            email: dataCompleta.email || "",
            senha: "",
            categoria: dataCompleta.categoria || "comissao_recebimento",
            ativo: dataCompleta.ativo ?? true,
            unidadeIds:
              dataCompleta.unidadesEducacionais?.map(
                (u: UnidadeEducacional) => u.id
              ) || [],
          });
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do usuário.",
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Se for criação, apenas reseta o formulário.
        setFormData({
          nome: "",
          email: "",
          senha: "",
          categoria: "comissao_recebimento",
          ativo: true,
          unidadeIds: [],
        });
      }
    };

    if (open) {
      carregarDadosIniciais();
    }
  }, [open, user, toast, isEdicao]);

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
      // 1. Usamos desestruturação para separar 'unidadeIds' do resto dos dados.
      // 'dadosParaApi' será um novo objeto sem a propriedade 'unidadeIds'.
      const { unidadeIds, ...dadosParaApi } = formData;

      // 2. A lógica para remover a senha (se vazia na edição) continua a mesma,
      // mas agora aplicada ao novo objeto 'dadosParaApi'.
      if (isEdicao && !dadosParaApi.senha) {
        delete dadosParaApi.senha;
      }

      let usuarioSalvo: User;
      if (isEdicao) {
        // 3. Enviamos para a API apenas o objeto 'dadosParaApi', que já está limpo.
        usuarioSalvo = await apiService.updateUsuario(user!.id, dadosParaApi);
      } else {
        usuarioSalvo = await apiService.createUsuario(dadosParaApi);
      }

      // ALTERAÇÃO: A lista de IDs iniciais agora vem do estado 'fullUserData', que contém os dados corretos.
      const idsIniciais =
        fullUserData?.unidadesEducacionais?.map((u) => u.id) || [];
      const idsFinais = unidadeIds;

      const idsParaAdicionar = idsFinais.filter(
        (id) => !idsIniciais.includes(id)
      );
      const idsParaRemover = idsIniciais.filter(
        (id) => !idsFinais.includes(id)
      );

      // Executa as operações de vinculação e desvinculação em paralelo.
      await Promise.all([
        ...idsParaAdicionar.map((unidadeId) =>
          apiService.linkUnidadeToUsuario(usuarioSalvo.id, unidadeId)
        ),
        ...idsParaRemover.map((unidadeId) =>
          apiService.unlinkUnidadeFromUsuario(usuarioSalvo.id, unidadeId)
        ),
      ]);

      toast({
        title: isEdicao ? "Usuário atualizado!" : "Usuário cadastrado!",
        description: `${formData.nome} foi ${
          isEdicao ? "atualizado" : "cadastrado"
        } com sucesso`,
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      let errorMessage = "Não foi possível salvar o usuário";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // NOVO: O seletor de unidades é renderizado condicionalmente.
  const mostrarSeletorUnidades = [
    "comissao_recebimento",
    "nutricionistas_externas",
  ].includes(formData.categoria);

  const unidadesSelecionadas = useMemo(
    () => unidadesDisponiveis.filter((u) => formData.unidadeIds.includes(u.id)),
    [formData.unidadeIds, unidadesDisponiveis]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isEdicao ? "outline" : "default"}
          size={isEdicao ? "sm" : "default"}
        >
          {isEdicao ? (
            <Edit className="h-3 w-3" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isEdicao ? "" : "Novo Usuário"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            {isEdicao ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao
              ? "Edite as informações do usuário e suas unidades vinculadas."
              : "Cadastre um novo usuário no sistema."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ... campos de nome, email, senha ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="usuario@sistema.gov.br"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="senha">
              {isEdicao
                ? "Nova Senha (deixe em branco para manter)"
                : "Senha *"}
            </Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) =>
                setFormData({ ...formData, senha: e.target.value })
              }
              placeholder={
                isEdicao ? "Digite apenas se quiser alterar" : "Digite a senha"
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria de Usuário *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value: UserCategory) =>
                  setFormData({ ...formData, categoria: value })
                }
              >
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
            {/* NOVO: Componente de seleção múltipla para unidades educacionais. */}
            {mostrarSeletorUnidades && (
              <div>
                <Label htmlFor="unidades">Unidades Vinculadas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {unidadesSelecionadas.length > 0
                          ? `${unidadesSelecionadas.length} unidade(s) selecionada(s)`
                          : "Selecione as unidades..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar unidade..." />
                      <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {unidadesDisponiveis.map((unidade) => (
                            <CommandItem
                              key={unidade.id}
                              value={unidade.nome}
                              onSelect={() => {
                                const isSelected = formData.unidadeIds.includes(
                                  unidade.id
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  unidadeIds: isSelected
                                    ? prev.unidadeIds.filter(
                                        (id) => id !== unidade.id
                                      )
                                    : [...prev.unidadeIds, unidade.id],
                                }));
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.unidadeIds.includes(unidade.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {unidade.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativo: checked })
              }
            />
            <Label htmlFor="ativo">Usuário ativo</Label>
          </div>

          {/* NOVO: Exibe as unidades selecionadas como badges. */}
          {mostrarSeletorUnidades && unidadesSelecionadas.length > 0 && (
            <div className="mt-2 p-2 border rounded-md">
              <Label className="text-sm font-medium">
                Unidades Selecionadas:
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {unidadesSelecionadas.map((unidade) => (
                  <Badge
                    key={unidade.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {unidade.nome}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          unidadeIds: prev.unidadeIds.filter(
                            (id) => id !== unidade.id
                          ),
                        }));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isEdicao ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ALTERAÇÃO: O componente principal agora lida com o tipo de usuário que inclui o _count.
export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState<
    (User & { _count?: { unidadesEducacionais?: number } })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsuarios(searchTerm);
      setUsuarios(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]); // Carrega apenas uma vez inicialmente

  const handleSearch = () => {
    loadUsuarios();
  };

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
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o usuário",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (categoria: UserCategory) => {
    const categoryInfo = USER_CATEGORIES[categoria];
    return <Badge variant="outline">{categoryInfo?.label || categoria}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Gerenciamento de Usuários
          </h2>
          <p className="text-muted-foreground">
            Gerencie os usuários e suas permissões no sistema
          </p>
        </div>
        <UserDialog onSuccess={handleSuccess} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            {loading
              ? "Carregando..."
              : `${usuarios.length} usuário(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Categoria</TableHead>
                {/* NOVO: Coluna para Unidades Vinculadas. */}
                <TableHead>Unidades Vinculadas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead className="w-[180px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
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
                    {/* NOVO: Célula que exibe a contagem de unidades. */}
                    <TableCell>
                      <div className="flex items-center">
                        <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                        {user._count?.unidadesEducacionais || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.ativo ? "default" : "secondary"}>
                        {user.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
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

      {/* ... Card de Informações sobre Categorias ... */}
    </div>
  );
}
