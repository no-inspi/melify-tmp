import './style.css';
import { useEffect, useState } from 'react';
import { useChat } from 'ai/react';

import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';

import { BubbleMenu, EditorContent, FloatingMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Iconify } from '../iconify';

import { Button } from 'src/s/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from 'src/s/components/ui/popover';
import { Textarea } from 'src/s/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/s/components/ui/dropdown-menu';

import { generateRephrase, generateRefactor, generateContinuation } from 'src/actions/openai';

import { getTextEditorSelected, handleAi, continueWriting } from './utils';

// ----------------------------------------------------------------------

const extensions = [
  //   Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
  }),
  Highlight,
  TextAlign,
  Placeholder.configure({
    placeholder: 'Write your email...',
  }),
  Link.configure({
    openOnClick: false, // Don't open the link immediately
  }),
];

export function Editor({ content, handleChangeContent }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    onError: (e) => {
      console.log(e);
    },
  });

  // Initialize the editor instance
  const editor = useEditor({
    extensions: extensions,
    content: content,
    onUpdate: ({ editor }) => {
      console.log(editor.getHTML());
      const updatedContent = editor.getHTML(); // Get updated content as HTML
      handleChangeContent(updatedContent); // Update state with the new content
    },
  });

  useEffect(() => {
    if (editor && messages.length > 1) {
      const lastMessage = messages[messages.length - 1].content;
      editor.chain().clearContent().insertContent(lastMessage).focus().run();
    }
  }, [messages, editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      console.log('entered', input);
      event.preventDefault();

      await handleSubmit();
    }
  };

  return (
    <div className="p-0">
      {editor && (
        <BubbleMenu
          className=""
          tippyOptions={{ duration: 100, interactive: true, hideOnClick: false }}
          editor={editor}
        >
          <div className="flex w-auto flex-wrap overflow-hidden rounded-[6px] border border-[hsl(var(--muted))] bg-background shadow-xl">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                editor.isActive('bold') && 'text-[hsl(var(--select-button))]'
              }`}
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none italic ${
                editor.isActive('italic') && 'text-[hsl(var(--select-button))]'
              }`}
            >
              i
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none line-through ${
                editor.isActive('strike') && 'text-[hsl(var(--select-button))]'
              }`}
            >
              S
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none line-through ${
                editor.isActive('highlight') && 'text-[hsl(var(--select-button))]'
              }`}
            >
              <Iconify icon="material-symbols-light:format-ink-highlighter" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                editor.isActive('codeBlock') && 'text-[hsl(var(--select-button))]'
              }`}
            >
              <Iconify icon="mingcute:code-line" />
            </button>
            <div className="border-l border-[hsl(var(--muted))] inline-flex">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                  editor.isActive('heading', { level: 1 }) && 'text-[hsl(var(--select-button))]'
                }`}
              >
                <div className="inline-flex items-end">
                  <span className="inline text-base">h</span>
                  <span className="inline text-xs">1</span>
                </div>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                  editor.isActive('heading', { level: 2 }) && 'text-[hsl(var(--select-button))]'
                }`}
              >
                <div className="inline-flex items-end">
                  <span className="inline text-base">h</span>
                  <span className="inline text-xs">2</span>
                </div>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                  editor.isActive('heading', { level: 3 }) && 'text-[hsl(var(--select-button))]'
                }`}
              >
                <div className="inline-flex items-end">
                  <span className="inline text-base">h</span>
                  <span className="inline text-xs">3</span>
                </div>
              </button>
            </div>
            <div className="border-l border-[hsl(var(--muted))] inline-flex">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                  editor.isActive('bulletList') && 'text-[hsl(var(--select-button))]'
                }`}
              >
                <Iconify icon="tabler:list" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 px-3 rounded-none ${
                  editor.isActive('orderedList') && 'text-[hsl(var(--select-button))]'
                }`}
              >
                <Iconify icon="tabler:list-numbers" />
              </button>
            </div>
          </div>
        </BubbleMenu>
      )}
      <EditorContent
        editor={editor}
        className="overflow-y-auto min-h-[200px] max-h-[200px] prose mx-auto mt-1 focus:outline-none focus:border-none"
      />
      <MenuBar
        editor={editor}
        input={input}
        handleInputChange={handleInputChange}
        handleKeyDown={handleKeyDown}
      />
    </div>
  );
}

