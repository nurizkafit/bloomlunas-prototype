import { ContentDB } from './core/ContentDB.js';
import { UnityAssets } from './views/sheet/UnityAssets.js';
import './views/ui/theme.css';
import './views/sheet/sheet.css';
import './views/sheet/unity.css';

// Unity assets page (unity.html): the text-free sprites (skins, ornaments, icons) the Unity UI needs,
// as compact 9-slice sprites with PNG downloads. PNGs come from npm run export:unity.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
new UnityAssets(content).mount(document.querySelector('#sheet'));
