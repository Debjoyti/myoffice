import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function IFSCInput({ value, onChange, onBankFound, className, ...props }) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    setInternalValue(val);
    setIsValid(false);
    if (onChange) onChange(val);
  };

  useEffect(() => {
    if (internalValue.length === 11) {
      setLoading(true);
      // Simulate API call to Razorpay IFSC API
      setTimeout(() => {
        setLoading(false);
        setIsValid(true);
        if (onBankFound) {
          onBankFound({ bank: 'HDFC Bank', branch: 'Pune Main' });
        }
      }, 600);
    }
  }, [internalValue, onBankFound]);

  return (
    <div className="relative">
      <Input
        {...props}
        value={internalValue}
        onChange={handleChange}
        placeholder="HDFC0000001"
        className={cn("font-mono uppercase", className)}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
        {!loading && isValid && <CheckCircle2 className="w-4 h-4 text-success" />}
      </div>
    </div>
  );
}
