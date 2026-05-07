import React from 'react';
import { cn } from '../../lib/utils';

export function MoneyDisplay({ amount, format = 'standard', className }) {
  if (amount === undefined || amount === null) return null;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatIndianNumber = (num) => {
    let numStr = num.toFixed(2);
    const parts = numStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    if (integerPart.length > 3) {
      const lastThree = integerPart.substring(integerPart.length - 3);
      const otherNumbers = integerPart.substring(0, integerPart.length - 3);
      integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }

    // Don't show decimal if it's .00 to reduce noise, unless explicitly needed
    return decimalPart === '00' ? integerPart : `${integerPart}.${decimalPart}`;
  };

  const getLakhCroreDisplay = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return formatIndianNumber(num);
  };

  const displayValue = format === 'short' ? getLakhCroreDisplay(numAmount) : formatIndianNumber(numAmount);

  return (
    <span className={cn("font-mono font-medium tracking-tight whitespace-nowrap", className)}>
      <span className="text-text-muted mr-0.5 font-sans">₹</span>
      {displayValue}
    </span>
  );
}
