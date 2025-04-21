'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { jellyTriangle } from 'ldrs';
import randomColor from 'randomcolor';
import { TwitterPicker } from 'react-color';

import Box from '@mui/material/Box';
import { styled } from '@mui/system';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
// @mui
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';

// hooks
import { useResponsive } from 'src/hooks/use-responsive';

// shadcn
import { Button as ButtonShadcn } from 'src/s/components/ui/button.tsx';
// api
import { postAddCategory, postUpdateProfileCategories } from 'src/api/profile';
import { toast } from 'sonner';

import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';

// components
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useAuthContext } from 'src/auth/hooks';

//
import { MailNavItem } from './mail-nav-item';
import { MailNavItemSkeleton } from './mail-skeleton';

jellyTriangle.register('jt-icon');

// ----------------------------------------------------------------------

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const Textarea = styled(BaseTextareaAutosize)(
  ({ theme }) => `
  box-sizing: border-box;
  font-family: 'Public Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  padding: 12px;
  border-radius: 8px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${
    theme.palette.mode === 'dark' ? theme.palette.melify.linearDarker : theme.palette.grey[200]
  };
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0px 2px 2px ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};

  &:hover {
    border-color: ${theme.palette.grey[600]};
  }

  &:focus {
    outline: 0;
    border-color: ${theme.palette.grey[500]};
  }

  // firefox
  &:focus-visible {
    outline: 0;
  }
`
);

const InputElement = styled('input')(
  ({ theme }) => `
  font-family: 'Public Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 8px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${
    theme.palette.mode === 'dark' ? theme.palette.melify.linearDarker : theme.palette.grey[200]
  };
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0px 2px 2px ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};

  &:hover {
    border-color: ${theme.palette.grey[600]};
  }

  &:focus {
    outline: 0;
    border-color: ${theme.palette.grey[500]};
  }

  // firefox
  &:focus-visible {
    outline: 0;
  }
`
);

