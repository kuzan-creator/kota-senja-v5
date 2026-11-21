// Kota Senja v5 — ekonomi: uang, respect, garasi, toko, kemampuan kru.
import { CREW, RANKS } from './config.js';
import { rankOf, saveGame } from './state.js';

export const UPGRADES = [
  { id: 'engine', name: 'Mesin Balap', desc: '+12 km/h top speed', costs: [800, 1600, 3000] },
  { id: 'armour', name: 'Pelat Baja', desc: '+25 kondisi maks', costs: [600, 1200, 2400] },
  { id: 'tires', name: 'Ban Grip', desc: 'Belok lebih tajam', costs: [400, 900, 1800] },
];

export const SHOPS = [
  { id: 'warung', name: 'Warung Kopi Slamet', item: 'Kopi Tubruk', price: 25, effect: 'health+15' },
  { id: 'bengkel', name: 'Bengkel Darma', item: 'Servis Kilat', price: 150, effect: 'repair' },
  { id: 'toko', name: 'Toko Senja', item: 'Rompi Anti Peluru', price: 300, effect: 'armour+50' },
];

export class Economy {
  constructor(state, player, police) {
    this.s = state;
    this.player = player;
    this.police = police;
  }

  rank() { return rankOf(this.s.respect); }

  buyUpgrade(id) {
    const s = this.s;
    const up = UPGRADES.find(u => u.id === id);
    if (!up) return { ok: false, why: 'upgrade tidak dikenal' };
    const lvl = s.upgrades[id] || 0;
    if (lvl >= up.costs.length) return { ok: false, why: 'sudah max' };
    const cost = up.costs[lvl];
    if (s.money < cost) return { ok: false, why: 'uang kurang' };
    s.money -= cost;
    s.upgrades[id] = lvl + 1;
    if (id === 'engine' && this.player.carDef) this.player.carDef.upgradeBoost = (this.player.carDef.upgradeBoost || 0) + 12;
    saveGame(s);
    return { ok: true, lvl: lvl + 1, cost };
  }

  buyShop(id) {
    const s = this.s;
    const shop = SHOPS.find(x => x.id === id);
    if (!shop) return { ok: false, why: 'toko tidak dikenal' };
    if (s.money < shop.price) return { ok: false, why: 'uang kurang' };
    s.money -= shop.price;
    if (shop.effect === 'health+15') s.health = Math.min(100, s.health + 15);
    if (shop.effect === 'repair') { this.player.carCondition = 100; if (this.player.car) this.player.car.condition = 100; }
    if (shop.effect === 'armour+50') s.armour = Math.min(100, s.armour + 50);
    saveGame(s);
    return { ok: true, item: shop.item };
  }

  useCrew(i) {
    const s = this.s;
    if (s.crewCd[i] > 0) return { ok: false, why: 'cooldown ' + Math.ceil(s.crewCd[i]) + ' dtk' };
    const c = CREW[i];
    s.crewCd[i] = c.cd;
    s.crewUsed[i] = true;
    if (c.id === 'dedi') {
      this.police.setWanted(Math.max(0, s.wanted - 2));
    } else if (c.id === 'sari') {
      this.player.carCondition = 100;
      if (this.player.car) this.player.car.condition = 100;
    } else if (c.id === 'bimo') {
      s.markTargets = true;
      setTimeout(() => { s.markTargets = false; }, 15000);
    }
    return { ok: true, skill: c.skill };
  }

  tick(dt) {
    for (let i = 0; i < 3; i++) {
      if (this.s.crewCd[i] > 0) this.s.crewCd[i] = Math.max(0, this.s.crewCd[i] - dt);
    }
  }
}
