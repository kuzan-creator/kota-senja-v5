// Kota Senja v5 — bootstrap, loop game, kamera, input, layar, dan API staging KS.
const THREE = window.THREE;
import { MISSIONS, DIALOGUES, WEAPONS } from './config.js';
import { freshState, saveGame, loadGame, currentMission } from './state.js';
import { City } from './city.js';
import { Player } from './player.js';
import { Police } from './police.js';
import { Missions } from './missions.js';
import { Combat } from './combat.js';
import { Economy, UPGRADES } from './economy.js';
import { HUD, fmtClock } from './hud.js';
import { Radio } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 800);

const state = freshState();
const city = new City(scene);
const player = new Player(scene, city);
const police = new Police(scene, city, player, state);
const radio = new Radio();
const economy = new Economy(state, player, police);
const missions = new Missions(state, player, city, police, {
  say: (speaker, text) => {
    const init = { 'Darma': 'DR', 'Bu Ratna': 'BR', 'Dedi': 'DP', 'Bimo': 'BS', 'Sari': 'SW' }[speaker] || 'KS';
    hud.say(speaker, init, text);
  },
  onPassed: (m) => {
    state.screen = 'passed';
    const unlocks = { 1: 'Garuda GT', 2: 'Safehouse Pasar', 3: 'Warung Slamet', 4: 'Balapan Terbuka', 5: 'Pier Safehouse', 6: 'Garasi Darma Lv2', 7: 'Teropong Bimo', 8: 'Dermaga Bebas', 9: 'Jalur Aman', 10: 'Gudang Pelabuhan', 11: 'Terminal Bebas', 12: 'Mahkota Raja Senja' };
    if (state.missionsDone >= 12) {
      state.won = true;
      hud.showWin();
      state.screen = 'won';
      return;
    }
    hud.showPassed(m, unlocks[m.id] || 'Safehouse baru');
  },
  onFailed: (m, reason) => {
    hud.toast('Misi gagal — ' + reason + '. Coba lagi.');
    setTimeout(() => { if (state.screen === 'playing') missions.beginStage(); }, 1200);
  },
});
const combat = new Combat(scene, player, state, missions, police);
const hud = new HUD(state, player, police, missions, economy, radio);

window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message || e.error)));

const SPEAKERS = { Darma: 'DR', 'Bu Ratna': 'BR', Dedi: 'DP', Bimo: 'BS', Sari: 'SW' };

