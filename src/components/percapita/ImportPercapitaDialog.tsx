// src/components/percapita/ImportPercapitaDialog.tsx

import { useState, useEffect } from "react";
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
import { Upload, Download, Loader2, FileCheck2, AlertCircle } from "lucide-react";
import { apiService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContratoDaLista {
    id: string;
    numero: string;
    fornecedor: { nome: string };
}

interface ImportPercapitaDialogProps {
  onSuccess: () => void;
}

export function ImportPercapitaDialog({ onSuccess }: ImportPercapitaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contratos, setContratos] = useState<ContratoDaLista[]>([]);
  const [selectedContratoId, setSelectedContratoId] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if(open) {
        apiService.getContratosAtivosLista()
            .then(setContratos)
            .catch(() => toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os contratos." }));
    }
  }, [open, toast]);

  const handleDownloadTemplate = () => {
    if (!selectedContratoId) {
      toast({ title: "Selecione um contrato", variant: "destructive" });
      return;
    }
    const downloadUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/percapita/template/${selectedContratoId}`;
    
    // Para forçar o download, criamos um link temporário
    const token = localStorage.getItem("token");
    fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `template-percapita-${selectedContratoId}.xlsx`;
       document.body.appendChild(a);
       a.click();
       a.remove();
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiService.importPercapitas(selectedFile);
      toast({ title: "Sucesso!", description: result.message });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro na Importação", description: error instanceof Error ? error.message : "Erro desconhecido.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Percápitas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Percápitas via Planilha</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para atualizar as percápitas em lote.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
            <div className="p-4 border rounded-md space-y-3">
                <h4 className="font-semibold">Passo 1: Baixar o Modelo</h4>
                <p className="text-sm text-muted-foreground">Selecione um contrato ativo para gerar uma planilha com todos os seus itens e as percápitas atuais.</p>
                <Select onValueChange={setSelectedContratoId} value={selectedContratoId ?? ""}>
                    <SelectTrigger><SelectValue placeholder="Selecione o contrato..." /></SelectTrigger>
                    <SelectContent>
                        {contratos.map(c => <SelectItem key={c.id} value={c.id}>{c.numero} - {c.fornecedor.nome}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Button variant="secondary" className="w-full" onClick={handleDownloadTemplate} disabled={!selectedContratoId}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Planilha Modelo
                 </Button>
            </div>
            
            <div className="p-4 border rounded-md space-y-3">
                <h4 className="font-semibold">Passo 2: Importar a Planilha Preenchida</h4>
                <p className="text-sm text-muted-foreground">Após preencher as colunas de gramagem e frequência, salve o arquivo e faça o upload aqui.</p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                  disabled={isSubmitting}
                />
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || isSubmitting}>
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