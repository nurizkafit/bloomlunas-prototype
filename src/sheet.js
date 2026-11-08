import { ContentDB } from './core/ContentDB.js';
import { InterfaceSheet } from './views/sheet/InterfaceSheet.js';
import './views/ui/theme.css';
import './views/sheet/sheet.css';

// Interface sheet entry (sheet.html): every UI component and its variants on one page, with an ID and a name,
// for the art audit. It uses the real theme.css, Dom helpers, icons and HUD view, so it shows the current look.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
new InterfaceSheet(content).mount(document.querySelector('#sheet'));