// ---------- input ----------
const keys = player.keys;
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys[e.code] = true;
  if (e.code === 'Enter' && state.screen === 'title') startGame();
  if (e.code === 'KeyM' && (state.screen === 'playing' || state.screen === 'map')) toggleMap();
  if (e.code === 'KeyP' && state.screen === 'playing') pauseGame();
  if (e.code === 'KeyP' && state.screen === 'paused') resumeGame();
  if (e.code === 'Escape' && state.screen === 'playing') pauseGame();
  if (e.code === 'KeyQ' && state.screen === 'playing') toggleWheel();
  if (e.code === 'KeyE' && state.screen === 'playing') tryEnterExit();
  if (e.code === 'KeyR' && state.screen === 'playing') { radio.setStation(state.radio + 1); state.radio = radio.station; }
  if (e.code === 'KeyZ' && state.screen === 'playing') useCrewKey(0);
  if (e.code === 'KeyX' && state.screen === 'playing') useCrewKey(1);
  if (e.code === 'KeyC' && state.screen === 'playing') useCrewKey(2);
  if (e.code === 'KeyG' && state.screen === 'playing') toggleGarage();
  if (e.code.startsWith('Digit') && state.screen === 'playing') {
    const n = Number(e.code.slice(5)) - 1;
    if (n >= 0 && n < 6) combat.selectWeapon(n);
  }
  if (e.code === 'KeyF' && state.screen === 'playing') radio.start();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('mousedown', (e) => {
  if (state.screen !== 'playing') return;
  if (combat.wheelOpen) return;
  radio.start();
  combat.shoot(camera, perfNow());
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function perfNow() { return performance.now() / 1000; }

function startGame() {
  state.screen = 'playing';
  document.getElementById('start-screen').hidden = true;
  missions.startMission(state.missionIndex);
  hud.say(DIALOGUES.intro.speaker, DIALOGUES.intro.initials, DIALOGUES.intro.text, 6);
  radio.start();
}

function pauseGame() {
  state.screen = 'paused';
  document.getElementById('pause-screen').hidden = false;
}
function resumeGame() {
  state.screen = 'playing';
  document.getElementById('pause-screen').hidden = true;
}
function toggleMap() {
  if (state.screen === 'playing') {
    state.screen = 'map';
    hud.fillMapOverlay();
    document.getElementById('map-overlay').hidden = false;
  } else if (state.screen === 'map') {
    state.screen = 'playing';
    document.getElementById('map-overlay').hidden = true;
  }
}
function toggleWheel() {
  combat.wheelOpen = !combat.wheelOpen;
  document.getElementById('wheel').hidden = !combat.wheelOpen;
  if (combat.wheelOpen) buildWheel();
}
function buildWheel() {
  const w = document.getElementById('wheel-items');
  w.innerHTML = '';
  WEAPONS.forEach((wp, i) => {
    const d = document.createElement('div');
    d.className = 'wheel-item' + (wp.locked ? ' locked' : '') + (i === state.weapon ? ' active' : '');
    d.innerHTML = '<div>' + (i + 1) + ' · ' + wp.name + '</div><div>' + (wp.locked ? 'LOCKED' : wp.ammo) + '</div>';
    d.onclick = () => { combat.selectWeapon(i); toggleWheel(); };
    w.appendChild(d);
  });
}
function tryEnterExit() {
  if (player.onFoot) {
    const c = player.nearestCar(7);
    if (c) {
      player.enterCar(c);
      state.inCar = true;
      state.carName = c.def.name;
      state.carCondition = c.condition;
      if (!c.counted) {
        c.counted = true;
        state.carsStolen++;
        police.addWanted(2);
        hud.toast('Mobil dicuri! Polisi mengejar.');
      }
    }
  } else {
    player.exitCar();
    state.inCar = false;
  }
}
function useCrewKey(i) {
  const r = economy.useCrew(i);
  if (r.ok) hud.toast(CREW_NAME(i) + ': ' + r.skill + ' aktif!');
  else hud.toast('Kru belum siap — ' + r.why);
}
function CREW_NAME(i) {
  return ['Dedi', 'Sari', 'Bimo'][i];
}
function toggleGarage() {
  const g = document.getElementById('garage-overlay');
  if (g.hidden) {
    state.screen = 'paused';
    fillGarage();
    g.hidden = false;
  } else {
    g.hidden = true;
    state.screen = 'playing';
  }
}
function fillGarage() {
  const list = document.getElementById('garage-list');
  list.innerHTML = '';
  UPGRADES.forEach(u => {
    const lvl = state.upgrades[u.id] || 0;
    const d = document.createElement('div');
    d.className = 'garage-row';
    const cost = lvl >= u.costs.length ? 'MAX' : '$' + u.costs[lvl];
    d.innerHTML = '<div><b>' + u.name + ' Lv' + lvl + '</b><br><span>' + u.desc + '</span></div><button>' + cost + '</button>';
    d.querySelector('button').onclick = () => {
      const r = economy.buyUpgrade(u.id);
      hud.toast(r.ok ? u.name + ' Lv' + r.lvl + ' terbeli!' : 'Gagal: ' + r.why);
      fillGarage();
    };
    list.appendChild(d);
  });
}

// Tombol overlay
document.getElementById('start-btn').onclick = () => startGame();
document.getElementById('continue-btn').onclick = () => {
  hud.hidePassed();
  state.screen = 'playing';
  if (state.missionIndex < 12) missions.beginStage();
};
document.getElementById('resume-btn').onclick = () => resumeGame();
document.getElementById('restart-btn').onclick = () => location.reload();
document.getElementById('close-map-btn').onclick = () => toggleMap();
document.getElementById('close-garage-btn').onclick = () => toggleGarage();
document.getElementById('close-wheel-btn').onclick = () => toggleWheel();

// ---------- kamera ----------
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();
let camOverride = null;
function updateCamera(dt) {
  if (camOverride) {
    camera.position.copy(camOverride.pos);
    camera.lookAt(camOverride.look);
    return;
  }
  const p = player.pos;
  const back = player.onFoot ? 9 : 14;
  const height = player.onFoot ? 4.5 : 7;
  const bx = p.x - Math.sin(player.yaw) * back;
  const bz = p.z - Math.cos(player.yaw) * back;
  camPos.set(bx, height, bz);
  camera.position.lerp(camPos, Math.min(1, dt * 5));
  camTarget.set(p.x + Math.sin(player.yaw) * 6, 1.6, p.z + Math.cos(player.yaw) * 6);
  camera.lookAt(camTarget);
}

// ---------- loop ----------
let last = performance.now();
let elapsed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  if (state.screen === 'playing') {
    state.elapsed += dt;
    state.clockMin += dt * 0.25;
    const hour = Math.floor(state.clockMin / 60) % 24;
    const wantNight = hour >= 19 || hour < 6;
    if (wantNight !== state.night) {
      state.night = wantNight;
      city.setNight(wantNight);
    }
    player.update(dt);
    police.update(dt, elapsed);
    missions.update(dt);
    combat.update(dt);
    economy.tick(dt);
    state.district = city.districtAt(player.pos.x, player.pos.z);
    // Kamera snap bila teleport jauh
    const camD = camera.position.distanceTo(player.pos);
    if (camD > 60) {
      const p = player.pos;
      camera.position.set(p.x - Math.sin(player.yaw) * 14, 7, p.z - Math.cos(player.yaw) * 14);
    }
    if (state.health <= 0) {
      state.screen = 'gameover';
      hud.showGameOver();
    }
  }
  city.update(dt, elapsed);
  updateCamera(dt);
  hud.update(dt);
  renderer.render(scene, camera);
}

// ---------- staging KS (untuk harness screenshot + play-test) ----------
const KS = {
  ready: () => true,
  state: () => ({
    screen: state.screen, money: state.money, respect: state.respect, wanted: state.wanted,
    health: Math.round(state.health), armour: Math.round(state.armour),
    mission: state.missionIndex + 1, missionName: currentMission(state).name,
    stage: state.stageIndex + 1, stageLabel: missions.stageLabel(), stageT: Math.round(state.stageT),
    stageProgress: Math.round((state.stageProgress || 0) * 100),
    weapon: state.weapon, ammo: state.ammo[state.weapon], kills: state.kills, missionsDone: state.missionsDone,
    inCar: !player.onFoot, carName: player.carName, kmh: Math.round(player.kmh()),
    carCondition: Math.round(player.carCondition), district: state.district,
    clock: fmtClock(state.clockMin), night: state.night,
    heli: !!police.heli, policeUnits: police.units.length, roadblocks: police.roadblocks.length,
    errors: window.__errors.slice(),
  }),
  jumpToMission: (i) => { missions.startMission(i); },
  setMissionsDone: (n) => { state.missionsDone = n; },
  driveCar: (defId) => { player.forceIntoCar(defId || 'garuda'); state.inCar = true; state.carName = player.carName; },
  followPos: () => {
    const f = missions.followTarget;
    return f ? [Math.round(f.mesh.position.x), Math.round(f.mesh.position.z)] : null;
  },
  start: () => { if (state.screen === 'title') startGame(); },
  teleport: (x, z, yaw) => player.teleport(x, z, yaw === undefined ? null : yaw),
  teleportToObjective: () => missions.teleportToObjective(),
  completeStage: () => missions.completeStage(),
  setWanted: (n) => police.setWanted(n),
  setMoney: (n) => { state.money = n; },
  setRespect: (n) => { state.respect = n; },
  setClock: (m) => { state.clockMin = m; },
  setHealth: (n) => { state.health = n; },
  setArmour: (n) => { state.armour = n; },
  spawnEnemy: (x, z) => {
    const man = city.makePerson(0x8a1a1a);
    man.position.set(x, 0, z);
    scene.add(man);
    const e = { mesh: man, hp: 100, x, z };
    missions.enemies.push(e);
    missions.enemyMeshes.push(man);
    return missions.enemies.length;
  },
  enemyCount: () => missions.enemies.length,
  aimAtEnemy: () => {
    const e = missions.enemies[0];
    if (!e) return false;
    const dx = e.mesh.position.x - player.pos.x, dz = e.mesh.position.z - player.pos.z;
    player.yaw = Math.atan2(dx, dz);
    // Snap kamera langsung ke belakang pemain menghadap musuh (tanpa menunggu lerp)
    const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
    camera.position.set(player.pos.x - fx * 9, 4.5, player.pos.z - fz * 9);
    camera.lookAt(e.mesh.position.x, 1.2, e.mesh.position.z);
    return true;
  },
  shoot: () => combat.shoot(camera, perfNow()),
  openWheel: () => { if (!combat.wheelOpen) toggleWheel(); },
  closeWheel: () => { if (combat.wheelOpen) toggleWheel(); },
  openMap: () => { if (state.screen === 'playing') toggleMap(); },
  closeMap: () => { if (state.screen === 'map') toggleMap(); },
  selectWeapon: (i) => combat.selectWeapon(i),
  buyUpgrade: (id) => economy.buyUpgrade(id),
  useCrew: (i) => economy.useCrew(i),
  save: () => saveGame(state),
  load: () => loadGame(state),
  hidePassed: () => {
    hud.hidePassed();
    state.screen = 'playing';
    if (state.missionIndex < 12) missions.beginStage();
  },
  setCam: (x, y, z, lx, ly, lz) => { camOverride = { pos: new THREE.Vector3(x, y, z), look: new THREE.Vector3(lx, ly, lz) }; },
  clearCam: () => { camOverride = null; },
  freezeCar: (on, kmh) => {
    KS._freeze = !!on;
    if (kmh !== undefined) KS._stagedKmh = kmh;
    if (on && player.car) player.speed = 0;
  },
  stageChase: () => {
    KS.start();
    state.money = 18450; state.respect = 3900; state.clockMin = 17 * 60 + 45;
    state.health = 72; state.armour = 55;
    missions.startMission(5); // misi 6 (index 5)
    missions.s.stageIndex = 2; // stage 3/4 (escape)
    missions.beginStage();
    state.stageT = 18;
    player.forceIntoCar('garuda');
    player.teleport(120, -120, Math.PI); // di tengah boulevard pantai (jalan x=120), bukan di pasir
    player.carCondition = 62;
    player.speed = 0;
    KS._freeze = true; KS._stagedKmh = 111;
    police.setWanted(4, true);
    police.refreshDispatch();
    police.placeHeli(124, 32, -182);
    police.freezeHeli = true;
    city.aimSpotlight(police.heli);
    // Bersihkan lalu lintas liar dari koridor boulevard supaya frame rapi
    city.traffic = city.traffic.filter(c => {
      const inCorridor = Math.abs(c.position.x - 120) < 12 && c.position.z > -195 && c.position.z < -90;
      if (inCorridor) scene.remove(c);
      return !inCorridor;
    });
    // SATU roadblock polisi melintang di depan (yang kedua disingkirkan)
    if (police.roadblocks[0]) { police.roadblocks[0].position.set(118, 0, -166); police.roadblocks[0].rotation.y = Math.PI / 2; }
    if (police.roadblocks[1]) { scene.remove(police.roadblocks[1]); police.roadblocks.splice(1, 1); police.refreshDispatch(); }
    // Jalanan rapi: Garuda GT (hero) + 1 polisi mengejar + 1 taksi, masing-masing di lajurnya
    const taxi = city.makeCar(0xf2c230, false, 'taxi');
    taxi.position.set(122.2, 0, -144);
    taxi.rotation.y = Math.PI;
    scene.add(taxi);
    police.forceSpawnAt(122.8, -132, 1); // 1 polisi mengejar di lajur kiri (mendarat di 117.8, -132)
    for (let i = 0; i < 16; i++) {
      const p = city.makePerson([0xc24a4a, 0x4a7ac2, 0x4ac27a, 0xd8a020][i % 4]);
      const side = i % 2 ? 113.2 : 126.8; // trotoar kiri-kanan boulevard
      p.position.set(side, 0, -122 - i * 3.6);
      scene.add(p);
      city.pedestrians.push(p);
    }
    city.placeWreck(120, -156);
    city.placeExplosion(123, -163); // api di lajur kanan jalan (bukan di trotoar)
    KS.setCam(120, 7.5, -100, 119, 2, -158);
    hud.say(DIALOGUES.mission.speaker, DIALOGUES.mission.initials, DIALOGUES.mission.text, 30);
  },
  stageMarket: () => {
    KS.start();
    state.money = 6420; state.respect = 1400; state.clockMin = 20 * 60 + 10;
    state.health = 88; state.armour = 20;
    city.setNight(true); state.night = true;
    missions.startMission(1); // misi 2
    if (player.car) player.exitCar();
    player.teleport(0, -104, Math.PI); // pemain jalan kaki di tengah pasar, membelakangi kamera
    city.hideBuildingsNear(0, -70, 75);
    // Layout kios seperti semula (rapat, dua kolom di x≈±10-12 dan ±24-30) —
    // yang dihilangkan HANYA kios (0,-118) yang berdiri di tengah jalan raya.
    const cols = [['#d84a4a', '#f5e6c8'], ['#2e7a4a', '#f5e6c8'], ['#2e5ec2', '#f5e6c8'], ['#d8a020', '#3a2a1a']];
    for (let i = 0; i < 4; i++) city.addMarketStall(-30 + i * 20, -120 - (i % 2) * 6, 0, cols[i % 4]);
    city.addMarketStall(8, -132, 0.3, cols[0]);
    city.addMarketStall(-10, -138, -0.3, cols[1]);
    // Baris kios tengah menghadap kamera — tanpa kios (0,-118), lajur tengah bersih
    for (const [mx, ci] of [[-24, 0], [-12, 1], [12, 2], [24, 3]]) city.addMarketStall(mx, -118, 0, cols[ci]);
    // Kios dekat kamera di tepi lorong + kerumunan dekat
    city.addMarketStall(-11, -111, 0.15, cols[2]);
    city.addMarketStall(11, -112, -0.15, cols[3]);
    // Lampu hangat di atas kios supaya pasar malam terang
    for (const [lx, lz] of [[0, -110], [0, -128]]) {
      const lamp = new THREE.PointLight(0xffc46a, 90, 45, 1.6);
      lamp.position.set(lx, 6, lz);
      scene.add(lamp);
    }
    // Baris kios belakang — kedalaman pasar (layout semula)
    for (const [bx, bz, ci] of [[-20, -148, 1], [-10, -152, 2], [10, -148, 0], [20, -152, 3]]) city.addMarketStall(bx, bz, 0, cols[ci]);
    // Lampu gantung (string lights) di atas lorong pasar
    for (const lz of [-112, -126, -140]) city.addStringLights(-32, 32, lz, 5.4);
    // Uap dari kios makanan (naik pelan seperti asap) — ikut kiosnya
    for (const [sx, sz] of [[-10, -138], [8, -132]]) {
      for (let i = 0; i < 3; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.5 + i * 0.15, 8, 8), new THREE.MeshLambertMaterial({ color: 0xd8d8d8, transparent: true, opacity: 0.45 }));
        puff.position.set(sx + (i - 1) * 0.5, 3.8 + i * 0.7, sz);
        scene.add(puff);
        city.smoke.push(puff);
      }
    }
    // Pembeli yang sedang memilih barang di depan kios (lengan terangkat, diam di tempat)
    for (const [bx, bz, col] of [[-24, -115, 0x8a4ac2], [-12, -115, 0xe8e8e8], [12, -115, 0x3a3a3a], [24, -115, 0x4a7ac2], [-11, -108.5, 0xd8a020], [11, -109.5, 0xc24a4a]]) {
      const p = city.makePerson(col, 'browse');
      p.position.set(bx, 0, bz);
      p.rotation.y = Math.PI; // menghadap kios (-z)
      scene.add(p); // sengaja TIDAK masuk city.pedestrians supaya tetap di depan kios
    }
    for (let i = 0; i < 14; i++) {
      const p = city.makePerson([0xc24a4a, 0x4a7ac2, 0x4ac27a, 0xd8a020, 0x8a4ac2][i % 5]);
      p.position.set(-22 + (i * 29) % 44, 0, -107 - (i * 5) % 6);
      scene.add(p);
      city.pedestrians.push(p);
    }
    for (let i = 0; i < 30; i++) {
      const p = city.makePerson([0xc24a4a, 0x4a7ac2, 0x4ac27a, 0xd8a020, 0x8a4ac2][i % 5]);
      p.position.set(-55 + (i * 37) % 108, 0, -160 + (i * 13) % 42);
      scene.add(p);
      city.pedestrians.push(p);
    }
    police.setWanted(2, true);
    police.forceSpawnAt(-40, -100, 1);
    police.forceSpawnAt(40, -110, 1);
    KS.setCam(0, 5.5, -97, 0, 2, -126);
    hud.say(DIALOGUES.market.speaker, DIALOGUES.market.initials, DIALOGUES.market.text, 30);
  },
  stageMap: () => {
    KS.start();
    state.money = 18450; state.respect = 3900; state.clockMin = 17 * 60 + 45;
    missions.startMission(5);
    KS.openMap();
  },
  stagePassed: () => {
    KS.start();
    state.money = 7100; state.respect = 1620; state.clockMin = 17 * 60 + 45;
    city.setNight(false); state.night = false;
    // Jalan senja di belakang overlay: mobil lalu lintas + palem
    for (let i = 0; i < 3; i++) {
      const c = city.makeCar([0xc2c2c2, 0x2e5ec2, 0xd8a020][i], false);
      c.position.set(-4 + (i % 2) * 8, 0, -48 - i * 14);
      c.rotation.y = Math.PI;
      scene.add(c);
    }
    KS.setCam(0, 6, -25, 0, 2, -90);
    missions.startMission(4); // misi 5
    missions.completeMission();
  },
  _freeze: false,
  _stagedKmh: 0,
};

window.KS = KS;

// Patch kmh saat staging beku
const _kmh = player.kmh.bind(player);
player.kmh = () => (KS._freeze ? KS._stagedKmh : _kmh());

// ?shot=chase|market|map|passed langsung staging untuk screenshot
if (shotParam && KS[ 'stage' + shotParam.charAt(0).toUpperCase() + shotParam.slice(1) ]) {
  KS['stage' + shotParam.charAt(0).toUpperCase() + shotParam.slice(1)]();
  setTimeout(() => { window.__shotReady = true; }, 1200);
}

requestAnimationFrame(frame);
