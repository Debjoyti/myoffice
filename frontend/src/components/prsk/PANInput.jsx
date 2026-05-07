import React, { useState } from 'react';
import { Input } from '../ui/input';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PANInput({ value, onChange, className, ...props }) {
  const [internalValue, setInternalValue] = useState(value || '');

  const handleChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    setInternalValue(val);
    if (onChange) onChange(val);
  };

  const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(internalValue);

  return (
    <div className="relative">
      <Input
        {...props}
        value={internalValue}
        onChange={handleChange}
        placeholder="ABCDE1234F"
        className={cn("font-mono uppercase", className, {
          "border-success focus-visible:ring-success": internalValue.length === 10 && isValidFormat,
          "border-danger focus-visible:ring-danger": internalValue.length === 10 && !isValidFormat,
        })}
      />
      {internalValue.length === 10 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidFormat ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-danger" />
          )}
        </div>
      )}
    </div>
  );
}
