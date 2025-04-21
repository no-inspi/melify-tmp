import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha as hexAlpha } from '@mui/material/styles';

import { CONFIG } from 'src/config-global';
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';

import { Block } from './styles';
import { SvgColor } from '../../svg-color';

// ----------------------------------------------------------------------

export function PresetsOptions({ value, options, onClickOption }) {
  return (
    <Block title="Themes">
      <Box component="ul" gap={1.5} display="grid" gridTemplateColumns="repeat(3, 1fr)">
        {options.map((option) => {
          const selected = value === option.name;

          return (
            <TooltipProvider delayDuration={0}>
              <TooltipShadcn>
                <TooltipTrigger asChild>
                  <Box component="li" key={option.name} sx={{ display: 'flex' }}>
                    <ButtonBase
                      onClick={() => onClickOption(option.name)}
                      sx={{
                        width: 1,
                        height: 64,
                        borderRadius: 1.5,
                        color: option.value,
                        ...(selected && {
                          bgcolor: hexAlpha(option.value, 0.08),
                        }),
                        '&:hover': {
                          bgcolor: hexAlpha(option.value, 0.08),
                        },
                      }}
                    >
                      <SvgColor
                        src={`${CONFIG.site.basePath}/assets/icons/setting/ic-siderbar-duotone.svg`}
                        sx={{ width: 28, height: 28, color: 'currentColor' }}
                      />
                    </ButtonBase>
                  </Box>
                </TooltipTrigger>
                <TooltipContent className="z-[2147483647] rounded bg-[hsl(var(--background))] text-foreground">
                  <p>{option.displayName}</p>
                </TooltipContent>
              </TooltipShadcn>
            </TooltipProvider>
          );
        })}
      </Box>
    </Block>
  );
}
