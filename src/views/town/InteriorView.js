import * as THREE from 'three';
import { AssetSlot } from './AssetSlot.js';
import { Avatar } from './Avatar.js';

/**
 * InteriorView: the inside of one building in the Do phase (data/interiors/<id>.json, SPECS §11).
 * Cutaway isometric room: floor, two back walls with a window, front walls hidden (low rim only), warm light.
 * One AssetSlot per station. A station links to a location (ActionMenuView opens) or to a panel (stock).
 * Moving between stations is only a picture: it costs 0 min in logic (_walk.withinBuilding).
 * TownView owns the renderer and the canvas; this class owns its scene and camera.
 * Reads GameState; sends no state changes. Unity: interior scene (or prefab room) with its own camera.
 */
export class InteriorView {
  /** @param {any} data InteriorData */
  constructor(data) {
    this.data = data;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    /** @type {Map<string, AssetSlot>} station id -> slot */
    this.stations = new Map();
    this.pickables = [];
    this.#build();
  }

  #build() {
    const sc = this.scene, d = this.data, [w, dp] = d.size, hW = w / 2, hD = dp / 2, H = d.wallHeight;
    sc.background = new THREE.Color(0x1c1a24);
    this.hemi = new THREE.HemisphereLight(0xffe2b8, 0x3a2a20, 0.7);
    this.lamp = new THREE.PointLight(0xffb060, 40, 18, 1.4);
    this.lamp.position.set(0, H - 0.4, 0);
    this.lamp.castShadow = true;
    this.window = new THREE.DirectionalLight(0xbfd8ff, 1.2);
    this.window.position.set(-hW + 0.5, H + 4, -hD - 6);
    this.window.target.position.set(0, 0, 0);
    this.window.castShadow = true;
    Object.assign(this.window.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
    sc.add(this.hemi, this.lamp, this.window, this.window.target);

    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
    const add = (geo, mat, x, y, z, name) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      m.castShadow = true;
      if (name) m.name = name;
      sc.add(m);
      return m;
    };
    // Floor: planks (wood) and a stone patch under the cauldron.
    for (let i = 0; i < w; i++) add(new THREE.BoxGeometry(0.98, 0.1, dp), std(i % 2 ? 0x8a5f3c : 0x7f5636), -hW + 0.5 + i, -0.05, 0, i ? null : 'env_floor');
    add(new THREE.CylinderGeometry(1.6, 1.6, 0.02, 24), std(0x6c6f80), -3, 0.01, -2);
    // Back walls (-z and -x), front walls hidden: low rim only.
    const wall = std(0xe9dcc0), beam = std(0x5a3a26);
    add(new THREE.BoxGeometry(w, H, 0.2), wall, 0, H / 2, -hD - 0.1, 'env_wall_back');
    add(new THREE.BoxGeometry(0.2, H, dp), wall, -hW - 0.1, H / 2, 0, 'env_wall_side');
    for (const x of [-hW, -hW / 3, hW / 3, hW]) add(new THREE.BoxGeometry(0.25, H, 0.25), beam, x, H / 2, -hD);
    for (const z of [-hD, 0, hD]) add(new THREE.BoxGeometry(0.25, H, 0.25), beam, -hW, H / 2, z);
    add(new THREE.BoxGeometry(w, 0.2, 0.3), beam, 0, H, -hD);
    add(new THREE.BoxGeometry(0.3, 0.2, dp), beam, -hW, H, 0);
    add(new THREE.BoxGeometry(w + 0.2, 0.35, 0.2), beam, 0, 0.17, hD + 0.1);
    add(new THREE.BoxGeometry(0.2, 0.35, dp), beam, hW + 0.1, 0.17, 0);
    // Round window on the back wall: its glow follows the time of day.
    this.glass = add(new THREE.CircleGeometry(0.9, 24), std(0xbfd8ff, { emissive: 0x9fc3e0, emissiveIntensity: 0.8 }), -1.5, H / 2 + 0.3, -hD + 0.01, 'env_window');
    this.glass.castShadow = false;
    // Door gap in the front rim, with a mat.
    add(new THREE.BoxGeometry(1.4, 0.03, 0.8), std(0xc9563e), d.door[0], 0.02, d.door[1] - 0.5);

