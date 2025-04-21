import Undo from 'editorjs-undo';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { jellyTriangle } from 'ldrs';
import styled from 'styled-components';
import EditorJS from '@editorjs/editorjs';
import Paragraph from '@editorjs/paragraph';
import NestedList from '@editorjs/nested-list';
import React, { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
// mui
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

import { Textarea } from 'src/s/components/ui/textarea.tsx';
import { Button as ButtonShadcn } from 'src/s/components/ui/button.tsx';
// shadcn
import { Popover, PopoverContent, PopoverTrigger } from 'src/s/components/ui/popover.tsx';

import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
// utils
import { convertToHTML, convertHTMLToBlocks } from 'src/components/novelEditor/utils/utils';

import AIPlugin from './plugins/aiplugin'; // Import your custom AI plugin
import FloatingToolbar from './floatingToolbar'; // Import your floating toolbar
import RephraseTool from './plugins/rephraseTool'; // Import your custom rephrase tool
import PromptEditor from './promptEditor';

jellyTriangle.register('jt-icon');

const CustomEditorJs = styled.div`
  .ce-toolbar__plus {
    display: none;
    color: #919eab !important;
  }

  .ce-toolbar__plus:hover {
    color: #1d202b !important;
  }

  .ce-toolbar__settings-btn {
    display: none;
    color: #919eab !important;
  }

  .ce-toolbar__settings-btn:hover {
    color: #1d202b !important;
  }

  .ce-toolbar__plus::before {
    background-color: white !important;
  }

  .ce-block {
    font-size: 13px;
  }

  .ce-block__content {
    margin: 0;
  }
  .ce-block a {
    color: #52e49c;
    text-decoration: underline;
    font-style: italic;
  }

  .codex-editor__redactor {
    padding-bottom: 0 !important;
  }
`;

const Editor = ({ height, onChange, data }) => {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [editorData, setEditorData] = useState(data);

  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAIPlugin, setCurrentAIPlugin] = useState(null);
  const [loadingOption, setLoadingOption] = useState({
    proofread: false,
    shorter: false,
    expand: false,
    neutral: false,
    friendly: false,
    professional: false,
    context: false,
    continuewriting: false,
  });

  const [openPromptEditor, setOpenPromptEditor] = useState(false);

  const popover = usePopover();

  useEffect(() => {
    if (!editorInstanceRef.current) {
      // Initialize EditorJS only once
      const editor = new EditorJS({
        holder: editorRef.current,
        data: editorData,
        tools: {
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
            config: {
              placeholder: 'Type something or press "/" for commands',
            },
          },
          list: {
            class: NestedList,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered',
              placeholder: 'Write your list here...',
            },
          },
          ai: {
            class: AIPlugin,
            config: {
              showFloatingToolbar: (el, plugin) => {
                setAnchorEl(el);
                setCurrentAIPlugin(plugin);
              },
            },
            shortcut: 'CMD+SHIFT+G',
          },
          rephrase: {
            class: RephraseTool,
            inlineToolbar: false,
          },
        },
        onChange: () => {
          editor
            .save()
            .then((outputData) => {
              console.log('Article data: ', outputData);
              if (onChange) {
                onChange(outputData);
              }
            })
            .catch((error) => {
              console.error('Saving failed: ', error);
            });
        },
      });

      if (editor && typeof editor.destroy === 'function') {
        // Integrate the Undo plugin
        const undo = new Undo({ editor });

        // Setup keyboard events for undo/redo
        undo.initialize();
      }

      editorInstanceRef.current = editor;

      return () => {
        if (editor && typeof editor.destroy === 'function') {
          editor.destroy();
        }
        return undefined;
      };
    }
    return undefined;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (editorInstanceRef.current && editorData !== data) {
      // Save current data and update local state when `data` changes
      editorInstanceRef.current.isReady
        .then(() => {
          editorInstanceRef.current.save().then(() => {
            setEditorData(data); // Update local state to match the new data
          });
        })
        .catch((error) => console.error('Error while updating editor:', error));
    }
    // eslint-disable-next-line
  }, [data]);

  const handleToolbarClose = () => {
    setAnchorEl(null);
    setCurrentAIPlugin(null);
  };

  const handleToolbarSubmit = async (prompt) => {
    if (currentAIPlugin) {
      await currentAIPlugin.generateAIContent(prompt);
    }
    handleToolbarClose();
  };

  const handleClickAi = async (event) => {
    console.log(event.target.innerText);
    const actionType = event.target.innerText.toLowerCase();
    console.log('AI button clicked:', actionType);

    if (editorInstanceRef.current) {
      setLoadingOption((prev) => ({ ...prev, [actionType]: !prev[actionType] }));
      // Get current editor content
      const editor = editorInstanceRef.current;
      const savedData = await editor.save();

      console.log(savedData);

      // Convert savedData to HTML
      const htmlText = convertToHTML(savedData.blocks);
      console.log(htmlText);

      // Perform POST request to the AI backend with the editor content and actionType
      try {
        const response = await fetch(`${process.env.REACT_APP_HOST_API}/api/ai/aiRefactor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actionType,
            htmlText,
          }),
        });

        const result = await response.json();

        // Convert HTML to Editor.js blocks
        const newBlocks = convertHTMLToBlocks(result.refactorText);

        console.log(newBlocks);

        await editor.clear();

        // Render the new blocks
        editor.render({ blocks: newBlocks });

        //   // Update the editor content with the new data from AI
        //   if (result && result.blocks) {
        //     await editor.clear(); // Clear the current content
        //     editor.render(result); // Render the new content from the AI
        //   }
        setLoadingOption((prev) => ({ ...prev, [actionType]: !prev[actionType] }));
      } catch (error) {
        console.error('Error processing AI content:', error);
      }
    }
  };

  const refactorWithPrompt = async (prompt) => {
    console.log('AI button click:', prompt);
    setLoadingOption((prev) => ({ ...prev, context: !prev.context }));

    // Get current editor content
    const editor = editorInstanceRef.current;
    const savedData = await editor.save();

    console.log(savedData);

    // Convert savedData to HTML
    const htmlText = convertToHTML(savedData.blocks);
    console.log(htmlText);

    // Perform POST request to the AI backend with the editor content and actionType
    try {
      const response = await fetch(`${process.env.REACT_APP_HOST_API}/api/ai/addMoreContext`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          htmlText,
        }),
      });

      const result = await response.json();

      // Convert HTML to Editor.js blocks
      const newBlocks = convertHTMLToBlocks(result.refactorText);

      console.log(newBlocks);

      await editor.clear();

      // Render the new blocks
      editor.render({ blocks: newBlocks });

      //   // Update the editor content with the new data from AI
      //   if (result && result.blocks) {
      //     await editor.clear(); // Clear the current content
      //     editor.render(result); // Render the new content from the AI
      //   }
      setLoadingOption((prev) => ({ ...prev, context: !prev.context }));
    } catch (error) {
      console.error('Error processing AI content:', error);
    }
  };

  return (
    <div>
      <div style={{ height, overflowY: 'auto', overflowX: 'hidden', width: '100%' }}>
        <CustomEditorJs>
          <div id="editorjs" ref={editorRef} />
        </CustomEditorJs>
        <FloatingToolbar
          anchorEl={anchorEl}
          onClose={handleToolbarClose}
          onSubmit={handleToolbarSubmit}
        />
        <PromptEditor
          open={openPromptEditor}
          setOpen={setOpenPromptEditor}
          addMoreContext={refactorWithPrompt}
        />
      </div>
      <Stack direction="row" spacing={2} alignItems="center">
        <Popover>
          <PopoverTrigger asChild>
            <ButtonShadcn
              variant="outline"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--secondary))] w-14 rounded"
            >
              <Iconify icon="streamline:ai-edit-spark" />
            </ButtonShadcn>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            className="z-[2147483647] p-0 rounded bg-[hsl(var(--background))] focus:bg-[hsl(var(--background))] translate-x-10"
          >
            <Textarea
              placeholder="Ask Ai to write your email..."
              className="rounded border-[hsl(var(--background))]"
            />
          </PopoverContent>
        </Popover>
        <Box>
          <Badge
            color="transparent"
            sx={{ padding: 0 }}
            badgeContent={<Iconify icon="mingcute:ai-line" width={20} sx={{ color: '#827ded' }} />}
          >
            <Chip
              label={!loadingOption.shorter ? 'Shorter' : <jt-icon color="white" size="10" />}
              variant="outlined"
              onClick={
                Object.values(loadingOption).filter((option) => option === true).length > 0
                  ? null
                  : handleClickAi
              }
            />
          </Badge>
        </Box>
        <Box>
          <Badge
            color="transparent"
            sx={{ padding: 0 }}
            badgeContent={<Iconify icon="mingcute:ai-line" width={20} sx={{ color: '#827ded' }} />}
          >
            <Chip
              label={!loadingOption.expand ? 'Expand' : <jt-icon color="white" size="10" />}
              variant="outlined"
              onClick={
                Object.values(loadingOption).filter((option) => option === true).length > 0
                  ? null
                  : handleClickAi
              }
            />
          </Badge>
        </Box>
        <Box>
          <IconButton
            component={m.button}
            whileTap="tap"
            whileHover="hover"
            variants={varHover(1.05)}
            onClick={popover.onOpen}
            sx={{
              width: 40,
              height: 40,
              background: 'transparent',
              borderRadius: 1,
            }}
          >
            <Iconify icon="ri:more-line" width={20} />
          </IconButton>

          <CustomPopover
            open={popover.open}
            onClose={popover.onClose}
            hiddenArrow="true"
            sx={{
              width: 200,
              p: 0,
              background: 'transparent',
              border: '1px solid #454F5B',
              //   background: (theme) =>
              //     theme.palette.mode === 'light'
              //       ? theme.palette.grey[200]
              //       : theme.palette.melify.linearDarker,
            }}
            arrow="bottom-left"
          >
            <MenuItem
              sx={{ m: 1, color: 'white' }}
              onClick={
                Object.values(loadingOption).filter((option) => option === true).length > 0
                  ? null
                  : handleClickAi
              }
            >
              {!loadingOption.neutral ? (
                <>
                  {' '}
                  <Iconify
                    icon="iconamoon:neutral-face-fill"
                    width={20}
                    sx={{ color: '#827ded' }}
                  />{' '}
                  Neutral
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <jt-icon color="white" size="15" />
                </Box>
              )}
            </MenuItem>

            <Divider />

            <MenuItem
              sx={{ m: 1, color: 'white' }}
              onClick={
                Object.values(loadingOption).filter((option) => option === true).length > 0
                  ? null
                  : handleClickAi
              }
            >
              {!loadingOption.friendly ? (
                <>
                  {' '}
                  <Iconify icon="bxs:cool" width={20} sx={{ color: '#827ded' }} />
                  Friendly
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <jt-icon color="white" size="15" />
                </Box>
              )}
            </MenuItem>

            <Divider />

            <MenuItem
              sx={{ m: 1, color: 'white' }}
              onClick={
                Object.values(loadingOption).filter((option) => option === true).length > 0
                  ? null
                  : handleClickAi
              }
            >
              {!loadingOption.professional ? (
                <>
                  {' '}
                  <Iconify icon="ci:suitcase" width={20} sx={{ color: '#827ded' }} />
                  Professional
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <jt-icon color="white" size="15" />
                </Box>
              )}
            </MenuItem>
          </CustomPopover>
        </Box>
      </Stack>
    </div>
  );
};

Editor.propTypes = {
  height: PropTypes.number,
  onChange: PropTypes.func,
  data: PropTypes.any,
};

export default Editor;
