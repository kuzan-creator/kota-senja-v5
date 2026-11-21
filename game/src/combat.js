// Kota Senja v5 — tembak-menembak + weapon wheel.
const THREE = window.THREE;
import { WEAPONS } from './config.js';

export class Combat {
  constructor(scene, player, state, missions, police) {
    this.scene = scene;
    this.player = player;
    this.state = state;
    this.missions = missions;
    this.police = police;
    this.lastShot = 0;
    this.tracers = [];
    this.wheelOpen = false;
  }

  selectWeapon(i) {
    const w = WEAPONS[i];
    if (!w || w.locked) return false;
    this.state.weapon = i;
    return true;
  }

  cycleWeapon(dir) {
    let i = this.state.weapon;
    for (let n = 0; n < WEAPONS.length; n++) {
      i = (i + dir + WEAPONS.length) % WEAPONS.length;
      if (!WEAPONS[i].locked) { this.state.weapon = i; return; }
    }
  }

  canShoot(t) {
    const w = WEAPONS[this.state.weapon];
    return t - this.lastShot >= w.rate;
  }

  shoot(camera, t) {
    const s = this.state;
    const w = WEAPONS[s.weapon];
    if (!this.canShoot(t)) return false;
    if (s.ammo[s.weapon] !== Infinity) {
      if (s.ammo[s.weapon] <= 0) {
        // reload otomatis dari reserve
        if (s.reserve[s.weapon] > 0) {
          const take = Math.min(typeof w.ammo === 'number' ? w.ammo : 0, s.reserve[s.weapon]);
          s.ammo[s.weapon] = take;
          s.reserve[s.weapon] -= take;
        } else return false;
      }
      s.ammo[s.weapon]--;
    }
    this.lastShot = t;
    // Raycast dari posisi pemain (y=1.2) searah kamera horizontal — bukan dari kamera menukik.
    const origin = new THREE.Vector3(this.player.pos.x, 1.2, this.player.pos.z);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const pellets = w.pellets || 1;
    let hitAny = false;
    for (let p = 0; p < pellets; p++) {
      const jitter = (Math.random() - 0.5) * 0.03;
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), jitter);
      const ray = new THREE.Raycaster(origin, d, 0, 60);
      // Musuh misi
      const meshes = this.missions.enemyMeshes;
      const hits = ray.intersectObjects(meshes, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj.parent && !this.missions.enemies.find(e => e.mesh === obj)) obj = obj.parent;
        const e = this.missions.enemies.find(en => en.mesh === obj);
        if (e) {
          hitAny = this.missions.damageEnemy(e, w.damage) || hitAny;
        }
      }
      // Polisi di mobil: tembak mobil polisi menaikkan wanted
      const policeMeshes = this.police.units.map(u => u.mesh);
      const ph = ray.intersectObjects(policeMeshes, true);
      if (ph.length && !hitAny) {
        this.police.addWanted(1);
        hitAny = true;
      }
      this.spawnTracer(origin, d);
    }
    if (hitAny) this.state.kills = this.state.kills; // kills dihitung di damageEnemy
    return true;
  }

  spawnTracer(origin, dir) {
    const len = 24;
    const end = origin.clone().add(dir.clone().multiplyScalar(len));
    const geo = new THREE.BufferGeometry().setFromPoints([origin.clone(), end]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe23a, transparent: true, opacity: 0.9 }));
    this.scene.add(line);
    this.tracers.push({ line, life: 0.09 });
  }

  update(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.line);
        this.tracers.splice(i, 1);
      }
    }
  }
}
