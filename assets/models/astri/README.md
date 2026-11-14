# Team 3D models (Astri)

Models by Astri (BloomLunas team), made in Blender 5.2, received as FBX on 14 Nov 2026.
Converted for the web build: FBX to GLB, then meshopt compression (`gltf-transform meshopt`).

What the conversion changes (the Unity build can use the FBX files as they are, after the same fixes):
- Texture: every "Material" gets the palette `MNWDqe.png` (the FBX files have no texture link).
- Removes `Cube018`, a stray dark copy of the room walls in each prop file.
- Removes far-away stray parts in `meja_grind` and `meja_guild_c`.
- Scale 0.01 (cm to m). The rooms in `data/scene/town.json` scale them again by 1.5.

Folders: `shop/`, `crafting/`, `bedroom/` (the three Home rooms, by station), `guild/`, `market/`.
Model keys in `town.json` start with `astri/` (see `bases`).
