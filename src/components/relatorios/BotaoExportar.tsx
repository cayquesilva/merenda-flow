import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ArquivoCsv, baixarCsv } from "@/lib/csv";

export interface OpcaoCsv {
  rotulo: string;
  gerar: () => ArquivoCsv;
}

interface BotaoExportarProps {
  onPdf: () => void;
  gerandoPdf?: boolean;
  opcoesCsv: OpcaoCsv[];
}

// Botão único "Exportar" dos relatórios: abre um menu para escolher o formato (PDF ou CSV).
// Quando o relatório tem mais de uma tabela, há uma opção de CSV para cada uma.
export function BotaoExportar({ onPdf, gerandoPdf = false, opcoesCsv }: BotaoExportarProps) {
  const { toast } = useToast();

  const exportarCsv = (opcao: OpcaoCsv) => {
    const arquivo = opcao.gerar();
    if (arquivo.linhas.length === 0) {
      toast({ title: "Nada para exportar", description: "O relatório não tem linhas nesta tabela." });
      return;
    }
    baixarCsv(arquivo);
    toast({ title: "CSV gerado!", description: `${arquivo.linhas.length} linha(s) exportada(s).` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={gerandoPdf}>
          {gerandoPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {gerandoPdf ? "Gerando PDF…" : "Exportar"}
          {!gerandoPdf && <ChevronDown className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>Escolha o formato</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPdf}>
          <FileText className="mr-2 h-4 w-4" />
          PDF (documento)
        </DropdownMenuItem>
        {opcoesCsv.map((opcao) => (
          <DropdownMenuItem key={opcao.rotulo} onClick={() => exportarCsv(opcao)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {opcoesCsv.length === 1 ? "CSV (planilha)" : `CSV · ${opcao.rotulo}`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
