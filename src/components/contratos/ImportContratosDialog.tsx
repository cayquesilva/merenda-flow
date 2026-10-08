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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, X } from "lucide-react";

interface ImportContratosDialogProps {
  onSuccess: () => void;
}

export function ImportContratosDialog({ onSuccess }: ImportContratosDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf" || file.name.endsWith(".pdf")
      );
      if (selectedFiles.length === 0) {
        toast({
          title: "Arquivo Inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        });
        return;
      }
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/contratos/importar-pdf`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Assumindo que usa token Bearer
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao importar os contratos.");
      }

      toast({
        title: "Sucesso!",
        description: "Os contratos foram importados e salvos no banco com sucesso.",
      });
      setOpen(false);
      setFiles([]);
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
        <Button variant="secondary">
          <Upload className="mr-2 h-4 w-4" />
          Importar PDFs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Contratos (PDF)</DialogTitle>
          <DialogDescription>
            Faça upload dos PDFs dos contratos para preencher automaticamente os dados do fornecedor, valores e itens.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-4 text-center">
              Arraste arquivos ou clique para selecionar
            </p>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Selecionar PDFs
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos selecionados:</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary/20 p-2 rounded-md"
                  >
                    <div className="flex items-center truncate max-w-[80%]">
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full mt-2"
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando... (Pode demorar)
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
