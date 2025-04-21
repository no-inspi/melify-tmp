'use client';

import * as React from 'react';
import { Plus, Check, ListTodo, CheckCheck, ChevronsUpDown } from 'lucide-react';

import { cn } from 'src/s/lib/utils.ts';
import { Button } from 'src/s/components/ui/button.tsx';
import { Popover, PopoverContent, PopoverTrigger } from 'src/s/components/ui/popover.tsx';
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';
import {
  Command,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
} from 'src/s/components/ui/command.tsx';

function hexToRgba(hex, alpha) {
  // Remove the '#' if present
  const hexValue = hex.replace('#', '');
  // eslint-disable-next-line
  const bigint = parseInt(hexValue, 16);
  // eslint-disable-next-line
  const r = (bigint >> 16) & 255;
  // eslint-disable-next-line
  const g = (bigint >> 8) & 255;
  // eslint-disable-next-line
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Combobox({ value, options, handleChange, tagMapping }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="rounded h-7 inline-flex justify-end">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="px-1 border-0 max-w-[110px] h-6 justify-between flex items-center overflow-hidden text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--secondary))]"
          style={{
            backgroundColor: tagMapping[value.toLocaleLowerCase()]?.bgcolor
              ? hexToRgba(tagMapping[value.toLocaleLowerCase()].bgcolor, 0.3) // Apply alpha
              : 'hsl(var(--primary))',
            color: tagMapping[value.toLocaleLowerCase()]?.bgcolor
              ? 'rgb(206, 233, 234)'
              : 'hsl(var(--primary-foreground))',
          }}
          onClick={(e) => e.stopPropagation()} // Optional to prevent propagation
        >
          <span className="truncate max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-xs">
            {value && value !== '' ? value.charAt(0).toUpperCase() + value.slice(1) : <Plus />}
          </span>
          <ChevronsUpDown className="ml-0 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded">
        <Command className="rounded">
          {/* <CommandInput placeholder="Search framework..." /> */}
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandSeparator />
            <CommandGroup heading="Your Categories">
              {options.map((framework) => (
                <CommandItem
                  key={framework}
                  value={framework}
                  onSelect={() => {
                    // handleChange(framework);
                    setOpen(false);
                  }}
                >
                  {/* eslint-disable-next-line */}
                  <div
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                    onClick={(e) => {
                      // Stop the click event from propagating
                      e.stopPropagation();
                    }}
                    className="flex justify-between items-center w-full"
                  >
                    <div className="inline-flex items-center">
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === framework ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {framework}
                    </div>
                    <div className="inline-flex justify-between items-center gap-1">
                      <TooltipProvider delayDuration={0}>
                        <TooltipShadcn>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                // Stop the click event from propagating
                                e.stopPropagation();
                                handleChange(framework, 'todo');
                                setOpen(false);
                              }}
                              className="flex items-center hover:bg-[hsl(var(--secondary))] rounded"
                            >
                              <ListTodo />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="z-[2147483647]" side="top" sideOffset={10}>
                            <p>To Do</p>
                          </TooltipContent>
                        </TooltipShadcn>
                        <TooltipShadcn>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                // Stop the click event from propagating
                                e.stopPropagation();
                                handleChange(framework, 'done');
                                setOpen(false);
                              }}
                              className="flex items-center hover:bg-[hsl(var(--secondary))] rounded"
                            >
                              <CheckCheck />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="z-[2147483647]" side="top" sideOffset={10}>
                            <p>Done</p>
                          </TooltipContent>
                        </TooltipShadcn>
                      </TooltipProvider>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
