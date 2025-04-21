const isTiptap = process.env.NEXT_PUBLIC_USE_TIPTAP === 'true';

if (isTiptap) {
  module.exports = require('./editor');
} else {
  module.exports = require('./editorHomeMade');
}
