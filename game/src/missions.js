// Kota Senja v5 — mesin misi: 12 misi cerita, stage, timer, hadiah.
import { MISSIONS } from './config.js';
import { currentMission, saveGame } from './state.js';

export class Missions {
  constructor(state, player, city, police, hooks) {
    this.s = state;
    this.player = player;
    this.city = city;
    this.police = police;
    this.hooks = hooks; // { onStage, onPassed, onFailed, say }
    this.activeTargets = []; // titik koleksi yang tersisa
    this.followTarget = null;
    this.enemies = [];
    this.enemyMeshes = [];
    this.stageElapsed = 0;
  }

  startMission(i) {
    this.s.missionIndex = i;
    this.s.stageIndex = 0;
    this.beginStage();
  }

  currentMissionSafe() {
    if (this.s.missionIndex >= MISSIONS.length) return null;
    return currentMission(this.s);
  }

  allMissions() { return MISSIONS; }

  beginStage() {
    const s = this.s;
    const m = currentMission(s);
    const st = m.stages[s.stageIndex];
    s.stageElapsed = 0;
    s.stageDone = 0;
    s.followT = 0;
    this.city.clearMarkers();
    this.clearEnemies();
    this.followTarget = null;
    if (st.kind === 'collect' || st.kind === 'race') {
      this.activeTargets = st.targets.map(t => ({ x: t[0], z: t[1], done: false }));
      s.stageTotal = st.targets.length;
      for (const t of st.targets) this.city.addMarker(t[0], t[1]);
    } else if (st.kind === 'defeat') {
      s.stageTotal = st.count;
      this.spawnEnemies(st.target[0], st.target[1], st.count);
      this.city.addMarker(st.target[0], st.target[1], 0xff4a4a);
    } else if (st.kind === 'follow') {
      s.stageTotal = 1;
      const car = this.city.makeCar(0x111111, false);
      car.position.set(st.target[0], 0, st.target[1]);
      this.city.scene.add(car);
      this.followTarget = { mesh: car, speed: 11, wp: [[120, -60], [60, 20], [-20, 80], [60, 120]], wi: 0 };
      this.city.addMarker(st.target[0], st.target[1], 0x4a7ae8);
    } else {
      s.stageTotal = 1;
      this.city.addMarker(st.target[0], st.target[1]);
    }
    s.stageT = st.time || 0;
    s.stageProgress = 0;
    if (this.hooks.say) this.hooks.say(m.giver, this.stageLabel());
    if (this.hooks.onStage) this.hooks.onStage(m, st);
  }

  stageLabel() {
    const m = currentMission(this.s);
    const st = m.stages[this.s.stageIndex];
    return st.label;
  }

  spawnEnemies(x, z, n) {
    for (let i = 0; i < n; i++) {
      const man = this.city.makePerson(0x8a1a1a);
      man.position.set(x + (i - n / 2) * 6, 0, z + (i % 2) * 6 - 3);
      this.city.scene.add(man);
      const e = { mesh: man, hp: 100, x: man.position.x, z: man.position.z };
      this.enemies.push(e);
      this.enemyMeshes.push(man);
    }
  }

  clearEnemies() {
    for (const m of this.enemyMeshes) this.city.scene.remove(m);
    this.enemies = [];
    this.enemyMeshes = [];
  }

  damageEnemy(e, dmg) {
    e.hp -= dmg;
    if (e.hp <= 0) {
      const i = this.enemies.indexOf(e);
      if (i >= 0) {
        this.city.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
        this.enemyMeshes.splice(this.enemyMeshes.indexOf(e.mesh), 1);
        this.s.kills++;
        this.s.stageDone++;
        this.s.stageProgress = this.s.stageDone / this.s.stageTotal;
        const m = currentMission(this.s);
        const st = m.stages[this.s.stageIndex];
        if (st.kind === 'defeat' && this.s.stageDone >= st.count) this.completeStage();
      }
      return true;
    }
    return false;
  }

  completeStage() {
    const s = this.s;
    const m = currentMission(s);
    if (s.stageIndex + 1 < m.stages.length) {
      s.stageIndex++;
      this.beginStage();
      return 'next';
    }
    this.completeMission();
    return 'done';
  }

