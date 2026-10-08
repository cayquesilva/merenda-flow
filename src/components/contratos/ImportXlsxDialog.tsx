import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Table } from "lucide-react";

interface ImportXlsxDialogProps {
  onSuccess: () => void;
}

export function ImportXlsxDialog({ onSuccess }: ImportXlsxDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".csv")
      ) {
        toast({
          title: "Arquivo Inválido",
          description: "Selecione um arquivo .xlsx ou .csv.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/contratos/importar-dados`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Erro ao importar a planilha.";
        try {
          const data = await response.json();
          if (data.error) errorMsg = data.error;
        } catch (e) {
          errorMsg = `Erro no servidor (Status: ${response.status}).`;
        }
        throw new Error(errorMsg);
      }

      toast({
        title: "Sucesso!",
        description: "Os dados da planilha foram salvos com sucesso.",
      });
      setOpen(false);
      setFile(null);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro na Importação",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Contratos (XLSX/CSV)</DialogTitle>
          <DialogDescription>
            Faça upload da planilha exportada pelo sistema (ou formatada corretamente) para popular o banco de dados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <Table className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-4 text-center">
              {file ? file.name : "Clique para selecionar a planilha"}
            </p>
            <Input
              id="file-upload-xlsx"
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {file ? "Trocar Arquivo" : "Selecionar Arquivo"}
            </Button>
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Importar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
