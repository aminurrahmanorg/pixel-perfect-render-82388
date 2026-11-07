import { lazy, Suspense, useId, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const Calendar = lazy(() =>
  import("@/components/ui/calendar").then((module) => ({ default: module.Calendar })),
);

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  labelClassName?: string;
};

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export function DatePickerField({
  label,
  value,
  onChange,
  min,
  max,
  className,
  labelClassName,
}: DatePickerFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn("block", labelClassName)}>
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full justify-between rounded-md px-3 text-left font-normal sm:w-44",
              className,
            )}
          >
            <span>{selectedDate ? format(selectedDate, "MM/dd/yyyy") : "Select date"}</span>
            <CalendarIcon className="size-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto p-0">
          <Suspense fallback={<div aria-label="Loading calendar" className="h-[18.5rem] w-72" />}>
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate ?? new Date()}
              disabled={(date) => (!!minDate && date < minDate) || (!!maxDate && date > maxDate)}
              onSelect={(date) => {
                if (!date) return;
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }}
            />
          </Suspense>
        </PopoverContent>
      </Popover>
    </div>
  );
}