const MenuBar = ({ editor, input, handleInputChange, handleKeyDown }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [aiPopoverOpen, setAiPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setPopoverOpen(false);
      setLinkUrl(''); // Reset input
    }
  };

  const handleRephrase = async () => {
    if (!editor) return;

    // Get the entire editor text
    const fullText = editor.getText();

    const { textToRephrase, selectedText, from, to } = await getTextEditorSelected(
      editor,
      fullText
    );

    const response = await generateRephrase(textToRephrase, fullText);
    await handleAi(selectedText, from, response, editor);
  };

  const handleRefactor = async (actionType) => {
    if (!editor) return;

    // Get the entire editor text
    const fullText = editor.getText();

    const { textToRephrase, selectedText, from, to } = await getTextEditorSelected(
      editor,
      fullText
    );

    const response = await generateRefactor(textToRephrase, fullText, actionType);
    await handleAi(selectedText, from, response, editor);
  };

  const handleContinueWriting = async () => {
    if (!editor) return;

    await continueWriting(editor, generateContinuation);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex space-x-0 mb-2">
      <div>
        {/* Link Button */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-[hsl(var(--accent))] h-9 px-3 rounded ${
                editor.isActive('link') ? 'bg-[hsl(var(--select-button))] text-white' : ''
              }`}
              onClick={() => {
                console.log('link', editor.isActive('link'));
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run(); // Remove the link if active
                } else {
                  setPopoverOpen((prev) => !prev);
                }
              }}
            >
              <Iconify icon="mdi:link" className="mr-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            className="p-1 bg-[hsl(var(--background))] rounded-md shadow-md z-[2147483647]"
          >
            <div className="flex flex-col gap-2 text-xs">
              <input
                type="url"
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default form submission behavior
                    addLink(); // Apply the link
                    setPopoverOpen(false); // Close the popover
                  }
                }}
                className="border p-2 rounded focus:outline-none"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Popover open={aiPopoverOpen} onOpenChange={setAiPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className=" inline-flex text-xs items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-[hsl(var(--accent))] h-9 px-3 rounded"
            >
              <div className="relative">
                Ask Ai
                <span className="absolute top-0 -right-2 transform translate-x-1/2 -translate-y-1/2">
                  <Iconify icon="mingcute:ai-line" className="text-[hsl(var(--select-button))]" />
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            className="p-1 bg-[hsl(var(--background))] rounded shadow-md z-[2147483647] ml-6"
          >
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Write me an email that ..."
              className="w-full p-2 border-0 focus-visible:ring-transparent"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Button
          onClick={handleRephrase}
          variant="ghost"
          className="inline-flex text-xs items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-[hsl(var(--accent))] h-9 px-3 rounded"
        >
          <div className="relative">
            Rephrase
            <span className="absolute top-0 -right-2 transform translate-x-1/2 -translate-y-1/2">
              <Iconify icon="mingcute:ai-line" className="text-[hsl(var(--select-button))]" />
            </span>
          </div>
        </Button>
      </div>
      <div>
        <Button
          onClick={handleContinueWriting}
          variant="ghost"
          className="inline-flex text-xs items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-[hsl(var(--accent))] h-9 px-3 rounded"
        >
          <div className="relative">
            <Iconify icon="icon-park-outline:writing-fluently" />
            <span className="absolute top-0 -right-2 transform translate-x-1/2 -translate-y-1/2">
              <Iconify icon="mingcute:ai-line" className="text-[hsl(var(--select-button))]" />
            </span>
          </div>
        </Button>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-[hsl(var(--accent))] h-9 px-3 rounded"
            >
              <div className="relative">
                <Iconify icon="fluent:apps-20-filled" />
                <span className="absolute top-0 -right-2 transform translate-x-1/2 -translate-y-1/2">
                  <Iconify icon="mingcute:ai-line" className="text-[hsl(var(--select-button))]" />
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="p-1 bg-[hsl(var(--background))] rounded shadow-md z-[2147483647] ml-6"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleRefactor('proofread')}
            >
              <Iconify icon="solar:text-linear" className="text-[hsl(var(--select-button))]" />
              Proofread
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => handleRefactor('expand')}>
              <Iconify className="text-[hsl(var(--select-button))]" icon="ci:expand" />
              Expand
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => handleRefactor('shorter')}>
              <Iconify className="text-[hsl(var(--select-button))]" icon="ci:shrink" />
              Shorter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => handleRefactor('neutral')}>
              <Iconify
                className="text-[hsl(var(--select-button))]"
                icon="iconamoon:neutral-face-fill"
              />
              Neutral
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => handleRefactor('friendly')}>
              <Iconify className="text-[hsl(var(--select-button))]" icon="bxs:cool" />
              Friendly
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleRefactor('professional')}
            >
              <Iconify className="text-[hsl(var(--select-button))]" icon="ci:suitcase" />
              Pro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))]  ${
          editor.isActive('heading', { level: 1 })
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <span className="inline text-base">h</span>
        <span className="inline text-xs">1</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <span className="inline text-base">h</span>
        <span className="inline text-xs">2</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('heading', { level: 3 })
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <span className="inline text-base">h</span>
        <span className="inline text-xs">3</span>
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('paragraph')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <span className="inline text-base">P</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] font-bold ${
          editor.isActive('bold')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] italic ${
          editor.isActive('italic')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        i
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] line-through ${
          editor.isActive('strike')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        W
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('highlight')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <Iconify icon="material-symbols-light:format-ink-highlighter" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`h-7 w-7 border rounded flex flex-row items-center hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('orderedList')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <Iconify icon="tabler:list-numbers" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('bulletList')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <Iconify icon="tabler:list" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`h-7 w-7 border rounded hover:bg-[hsl(var(--select-button))] hover:text-[hsl(var(--select-button-foreground))] ${
          editor.isActive('codeBlock')
            ? 'bg-[hsl(var(--select-button))] text-[hsl(var(--select-button-foreground))]'
            : 'bg-white text-black'
        }`}
      >
        <Iconify icon="mingcute:code-line" />
      </button> */}
    </div>
  );
};
