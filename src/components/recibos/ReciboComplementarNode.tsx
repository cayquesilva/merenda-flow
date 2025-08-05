import { Recibo as BaseRecibo } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CornerDownRight } from "lucide-react";

interface ReciboComplementarNodeProps {
  recibo: BaseRecibo;
  familiaCompleta: BaseRecibo[];
  onReciboClick: (reciboId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function ReciboComplementarNode({
  recibo,
  familiaCompleta,
  onReciboClick,
  getStatusBadge,
}: ReciboComplementarNodeProps) {
  // Encontra os filhos diretos deste nó na família completa
  const children = familiaCompleta.filter(
    (r) => r.reciboOriginalId === recibo.id
  );

  return (
    <div className="ml-4 pl-4 border-l">
      {/* Informações do nó atual */}
      <div className="flex justify-between items-center text-sm py-2">
        <div className="flex items-center gap-2">
          <CornerDownRight className="h-4 w-4 text-muted-foreground" />
          <span>Recibo Complementar</span>
          <Button
            variant="link"
            className="h-auto p-0 font-mono"
            onClick={() => onReciboClick(recibo.id)}
          >
            #{recibo.numero}
          </Button>
        </div>
        {getStatusBadge(recibo.status)}
      </div>

      {/* Renderização recursiva para cada filho */}
      {children.map((child) => (
        <ReciboComplementarNode
          key={child.id}
          recibo={child}
          familiaCompleta={familiaCompleta}
          onReciboClick={onReciboClick}
          getStatusBadge={getStatusBadge}
        />
      ))}
    </div>
  );
}