  completeMission() {
    const s = this.s;
    const m = currentMission(s);
    s.money += m.reward;
    s.respect += m.rep;
    s.missionsDone++;
    if (m.id === 4 || m.id === 8) s.racesWon++;
    this.city.clearMarkers();
    this.clearEnemies();
    if (this.followTarget) { this.city.scene.remove(this.followTarget.mesh); this.followTarget = null; }
    saveGame(s);
    const next = m.id;
    s.missionIndex = Math.min(m.id, MISSIONS.length - 1);
    // misi berikutnya dimulai setelah overlay Passed ditutup (oleh main)
    if (this.hooks.onPassed) this.hooks.onPassed(m, next);
  }

  failMission(reason) {
    this.city.clearMarkers();
    this.clearEnemies();
    if (this.followTarget) { this.city.scene.remove(this.followTarget.mesh); this.followTarget = null; }
    if (this.hooks.onFailed) this.hooks.onFailed(currentMission(this.s), reason);
  }

  teleportToObjective() {
    const s = this.s;
    const m = currentMission(s);
    const st = m.stages[s.stageIndex];
    let t = null;
    if (st.kind === 'collect' || st.kind === 'race') {
      const rem = this.activeTargets.find(x => !x.done);
      if (rem) t = [rem.x, rem.z];
    } else if (st.target) t = st.target;
    if (t) this.player.teleport(t[0] + 3, t[1] + 3);
    return t;
  }

  update(dt) {
    const s = this.s;
    if (s.screen !== 'playing') return;
    const m = currentMission(s);
    if (!m || s.missionIndex >= MISSIONS.length) return;
    const st = m.stages[s.stageIndex];
    if (!st) return;
    this.stageElapsed += dt;
    if (s.stageT > 0) {
      s.stageT -= dt;
      if (s.stageT <= 0) {
        s.stageT = 0;
        if (st.kind === 'escape') { this.completeStage(); return; }
        this.failMission('Waktu habis');
        return;
      }
    }
    const p = this.player.pos;
    const dist = (x, z) => Math.hypot(p.x - x, p.z - z);
    if (st.kind === 'goto') {
      s.stageProgress = Math.max(0, 1 - dist(st.target[0], st.target[1]) / 120);
      if (dist(st.target[0], st.target[1]) < 6) this.completeStage();
    } else if (st.kind === 'collect' || st.kind === 'race') {
      for (const t of this.activeTargets) {
        if (!t.done && dist(t.x, t.z) < 5.5) {
          t.done = true;
          s.stageDone++;
          s.stageProgress = s.stageDone / s.stageTotal;
          this.city.clearMarkers();
          for (const r of this.activeTargets) if (!r.done) this.city.addMarker(r.x, r.z);
          if (s.stageDone >= s.stageTotal) this.completeStage();
          break;
        }
      }
    } else if (st.kind === 'deliver') {
      s.stageProgress = Math.max(0, 1 - dist(st.target[0], st.target[1]) / 200);
      if (dist(st.target[0], st.target[1]) < 7) {
        if (this.player.onFoot) {
          // harus naik mobil untuk antar — beri petunjuk lewat progres
          s.stageProgress = Math.min(s.stageProgress, 0.95);
        } else this.completeStage();
      }
    } else if (st.kind === 'escape') {
      s.stageProgress = st.time ? 1 - s.stageT / st.time : 0;
      if (this.police.state.wanted >= 2 && dist(st.target[0], st.target[1]) < 8 && s.stageT < (st.time || 75) - 5) {
        // sampai tujuan setelah sempat dikejar
        this.completeStage();
      } else if (s.stageT <= 0) this.completeStage();
    } else if (st.kind === 'follow') {
      const f = this.followTarget;
      if (f) {
        const wp = f.wp[f.wi];
        const dx = wp[0] - f.mesh.position.x, dz = wp[1] - f.mesh.position.z;
        const d = Math.hypot(dx, dz) || 1;
        f.mesh.position.x += (dx / d) * f.speed * dt;
        f.mesh.position.z += (dz / d) * f.speed * dt;
        f.mesh.rotation.y = Math.atan2(dx, dz);
        if (d < 5) f.wi = (f.wi + 1) % f.wp.length;
        const pd = Math.hypot(p.x - f.mesh.position.x, p.z - f.mesh.position.z);
        if (pd < 28) {
          s.followT += dt;
          s.stageProgress = Math.min(1, s.followT / 10);
          if (s.followT >= 10) this.completeStage();
        } else {
          s.followT = Math.max(0, s.followT - dt * 0.5);
          s.stageProgress = Math.min(1, s.followT / 10);
        }
        if (pd > 70) this.failMission('Kehilangan jejak Bos Pantai');
      }
    }
  }
}
