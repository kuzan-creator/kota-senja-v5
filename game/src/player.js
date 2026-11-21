// Kota Senja v5 — pemain: jalan kaki + mengemudi + curi mobil.
const THREE = window.THREE;
import { VEHICLES } from './config.js';

const KIND_BY_ID = { garuda: 'sport', elang: 'pickup', naga: 'van', komodo: 'sedan', kancil: 'sedan' };

export class Player {
  constructor(scene, city) {
    this.scene = scene;
    this.city = city;
    this.pos = new THREE.Vector3(0, 0, 60);
    this.yaw = 0; // arah hadap (radian)
    this.speed = 0;
    this.onFoot = true;
    this.car = null;
    this.carDef = null;
    this.carCondition = 100;
    this.carName = '';
    this.keys = {};
    this.walkSpeed = 9;
    this.cars = []; // mobil yang bisa dicuri / dikendarai
    this.buildAvatar();
    this.spawnParkedCars();
  }

  buildAvatar() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8), new THREE.MeshLambertMaterial({ color: 0xd85a2a }));
    body.position.y = 0.9; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 10), new THREE.MeshLambertMaterial({ color: 0xe8b98a }));
    head.position.y = 1.75; g.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.18, 10), new THREE.MeshLambertMaterial({ color: 0x222831 }));
    cap.position.y = 1.95; g.add(cap);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), new THREE.MeshLambertMaterial({ color: 0x2a3444 }));
    legs.position.y = 0.35; g.add(legs);
    g.position.copy(this.pos);
    this.scene.add(g);
    this.avatar = g;
  }

  spawnParkedCars() {
    const spots = [
      { def: VEHICLES[0], x: 160, z: -120 },
      { def: VEHICLES[1], x: 30, z: 42 },
      { def: VEHICLES[2], x: -58, z: -28 },
      { def: VEHICLES[3], x: 62, z: 92 },
      { def: VEHICLES[4], x: -118, z: 92 },
      { def: VEHICLES[1], x: 122, z: 32 },
      { def: VEHICLES[3], x: -28, z: -88 },
      { def: VEHICLES[2], x: 90, z: -148 },
    ];
    for (const s of spots) {
      const mesh = this.city.makeCar(s.def.color, false, KIND_BY_ID[s.def.id] || 'sedan');
      mesh.position.set(s.x, 0, s.z);
      mesh.rotation.y = (Math.random() - 0.5) * 0.6;
      this.scene.add(mesh);
      this.cars.push({ def: s.def, mesh, taken: false, condition: 62 + Math.floor(Math.random() * 36) });
    }
  }

  nearestCar(maxD = 7) {
    let best = null, bd = maxD;
    for (const c of this.cars) {
      if (c.taken) continue;
      const d = c.mesh.position.distanceTo(this.pos);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  enterCar(c) {
    c.taken = true;
    this.car = c;
    this.carDef = c.def;
    this.carName = c.def.name;
    this.carCondition = c.condition;
    this.onFoot = false;
    this.avatar.visible = false;
    this.speed = 0;
    this.yaw = c.mesh.rotation.y;
    return c;
  }

  exitCar() {
    if (!this.car) return;
    this.pos.copy(this.car.mesh.position);
    this.pos.x += 3;
    this.avatar.visible = true;
    this.avatar.position.copy(this.pos);
    this.car = null;
    this.carDef = null;
    this.onFoot = true;
    this.speed = 0;
  }

  teleport(x, z, yaw = null) {
    this.pos.set(x, 0, z);
    if (yaw !== null) this.yaw = yaw;
    if (this.onFoot) {
      this.avatar.position.copy(this.pos);
    } else if (this.car) {
      this.car.mesh.position.set(x, 0, z);
      if (yaw !== null) this.car.mesh.rotation.y = yaw;
    }
    this.speed = 0;
  }

  forceIntoCar(defId) {
    const def = VEHICLES.find(v => v.id === defId) || VEHICLES[0];
    let c = this.cars.find(x => x.def.id === defId && !x.taken);
    if (!c) {
      const mesh = this.city.makeCar(def.color, false, KIND_BY_ID[def.id] || 'sedan');
      mesh.position.copy(this.pos);
      this.scene.add(mesh);
      c = { def, mesh, taken: false, condition: 62 };
      this.cars.push(c);
    }
    this.enterCar(c);
    return c;
  }

  update(dt) {
    const k = this.keys;
    if (this.onFoot) {
      // Gerak relatif terhadap kamera: W = maju menjauhi kamera, D = kanan layar.
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const rx = -Math.cos(this.yaw), rz = Math.sin(this.yaw);
      const fwd = ((k['KeyW'] || k['ArrowUp']) ? 1 : 0) - ((k['KeyS'] || k['ArrowDown']) ? 1 : 0);
      const strafe = ((k['KeyD'] || k['ArrowRight']) ? 1 : 0) - ((k['KeyA'] || k['ArrowLeft']) ? 1 : 0);
      let mx = fx * fwd + rx * strafe;
      let mz = fz * fwd + rz * strafe;
      if (mx || mz) {
        const len = Math.hypot(mx, mz);
        mx /= len; mz /= len;
        this.pos.x += mx * this.walkSpeed * dt;
        this.pos.z += mz * this.walkSpeed * dt;
        this.yaw = Math.atan2(mx, mz);
        this.avatar.rotation.y = this.yaw;
      }
      this.pos.x = Math.max(-195, Math.min(195, this.pos.x));
      this.pos.z = Math.max(-195, Math.min(195, this.pos.z));
      this.avatar.position.copy(this.pos);
    } else if (this.car) {
      const def = this.carDef;
      const up = this.carDef ? (this.carDef.upgradeBoost || 0) : 0;
      const top = (def.top + up) * 0.447; // km/h -> m/s kira-kira
      const accel = def.accel;
      if (k['KeyW'] || k['ArrowUp']) this.speed += accel * dt;
      else if (k['KeyS'] || k['ArrowDown']) this.speed -= accel * 1.4 * dt;
      else this.speed *= Math.pow(0.4, dt);
      if (k['Space']) this.speed *= Math.pow(0.02, dt);
      this.speed = Math.max(-12, Math.min(top, this.speed));
      const steer = (k['KeyA'] || k['ArrowLeft'] ? 1 : 0) - (k['KeyD'] || k['ArrowRight'] ? 1 : 0);
      const dir = this.speed >= 0 ? 1 : -1;
      this.yaw += steer * 1.9 * dt * dir * Math.min(1, Math.abs(this.speed) / 8);
      const m = this.car.mesh;
      m.position.x += Math.sin(this.yaw) * this.speed * dt;
      m.position.z += Math.cos(this.yaw) * this.speed * dt;
      m.rotation.y = this.yaw;
      this.pos.copy(m.position);
      this.pos.x = Math.max(-195, Math.min(205, this.pos.x));
      this.pos.z = Math.max(-205, Math.min(195, this.pos.z));
      m.position.copy(this.pos);
    }
  }

  kmh() {
    if (!this.onFoot) return Math.abs(this.speed) * 2.237;
    return 0;
  }
}