export function MailNav({
  loading,
  openNav,
  onCloseNav,
  //
  labels,
  selectedLabelId,
  handleClickLabel,
  //
  onToggleCompose,
}) {
  const [open, setOpen] = React.useState(false);
  const [openEditCategories, setOpenEditCategories] = React.useState(false);
  const [color, setColor] = React.useState({ r: '241', g: '112', b: '19', a: '1' });
  const [hexColor, setHexColor] = React.useState('');
  const [colors, setColors] = React.useState([]);

  // categories editing
  const [categories, setCategories] = React.useState(labels || []);
  const [categoryToAdd, setCategoryToAdd] = React.useState('');
  const [displayColorPicker, setDisplayColorPicker] = React.useState(false);
  const [displayColorPickerEditing, setDisplayColorPickerEditing] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState(null); // Track the selected category for color editing
  const [saveLoading, setSaveLoading] = React.useState(false);

  const pickerRef = React.useRef(null);
  const editingPickerRef = React.useRef(null);

  const scrollRef = React.useRef(null);

  const { user } = useAuthContext();

  // const { enqueueSnackbar } = useSnackbar();

  // const theme = useTheme();

  // UseEffect to update categories when labels change
  React.useEffect(() => {
    if (labels && labels.length > 0) {
      setCategories(labels);
    }
  }, [labels]);

  React.useEffect(() => {
    const generatedColors = randomColor({ count: 20, alpha: 1, luminosity: 'random' });
    const [r, g, b] = hexToRgba(generatedColors[0]);
    setColors(generatedColors);
    setColor({ r, g, b, a: 1 });
    setHexColor(generatedColors[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setDisplayColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerRef]);

  React.useEffect(() => {
    const handleClickOutsideEditing = (event) => {
      if (editingPickerRef.current && !editingPickerRef.current.contains(event.target)) {
        setDisplayColorPickerEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideEditing);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideEditing);
    };
  }, [editingPickerRef]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpenCategories = () => {
    setOpenEditCategories(true);
  };

  const handleCloseCategories = () => {
    setOpenEditCategories(false);
  };

  const handleChangeColor = (inputColor) => {
    setColor(inputColor.rgb);
    setHexColor(inputColor.hex);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth', // Smooth scroll
      });
    }
  };

  const handleColorChangeEditingCategory = (newColor, categoryName) => {
    // Update the color for the selected category
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.name === categoryName ? { ...category, color: newColor.hex } : category
      )
    );
    setDisplayColorPickerEditing(false); // Close the color picker after selection
  };

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleDelete = (chipToDelete) => () => {
    // setGeneratedCategories((chips) => chips.filter((chip) => chip.category !== chipToDelete));
    setCategories((chips) => chips.filter((chip) => chip.name !== chipToDelete));
  };

  const addCategory = (category) => {
    // setGeneratedCategories([...generatedCategories, { category, hexColor, color }]);
    setCategories([
      ...categories,
      { name: category, color: hexColor, id: category, type: 'system', unreadcount: 0 },
    ]);
    setCategoryToAdd('');
    scrollToBottom();
  };

  const handleClickCategoryEditing = (categoryName) => {
    setSelectedCategory(categoryName);
    setDisplayColorPickerEditing(!displayColorPickerEditing); // Show the color picker for this category
  };

  const handleSubmitCategoriesEditing = async () => {
    console.log('submit categories');
    console.log(categories.filter((item) => item.color && item.name !== 'Other'));
    setSaveLoading(true);
    const response = await postUpdateProfileCategories({
      userEmail: user.email,
      categories: categories.filter((item) => item.color && item.name !== 'Other'),
    });

    if (response.status === 200 || response.status === 201) {
      // enqueueSnackbar('Category successfully updated!', { variant: 'success' });
      toast.success('Category successfully updated', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
    } else {
      // enqueueSnackbar('An error has occured, please contact us for further information', {
      //   variant: 'error',
      // });
      toast.error('An error has occured, please contact us for further information', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
    }

    handleCloseCategories();
    setSaveLoading(false);
  };

  const mdUp = useResponsive('up', 'md');

  function hexToRgba(hex) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the r, g, b values
    let r;
    let g;
    let b;

    if (hex.length === 3) {
      // If 3 characters, expand them to 6
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      // If 6 characters, parse normally
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      throw new Error('Invalid hex color code');
    }

    return [r, g, b];
  }

  /**
   * Converts RGBA values to a hex color code.
   * @param {number} r - The red component, ranging from 0 to 255.
   * @param {number} g - The green component, ranging from 0 to 255.
   * @param {number} b - The blue component, ranging from 0 to 255.
   * @param {number} a - The alpha component, ranging from 0 to 1.
   * @return {string} The hex color code including alpha, in the format #RRGGBBAA.
   */

  const renderSkeleton = (
    <>
      {[...Array(8)].map((_, index) => (
        <MailNavItemSkeleton key={index} />
      ))}
    </>
  );

  const renderList = (
    <>
      {labels.map((label) => (
        <MailNavItem
          key={label.id}
          label={label}
          selected={selectedLabelId === label.id}
          onClickNavItem={() => {
            handleClickLabel(label.id);
          }}
        />
      ))}
    </>
  );

  const renderContent = (
    <>
      <div className="flex flex-row justify-center items-center gap-5 px-2.5 py-2 md:px-1.5 md:py-2">
        <TooltipProvider delayDuration={0}>
          <TooltipShadcn>
            <TooltipTrigger asChild>
              <ButtonShadcn
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--secondary))] w-14 rounded"
                variant="ghost"
                size="icon"
                onClick={onToggleCompose}
              >
                {' '}
                <Iconify icon="carbon:edit" />{' '}
              </ButtonShadcn>
            </TooltipTrigger>
            <TooltipContent>
              <p>Compose Mail</p>
            </TooltipContent>
          </TooltipShadcn>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <TooltipShadcn>
            <TooltipTrigger asChild>
              <ButtonShadcn
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--secondary))] w-14 rounded"
                variant="ghost"
                size="icon"
                onClick={handleClickOpenCategories}
              >
                {' '}
                <Iconify icon="mage:plus-square-fill" />{' '}
              </ButtonShadcn>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Categories</p>
            </TooltipContent>
          </TooltipShadcn>
        </TooltipProvider>

        {/* <Tooltip title="Compose" placement="top">
          <Button
            color="inherit"
            variant="contained"
            // startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={onToggleCompose}
            sx={{
              background:
                theme.palette.mode === 'light'
                  ? theme.palette.melify.linearLighter
                  : theme.palette.melify.linearLighter,
              color: 'white',
              '&:hover': {
                background:
                  theme.palette.mode === 'light'
                    ? theme.palette.melify.linearLight
                    : theme.palette.melify.linearLight,
                '& .iconify': {
                  color: 'white', // replace with the desired hover color
                },
              },
            }}
          >
            <Iconify icon="carbon:edit" />
          </Button>
        </Tooltip> */}
        {/* <Tooltip title="Edit categories" placement="top">
          <Button
            color="inherit"
            variant="contained"
            // startIcon={<Iconify icon="carbon:add-filled" />}
            onClick={handleClickOpenCategories}
            sx={{
              background:
                theme.palette.mode === 'light'
                  ? theme.palette.melify.linearLighter
                  : theme.palette.melify.linearLighter,
              color: 'white',
              '&:hover': {
                background:
                  theme.palette.mode === 'light'
                    ? theme.palette.melify.linearLight
                    : theme.palette.melify.linearLight,
                '& .iconify': {
                  color: 'white', // replace with the desired hover color
                },
              },
            }}
          >
            <Iconify icon="mage:plus-square-fill" />
          </Button>
        </Tooltip> */}
      </div>

      <Scrollbar>
        <Stack
          sx={{
            px: { xs: 1, md: 0.5 },
          }}
        >
          {loading && renderSkeleton}

          {!!labels.length && renderList}

          {/* {renderEditCategories} */}
        </Stack>
      </Scrollbar>
    </>
  );

  const renderDialog = (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        // style: {
        //   background: "#0B0E12"
        // },
        onSubmit: async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const formJson = Object.fromEntries(formData.entries());
          const { category } = formJson;
          const { description } = formJson;
          console.log(category, description, hexColor, user.email);
          const returnValue = await postAddCategory({
            user,
            categoryName: category,
            categoryDescription: description || '',
            categoryColor: hexColor,
            categoryDisplayName: category,
          });
          console.log(returnValue);
          if (returnValue.status === 200 || returnValue.status === 201) {
            // enqueueSnackbar('Category successfully added!', { variant: 'success' });
            toast.success('Category successfully added!', {
              duration: 2000,
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            });
          } else {
            // enqueueSnackbar('An error has occured, please contact us for further information', {
            //   variant: 'error',
            // });
            toast.error('An error has occured, please contact us for further information', {
              duration: 2000,
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            });
          }
          handleClose();
        },
      }}
    >
      <DialogTitle>Add a new category</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Create a category by giving a name and a description (optional). Be the more precise and
          concise as possible.
        </DialogContentText>
        <Stack spacing={2} direction="column">
          <InputElement
            autoFocus
            required
            margin="dense"
            id="name"
            name="category"
            label="Category"
            type="text"
            fullWidth
            variant="filled"
            placeholder="Category name"
          />
          <Textarea
            minRows={2}
            maxRows={2}
            aria-label="empty textarea"
            id="description"
            name="description"
            label="Description"
            placeholder="Description of the category"
          />
          <div>
            <div
              style={{
                padding: '5px',
                background: '#fff',
                borderRadius: '1px',
                boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                display: 'inline-block',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '14px',
                  borderRadius: '2px',
                  background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                }}
              />
            </div>
            <TwitterPicker colors={colors} color={color} onChange={handleChangeColor} />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Add</Button>
      </DialogActions>
    </Dialog>
  );

  const editCategoriesDialog = (
    <Dialog
      fullWidth
      maxWidth="md"
      open={openEditCategories}
      onClose={handleCloseCategories}
      PaperProps={{
        sx: {
          borderRadius: 1,
          background: 'hsl(var(--black-background))', // Change to your desired background color
        },
      }}
      BackdropProps={{
        style: {
          backgroundColor: 'transparent', // Make the backdrop transparent
        },
      }}
    >
      <DialogTitle>Edit your categories</DialogTitle>
      <DialogContent sx={{ minHeight: '40vh' }}>
        <Stack direction="column" alignItems="center" spacing={2} sx={{ height: '100%' }}>
          <Stack direction="row" alignItems="flex-end" justifyContent="center" spacing={4}>
            <TextField
              label="Add a category"
              variant="standard"
              value={categoryToAdd}
              onChange={(event) => setCategoryToAdd(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault(); // Prevent form submission
                  addCategory(event.target.value);
                }
              }}
            />
            <Box>
              <Box
                onClick={handleClick}
                style={{
                  padding: '5px',
                  background: '#fff',
                  borderRadius: '1px',
                  boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                  display: 'inline-block',
                  cursor: 'pointer',
                }}
              >
                <Box
                  style={{
                    width: '36px',
                    height: '14px',
                    borderRadius: '2px',
                    background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                  }}
                />
              </Box>
              {displayColorPicker ? (
                <Box sx={{ position: 'absolute', zIndex: 2 }} ref={pickerRef}>
                  <TwitterPicker colors={colors} color={color} onChange={handleChangeColor} />
                </Box>
              ) : null}
            </Box>
            <TooltipProvider delayDuration={0}>
              <TooltipShadcn>
                <TooltipTrigger asChild>
                  <ButtonShadcn
                    className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--accent))] w-10 h-8 rounded"
                    variant="ghost"
                    size="icon"
                    onClick={() => addCategory(categoryToAdd)}
                  >
                    {' '}
                    <Iconify icon="mage:plus-square-fill" />
                  </ButtonShadcn>
                </TooltipTrigger>
                <TooltipContent className="z-[2147483647]">
                  <p>Add a category</p>
                </TooltipContent>
              </TooltipShadcn>
            </TooltipProvider>
            {/* <Button
              size="medium"
              variant="contained"
              sx={{
                color: 'white',
                background: theme.palette.melify.linearLighter,
                '&:hover': {
                  background: theme.palette.melify.linearLight,
                  '& .iconify': {
                    color: 'white',
                  },
                },
              }}
              onClick={() => addCategory(categoryToAdd)}
              endIcon={<Iconify icon="mage:plus-square-fill" />}
            >
              Add
            </Button> */}
          </Stack>

          <Scrollbar ref={scrollRef} sx={{ width: '600px', maxHeight: '400px', pb: 10 }}>
            <Stack spacing={2}>
              {categories
                .filter((item) => item.color && item.name !== 'Other')
                .map((data) => (
                  <Chip
                    key={data.id}
                    sx={{
                      py: 3,
                      mx: 10,
                      bgcolor: 'hsl(var(--background))',
                      '&:hover': {
                        // opacity: 0.7,
                        bgcolor: 'hsl(var(--accent)) !important',
                      },
                    }}
                    label={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ color: 'white' }}>
                          <Typography sx={{ cursor: 'pointer' }}>{data.name}</Typography>
                        </Box>
                        <Box>
                          <Box
                            onClick={() => handleClickCategoryEditing(data.name)}
                            sx={{
                              padding: '5px',
                              background: '#fff',
                              borderRadius: '1px',
                              boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                              display: 'inline-block',
                              cursor: 'pointer',
                              mt: 0.8,
                            }}
                          >
                            <Box
                              style={{
                                width: '36px',
                                height: '14px',
                                borderRadius: '2px',
                                background: `${data.color}`,
                              }}
                            />
                          </Box>
                          {selectedCategory === data.name && displayColorPickerEditing && (
                            <Box sx={{ position: 'absolute', zIndex: 2 }} ref={editingPickerRef}>
                              <TwitterPicker
                                color={data.color}
                                onChangeComplete={(packageColor) =>
                                  handleColorChangeEditingCategory(packageColor, data.name)
                                }
                              />
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          aria-label="delete"
                          onClick={handleDelete(data.name)}
                          sx={{ borderRadius: 1 }}
                        >
                          <Iconify icon="mdi:cross-circle" style={{ color: 'white' }} />
                        </IconButton>
                      </Stack>
                    }
                  />
                ))}
            </Stack>
          </Scrollbar>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseCategories}>Cancel</Button>

        <Button disabled={saveLoading} onClick={handleSubmitCategoriesEditing}>
          {saveLoading ? <jt-icon color="white" size="10" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return mdUp ? (
    <Stack
      sx={{
        width: 'auto',
        flexShrink: 0,
        // borderRight: '1px solid rgba(145 158 171 / 0.2)',
        pr: 3,
      }}
    >
      {renderDialog}
      {editCategoriesDialog}
      <div
        style={{
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {renderContent}
      </div>
    </Stack>
  ) : (
    <Drawer
      open={openNav}
      onClose={onCloseNav}
      slotProps={{
        backdrop: { invisible: true },
      }}
      PaperProps={{
        sx: {
          width: 260,
        },
      }}
    >
      {renderDialog}
      {editCategoriesDialog}
      {renderContent}
    </Drawer>
  );
}

MailNav.propTypes = {
  handleClickLabel: PropTypes.func,
  labels: PropTypes.array,
  loading: PropTypes.bool,
  onCloseNav: PropTypes.func,
  onToggleCompose: PropTypes.func,
  openNav: PropTypes.bool,
  selectedLabelId: PropTypes.string,
};
