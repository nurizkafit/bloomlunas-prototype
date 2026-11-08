import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

/**
 * SceneView: the 3D City View and the interior rooms (user decisions: move by a place list over the 3D town;
 * a 3D room for each building). Builds the town and the rooms from data/scene/town.json with Kenney CC0
 * placeholder models (assets/models/kenney/), tints roofs and ground to the M2 town colours, moves the camera
 * to the current place or into its room, walks a few townsfolk along the roads, shifts the light from day
 * to moon light, and keeps DOM hotspots (stations, places) over their 3D anchors.
 * The watercolor look comes from the CSS filter and paper veil on top of the canvas.
 * It reads GameState only (through sync). Unity: the town scene + Cinemachine camera.
 */
export class SceneView {
  /** @param {import('../../core/ContentDB.js').ContentDB} content */
  constructor(content) {
    this.content = content;
    this.data = content.find('scene', 'town');
    this.cache = new Map();
    this.mixers = [];
    this.walkers = [];
    this.focus = 'overview';
    this.minute = 9 * 60;
    this.target = new THREE.Vector3();
    this.camGoal = new THREE.Vector3();
    this.ready = false;
    this.offsetX = 0;
    this.rooms = new Map();
    this.spots = [];
    this.selected = null;
  }

  /** @param {HTMLElement} el */
  mount(el) {
    this.el = el;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false });
    } catch (e) {
      console.warn('SceneView: no WebGL, the city backdrop is off.', e);
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.2;
    el.append(r.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.5, 200);
    this.#lights();
    this.#ground();
    this.#resize();
    new ResizeObserver(() => this.#resize()).observe(el);
    this.clock = new THREE.Timer();
    this.#build().then(() => { this.ready = true; }).catch((e) => console.warn('SceneView: model load failed', e));
    const loop = () => { requestAnimationFrame(loop); if (!document.hidden) this.#frame(); };
    loop();
  }

  /** Called by UiRoot on each draw. @param {any} state @param {any} local */
  sync(state, local) {
    if (!this.data) return;
    const inGame = local.screen === 'game', doing = inGame && state.phase === 'do';
    const room = this.data.rooms?.[state.place];
    this.focus = doing && !local.map ? (room ? `room:${state.place}` : state.place) : 'overview';
    this.selected = doing && local.map ? local.pick?.place ?? null : null;
    this.minute = inGame ? state.cal.minute : 16 * 60;
    this.playerPlace = inGame ? state.place : null;
    // Free view area: right of the station list or the place list when no window is open.
    this.offsetX = doing && !local.station && !local.journal ? -150 : 0;
  }

  /**
   * DOM hotspots kept over 3D anchors. kind 'station' uses the current room; kind 'place' uses the town.
   * @param {{kind:'station'|'place', id:string, el:HTMLElement}[]} items
   */
  setSpots(items) {
    this.spots = items.map((it) => ({ ...it, pos: this.#anchor(it.kind, it.id) })).filter((s) => s.pos);
    this.#placeSpots();
  }

  #anchor(kind, id) {
    const d = this.data;
    if (!d) return null;
    if (kind === 'place') {
      const p = d.places[id];
      return p ? new THREE.Vector3(p.x, id === 'outskirt' ? 1.2 : 2.6, p.z) : null;
    }
    const key = this.focus.startsWith('room:') ? this.focus.slice(5) : null;
    const r = key && d.rooms[key];
    const a = r?.stations?.[id];
    if (r && a) return new THREE.Vector3(r.origin[0] + a[0], a[1], r.origin[1] + a[2]);
    if (!key && id === 'explore' && d.places.outskirt) return new THREE.Vector3(d.places.outskirt.x, 1.0, d.places.outskirt.z);
    return null;
  }

  #placeSpots() {
    if (!this.camera || !this.spots.length) return;
    const v = new THREE.Vector3();
    for (const s of this.spots) {
      v.copy(s.pos).project(this.camera);
      const hide = !this.ready || v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05 || ((v.x + 1) / 2) * 1280 < 340; // under the side panel
      s.el.style.visibility = hide ? 'hidden' : 'visible';
      const half = (s.el.offsetWidth || 0) / 2 + 8;
      s.el.style.left = `${Math.min(1280 - half, Math.max(half, ((v.x + 1) / 2) * 1280))}px`;
      s.el.style.top = `${((1 - v.y) / 2) * 720}px`;
    }
  }

  /* ---------- build ---------- */
  #lights() {
    const d = this.data;
    this.hemi = new THREE.HemisphereLight(d?.light.sky ?? '#ffffff', '#8FA56E', 1.8);
    this.sun = new THREE.DirectionalLight(d?.light.day ?? '#ffffff', 2.4);
    this.sun.position.set(-8, 16, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -18; sc.right = 18; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.radius = 3;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.scene.fog = new THREE.Fog(d?.light.sky ?? '#D8E3D0', 28, 70);
  }

  #ground() {
    const t = this.data?.tints ?? {};
    const g = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: t.ground ?? '#A9B886', roughness: 1 }));
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    this.scene.add(g);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(3.6, 48), new THREE.MeshStandardMaterial({ color: t.plaza ?? '#DCCFAF', roughness: 1 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; plaza.receiveShadow = true;
    this.scene.add(plaza);
    const pathMat = new THREE.MeshStandardMaterial({ color: t.path ?? '#B8A887', roughness: 1 });
    for (const road of this.data?.roads ?? []) {
      for (let i = 0; i < road.length - 1; i++) {
        const [ax, az] = road[i], [bx, bz] = road[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const seg = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.9), pathMat);
        seg.rotation.x = -Math.PI / 2;
        seg.rotation.z = -Math.atan2(bz - az, bx - ax);
        seg.position.set((ax + bx) / 2, 0.015, (az + bz) / 2);
        seg.receiveShadow = true;
        this.scene.add(seg);
      }
      for (const [x, z] of road) {
        const j = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), pathMat);
        j.rotation.x = -Math.PI / 2; j.position.set(x, 0.016, z); j.receiveShadow = true;
        this.scene.add(j);
      }
    }
    // Home herb bed and outskirt meadow (washed colour patches).
    const patch = (x, z, rx, rz, color) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
      m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1); m.position.set(x, 0.012, z); m.receiveShadow = true;
      this.scene.add(m);
    };
    patch(-10, 3.5, 1.8, 2.4, t.herb ?? '#6E9A6A');
    patch(9.5, 5.5, 5.5, 4.2, '#8FA56E');
    patch(7, -5.2, 3.4, 2.6, t.plaza ?? '#DCCFAF');
  }

  async #build() {
    const d = this.data;
    const names = new Set(d.props.map((p) => p.m));
    for (const h of d.houses) {
      const w = d.walls[h.wall];
      for (const k of Object.values(w)) names.add(`fantasy-town-kit/${k}`);
      names.add(`fantasy-town-kit/${h.roof}`);
    }
    for (const w of d.walkers) names.add(w.m);
    names.add(d.player.m);
    for (const r of this.#roomList()) {
      for (const p of r.props) names.add(p.m);
      for (const n of r.npc ?? []) names.add(n.m);
      for (const w of r.walkers ?? []) names.add(w.m);
    }
    const loader = new GLTFLoader();
    await Promise.all([...names].map((n) => loader.loadAsync(`${d.base}${n}.glb`).then((g) => this.cache.set(n, g)).catch((e) => console.warn('missing model', n, e))));
    for (const h of d.houses) this.#house(h);
    for (const p of d.props) {
      const o = this.#inst(p.m);
      if (!o) continue;
      o.position.set(p.x, p.y ?? 0, p.z);
      o.rotation.y = THREE.MathUtils.degToRad(p.r ?? 0);
      o.scale.setScalar(p.s ?? 1);
      this.scene.add(o);
    }
    for (const w of d.walkers) this.#walker(w);
    this.player = this.#character(d.player.m, 'idle');
    if (this.player) this.scene.add(this.player.obj);
    for (const [key, r] of Object.entries(d.rooms ?? {})) if (r && r.origin) this.#room(key, r);
  }

  #roomList() { return Object.values(this.data.rooms ?? {}).filter((r) => r && r.origin); }

  /** One interior: floor, back and side walls (front open), beams, windows, boards, props and NPCs. */
  #room(key, r) {
    const g = new THREE.Group();
    const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, ...extra });
    const box = (w, h, dd, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const W = r.w, D = r.d, H = r.h, t = 0.12;
    const wall = mat(r.wall), beam = mat(r.beam), floor = mat(r.floor);
    if (r.outdoor) this.#yard(g, r, mat);
    else this.#walls(g, r, mat, box, W, D, H, t, wall, beam, floor);
    this.#roomProps(g, r, mat, box, beam, H);
    g.position.set(r.origin[0], 0, r.origin[1]);
    this.scene.add(g);
    this.rooms.set(key, { g, r });
    // Shoppers walk in world space along room-local paths.
    for (const w of r.walkers ?? []) this.#walker({ ...w, path: w.path.map(([x, z]) => [x + r.origin[0], z + r.origin[1]]) });
  }

  /** Open-air set (user decision, 8 Nov 2026): ground, paving, no walls. */
  #yard(g, r, mat) {
    const ground = new THREE.Mesh(new THREE.CircleGeometry(r.groundR ?? 26, 48), mat(r.ground ?? '#A9B886'));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; g.add(ground);
    const pave = new THREE.Mesh(new THREE.CylinderGeometry(r.paveR ?? 5.2, r.paveR ?? 5.2, 0.06, 40), mat(r.floor));
    pave.position.set(0, 0.0, 0.2); pave.receiveShadow = true; g.add(pave);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r.paveR ?? 5.2, 0.07, 6, 48), mat(r.beam));
    ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.03, 0.2); g.add(ring);
    for (const [x, z, w, d] of r.paths ?? []) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mat(r.path ?? r.floor));
      m.position.set(x, -0.005, z); m.receiveShadow = true; g.add(m);
    }
  }

  #walls(g, r, mat, box, W, D, H, t, wall, beam, floor) {
    box(W + 2 * t, 0.1, D + 0.6, 0, -0.05, 0.3, floor);
    box(W + 2 * t, H, t, 0, H / 2, -D / 2 - t / 2, wall);
    box(t, H, D, -W / 2 - t / 2, H / 2, 0, wall);
    box(t, H, D, W / 2 + t / 2, H / 2, 0, wall);
    // Skirting, top beam and posts in dark wood.
    box(W, 0.12, 0.04, 0, 0.06, -D / 2 + 0.02, beam);
    box(W + 2 * t, 0.14, t + 0.04, 0, H - 0.07, -D / 2 - t / 2, beam);
    for (const x of [-W / 2, W / 2]) box(0.16, H, 0.16, x, H / 2, -D / 2, beam);
    for (const x of [-W / 2 - t / 2, W / 2 + t / 2]) box(t + 0.04, 0.14, D, x, H - 0.07, 0, beam);
    // Floor boards (lines).
    for (let i = -W / 2 + 0.5; i < W / 2; i += 0.5) box(0.015, 0.005, D + 0.5, i, 0.003, 0.25, beam);
    for (const [x, y] of r.windows ?? []) {
      box(0.9, 0.7, 0.03, x, y, -D / 2 + 0.02, mat('#F6E7B8', { emissive: '#F6E7B8', emissiveIntensity: 0.55 }));
      box(0.06, 0.78, 0.05, x, y, -D / 2 + 0.04, beam); box(0.98, 0.06, 0.05, x, y, -D / 2 + 0.04, beam);
      box(1.02, 0.08, 0.1, x, y - 0.4, -D / 2 + 0.06, beam);
    }
  }

  #roomProps(g, r, mat, box, beam, H) {
    for (const b of r.boards ?? []) {
      box(b.w + 0.12, b.h + 0.12, 0.05, b.x, b.y, b.z, beam);
      box(b.w, b.h, 0.06, b.x, b.y, b.z + 0.01, mat('#C8A57A'));
      for (let i = 0; i < b.notes; i++) {
        const col = i % 4, row = Math.floor(i / 4);
        const n = box(0.3, 0.36, 0.01, b.x - b.w / 2 + 0.3 + col * 0.42, b.y + b.h / 2 - 0.3 - row * 0.48, b.z + 0.05, mat(i % 3 ? '#F4ECDB' : '#EBD9A8'));
        n.rotation.z = ((i * 37) % 9 - 4) * 0.03;
      }
    }
    for (const p of r.props) {
      const o = this.#inst(p.m);
      if (!o) continue;
      o.scale.setScalar(p.s ?? 1);
      o.rotation.y = THREE.MathUtils.degToRad(p.r ?? 0);
      o.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
      o.position.set(p.x - c.x, (p.y ?? 0) - bb.min.y, p.z - c.z);
      g.add(o);
    }
    if (!r.outdoor) {
      const lamp = new THREE.PointLight('#FFD9A0', 6, 9, 1.6);
      lamp.position.set(0, H + 0.6, 0.6);
      g.add(lamp);
    }
    for (const n of r.npc ?? []) {
      const c = this.#character(n.m, 'idle');
      if (!c) continue;
      c.obj.position.set(n.x, 0, n.z);
      c.obj.rotation.y = THREE.MathUtils.degToRad(n.r ?? 0);
      g.add(c.obj);
    }
  }

  /** A clone of a loaded model, with matte materials and shadows. @param {string} name @param {string} [tint] */
  #inst(name, tint) {
    const g = this.cache.get(name);
    if (!g) return null;
    const o = g.scene.clone(true);
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      m.material = m.material.clone();
      m.material.roughness = 1; m.material.metalness = 0;
      if (tint) { m.material.map = null; m.material.color = new THREE.Color(tint); }
    });
    return o;
  }

  #house(h) {
    const d = this.data, w = d.walls[h.wall];
    const g = new THREE.Group();
    const rot = { 'x+': 0, 'z-': Math.PI / 2, 'x-': Math.PI, 'z+': -Math.PI / 2 };
    for (let f = 0; f < h.floors; f++) {
      for (let i = 0; i < h.w; i++) {
        for (let j = 0; j < h.d; j++) {
          const cx = -h.w / 2 + 0.5 + i, cz = -h.d / 2 + 0.5 + j;
          const sides = [];
          if (j === h.d - 1) sides.push('z+');
          if (j === 0) sides.push('z-');
          if (i === h.w - 1) sides.push('x+');
          if (i === 0) sides.push('x-');
          for (const s of sides) {
            const door = f === 0 && s === h.front && i === Math.floor(h.w / 2);
            const kind = door ? w.door : (i + j + f) % 2 === 0 ? w.window : w.plain;
            const o = this.#inst(`fantasy-town-kit/${kind}`);
            if (!o) continue;
            o.position.set(cx, f, cz);
            o.rotation.y = rot[s];
            g.add(o);
          }
        }
      }
    }
    // Floor slab so the inside does not show the ground through gaps.
    const slab = new THREE.Mesh(new THREE.BoxGeometry(h.w, 0.06, h.d), new THREE.MeshStandardMaterial({ color: d.tints[h.wall] ?? '#E8DFCB', roughness: 1 }));
    slab.position.y = 0.03; slab.receiveShadow = true;
    g.add(slab);
    const roof = this.#inst(`fantasy-town-kit/${h.roof}`, d.tints[h.roofTint]);
    if (roof) {
      roof.scale.set(h.w, h.roof === 'roof-high-point' ? 1.2 : Math.max(h.w, h.d) * 0.7, h.d);
      roof.position.y = h.floors;
      g.add(roof);
    }
    g.position.set(h.x, 0, h.z);
    this.scene.add(g);
  }

  /** @param {string} name @param {string} clip */
  #character(name, clip) {
    const g = this.cache.get(name);
    if (!g) return null;
    const obj = cloneSkinned(g.scene);
    obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.material = m.material.clone(); m.material.roughness = 1; m.material.metalness = 0; } });
    const mixer = new THREE.AnimationMixer(obj);
    const a = g.animations.find((x) => x.name === clip) ?? g.animations[0];
    if (a) mixer.clipAction(a).play();
    this.mixers.push(mixer);
    return { obj, mixer };
  }

  #walker(w) {
    const c = this.#character(w.m, 'walk');
    if (!c) return;
    const pts = w.path.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(pts, w.path.length > 2 && w.path[0][0] === w.path.at(-1)[0] && w.path[0][1] === w.path.at(-1)[1]);
    const len = curve.getLength();
    this.walkers.push({ ...c, curve, len, speed: w.speed, t: Math.random(), dir: 1 });
    this.scene.add(c.obj);
  }

  /* ---------- frame ---------- */
  #frame() {
    this.clock.update(); const dt = Math.min(0.05, this.clock.getDelta());
    const d = this.data;
    if (!d) return;
    const sway = Math.sin(this.clock.getElapsed() * 0.06) * 0.12;
    const roomKey = this.focus.startsWith('room:') ? this.focus.slice(5) : null;
    const room = roomKey ? d.rooms[roomKey] : null;
    let goal, dir, dist;
    if (room) {
      const c = room.cam;
      goal = new THREE.Vector3(room.origin[0] + (c.tx ?? 0.2), 0.55, room.origin[1] + (c.tz ?? 0.1));
      dir = new THREE.Vector3(Math.sin(c.yaw + sway * 0.4), c.pitch, Math.cos(c.yaw + sway * 0.4)).normalize();
      dist = c.dist;
    } else {
      const place = d.places[this.focus] ?? d.places.overview;
      goal = new THREE.Vector3(place.x, 0.4, place.z);
      dir = new THREE.Vector3(Math.sin(0.62 + sway), 0.82, Math.cos(0.62 + sway)).normalize();
      dist = place.dist;
    }
    // Cut (no long glide) when the camera goes in or out of a room.
    const cut = this.lastRoom !== roomKey;
    this.lastRoom = roomKey;
    if (cut) this.target.copy(goal); else this.target.lerp(goal, 1 - Math.pow(0.02, dt));
    this.camGoal.copy(this.target).addScaledVector(dir, dist);
    if (cut) this.camera.position.copy(this.camGoal); else this.camera.position.lerp(this.camGoal, 1 - Math.pow(0.05, dt));
    this.camera.lookAt(this.target);
    this.inRoom = !!room;
    this.indoor = !!room && !room.outdoor;
    if (this.view?.x !== this.offsetX) this.#resize();
    for (const m of this.mixers) m.update(dt);
    for (const w of this.walkers) {
      w.t += (w.speed * dt * w.dir) / w.len;
      if (w.t > 1 || w.t < 0) { w.dir *= -1; w.t = Math.max(0, Math.min(1, w.t)); }
      const p = w.curve.getPointAt(w.t), ahead = w.curve.getPointAt(Math.max(0, Math.min(1, w.t + 0.01 * w.dir)));
      w.obj.position.copy(p);
      w.obj.lookAt(ahead.x, 0, ahead.z);
    }
    if (this.player && this.playerPlace) {
      const rp = this.inRoom && d.rooms[this.playerPlace]?.player;
      if (rp) {
        const o = d.rooms[this.playerPlace].origin;
        this.player.obj.position.set(o[0] + rp[0], 0, o[1] + rp[1]); this.player.obj.rotation.y = THREE.MathUtils.degToRad(rp[2] ?? 0);
      } else {
        const s = d.player.spots[this.playerPlace];
        if (s) { this.player.obj.position.set(s[0], 0, s[1]); this.player.obj.rotation.y = 0.6; }
      }
      this.player.obj.visible = true;
    } else if (this.player) this.player.obj.visible = false;
    this.#light();
    this.renderer.render(this.scene, this.camera);
    this.#placeSpots();
  }

  /** Day light to moon light by the clock. */
  #light() {
    const d = this.data.light;
    const h = this.minute / 60;
    const night = THREE.MathUtils.smoothstep(h, 17, 21);
    const dawn = 1 - THREE.MathUtils.smoothstep(h, 6, 7.5);
    const k = Math.max(night, dawn * 0.25);
    this.sun.color.set(d.day).lerp(new THREE.Color(d.moon), k);
    this.sun.intensity = 2.4 - 1.5 * k;
    this.hemi.intensity = 1.8 - 0.9 * k;
    const sky = this.indoor ? new THREE.Color(d.indoor ?? '#3B2F26').lerp(new THREE.Color('#1E1A1C'), k * 0.6) : new THREE.Color(d.sky).lerp(new THREE.Color(d.skyNight), k * 0.8);
    this.scene.background = sky;
    this.scene.fog.color.copy(sky);
    if (this.indoor) { this.hemi.intensity = 1.5 - 0.5 * k; this.sun.intensity = 1.6 - 1.0 * k; }
    const a = THREE.MathUtils.mapLinear(Math.min(Math.max(h, 6), 22), 6, 22, -0.9, 0.9);
    this.sun.position.set(this.target.x + a * 14, 16, this.target.z + 10);
    this.sun.target.position.copy(this.target);
  }

  #resize() {
    if (!this.renderer) return;
    const w = this.el.clientWidth || 1280, h = this.el.clientHeight || 720;
    const scale = (this.el.getBoundingClientRect().width || w) / w;
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio * scale));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.view = { x: this.offsetX };
    if (this.offsetX) this.camera.setViewOffset(w, h, this.offsetX * (w / 1280), 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }
}
