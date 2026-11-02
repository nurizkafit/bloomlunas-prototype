import * as THREE from 'three';
import { AssetSlot } from './AssetSlot.js';

/**
 * Avatar: the player character (slot chr_avatar). Walks a list of points at a fixed view speed.
 * The walk is only a picture: game time for travel comes from logic (ActionRunner).
 * States: idle, walk, work, tired. Unity: character prefab + simple waypoint mover.
 */
export class Avatar {
  constructor() {
    this.slot = new AssetSlot('chr_avatar', 'avatar');
    this.slot.greybox.clear();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1, 4, 10), new THREE.MeshStandardMaterial({ color: 0xe9b44c, roughness: 0.7 }));
    body.position.y = 0.95;
    body.castShadow = true;
    body.userData.tintable = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf1e6ca }));
    head.position.y = 1.9;
    this.slot.greybox.add(body, head);
    this.root = this.slot.root;
    this.points = [];
    this.speed = 14;
    this.onArrive = null;
  }

  /** @param {[number, number]} p */
  place(p) {
    this.root.position.set(p[0], 0, p[1]);
  }

  /** @param {[number, number][]} points @param {()=>void} [onArrive] */
  walk(points, onArrive) {
    this.points = points.map((p) => new THREE.Vector3(p[0], 0, p[1]));
    this.onArrive = onArrive ?? null;
    this.slot.setState('walk');
  }

  get walking() { return this.points.length > 0; }

  /** @param {number} dt seconds */
  update(dt) {
    if (!this.points.length) return;
    const pos = this.root.position, target = this.points[0];
    const d = target.clone().sub(pos);
    const step = this.speed * dt;
    if (d.length() <= step) {
      pos.copy(target);
      this.points.shift();
      if (!this.points.length) { this.slot.setState('idle'); this.onArrive?.(); }
    } else {
      pos.add(d.normalize().multiplyScalar(step));
      this.root.rotation.y = Math.atan2(d.x, d.z);
    }
    this.root.position.y = this.walking ? Math.abs(Math.sin(performance.now() / 90)) * 0.12 : 0;
  }
}
