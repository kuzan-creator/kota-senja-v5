// Kota Senja v5 — state permainan + save/load.
import { MISSIONS, RANKS, WEAPONS } from './config.js';

export const SAVE_KEY = 'kota-senja-v5.save';

export function freshState() {
  return {
    screen: 'title', // title | playing | paused | map | passed | gameover | won
    paused: false,
    money: 500,
    respect: 0,
    wanted: 0,
    health: 100,
    armour: 0,
    clockMin: 17 * 60 + 45, // 17:45
    night: false,
    missionIndex: 0, // 0-based ke MISSIONS
    stageIndex: 0,
    stageT: 0, // sisa detik stage (0 = tanpa batas)
    stageProgress: 0, // 0..1 progres dalam stage
    stageDone: 0, // jumlah sub-target selesai di stage ini
    stageTotal: 1,
    missionsDone: 0,
    carsStolen: 0,
    racesWon: 0,
    racesBest: null,
    kills: 0,
    weapon: 1, // index WEAPONS
    ammo: WEAPONS.map(w => (w.locked ? 0 : (typeof w.ammo === 'number' ? w.ammo : Infinity))),
    reserve: WEAPONS.map(w => (w.locked ? 0 : (typeof w.reserve === 'number' ? w.reserve : Infinity))),
    crewCd: [0, 0, 0],
    crewUsed: [false, false, false],
    upgrades: { engine: 0, armour: 0, tires: 0 },
    safehouse: 'Rumah Raka',
    radio: 0,
    inCar: false,
    carId: null,
    carSpeed: 0,
    carCondition: 100,
    carName: '',
    district: 'Kota Senja',
    onFoot: true,
    markTargets: false,
    followT: 0,
    won: false,
    elapsed: 0,
  };
}

export function rankOf(rep) {
  let r = RANKS[0];
  for (const x of RANKS) if (rep >= x.min) r = x;
  return r;
}

export function saveGame(s) {
  try {
    const snap = { money: s.money, respect: s.respect, missionIndex: s.missionIndex, missionsDone: s.missionsDone, upgrades: s.upgrades, carsStolen: s.carsStolen, racesWon: s.racesWon, kills: s.kills, safehouse: s.safehouse };
    localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
    return true;
  } catch (e) { return false; }
}

export function loadGame(s) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    Object.assign(s, snap);
    return true;
  } catch (e) { return false; }
}

export function currentMission(s) {
  return MISSIONS[Math.min(s.missionIndex, MISSIONS.length - 1)];
}

export function missionDone(s) {
  return s.missionIndex >= MISSIONS.length;
}
