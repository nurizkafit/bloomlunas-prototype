# Hand-drawn UI art

Put hand-drawn PNG files in this folder. The game uses them in place of the code-drawn icons and skins.

Rules:
- Use the same file name as the Unity sprite in `assets/unity-export/png/`. Example: `ui_ic01_gold.png`, `ui_sk15_gold_button_normal.png`.
- Use the same pixel size as that sprite (2x). Keep the 9-slice borders of `assets/unity-export/manifest.csv`. Then the same file works in Unity.
- Transparent background. No text on skins (the game puts the text on top).
- A sprite with no PNG here keeps the current look. You can add the art in parts.

How it works: `vite.config.js` lists this folder (`virtual:art-pack`). `src/views/ui/ArtPack.js` turns each skin PNG into a CSS 9-slice (`border-image`) and each icon PNG into an `<img>`. The dev server reloads when you add or remove a PNG.
Only the game uses the art. `sheet.html` and `unity.html` keep the code-drawn look, so `npm run export:unity` still makes the templates.

Not covered yet: day dial (SK-27), goal card band (SK-36), jar badge colours (SK-48 store and personal), hotspot arrow (SK-51), bar fills (SK-55), budget jar (SK-57). They stay code-drawn.
