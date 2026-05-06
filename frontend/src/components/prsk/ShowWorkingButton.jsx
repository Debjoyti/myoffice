import React from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MoneyDisplay } from './MoneyDisplay';

export function ShowWorkingButton({ title = "Calculation Breakdown", formula, lineItems = [], source }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center w-5 h-5 ml-1 rounded-full text-text-subtle hover:text-text hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand">
          <Info className="w-3.5 h-3.5" />
          <span className="sr-only">Show working</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 text-sm" align="start">
        <h4 className="font-semibold mb-3 text-text">{title}</h4>

        {formula && (
          <div className="mb-4 bg-surface-2 p-2 rounded-md font-mono text-xs text-text-muted">
            {formula}
          </div>
        )}

        {lineItems.length > 0 && (
          <div className="space-y-2 mb-4">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-text-muted">{item.label}</span>
                <span className={item.operator === '-' ? "text-danger" : "text-text"}>
                  {item.operator === '-' && "-"}
                  {typeof item.value === 'number' ? <MoneyDisplay amount={item.value} /> : item.value}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2 flex justify-between items-center font-medium">
              <span>Total</span>
              <MoneyDisplay amount={lineItems.reduce((acc, curr) => {
                const val = typeof curr.value === 'number' ? curr.value : 0;
                return curr.operator === '-' ? acc - val : acc + val;
              }, 0)} />
            </div>
          </div>
        )}

        {source && (
          <div className="mt-4 pt-3 border-t border-border text-[10px] text-text-subtle flex justify-between">
            <span>Source:</span>
            <span className="font-medium">{source}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
