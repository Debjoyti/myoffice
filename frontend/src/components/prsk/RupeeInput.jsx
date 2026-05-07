import React, { useState } from 'react';
import { Input } from '../ui/input';

export function RupeeInput({ value, onChange, placeholder = "0", ...props }) {
  const [displayValue, setDisplayValue] = useState(formatIndianNumber(value));

  function formatIndianNumber(numStr) {
    if (!numStr) return '';
    const cleanNum = numStr.toString().replace(/[^0-9.]/g, '');
    if (!cleanNum) return '';

    const parts = cleanNum.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';

    if (integerPart.length > 3) {
      const lastThree = integerPart.substring(integerPart.length - 3);
      const otherNumbers = integerPart.substring(0, integerPart.length - 3);
      integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }

    return integerPart + decimalPart;
  }

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    setDisplayValue(formatIndianNumber(rawValue));
    if (onChange) {
      onChange(rawValue);
    }
  };

  const getHint = () => {
    const num = parseFloat(displayValue.replace(/,/g, ''));
    if (isNaN(num)) return null;
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Crore`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
    return null;
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-text-muted select-none">₹</span>
        <Input
          {...props}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-7 font-mono"
          inputMode="decimal"
        />
      </div>
      {getHint() && (
        <div className="absolute -bottom-5 right-0 text-xs text-text-subtle">
          {getHint()}
        </div>
      )}
    </div>
  );
}
