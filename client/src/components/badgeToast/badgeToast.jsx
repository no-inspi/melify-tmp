// components/CustomToast.js
import './style.css';

import React from 'react';

import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';

import { Iconify } from 'src/components/iconify';

export function BadgeToast({ icon, title, withRibbon, gradient }) {
  function darkenColor(hex, amount) {
    // Remove the '#' if it's there
    hex = hex.replace('#', '');

    // Parse the red, green, and blue components
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) - amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) - amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) - amount));

    // Convert back to hex and return
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  function generateGradient(baseHex) {
    const darkerHex = darkenColor(baseHex, 20); // Darken the color by 20 units
    return `linear-gradient(90deg, ${baseHex} 0%, ${darkerHex} 100%)`;
  }

  return (
    <div>
      <TooltipProvider delayDuration={0}>
        <TooltipShadcn>
          <TooltipTrigger asChild>
            <div
              className="hexagon"
              style={{
                background: gradient ? generateGradient(gradient) : 'black',
              }}
            >
              <div className="circle">
                <Iconify className="iconify" style={{ color: gradient }} icon={icon} width={25} />
              </div>
              {withRibbon && <div className="ribbon">{title}</div>}
            </div>
          </TooltipTrigger>
          <TooltipContent className="z-[2147483647] rounded bg-[hsl(var(--background))] text-foreground">
            <p>{title}</p>
          </TooltipContent>
        </TooltipShadcn>
      </TooltipProvider>
    </div>
  );
}
