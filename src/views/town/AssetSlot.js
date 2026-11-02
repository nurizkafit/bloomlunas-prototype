import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * AssetSlot: one named place for art in the town (SPECS §11).
 * It shows a greybox. If assets/models/<slotId>.glb exists, it loads that model and hides the greybox.
 * States: setState(name) shows a child node with that name (if the model has it) or tints the greybox.
 * 1 unit = 1 m, Y up, pivot at ground centre, facing +Z.
 * Unity: prefab slot; the artist drops a prefab with the same name.
 */
export class AssetSlot {
  /** @param {string} slotId @param {string} kind greybox kind @param {string} [label] */
  constructor(slotId, kind, label = slotId) {
    this.slotId = slotId;
    this.kind = kind;
    this.root = new THREE.Group();
    this.root.name = slotId;
    this.root.userData.slotId = slotId;
    this.greybox = buildGreybox(kind);
    this.root.add(this.greybox);
    this.model = null;
    this.state = null;
    this.label = label;
  }

  /** Try to load assets/models/<slotId>.glb. A missing file keeps the greybox (no error). @param {string} base */
  async tryLoadModel(base = './models/') {
    const url = `${base}${this.slotId}.glb`;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      const type = head.headers.get('content-type') ?? '';
      if (!head.ok || type.includes('text/html')) return false;
      const gltf = await new GLTFLoader().loadAsync(url);
      this.model = gltf.scene;
      this.model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.root.add(this.model);
      this.greybox.visible = false;
      if (this.state) this.setState(this.state);
      return true;
    } catch {
      return false;
    }
  }

  /** @param {string} name */
  setState(name) {
    this.state = name;
    if (this.model) {
      const states = this.model.children.filter((c) => c.name.startsWith('state_'));
      if (states.length) for (const c of states) c.visible = c.name === `state_${name}`;
      return;
    }
    const tint = STATE_TINT[name];
    this.greybox.traverse((o) => {
      if (o.isMesh && o.userData.tintable) o.material.emissive.setHex(tint ?? 0x000000);
    });
  }
}

const STATE_TINT = { busy: 0x553300, crafting: 0x442200, drying: 0x332200, ready: 0x225522, closed: 0x000000, gathered: 0x111111, alert: 0x661111 };

function mat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
}

function mesh(geo, color, y = 0, tintable = true) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData.tintable = tintable;
  return m;
}

/** Greybox shapes per kind (SPECS §11 table). @param {string} kind */
function buildGreybox(kind) {
  const g = new THREE.Group();
  switch (kind) {
    case 'shop': {
      g.add(mesh(new THREE.BoxGeometry(5, 3, 4), 0xd8c8a8, 1.5));
      const roof = mesh(new THREE.ConeGeometry(3.8, 2, 4), 0xa0583a, 4);
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      g.add(mesh(new THREE.BoxGeometry(4, 0.2, 1.4), 0xc9563e, 2.4)).position.z = 2.5;
      break;
    }
    case 'house': {
      g.add(mesh(new THREE.BoxGeometry(3.5, 2.5, 3.5), 0xcfbfa0, 1.25));
      const roof = mesh(new THREE.ConeGeometry(3, 1.6, 4), 0x7a5134, 3.3);
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      break;
    }
    case 'room':
      g.add(mesh(new THREE.BoxGeometry(4, 2.6, 3.5), 0xb8a888, 1.3));
      g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 8), 0x6b6256, 3)).position.x = 1.2;
      break;
    case 'racks':
      for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(3, 0.15, 0.9), 0xd9b25c, 0.9)).position.z = (i - 1) * 1.3;
      g.add(mesh(new THREE.BoxGeometry(3.4, 0.05, 4), 0x8f805f, 0.02, false));
      break;
    case 'market':
      g.add(mesh(new THREE.BoxGeometry(9, 1.2, 4), 0xc7a46a, 0.6));
      for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(2.4, 0.15, 2.6), [0xc9563e, 0x3f9e78, 0x4f8fc4][i], 2.6)).position.x = (i - 1) * 3;
      break;
    case 'guild':
      g.add(mesh(new THREE.BoxGeometry(4.5, 6, 4), 0x9ba4c4, 3));
      g.add(mesh(new THREE.BoxGeometry(5, 0.4, 4.5), 0x34406b, 6.2));
      break;
    case 'field': {
      g.add(mesh(new THREE.CylinderGeometry(7, 7, 0.1, 24), 0x5cc29b, 0.05));
      for (let i = 0; i < 9; i++) {
        const c = mesh(new THREE.ConeGeometry(0.5, 1.6, 6), 0x2c7a5a, 0.8);
        c.position.x = Math.cos(i * 0.7) * (2 + (i % 3) * 1.5);
        c.position.z = Math.sin(i * 0.7) * (2 + (i % 3) * 1.5);
        g.add(c);
      }
      break;
    }
    case 'marker':
      g.add(mesh(new THREE.OctahedronGeometry(0.6), 0xe8735c, 0));
      break;
    case 'avatar':
      break;
    default:
      g.add(mesh(new THREE.BoxGeometry(2, 2, 2), 0xaaaaaa, 1));
  }
  return g;
}
