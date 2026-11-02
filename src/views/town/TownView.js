import * as THREE from 'three';
import { MSG } from '../../core/EventBus.js';
import { AssetSlot } from './AssetSlot.js';
import { Avatar } from './Avatar.js';
import { PathGraph } from './PathGraph.js';
import { InteriorView } from './InteriorView.js';

/**
 * TownView: the Do phase town (SPECS §11). Isometric orthographic camera with pan and zoom limits,
 * ground and paths, one AssetSlot per location, the avatar, light by time of day. Click-only input.
 * Click a location -> onPick(locationId) (ActionMenuView opens). Reads GameState; sends no state changes.
 * Buildings with an interior (data/interiors/): the view goes inside when the avatar walks through the door,
 * and an Exit button goes back to the town. Inside, a station click -> onPick(locationId) or onPanel(panel).
 * Unity: town scene, Cinemachine ortho camera, prefabs in slots.
 */
export class TownView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm;
    this.c = gm.content;
    this.s = gm.state;
    this.onPick = (_id) => {};
    this.onPanel = (_panel) => {};
    /** @type {InteriorView|null} the interior shown now (view state only, not GameState) */
    this.inside = null;
    this.el = document.createElement('div');
    this.el.className = 'town';
    this.el.hidden = true;
    root.appendChild(this.el);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.el.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.zoom = 1;
    this.pan = new THREE.Vector3(0, 0, -2);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    this.#buildWorld();
    this.#buildInteriors();
    this.#input();
    this.clock = new THREE.Clock();

    gm.bus.on(MSG.PHASE_ENTERED, ({ phase }) => {
      this.el.hidden = phase !== 'Do';
      if (phase === 'Do') { this.#placeAvatarAt(this.s.player.location); this.#syncInside(); this.#light(); this.resize(); }
    });
    gm.bus.on(MSG.CLOCK_CHANGED, () => this.#light());
    gm.bus.on(MSG.ACTION_STARTED, () => this.#slotStates());
    gm.bus.on(MSG.ACTION_COMPLETED, (r) => { if (r.actionId === 'serve-customer' && this.inside) this.inside.customerVisit(); });
    gm.bus.on(MSG.ACTION_COMPLETED, (r) => this.#onAction(r));
    gm.bus.on(MSG.EVENT_FIRED, () => { this.marker.root.visible = true; this.marker.setState('alert'); });
    gm.bus.on(MSG.EVENT_RESOLVED, () => { this.marker.root.visible = false; });
    addEventListener('resize', () => this.resize());
    this.resize();
    this.renderer.setAnimationLoop(() => this.#frame());
  }

  #buildWorld() {
    const sc = this.scene;
    sc.background = new THREE.Color(0x9fc3e0);
    this.hemi = new THREE.HemisphereLight(0xfff4e0, 0x4a5a3a, 0.9);
    sc.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 200 });
    sc.add(this.sun, this.sun.target);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0x9cb57a, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'env_ground';
    sc.add(ground);

    const paths = this.c.get('locations', '_paths');
    this.graph = new PathGraph(paths, (id) => this.c.get('locations', this.#outer(id)));
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xd9c79d, roughness: 1 });
    const seg = (a, b) => {
      const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, len + 1.6), pathMat);
      m.position.set((a[0] + b[0]) / 2, 0.02, (a[1] + b[1]) / 2);
      m.rotation.y = Math.atan2(dx, dz);
      m.receiveShadow = true;
      sc.add(m);
    };
    for (const [a, b] of paths.edges) seg(paths.nodes[a], paths.nodes[b]);

    this.slots = new Map();
    this.pickables = [];
    for (const loc of this.c.all('locations').filter((l) => l.position)) {
      const slot = new AssetSlot(loc.assetSlotId, loc.greybox, loc.name);
      slot.root.position.set(loc.position[0], 0, loc.position[1]);
      slot.root.userData.locationId = loc.id;
      sc.add(slot.root);
      slot.tryLoadModel();
      this.slots.set(loc.id, slot);
      this.pickables.push(slot.root);
      seg(loc.door, paths.nodes[paths.doors[loc.id]]);
      this.#label(loc);
    }
    this.marker = new AssetSlot('prop_event_marker', 'marker');
    this.marker.root.visible = false;
    sc.add(this.marker.root);
    this.avatar = new Avatar();
    sc.add(this.avatar.root);
    this.avatar.slot.tryLoadModel();
  }

  #label(loc) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(20,26,43,.82)';
    g.beginPath(); g.roundRect(4, 8, 248, 48, 12); g.fill();
    g.fillStyle = '#ede6d3'; g.font = '600 24px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const int = this.c.all('interiors').find((i) => i.buildingId === loc.id);
    g.fillText((int?.name ?? loc.name).replace(/ \(.*\)/, ''), 128, 33);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
    sp.scale.set(6, 1.5, 1);
    sp.position.set(loc.position[0], loc.greybox === 'guild' ? 8 : 6, loc.position[1]);
    sp.renderOrder = 10;
    this.scene.add(sp);
  }

  /** The town building of a location: itself, or location.building for a station inside. @param {string} id */
  #outer(id) {
    return this.c.get('locations', id).building ?? id;
  }

  #buildInteriors() {
    /** @type {Map<string, InteriorView>} building id -> interior */
    this.interiors = new Map();
    for (const d of this.c.all('interiors')) this.interiors.set(d.buildingId, new InteriorView(d));
    this.exitBar = document.createElement('div');
    this.exitBar.className = 'intbar';
    this.exitBar.hidden = true;
    this.exitBar.innerHTML = '<span id="intName"></span><button class="tbtn" id="intExit" title="Back to the town">Exit to town</button>';
    this.el.appendChild(this.exitBar);
    this.exitBar.querySelector('#intExit').onclick = () => this.exit();
  }

  /** The interior of the building where the player is, or null. */
  #interiorHere() {
    return this.interiors.get(this.#outer(this.s.player.location)) ?? null;
  }

  /** Show the interior (view only). @param {InteriorView} int */
  #enter(int) {
    this.inside = int;
    this.exitBar.hidden = false;
    this.exitBar.querySelector('#intName').textContent = int.data.name;
    this.#light();
    this.resize();
  }

  /** Back to the town view. The player stays at the same location (no game time). */
  exit() {
    if (!this.inside) return;
    this.inside = null;
    this.exitBar.hidden = true;
    this.#placeAvatarAt(this.s.player.location);
    this.resize();
  }

  /** Inside if the player is in a building with an interior (start of Do, after sleep). */
  #syncInside() {
    const int = this.#interiorHere();
    if (int) { int.placeAt(this.s.player.location); this.#enter(int); } else if (this.inside) this.exit();
  }

  resize() {
    const w = this.el.clientWidth || innerWidth, h = this.el.clientHeight || innerHeight;
    this.renderer.setSize(w, h);
    const half = 26 / this.zoom, aspect = w / h;
    Object.assign(this.camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    this.camera.updateProjectionMatrix();
    this.#aim();
    for (const int of this.interiors?.values() ?? []) int.resize(aspect);
  }

  #aim() {
    const off = new THREE.Vector3(40, 40, 40);
    this.camera.position.copy(this.pan).add(off);
    this.camera.lookAt(this.pan);
  }

  #input() {
    const cv = this.renderer.domElement;
    let down = null;
    cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, pan: this.pan.clone(), moved: false }; });
    cv.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 5) down.moved = true;
      if (!down.moved) return;
      const k = (this.camera.right - this.camera.left) / cv.clientWidth;
      const right = new THREE.Vector3(1, 0, -1).normalize(), fwd = new THREE.Vector3(-1, 0, -1).normalize();
      this.pan.copy(down.pan).addScaledVector(right, -dx * k).addScaledVector(fwd, dy * k * 1.4);
      this.pan.x = THREE.MathUtils.clamp(this.pan.x, -25, 25);
      this.pan.z = THREE.MathUtils.clamp(this.pan.z, -30, 25);
      this.#aim();
    });
    cv.addEventListener('pointerup', (e) => {
      const d = down;
      down = null;
      if (d && !d.moved) this.#pick(e);
    });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom = THREE.MathUtils.clamp(this.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.6, 2.2);
      this.resize();
    }, { passive: false });
  }

  #pick(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    if (this.inside) {
      ray.setFromCamera(ndc, this.inside.camera);
      let o = ray.intersectObjects(this.inside.pickables, true)[0]?.object;
      while (o && !o.userData.stationId) o = o.parent;
      const st = o && this.inside.data.stations.find((x) => x.id === o.userData.stationId);
      if (st?.locationId) this.onPick(st.locationId);
      else if (st?.panel) this.onPanel(st.panel);
      return;
    }
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects(this.pickables, true)[0];
    if (!hit) return;
    let o = hit.object;
    while (o && !o.userData.locationId) o = o.parent;
    if (o) this.onPick(o.userData.locationId);
  }

  #placeAvatarAt(locId) {
    this.avatar.points = [];
    this.avatar.place(this.c.get('locations', this.#outer(locId)).door);
  }

  /** @param {any} r action result */
  #onAction(r) {
    if (r.actionId === 'travel') {
      const from = this.lastLoc ?? 'loc_home';
      const target = this.interiors.get(this.#outer(r.to));
      if (this.inside && this.#outer(from) === this.#outer(r.to)) this.inside.walkTo(r.to);
      else {
        if (this.inside) this.exit();
        this.#placeAvatarAt(from);
        // Walk in the town; at the door, go inside if the building has an interior.
        this.avatar.walk(this.graph.route(this.#outer(from), this.#outer(r.to)), target ? () => {
          if (this.#outer(this.s.player.location) !== target.data.buildingId) return;
          target.enterTo(this.s.player.location);
          this.#enter(target);
        } : undefined);
      }
    }
    if (r.actionId === 'sleep') { this.#placeAvatarAt('loc_home'); this.#syncInside(); }
    this.lastLoc = this.s.player.location;
    this.#slotStates(r);
  }

  #slotStates(r) {
    const day = this.s.calendar.day, min = this.s.calendar.minute;
    for (const [id, slot] of this.slots) {
      const loc = this.c.get('locations', id), h = loc.openHours?.[day];
      let st = h && min >= h[0] * 60 && min < h[1] * 60 ? 'open' : 'closed';
      if (id === 'loc_home_drying_yard') st = this.s.batches.length ? (this.s.batches.some((b) => b.readyDay <= this.s.calendar.absDay()) ? 'ready' : 'drying') : 'empty';
      if (r && this.s.player.location === id && ['serve-customer'].includes(r.actionId)) st = 'busy';
      if (r && this.s.player.location === id && ['brew', 'concoct'].includes(r.actionId)) st = 'crafting';
      slot.setState(st);
    }
    for (const int of this.interiors?.values() ?? []) {
      for (const st of int.data.stations) {
        const here = this.s.player.location === st.locationId;
        let state = 'idle';
        if (st.greybox === 'cauldron' && here && r && ['brew', 'concoct'].includes(r.actionId)) state = 'crafting';
        if (st.greybox === 'counter') state = this.slots.get(st.locationId)?.state ?? 'idle';
        if (st.greybox === 'bed' && this.s.player.dayOver) state = 'sleeping';
        int.setState(st.id, state);
      }
    }
    const tired = this.s.player.energy < this.c.num('FATIGUE_THRESHOLD') || this.s.player.fatigued;
    if (!this.avatar.walking) this.avatar.slot.setState(tired ? 'tired' : 'idle');
  }

  /** Light by time of day: morning warm, noon bright, evening orange, night blue. */
  #light() {
    const h = this.s.calendar.minute / 60;
    const t = THREE.MathUtils.clamp((h - 6) / 14, 0, 1);
    const ang = Math.PI * t;
    this.sun.position.set(Math.cos(ang) * 50, Math.max(5, Math.sin(ang) * 60), 25);
    const night = h >= this.c.num('DAY_END_HOUR') + 1 || h < 6;
    const evening = h >= this.c.num('DAY_END_HOUR') - 2 && !night;
    this.sun.color.setHex(night ? 0x6070c0 : evening ? 0xffa060 : h < 9 ? 0xffd9a0 : 0xffffff);
    this.sun.intensity = night ? 0.35 : evening ? 1.1 : 1.6;
    this.hemi.intensity = night ? 0.35 : 0.9;
    this.scene.background.setHex(night ? 0x1c2440 : evening ? 0xe0a070 : 0x9fc3e0);
    for (const int of this.interiors?.values() ?? []) int.light(night ? 'night' : evening ? 'evening' : 'day');
    this.#slotStates();
  }

  #frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.el.hidden) return;
    this.avatar.update(dt);
    if (this.inside) {
      this.inside.update(dt);
      this.renderer.render(this.inside.scene, this.inside.camera);
      return;
    }
    if (this.marker.root.visible) {
      this.marker.root.position.copy(this.avatar.root.position);
      this.marker.root.position.y = 3 + Math.sin(performance.now() / 300) * 0.25;
      this.marker.root.rotation.y += dt * 2;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
