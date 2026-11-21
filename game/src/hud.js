// Kota Senja v5 — HUD DOM: banner misi, dispatch, kru, minimap, dialog, overlay.
import { CREW, WEAPONS, RADIOS, DISTRICTS } from './config.js';
import { rankOf } from './state.js';

export function fmtClock(min) {
  const m = Math.floor(min) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

export function fmtTimer(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export class HUD {
  constructor(state, player, police, missions, economy, radio) {
    this.s = state;
    this.player = player;
    this.police = police;
    this.missions = missions;
    this.economy = economy;
    this.radio = radio;
    this.el = {};
    for (const id of ['mission-banner', 'mission-name', 'mission-obj', 'stage-bar', 'stage-label', 'stage-timer',
      'clock', 'money', 'wanted', 'respect-label', 'respect-bar', 'dispatch-list', 'dispatch-panel',
      'crew-cards', 'health-bar', 'health-num', 'armour-bar', 'armour-num', 'district', 'minimap',
      'weapon-slots', 'vehicle-name', 'vehicle-cond', 'vehicle-speed', 'radio-name',
      'dialogue', 'dialogue-portrait', 'dialogue-name', 'dialogue-text',
      'prompt', 'wheel', 'map-overlay', 'map-missions', 'map-stats', 'passed-overlay', 'passed-title',
      'passed-reward', 'passed-unlock', 'garage-overlay', 'garage-list', 'start-screen', 'gameover-screen',
      'win-screen', 'toast', 'map-canvas']) {
      this.el[id] = document.getElementById(id);
    }
    this.buildCrewCards();
    this.buildWeaponSlots();
    this.dialogueT = 0;
  }

  buildCrewCards() {
    const box = this.el['crew-cards'];
    box.innerHTML = '';
    CREW.forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'crew-card';
      d.id = 'crew-' + i;
      d.innerHTML = '<div class="crew-portrait">' + c.initials + '</div>' +
        '<div class="crew-info"><div class="crew-name">' + c.name + '</div>' +
        '<div class="crew-role">' + c.role + ' · ' + c.skill + '</div>' +
        '<div class="crew-desc">' + c.desc + '</div></div>' +
        '<div class="crew-key">[' + c.key + ']</div>' +
        '<div class="crew-cd" hidden></div>';
      box.appendChild(d);
    });
  }

  buildWeaponSlots() {
    const box = this.el['weapon-slots'];
    box.innerHTML = '';
    WEAPONS.forEach((w, i) => {
      const d = document.createElement('div');
      d.className = 'weapon-slot' + (w.locked ? ' locked' : '');
      d.id = 'wslot-' + i;
      d.innerHTML = '<div class="wslot-num">' + (i + 1) + '</div>' +
        '<div class="wslot-name">' + w.name + '</div>' +
        '<div class="wslot-ammo">' + (w.locked ? 'LOCKED' : w.ammo) + '</div>';
      box.appendChild(d);
    });
  }

  say(speaker, initials, text, secs = 5) {
    this.el['dialogue'].hidden = false;
    this.el['dialogue-portrait'].textContent = initials;
    this.el['dialogue-name'].textContent = speaker;
    this.el['dialogue-text'].textContent = speaker + ': "' + text + '"';
    this.dialogueT = secs;
  }

  toast(msg, secs = 3) {
    this.el['toast'].textContent = msg;
    this.el['toast'].hidden = false;
    this.el['toast']._t = secs;
  }

  showPassed(mission, unlockText) {
    this.el['passed-title'].textContent = mission.name;
    this.el['passed-reward'].textContent = '+$' + mission.reward + '  +' + mission.rep + ' REP';
    this.el['passed-unlock'].textContent = 'Unlocked: ' + unlockText;
    this.el['passed-overlay'].hidden = false;
  }

  hidePassed() { this.el['passed-overlay'].hidden = true; }

  showGameOver() { this.el['gameover-screen'].hidden = false; }
  showWin() { this.el['win-screen'].hidden = false; }

  update(dt) {
    const s = this.s;
    if (this.dialogueT > 0) {
      this.dialogueT -= dt;
      if (this.dialogueT <= 0) this.el['dialogue'].hidden = true;
    }
    if (this.el['toast']._t > 0) {
      this.el['toast']._t -= dt;
      if (this.el['toast']._t <= 0) this.el['toast'].hidden = true;
    }
    if (s.screen !== 'playing' && s.screen !== 'map' && s.screen !== 'passed') return;
    // Banner misi
    const m = this.missions ? this.missions.currentMissionSafe() : null;
    if (m) {
      this.el['mission-name'].textContent = 'MISSION ' + m.id + ' — ' + m.name.toUpperCase();
      const st = m.stages[s.stageIndex];
      this.el['mission-obj'].textContent = m.desc + '\n' + (st ? st.label : '');
      const total = m.stages.length;
      this.el['stage-label'].textContent = 'Stage ' + (s.stageIndex + 1) + '/' + total;
      this.el['stage-bar'].style.width = Math.round((s.stageProgress || 0) * 100) + '%';
      this.el['stage-timer'].textContent = s.stageT > 0 ? fmtTimer(s.stageT) : '';
    }
    // Status kanan atas
    this.el['clock'].textContent = fmtClock(s.clockMin);
    this.el['money'].textContent = '$' + s.money.toLocaleString('en-US');
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < s.wanted ? '★' : '☆';
    this.el['wanted'].textContent = 'WANTED  ' + stars;
    const rank = rankOf(s.respect);
    this.el['respect-label'].textContent = rank.name + ' ' + s.respect.toLocaleString('en-US') + '/' + rank.max.toLocaleString('en-US');
    this.el['respect-bar'].style.width = Math.min(100, (s.respect - rank.min) / (rank.max - rank.min) * 100) + '%';
    // Dispatch
    const dl = this.el['dispatch-list'];
    const rows = this.police.dispatch;
    if (rows.length) {
      this.el['dispatch-panel'].hidden = false;
      dl.innerHTML = rows.slice(0, 5).map(r =>
        '<div class="dispatch-row"><span>' + r.id + '</span><span class="dispatch-role">' + r.role + '</span><span>' + r.dist + '</span></div>'
      ).join('') + (this.police.announcedHeli ? '<div class="dispatch-note">⚠ AIR UNIT DEPLOYED — CONDOR-1</div>' : '');
    } else {
      this.el['dispatch-panel'].hidden = s.wanted === 0;
      if (s.wanted === 0) dl.innerHTML = '<div class="dispatch-row"><span>Tidak ada unit aktif — kota tenang</span></div>';
    }
    // Kartu kru + cooldown
    CREW.forEach((c, i) => {
      const card = document.getElementById('crew-' + i);
      if (!card) return;
      const cd = s.crewCd[i];
      const badge = card.querySelector('.crew-cd');
      if (cd > 0) {
        badge.hidden = false;
        badge.textContent = Math.ceil(cd) + ' dtk';
        card.classList.add('cooling');
      } else {
        badge.hidden = true;
        card.classList.remove('cooling');
      }
    });
    // Vitals
    this.el['health-bar'].style.width = s.health + '%';
    this.el['health-num'].textContent = Math.round(s.health);
    this.el['armour-bar'].style.width = s.armour + '%';
    this.el['armour-num'].textContent = Math.round(s.armour);
    this.el['district'].textContent = s.district.toUpperCase();
    // Slot senjata
    WEAPONS.forEach((w, i) => {
      const slot = document.getElementById('wslot-' + i);
      if (!slot) return;
      slot.classList.toggle('active', i === s.weapon);
      const ammoEl = slot.querySelector('.wslot-ammo');
      if (!w.locked) ammoEl.textContent = (s.ammo[i] === Infinity ? '∞' : s.ammo[i]) + '/' + (s.reserve[i] === Infinity ? '∞' : s.reserve[i]);
    });
    // Kendaraan / jalan kaki
    if (this.player.onFoot) {
      this.el['vehicle-name'].textContent = 'On foot';
      this.el['vehicle-cond'].textContent = '';
      this.el['vehicle-speed'].textContent = '0 km/h';
    } else {
      this.el['vehicle-name'].textContent = this.player.carName + ' · ' + Math.round(this.player.carCondition) + '% condition' + (this.player.carCondition < 75 ? ' · DENTED' : '');
      this.el['vehicle-cond'].textContent = '';
      this.el['vehicle-speed'].textContent = Math.round(this.player.kmh()) + ' km/h';
    }
    this.el['radio-name'].textContent = this.radio.name();
    this.drawMinimap();
  }

  drawMinimap() {
    const cv = this.el['minimap'];
    if (!cv) return;
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.fillStyle = '#10142a';
    g.fillRect(0, 0, W, H);
    // Laut
    g.fillStyle = '#1d5f8a';
    g.fillRect(W * 0.86, 0, W * 0.14, H);
    // Jalan
    g.strokeStyle = '#3a3a4a';
    g.lineWidth = 3;
    const px = x => (x + 210) / 420 * W;
    const pz = z => (z + 210) / 420 * H;
    for (const x of [-120, -60, 0, 60, 120]) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), H); g.stroke(); }
    for (const z of [-150, -90, -30, 30, 90, 150]) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(W, pz(z)); g.stroke(); }
    // Target misi
    const m = this.missions ? this.missions.currentMissionSafe() : null;
    if (m) {
      const st = m.stages[this.s.stageIndex];
      const t = st && st.target ? st.target : (st && st.targets ? st.targets[0] : null);
      if (t) {
        g.fillStyle = '#ffd23a';
        g.beginPath(); g.arc(px(t[0]), pz(t[1]), 5, 0, Math.PI * 2); g.fill();
      }
    }
    // Polisi
    g.fillStyle = '#ff4a4a';
    for (const u of this.police.units) {
      g.beginPath(); g.arc(px(u.mesh.position.x), pz(u.mesh.position.z), 3, 0, Math.PI * 2); g.fill();
    }
    // Pemain
    g.fillStyle = '#4fc3f7';
    g.beginPath(); g.arc(px(this.player.pos.x), pz(this.player.pos.z), 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff';
    g.beginPath(); g.arc(px(this.player.pos.x), pz(this.player.pos.z), 6, 0, Math.PI * 2); g.stroke();
    // Utara
    g.fillStyle = '#ffd23a';
    g.font = 'bold 12px system-ui';
    g.fillText('N', W / 2 - 4, 12);
  }

  drawBigMap() {
    const cv = this.el['map-canvas'];
    if (!cv) return;
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.fillStyle = '#141830';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1d5f8a';
    g.fillRect(W * 0.86, 0, W * 0.14, H);
    g.strokeStyle = '#3a3a4a';
    g.lineWidth = 2;
    const px = x => (x + 210) / 420 * W;
    const pz = z => (z + 210) / 420 * H;
    for (let x = -200; x <= 200; x += 20) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), H); g.stroke(); }
    for (let z = -200; z <= 200; z += 20) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(W, pz(z)); g.stroke(); }
    g.fillStyle = '#eef1f5';
    g.font = '13px system-ui';
    for (const d of DISTRICTS) {
      const w = g.measureText(d.name).width;
      const lx = Math.max(4, Math.min(px(d.x) - 20, W - w - 4));
      g.fillText(d.name, lx, pz(d.z));
    }
    g.fillStyle = '#4fc3f7';
    g.beginPath(); g.arc(px(this.player.pos.x), pz(this.player.pos.z), 6, 0, Math.PI * 2); g.fill();
    const m = this.missions ? this.missions.currentMissionSafe() : null;
    if (m) {
      const st = m.stages[this.s.stageIndex];
      const t = st && st.target ? st.target : null;
      if (t) {
        g.fillStyle = '#ffd23a';
        g.beginPath(); g.arc(px(t[0]), pz(t[1]), 8, 0, Math.PI * 2); g.fill();
      }
    }
  }

  fillMapOverlay() {
    const s = this.s;
    const list = this.el['map-missions'];
    list.innerHTML = '';
    // daftar misi dari modul missions
    const all = this.missions.allMissions();
    all.forEach((mm, i) => {
      const d = document.createElement('div');
      d.className = 'map-mission' + (i < s.missionsDone ? ' done' : '') + (i === s.missionIndex ? ' active' : '');
      d.textContent = (i + 1) + '. ' + mm.name + (i === s.missionIndex ? ' ▶' : '');
      list.appendChild(d);
    });
    const rank = rankOf(s.respect);
    this.el['map-stats'].innerHTML =
      'Uang: $' + s.money.toLocaleString('en-US') + '<br>' +
      'Respect: ' + rank.name + ' (' + s.respect + ')<br>' +
      'Misi selesai: ' + s.missionsDone + '/12<br>' +
      'Bunuh: ' + s.kills + '<br>' +
      'Mobil dicuri: ' + s.carsStolen + '<br>' +
      'Balapan menang: ' + s.racesWon + '<br>' +
      'Balapan tercepat: ' + (s.racesBest || '—') + '<br>' +
      'Safehouse: ' + s.safehouse;
    this.drawBigMap();
  }
}
