// src/components/unidades/UnidadeDetailDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Phone,
  Mail,
  MapPin,
  Hash,
  School,
  Baby,
  Users,
  GraduationCap,
} from "lucide-react";
import { formatTelefone } from "@/lib/utils";

// Usando a mesma interface da página principal
interface UnidadeEducacional {
  id: string;
  nome: string;
  codigo: string;
  endereco: string | null;
  telefone: string | null;
  email: string;
  ativo: boolean;
  estudantesBercario: number;
  estudantesMaternal: number;
  estudantesPreEscola: number;
  estudantesRegular: number;
  estudantesIntegral: number;
  estudantesEja: number;
}

interface UnidadeDetailDialogProps {
  unidade: UnidadeEducacional;
}

// Componente para exibir um campo de detalhe com ícone e valor
const DetailField = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null;
}) => (
  <div>
    <Label className="text-muted-foreground">{label}</Label>
    <div className="flex items-center mt-1 text-sm">
      <Icon className="h-4 w-4 mr-2 text-primary" />
      <span>{value || "Não informado"}</span>
    </div>
  </div>
);

export function UnidadeDetailDialog({ unidade }: UnidadeDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <School className="h-6 w-6 mr-2" />
            Detalhes da Unidade Educacional
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a unidade {unidade.nome}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seção de Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Nome da Unidade</Label>
              <p className="font-semibold text-lg">{unidade.nome}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div>
                <Badge variant={unidade.ativo ? "default" : "secondary"}>
                  {unidade.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Seção de Contato e Localização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Hash}
              label="Código da Unidade"
              value={unidade.codigo}
            />
            <DetailField
              icon={Phone}
              label="Telefone"
              value={formatTelefone(unidade.telefone)}
            />
            <DetailField icon={Mail} label="Email" value={unidade.email} />
            <DetailField
              icon={MapPin}
              label="Endereço"
              value={unidade.endereco}
            />
          </div>

          {/* Seção de Alunos Matriculados */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Alunos Matriculados
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/50">
              <DetailField
                icon={Baby}
                label="Berçário"
                value={unidade.estudantesBercario}
              />
              <DetailField
                icon={Baby}
                label="Maternal"
                value={unidade.estudantesMaternal}
              />
              <DetailField
                icon={Baby}
                label="Pré-Escola"
                value={unidade.estudantesPreEscola}
              />
              <DetailField
                icon={Users}
                label="Turmas Parciais"
                value={unidade.estudantesRegular}
              />
              <DetailField
                icon={Users}
                label="Turmas Integrais"
                value={unidade.estudantesIntegral}
              />
              <DetailField
                icon={GraduationCap}
                label="EJA"
                value={unidade.estudantesEja}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
            <DialogTrigger asChild>
                <Button variant="outline">Fechar</Button>
            </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}