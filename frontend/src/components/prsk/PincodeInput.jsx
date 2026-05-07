import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PincodeInput({ value, onChange, onLocationFound, className, ...props }) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    setInternalValue(val);
    if (onChange) onChange(val);
  };

  useEffect(() => {
    if (internalValue.length === 6) {
      setLoading(true);
      // Simulate API call to postalpincode.in
      setTimeout(() => {
        setLoading(false);
        if (onLocationFound) {
          // Fake mock response based on pincode for demo
          onLocationFound({ city: 'Pune', state: 'Maharashtra' });
        }
      }, 600);
    }
  }, [internalValue, onLocationFound]);

  return (
    <div className="relative">
      <Input
        {...props}
        value={internalValue}
        onChange={handleChange}
        placeholder="411001"
        className={cn("font-mono", className)}
        inputMode="numeric"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
        </div>
      )}
    </div>
  );
}