    for (const st of d.stations) {
      const slot = new AssetSlot(st.assetSlotId, st.greybox, st.label);
      slot.root.position.set(st.position[0], 0, st.position[1]);
      slot.root.userData.stationId = st.id;
      sc.add(slot.root);
      slot.tryLoadModel();
      this.stations.set(st.id, slot);
      this.pickables.push(slot.root);
      this.#label(st);
    }
    this.avatar = new Avatar();
    this.avatar.speed = 5;
    sc.add(this.avatar.root);
    this.customer = new AssetSlot('chr_customer', 'customer');
    this.customer.root.visible = false;
    sc.add(this.customer.root);
    this.customerPath = [];
  }

  #label(st) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(20,26,43,.82)';
    g.beginPath(); g.roundRect(4, 8, 248, 48, 12); g.fill();
    g.fillStyle = '#ede6d3'; g.font = '600 24px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(st.label, 128, 33);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
    sp.scale.set(2.6, 0.65, 1);
    sp.position.set(st.position[0], st.greybox === 'shelf' ? 3.1 : 2.2, st.position[1]);
    sp.renderOrder = 10;
    this.scene.add(sp);
  }

  /** Station for a location id, or null. @param {string} locationId */
  stationFor(locationId) {
    return this.data.stations.find((s) => s.locationId === locationId) ?? null;
  }

  /** Where the avatar stands at a station (station.stand offset; the shopkeeper stands behind the counter). @param {any} st */
  #spot(st) {
    const [dx, dz] = st.stand ?? [0, 1.2];
    return [st.position[0] + dx, st.position[1] + dz];
  }

  /** Put the avatar at a station (no walk). @param {string} locationId */
  placeAt(locationId) {
    const st = this.stationFor(locationId);
    this.avatar.points = [];
    this.avatar.place(st ? this.#spot(st) : [this.data.door[0], this.data.door[1] - 1]);
  }

  /** Enter by the door and walk to a station. @param {string} locationId */
  enterTo(locationId) {
    this.avatar.place([this.data.door[0], this.data.door[1]]);
    this.walkTo(locationId);
  }

  /** Walk to a station (a picture only: 0 game minutes). @param {string} locationId */
  walkTo(locationId) {
    const st = this.stationFor(locationId);
    if (st) this.avatar.walk([this.#spot(st)]);
  }

  /** A customer walks from the door to the counter and back. */
  customerVisit() {
    const counter = this.data.stations.find((s) => s.greybox === 'counter');
    if (!counter) return;
    const door = new THREE.Vector3(this.data.door[0], 0, this.data.door[1] + 0.5);
    const front = new THREE.Vector3(counter.position[0], 0, counter.position[1] + 1.2);
    this.customer.root.position.copy(door);
    this.customer.root.visible = true;
    this.customer.setState('walk');
    this.customerPath = [front, front.clone(), door];
    this.customerWait = 0.8;
  }

  /** @param {string} stationId @param {string} state */
  setState(stationId, state) {
    this.stations.get(stationId)?.setState(state);
  }

  /** Light by time of day: the window is bright by day and dark blue at night; the lamp is warm. @param {'day'|'evening'|'night'} part */
  light(part) {
    const win = { day: [0x9fc3e0, 0.9, 1.2], evening: [0xe0a070, 0.7, 0.6], night: [0x2a3460, 0.4, 0.15] }[part];
    this.glass.material.emissive.setHex(win[0]);
    this.glass.material.emissiveIntensity = win[1];
    this.window.intensity = win[2];
    this.window.color.setHex(part === 'evening' ? 0xffb070 : part === 'night' ? 0x6070c0 : 0xbfd8ff);
    this.lamp.intensity = part === 'day' ? 30 : 55;
  }

  /** @param {number} aspect @param {number} zoom */
  resize(aspect, zoom = 1) {
    const half = 6.2 / zoom;
    Object.assign(this.camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    this.camera.updateProjectionMatrix();
    this.camera.position.set(14, 14, 14);
    this.camera.lookAt(0, 0.6, 0);
  }

  /** @param {number} dt seconds */
  update(dt) {
    this.avatar.update(dt);
    if (!this.customer.root.visible) return;
    const pos = this.customer.root.position, target = this.customerPath[0];
    if (!target) { this.customer.root.visible = false; return; }
    const dist = target.distanceTo(pos);
    if (dist < 0.01) {
      if (this.customerPath.length === 2 && this.customerWait > 0) { this.customer.setState('buy'); this.customerWait -= dt; return; }
      this.customerPath.shift();
      return;
    }
    const step = Math.min(dist, 5 * dt);
    const dir = target.clone().sub(pos).normalize();
    pos.addScaledVector(dir, step);
    this.customer.root.rotation.y = Math.atan2(dir.x, dir.z);
  }
}
