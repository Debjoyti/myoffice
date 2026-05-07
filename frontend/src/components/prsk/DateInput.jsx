import React from 'react';
import { Input } from '../ui/input';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function DateInput({ date, setDate }) {
  const getHint = (d) => {
    if (!d) return "Select date";
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-text-muted" />
            <span className={date ? "text-text" : "text-text-muted"}>
              {date ? format(date, 'dd/MM/yyyy') : "DD/MM/YYYY"}
            </span>
          </div>
          {date && (
            <span className="text-xs text-text-subtle">
              {getHint(date)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
