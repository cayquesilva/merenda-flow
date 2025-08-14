import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Loader2,
  FileCheck2,
  AlertCircle,
  Download,
} from "lucide-react";

interface ImportDialogProps {
  onSuccess: () => void;
}

export function ImportDialog({ onSuccess }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<
    { row: number; messages: string[] }[]
  >([]);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      setImportErrors([]); // Limpa erros anteriores ao selecionar um novo arquivo
    }
  };

  const handleDownloadTemplate = () => {
    // A URL aponta para um arquivo que você deve adicionar à sua pasta `public`
    const link = document.createElement("a");
    link.href = "/template_unidades.xlsx";
    link.setAttribute("download", "template_unidades.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, escolha um arquivo de planilha (.xlsx, .csv).",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token"); 
    
    if (!token) {
        toast({
            title: "Erro de Autenticação",
            description: "Seu token de usuário não foi encontrado. Por favor, faça login novamente.",
            variant: "destructive",
        });
        return;
    }


    setIsSubmitting(true);
    setImportErrors([]);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/unidades/importar`,
        {
          method: "POST",
          // Adicione o token de autenticação se necessário
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setImportErrors(result.details);
        }
        throw new Error(result.error || "Falha ao importar planilha.");
      }

      toast({
        title: "Sucesso!",
        description: result.message,
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast({
        title: "Erro na Importação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Unidades Educacionais</DialogTitle>
          <DialogDescription>
            Siga as instruções abaixo para garantir uma importação bem-sucedida.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* SEÇÃO DE INSTRUÇÕES ATUALIZADA */}
          <div className="p-4 border rounded-md bg-muted/50 text-sm">
            <h4 className="font-semibold mb-2">Estrutura da Planilha</h4>
            <p className="text-muted-foreground mb-3">
              O arquivo deve ser no formato .xlsx e a primeira linha deve conter
              os cabeçalhos exatamente como listado abaixo (em minúsculas).
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Obrigatórios:</strong> <code>nome</code>,{" "}
                <code>codigo</code>, <code>email</code>.
              </li>
              <li>
                <strong>Opcionais:</strong> <code>telefone</code>,{" "}
                <code>endereco</code>, <code>ativo</code> (use 'Sim' ou 'Não'),{" "}
                <code>estudantesBercario</code>, <code>estudantesMaternal</code>
                , <code>estudantesPreEscola</code>,{" "}
                <code>estudantesRegular</code>, <code>estudantesIntegral</code>,{" "}
                <code>estudantesEja</code>.
              </li>
            </ul>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Planilha Modelo
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="file-upload" className="font-semibold">
              Arquivo da Planilha
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx, .csv"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          {importErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md max-h-40 overflow-y-auto">
              <h4 className="font-semibold text-destructive flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" /> Erros na Planilha
              </h4>
              <ul className="list-disc pl-5 mt-2 text-sm text-destructive">
                {importErrors.map((err, index) => (
                  <li key={index}>
                    <strong>Linha {err.row}:</strong> {err.messages.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
