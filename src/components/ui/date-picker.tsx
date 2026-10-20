import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ISO = "yyyy-MM-dd";

const toDate = (value?: string) => {
  if (!value) return undefined;
  const date = parse(value, ISO, new Date());
  return isValid(date) ? date : undefined;
};

interface DatePickerProps {
  id?: string;
  // Valor no formato yyyy-MM-dd (o mesmo de <input type="date">).
  value?: string;
  onChange: (value: string) => void;
  // Limites no formato yyyy-MM-dd.
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Seletor de data com calendário em português, no lugar do <input type="date"> nativo.
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = "Selecione a data",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);
  const thisYear = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start px-3 text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected ?? minDate}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, ISO));
              setOpen(false);
            }
          }}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          captionLayout="dropdown-buttons"
          fromYear={thisYear - 10}
          toYear={thisYear + 10}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
