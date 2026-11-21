// Kota Senja v5 — polisi: wanted, patroli, roadblock, helikopter + dispatch.
const THREE = window.THREE;
import { POLICE_UNITS } from './config.js';

export class Police {
  constructor(scene, city, player, state) {
    this.scene = scene;
    this.city = city;
    this.player = player;
    this.state = state;
    this.units = []; // mobil polisi aktif
    this.foot = []; // polisi jalan kaki
    this.heli = null;
    this.heliTarget = null;
    this.roadblocks = [];
    this.spawnT = 0;
    this.dispatch = [];
    this.announcedHeli = false;
    this.freezeHeli = false;
  }

  setWanted(n, silent = false) {
    const old = this.state.wanted;
    this.state.wanted = Math.max(0, Math.min(5, n));
    if (this.state.wanted >= 4 && !this.heli) this.spawnHeli();
    if (this.state.wanted < 4 && this.heli) this.removeHeli();
    if (this.state.wanted >= 3 && this.roadblocks.length === 0) this.spawnRoadblocks();
    if (this.state.wanted < 3) this.clearRoadblocks();
    if (!silent && this.state.wanted > old && this.state.wanted >= 2) {
      this.refreshDispatch();
    }
    if (this.state.wanted === 0) this.dispatch = [];
  }

  addWanted(n) { this.setWanted(this.state.wanted + n); }

  spawnHeli() {
    const h = this.city.makeHeliMesh(1.9);
    const p = this.player.pos;
    h.position.set(p.x - 10, 42, p.z - 40);
    this.scene.add(h);
    this.city.heli = h;
    this.heli = h;
    this.announcedHeli = true;
  }

  removeHeli() {
    if (!this.heli) return;
    this.scene.remove(this.heli);
    this.city.heli = null;
    this.heli = null;
    this.announcedHeli = false;
  }

  placeHeli(x, y, z) {
    if (!this.heli) this.spawnHeli();
    this.heli.position.set(x, y, z);
  }

  spawnRoadblocks() {
    const p = this.player.pos;
    for (let i = 0; i < 2; i++) {
      const car = this.city.makeCar(0x1a1a22, true);
      car.position.set(p.x - 8 + i * 16, 0, p.z - 45);
      car.rotation.y = Math.PI / 2;
      this.scene.add(car);
      this.roadblocks.push(car);
    }
  }

  clearRoadblocks() {
    for (const c of this.roadblocks) this.scene.remove(c);
    this.roadblocks = [];
  }

  refreshDispatch() {
    const p = this.player.pos;
    const n = Math.min(this.state.wanted + 1, POLICE_UNITS.length);
    this.dispatch = [];
    for (let i = 0; i < n; i++) {
      const u = POLICE_UNITS[i];
      const d = Math.round(18 + Math.random() * 40);
      this.dispatch.push({ id: u.id, role: u.role, dist: d });
    }
    if (this.heli) this.dispatch.push({ id: 'CONDOR-1', role: 'Spotlight', dist: 'OVERHEAD' });
    if (this.roadblocks.length) this.dispatch.push({ id: 'ROADBLOCK', role: 'Blockade', dist: this.roadblocks.length + ' SET · AHEAD' });
  }

  forceSpawnAt(x, z, count = 2) {
    for (let i = 0; i < count; i++) {
      const car = this.city.makeCar(0x1a1a22, true);
      car.position.set(x + (i - 0.5) * 10, 0, z + i * 6);
      this.scene.add(car);
      this.units.push({ mesh: car, speed: 14 + i * 2, unit: POLICE_UNITS[i % POLICE_UNITS.length] });
    }
    this.refreshDispatch();
  }

  update(dt, t) {
    const s = this.state;
    if (s.wanted > 0) {
      this.spawnT -= dt;
      const want = Math.min(s.wanted + 1, 5);
      if (this.spawnT <= 0 && this.units.length < want) {
        this.spawnT = 1.2;
        const p = this.player.pos;
        const a = Math.random() * Math.PI * 2;
        const car = this.city.makeCar(0x1a1a22, true);
        car.position.set(p.x + Math.cos(a) * 55, 0, p.z + Math.sin(a) * 55);
        this.scene.add(car);
        this.units.push({ mesh: car, speed: 15 + s.wanted * 2, unit: POLICE_UNITS[this.units.length % POLICE_UNITS.length] });
        this.refreshDispatch();
      }
      // Polisi jalan kaki saat pemain jalan kaki
      if (this.player.onFoot && this.foot.length < Math.min(s.wanted, 3) && Math.random() < dt * 0.5) {
        const p = this.player.pos;
        const man = this.city.makePerson(0x1a2a4a);
        man.position.set(p.x + 20 - Math.random() * 40, 0, p.z + 20 - Math.random() * 40);
        this.scene.add(man);
        this.foot.push(man);
      }
    }
    // Kejar pemain
    const p = this.player.pos;
    for (const u of this.units) {
      const m = u.mesh;
      const dx = p.x - m.position.x, dz = p.z - m.position.z;
      const d = Math.hypot(dx, dz) || 1;
      const targetYaw = Math.atan2(dx, dz);
      let dy = targetYaw - m.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      m.rotation.y += Math.max(-2.4 * dt, Math.min(2.4 * dt, dy));
      const sp = Math.min(u.speed, d > 6 ? u.speed : 4);
      m.position.x += Math.sin(m.rotation.y) * sp * dt;
      m.position.z += Math.cos(m.rotation.y) * sp * dt;
      // Tabrak pemain di mobil: kurangi kondisi
      if (d < 3.4 && !this.player.onFoot) {
        this.player.carCondition = Math.max(0, this.player.carCondition - 6 * dt);
        this.player.speed *= 0.98;
      }
      if (d > 160) {
        // teleport ulang mendekat supaya kejaran tak hilang
        const a = Math.random() * Math.PI * 2;
        m.position.set(p.x + Math.cos(a) * 60, 0, p.z + Math.sin(a) * 60);
      }
    }
    for (const f of this.foot) {
      const dx = p.x - f.position.x, dz = p.z - f.position.z;
      const d = Math.hypot(dx, dz) || 1;
      f.position.x += (dx / d) * 3.4 * dt;
      f.position.z += (dz / d) * 3.4 * dt;
      f.rotation.y = Math.atan2(dx, dz);
      if (d < 1.6) {
        s.health = Math.max(0, s.health - 12 * dt);
      }
    }
    // Helikopter mengikuti dari atas
    if (this.heli) {
      const h = this.heli;
      if (!this.freezeHeli) {
        const tx = p.x - 6, tz = p.z - 30;
        h.position.x += (tx - h.position.x) * Math.min(1, dt * 0.6);
        h.position.z += (tz - h.position.z) * Math.min(1, dt * 0.6);
        h.position.y = 42 + Math.sin(t * 0.8) * 1.5;
        h.rotation.y = Math.atan2(p.x - h.position.x, p.z - h.position.z);
      }
      this.city.aimSpotlight(h);
    }
    // Wanted turun pelan saat bersembunyi (tidak ada polisi dekat)
    if (s.wanted > 0 && this.units.length === 0 && !this.heli) {
      s._coolT = (s._coolT || 0) + dt;
      if (s._coolT > 20) { s.wanted--; s._coolT = 0; this.refreshDispatch(); }
    } else s._coolT = 0;
  }

  clearAll() {
    for (const u of this.units) this.scene.remove(u.mesh);
    for (const f of this.foot) this.scene.remove(f);
    this.units = []; this.foot = [];
    this.removeHeli();
    this.clearRoadblocks();
    this.dispatch = [];
  }
}
