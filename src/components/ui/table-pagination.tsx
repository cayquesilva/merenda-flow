import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = "registros",
}: TablePaginationProps) {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (safePage > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < totalPages - 2) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          Mostrando{" "}
          <strong className="text-foreground">
            {startItem.toLocaleString("pt-BR")}
          </strong>{" "}
          a{" "}
          <strong className="text-foreground">
            {endItem.toLocaleString("pt-BR")}
          </strong>{" "}
          de{" "}
          <strong className="text-foreground">
            {totalItems.toLocaleString("pt-BR")}
          </strong>{" "}
          {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Por página:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-8 w-[72px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hidden sm:inline-flex"
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
          title="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <div className="hidden md:flex items-center gap-1 mx-1">
          {getVisiblePages().map((p, idx) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-xs text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === safePage ? "default" : "outline"}
                size="sm"
                className="h-8 min-w-[32px] px-2 text-xs"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <span className="md:hidden text-xs text-muted-foreground px-2">
          Pág. {safePage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hidden sm:inline-flex"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

