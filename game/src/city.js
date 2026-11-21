// Kota Senja v5 — dunia 3D: kota pesisir senja, jembatan, pasar, laut, lalu lintas.
const THREE = window.THREE;
import { WORLD, DISTRICTS } from './config.js';

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeWindowTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#232a3a'; g.fillRect(0, 0, 64, 128);
  const rnd = mulberry(7);
  for (let y = 8; y < 120; y += 14) {
    for (let x = 6; x < 58; x += 12) {
      const lit = rnd() > 0.45;
      g.fillStyle = lit ? (rnd() > 0.5 ? '#ffd27a' : '#9fd8ff') : '#141a26';
      g.fillRect(x, y, 8, 9);
    }
  }
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function makeAwningTexture(colorA, colorB) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? colorA : colorB;
    g.fillRect(i * 8, 0, 8, 32);
  }
  return new THREE.CanvasTexture(c);
}

// Langit senja bergradasi + matahari + awan tipis (atau langit malam + bintang + bulan).
export function makeSkyTexture(night) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  if (night) {
    grad.addColorStop(0, '#04020e');
    grad.addColorStop(0.5, '#0d0a26');
    grad.addColorStop(0.75, '#1c1440');
    grad.addColorStop(1, '#14102e');
  } else {
    // Cakrawala hangat: oranye naik lebih tinggi supaya langit di atas jalan terasa senja
    grad.addColorStop(0, '#150a33');
    grad.addColorStop(0.28, '#3a1f5e');
    grad.addColorStop(0.44, '#8a3558');
    grad.addColorStop(0.55, '#e85d3a');
    grad.addColorStop(0.66, '#ffb37a');
    grad.addColorStop(0.78, '#7a3a5e');
    grad.addColorStop(1, '#2b1d4e');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 256);
  const rnd = mulberry(night ? 99 : 7);
  if (night) {
    for (let i = 0; i < 110; i++) {
      g.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.6) + ')';
      g.fillRect(rnd() * 512, rnd() * 130, 1.4, 1.4);
    }
    const moon = g.createRadialGradient(400, 52, 4, 400, 52, 26);
    moon.addColorStop(0, 'rgba(240,240,220,1)');
    moon.addColorStop(0.5, 'rgba(220,220,200,0.85)');
    moon.addColorStop(1, 'rgba(220,220,200,0)');
    g.fillStyle = moon;
    g.beginPath(); g.arc(400, 52, 26, 0, Math.PI * 2); g.fill();
  } else {
    // Matahari senja: SATU saja, kecil, di langit yang terlihat (bukan di balik HUD)
    const sun = g.createRadialGradient(210, 85, 3, 210, 85, 38);
    sun.addColorStop(0, 'rgba(255,236,170,1)');
    sun.addColorStop(0.35, 'rgba(255,170,80,0.9)');
    sun.addColorStop(1, 'rgba(255,120,50,0)');
    g.fillStyle = sun;
    g.beginPath(); g.arc(210, 85, 38, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe9a8';
    g.beginPath(); g.arc(210, 85, 11, 0, Math.PI * 2); g.fill();
    // Awan tipis warna senja
    for (let i = 0; i < 9; i++) {
      const cx = rnd() * 512, cy = 30 + rnd() * 110, cw = 50 + rnd() * 90, ch = 7 + rnd() * 9;
      const cl = g.createRadialGradient(cx, cy, 2, cx, cy, cw / 2);
      cl.addColorStop(0, 'rgba(255,170,150,0.28)');
      cl.addColorStop(1, 'rgba(255,170,150,0)');
      g.fillStyle = cl;
      g.beginPath(); g.ellipse(cx, cy, cw / 2, ch, 0, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Aspal: abu gelap + bintik + jejak ban gelap di lajur + tambalan + retakan halus.
export function makeAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const rnd = mulberry(42);
  g.fillStyle = '#3d3d44';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const v = 45 + rnd() * 40;
    g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 4) + ')';
    g.fillRect(rnd() * 128, rnd() * 128, 1.6, 1.6);
  }
  // Jejak ban: dua pita gelap memanjang di tiap lajur (tekstur diulang sepanjang jalan)
  for (const bx of [26, 52, 76, 102]) {
    g.fillStyle = 'rgba(20,20,24,0.5)';
    g.fillRect(bx - 5, 0, 10, 128);
  }
  // Tambalan aspal + retakan
  for (let i = 0; i < 5; i++) {
    g.fillStyle = 'rgba(28,28,32,0.55)';
    g.fillRect(rnd() * 100, rnd() * 100, 14 + rnd() * 16, 10 + rnd() * 12);
  }
  g.strokeStyle = 'rgba(22,22,26,0.8)';
  g.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    let x = rnd() * 128, y = rnd() * 128;
    g.moveTo(x, y);
    for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 22; y += (rnd() - 0.5) * 22; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Zebra cross: garis putih tebal di atas aspal.
export function makeZebraTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)';
  g.clearRect(0, 0, 128, 64);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = '#e8e8e8';
    g.fillRect(6 + i * 21, 4, 12, 56);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Lantai plaza pasar: ubin batu warna bervariasi.
export function makePlazaTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const rnd = mulberry(11);
  g.fillStyle = '#5a5148';
  g.fillRect(0, 0, 256, 256);
  const tones = ['#7a6a58', '#6e5f4e', '#84745f', '#655848', '#8a7a66'];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      g.fillStyle = tones[(rnd() * tones.length) | 0];
      g.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
      if (rnd() > 0.6) {
        g.fillStyle = 'rgba(60,50,40,0.35)';
        g.fillRect(x * 32 + 2 + rnd() * 14, y * 32 + 2 + rnd() * 14, 8, 6);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class City {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.pedestrians = [];
    this.traffic = [];
    this.stalls = [];
    this.markers = [];
    this.lamps = [];
    this.wreck = null;
    this.explosion = null;
    this.smoke = [];
    this.heli = null;
    this.night = false;
    this.rnd = mulberry(20261122);
    this.build();
  }

  mat(color, opts = {}) {
    return new THREE.MeshLambertMaterial({ color, ...opts });
  }

  box(w, h, d, color, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(color, opts));
    m.position.set(x, y, z);
    this.scene.add(m);
    return m;
  }

  // Balok silinder antara dua titik (untuk kabel jembatan, tiang, dll.)
  beam(ax, ay, az, bx, by, bz, r, color) {
    const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), this.mat(color));
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    this.scene.add(m);
    return m;
  }

  build() {
    const S = this.scene;
    // Langit senja bergradasi + matahari + awan tipis (bukan satu warna datar)
    this.skyDusk = makeSkyTexture(false);
    this.skyNight = makeSkyTexture(true);
    S.background = this.skyDusk;
    S.fog = new THREE.Fog(0x3a2350, 90, 260);
    this.hemi = new THREE.HemisphereLight(0xffb37a, 0x4a2c1e, 0.85);
    S.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xff9a4d, 1.0);
    this.sun.position.set(-80, 60, 120);
    S.add(this.sun);

    // Tanah dasar + laut + pasir
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), this.mat(0x6b4a2f));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05;
    S.add(ground);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, 520), this.mat(0x1d5f8a));
    sea.rotation.x = -Math.PI / 2; sea.position.set(330, 0.0, 0);
    S.add(sea);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 520), this.mat(0xd9b380));
    sand.rotation.x = -Math.PI / 2; sand.position.set(180, 0.02, 0);
    S.add(sand);

    // Jalan aspal bertekstur + trotoar + curb + garis tepi + marka tengah + zebra
    const asphalt = makeAsphaltTexture();
    const asphaltZ = asphalt.clone(); // jalan arah z: ulang sepanjang z
    asphaltZ.needsUpdate = true; asphaltZ.repeat.set(1, 30);
    const asphaltX = asphalt.clone(); // jalan arah x: ulang sepanjang x
    asphaltX.needsUpdate = true; asphaltX.repeat.set(30, 1);
    const roadMatZ = new THREE.MeshLambertMaterial({ map: asphaltZ });
    const roadMatX = new THREE.MeshLambertMaterial({ map: asphaltX });
    const zebraTex = makeZebraTexture();
    const zebraMat = new THREE.MeshBasicMaterial({ map: zebraTex, transparent: true, depthWrite: false });
    const edgeMat = this.mat(0xe8e8e8);
    const curbMat = this.mat(0x5a5d64);
    for (const x of WORLD.roadXs) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 420), roadMatZ);
      road.position.set(x, 0.02, 0); S.add(road);
      this.box(1.4, 0.18, 420, 0x8a8d94, x - 6, 0.04, 0); // trotoar kiri
      this.box(1.4, 0.18, 420, 0x8a8d94, x + 6, 0.04, 0); // trotoar kanan
      this.box(0.3, 0.2, 420, 0x5a5d64, x - 5.2, 0.05, 0); // curb kiri
      this.box(0.3, 0.2, 420, 0x5a5d64, x + 5.2, 0.05, 0); // curb kanan
      this.box(0.35, 0.13, 420, 0xe8e8e8, x - 4.6, 0.04, 0); // garis tepi putih kiri
      this.box(0.35, 0.13, 420, 0xe8e8e8, x + 4.6, 0.04, 0); // garis tepi putih kanan
      for (let z = -200; z < 210; z += 16) this.box(0.7, 0.13, 5, 0xf2c230, x, 0.04, z);
      // Zebra cross di tiap persimpangan
      for (const z of WORLD.roadZs) {
        const zb = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 5), zebraMat);
        zb.rotation.x = -Math.PI / 2; zb.position.set(x, 0.09, z);
        S.add(zb);
      }
    }
    for (const z of WORLD.roadZs) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(420, 0.1, 10), roadMatX);
      road.position.set(0, 0.02, z); S.add(road);
      this.box(420, 0.18, 1.4, 0x8a8d94, 0, 0.04, z - 6);
      this.box(420, 0.18, 1.4, 0x8a8d94, 0, 0.04, z + 6);
      this.box(420, 0.2, 0.3, 0x5a5d64, 0, 0.05, z - 5.2);
      this.box(420, 0.2, 0.3, 0x5a5d64, 0, 0.05, z + 5.2);
      this.box(420, 0.13, 0.35, 0xe8e8e8, 0, 0.04, z - 4.6);
      this.box(420, 0.13, 0.35, 0xe8e8e8, 0, 0.04, z + 4.6);
      for (let x = -200; x < 210; x += 16) this.box(5, 0.13, 0.7, 0xf2c230, x, 0.04, z);
    }
    // Rumput strip di taman
    for (const [x, z] of [[-90, 60], [90, -120], [-30, 120], [30, -120]]) {
      this.box(24, 0.15, 14, 0x3f7a34, x, 0.04, z);
    }
    // Rumput memanjang di kedua sisi boulevard (dulu 3 petak pendek lebar 4 —
    // tanah cokelat masih menganga di antara petak). Kini strip utuh lebar 7
    // dari z=-195 sampai -25, tepat di luar trotoar.
    for (const [gx, gz, gw, gd] of [[107, -110, 7, 170], [133, -110, 7, 170]]) {
      this.box(gw, 0.14, gd, 0x4a7a38, gx, 0.04, gz);
    }
    for (const [tx, tz] of [[108, -110], [108, -70], [108, -30], [132, -140], [132, -100], [132, -60], [132, -20]]) {
      this.shadeTree(tx, tz);
    }
    // Rambu jalan + pot tanaman di trotoar boulevard
    for (const [sx, sz, col] of [[113.4, -100, 0xf2c230], [126.6, -138, 0x2e5ec2], [113.4, -168, 0x2e5ec2], [126.6, -62, 0xf2c230]]) {
      this.roadSign(sx, sz, col);
    }
    for (const [px, pz] of [[114.4, -112], [125.6, -132], [114.4, -162], [125.6, -82]]) {
      this.potPlant(px, pz);
    }
    // Tepi boulevard diisi supaya tidak ada bidang cokelat kosong:
    // warung + skuter di sisi kota, pohon + pot + lampu tambahan di trotoar,
    // mobil parkir di tepi jalan silang + di bahu boulevard, payung + palem di sisi pantai.
    for (const [wx, wz] of [[102, -138], [102, -163], [102, -185]]) this.warung(wx, wz);
    this.scooter(106, -130); this.scooter(106, -156);
    // Pohon rindang: yang dulu di sisi barat (x=108) menutupi warung — batangnya
    // tepat segaris dengan warung di layar. Tiga pohon itu dipindah ke strip
    // timur (x=132), di antara pohon timur yang sudah ada; warung kini terlihat utuh.
    for (const [tx, tz] of [[132, -130], [132, -150], [132, -170], [132, -120], [132, -160], [132, -180]]) this.shadeTree(tx, tz);
    for (const [px, pz] of [[125.6, -102], [114.4, -142], [125.6, -172]]) this.potPlant(px, pz);
    for (const [lx, lz] of [[113, -124], [113, -164], [127, -144], [127, -184]]) this.streetLamp(lx, lz);
    // Mobil parkir di jalan silang z=-150 (tidak ada lalu lintas bergerak di sana)
    for (const [px, col, kind] of [[96, 0xc2c2c2, 'sedan'], [104, 0x2e5ec2, 'sedan'], [136, 0xf2c230, 'taxi'], [144, 0x8a8f96, 'van']]) {
      const pc = this.makeCar(col, false, kind);
      pc.position.set(px, 0, -150); pc.rotation.y = Math.PI / 2; S.add(pc);
    }
    // Mobil parkir di bahu boulevard (di luar lajur lalu lintas)
    const verge1 = this.makeCar(0x8a8f96, false, 'sedan'); verge1.position.set(110.5, 0, -135); verge1.rotation.y = Math.PI; S.add(verge1);
    const verge2 = this.makeCar(0x2e5ec2, false, 'sedan'); verge2.position.set(129.5, 0, -155); verge2.rotation.y = 0; S.add(verge2);
    // Pantai di sisi +x boulevard: payung + palem + kursi pantai di atas pasir
    for (const [ux, uz, col] of [[150, -152, 0xe85d3a], [155, -165, 0x2e7ac2], [148, -172, 0xf2c230]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), this.mat(0xe8e8e8));
      pole.position.set(ux, 1.5, uz); S.add(pole);
      const top = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 8), this.mat(col));
      top.position.set(ux, 3.2, uz); S.add(top);
    }
    this.palm(148, -140); this.palm(152, -160);
    for (const [cx, cz] of [[151, -158], [153, -168]]) {
      this.box(1.8, 0.35, 0.7, 0x2e7ac2, cx, 0.35, cz);
      this.box(0.5, 0.3, 0.6, 0xf5e6c8, cx - 0.6, 0.55, cz);
    }
    // Burung senja di langit (siluet V kecil, di langit kosong sekitar heli)
    for (const [bx, by, bz] of [[100, 28, -160], [108, 30, -175], [140, 27, -165], [148, 31, -180], [95, 26, -185], [135, 29, -155]]) {
      const bird = new THREE.Group();
      const wingMat = this.mat(0x1a1a22);
      for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.18), wingMat);
        w.position.set(s * 0.42, 0, 0);
        w.rotation.z = s * 0.5;
        bird.add(w);
      }
      bird.position.set(bx, by, bz);
      S.add(bird);
    }
    // Lantai plaza pasar berubin (bukan tanah datar)
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(110, 70), new THREE.MeshLambertMaterial({ map: makePlazaTexture() }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.05, -120);
    S.add(plaza);

    // Gedung-gedung dengan jendela menyala — SEMUA berjendela (dulu ~50% polos
    // cokelat, makanya gedung kanan pasar terlihat balok mati). Variasi fasad
    // lewat tint warna material, bukan lewat gedung polos.
    const winTex = makeWindowTexture();
    const winMats = [0xffffff, 0xe8d8c0, 0xc8d8e8, 0xd8c8c8, 0xc8e0c8].map(c => new THREE.MeshLambertMaterial({ map: winTex, color: c }));
    const rnd = this.rnd;
    for (let gx = -170; gx <= 170; gx += 28) {
      for (let gz = -170; gz <= 170; gz += 28) {
        if (WORLD.roadXs.some(rx => Math.abs(gx - rx) < 12)) continue;
        if (WORLD.roadZs.some(rz => Math.abs(gz - rz) < 12)) continue;
        if (gx > 165) continue; // pantai
        if (rnd() < 0.18) continue; // taman kosong
        const h = 8 + rnd() * 26;
        const w = 12 + rnd() * 10, d = 12 + rnd() * 10;
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), winMats[(rnd() * winMats.length) | 0]);
        b.position.set(gx + (rnd() - 0.5) * 6, h / 2, gz + (rnd() - 0.5) * 6);
        S.add(b);
        this.buildings.push(b);
      }
    }

    // Jembatan gantung merah di teluk utara
    this.buildBridge();

    // Palem di boulevard + pantai
    for (let i = 0; i < 44; i++) {
      const x = i % 2 ? 146 + rnd() * 8 : 172 + rnd() * 6;
      const z = -190 + i * 9 + rnd() * 4;
      this.palm(x, z);
    }
    for (let i = 0; i < 14; i++) this.palm(-150 + rnd() * 300, -168 + rnd() * 10);

    // Bangku + warung + payung pantai + skuter
    for (let i = 0; i < 18; i++) {
      const x = (i % 2 ? 1 : -1) * (8 + rnd() * 4) + (Math.floor(i / 2) % 5) * 60 - 120;
      const z = -140 + (i % 4) * 70;
      this.box(3, 0.5, 1.2, 0x7a5230, x, 0.35, z);
      this.box(0.4, 0.7, 1.2, 0x5a3a20, x - 1.2, 0.35, z);
      this.box(0.4, 0.7, 1.2, 0x5a3a20, x + 1.2, 0.35, z);
    }
    for (let i = 0; i < 8; i++) {
      const x = -160 + i * 44, z = 170 + (i % 2) * 8;
      this.warung(x, z);
    }
    for (let i = 0; i < 10; i++) this.umbrella(196 + rnd() * 10, -160 + i * 34);
    this.scooter(168, -60);

    // Kios pasar (klaster Pasar Baru + beberapa tersebar)
    const stallCols = [['#d84a4a', '#f5e6c8'], ['#2e7a4a', '#f5e6c8'], ['#2e5ec2', '#f5e6c8'], ['#d8a020', '#3a2a1a']];
    for (let i = 0; i < 6; i++) {
      const x = -26 + (i % 3) * 16, z = -44 + Math.floor(i / 3) * 14;
      this.addMarketStall(x, z, 0, stallCols[i % 4]);
    }
    for (let i = 0; i < 5; i++) {
      const x = -140 + rnd() * 280, z = -160 + rnd() * 320;
      if (Math.abs(x) < 30 && Math.abs(z + 30) < 30) continue;
      if (Math.abs(x) < 16 && z > -170 && z < -90) continue; // jangan di lajur pasar (staging shot 2)
      this.addMarketStall(x, z, rnd() * Math.PI, stallCols[i % 4]);
    }

    // Lampu jalan
    for (let i = 0; i < 24; i++) {
      const x = WORLD.roadXs[i % 5] + 7;
      const z = -180 + i * 16;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), this.mat(0x222226));
      pole.position.set(x, 3.5, z); S.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(x, 7.1, z); S.add(bulb);
      this.lamps.push(bulb);
    }

    // Pejalan kaki awal + lalu lintas
    this.spawnPedestrians(46);
    this.spawnTraffic(12);
  }

  buildBridge() {
    const S = this.scene;
    // Dek jembatan melintasi teluk utara (z = -190), membentang sepanjang x
    this.box(120, 1.2, 14, 0x4a4a52, 150, 6, -196);
    for (const tx of [118, 182]) {
      this.box(4, 26, 4, 0xb02a2a, tx, 19, -196);
      this.box(3, 3, 16, 0xb02a2a, tx, 30, -196);
      // Pita putih di menara + lampu peringatan merah di puncak
      this.box(4.2, 1.2, 4.2, 0xf2f2f2, tx, 24, -196);
      const warn = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
      warn.position.set(tx, 32.2, -196); S.add(warn);
    }
    // Kabel utama TEBAL (bukan garis 1px) + kabel penggantung vertikal — jembatan gantung terbaca
    for (const tx of [118, 182]) {
      for (const dz of [-1.5, 1.5]) {
        const z = -196 + dz;
        this.beam(tx - 30, 6.8, z, tx, 30, z, 0.22, 0xd8d8d8);
        this.beam(tx, 30, z, tx + 30, 6.8, z, 0.22, 0xd8d8d8);
        for (let x = tx - 30; x <= tx + 30; x += 7.5) {
          if (Math.abs(x - tx) < 1) continue;
          const yTop = 6.8 + (30 - Math.abs(x - tx)) / 30 * 23.2;
          this.beam(x, yTop, z, x, 6.8, z, 0.09, 0xc8c8c8);
        }
      }
    }
    // Lampu jembatan
    for (let x = 96; x <= 204; x += 18) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
      b.position.set(x, 8, -196); S.add(b);
    }
  }

  shadeTree(x, z) {
    const S = this.scene;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 3.2, 6), this.mat(0x5a3a22));
    trunk.position.set(x, 1.6, z); S.add(trunk);
    const greens = [0x2e6a2e, 0x3a7a34, 0x27602a];
    for (const [ox, oy, oz, r] of [[0, 4.2, 0, 2.2], [1.2, 3.5, 0.6, 1.5], [-1.1, 3.6, -0.5, 1.4]]) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), this.mat(greens[(this.rnd() * 3) | 0]));
      ball.position.set(x + ox, oy, z + oz); S.add(ball);
    }
  }

  roadSign(x, z, color) {
    const S = this.scene;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 6), this.mat(0x8a8d94));
    pole.position.set(x, 1.6, z); S.add(pole);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.08), this.mat(color));
    panel.position.set(x, 3.4, z); panel.rotation.z = Math.PI / 4; S.add(panel);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), this.mat(0x222226));
    inner.position.set(x, 3.4, z); inner.rotation.z = Math.PI / 4; S.add(inner);
  }

  streetLamp(x, z) {
    const S = this.scene;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.5, 6), this.mat(0x222226));
    pole.position.set(x, 3.25, z); S.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.12), this.mat(0x222226));
    arm.position.set(x - 0.5, 6.5, z); S.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.set(x - 1.0, 6.4, z); S.add(bulb);
    this.lamps.push(bulb);
  }

  potPlant(x, z) {
    const S = this.scene;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.7, 8), this.mat(0xb05a2a));
    pot.position.set(x, 0.35, z); S.add(pot);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), this.mat(0x3a7a34));
    bush.position.set(x, 1.1, z); S.add(bush);
    const bush2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), this.mat(0x2e6a2e));
    bush2.position.set(x + 0.3, 0.9, z + 0.2); S.add(bush2);
  }

  palm(x, z) {
    const S = this.scene;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 6, 6), this.mat(0x6b4a2a));
    trunk.position.set(x, 3, z); S.add(trunk);
    const leafMat = this.mat(0x2e7a34);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.4, 4), leafMat);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(x + Math.cos(a) * 1.3, 6.4, z + Math.sin(a) * 1.3);
      leaf.rotation.z = Math.cos(a) * 1.1;
      leaf.rotation.x = -Math.sin(a) * 1.1;
      S.add(leaf);
    }
  }

  warung(x, z) {
    const S = this.scene;
    this.box(6, 3, 5, 0x8a6a3a, x, 1.5, z);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.2, 4), this.mat(0xa03a2a));
    roof.position.set(x, 4.1, z); roof.rotation.y = Math.PI / 4; S.add(roof);
    this.box(5, 0.3, 1, 0x5a3a20, x, 1.1, z + 2.8);
  }

  umbrella(x, z) {
    const S = this.scene;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), this.mat(0xe8e8e8));
    pole.position.set(x, 1.5, z); S.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 8), this.mat((Math.random() > 0.5) ? 0xe85d3a : 0x2e7ac2));
    top.position.set(x, 3.2, z); S.add(top);
  }

  scooter(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.6), this.mat(0x2ec2b0));
    body.position.y = 0.55; g.add(body);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.5), this.mat(0x222226));
    seat.position.set(-0.3, 0.9, 0); g.add(seat);
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10);
    const wheelMat = this.mat(0x16161a);
    for (const wx of [-0.8, 0.8]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2; w.position.set(wx, 0.35, 0); g.add(w);
    }
    g.position.set(x, 0, z);
    this.scene.add(g);
    return g;
  }

  addMarketStall(x, z, ry, colors) {
    const g = new THREE.Group();
    const tex = makeAwningTexture(colors[0], colors[1]);
    const awn = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 4.4), new THREE.MeshLambertMaterial({ map: tex }));
    awn.position.y = 3.1; g.add(awn);
    for (const [px, pz] of [[-2.8, -2], [2.8, -2], [-2.8, 2], [2.8, 2]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.1, 6), this.mat(0x6b4a2a));
      pole.position.set(px, 1.55, pz); g.add(pole);
    }
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1, 3.6), this.mat(0x7a5230));
    counter.position.y = 0.9; g.add(counter);
    // Barang dagangan bervariasi: kubus, buah bulat, keranjang, gulungan kain + lampion hangat
    const goodsCols = [0xe84a4a, 0x4ae87a, 0x4a7ae8, 0xf2c230, 0xe84ad8, 0x7ae8e0];
    const rnd = this.rnd;
    for (let i = 0; i < 10; i++) {
      const gx = -2.2 + (i % 5) * 1.1, gz = -1.2 + Math.floor(i / 5) * 2.2;
      const kind = i % 3;
      if (kind === 0) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5 + rnd() * 0.3, 0.55), this.mat(goodsCols[i % 6]));
        b.position.set(gx, 1.65, gz); g.add(b);
      } else if (kind === 1) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.3 + rnd() * 0.12, 8, 8), this.mat([0xe87a2a, 0x4ae87a, 0xe84a4a, 0xf2c230][i % 4]));
        f.position.set(gx, 1.6, gz); g.add(f);
        const f2 = f.clone(); f2.position.set(gx + 0.25, 1.6, gz + 0.2); g.add(f2);
      } else {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.4, 8), this.mat(0x8a6a3a));
        basket.position.set(gx, 1.6, gz); g.add(basket);
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), this.mat(goodsCols[(i + 2) % 6]));
        roll.rotation.z = Math.PI / 2; roll.position.set(gx, 1.85, gz); g.add(roll);
      }
    }
    const strip = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 0.18), new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    strip.position.set(0, 2.95, 2.2); g.add(strip);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    lantern.position.set(0, 2.6, 0); g.add(lantern);
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    this.scene.add(g);
    this.stalls.push(g);
    return g;
  }

  hideBuildingsNear(x, z, radius) {
    for (const b of this.buildings) {
      const dx = b.position.x - x, dz = b.position.z - z;
      if (dx * dx + dz * dz < radius * radius) b.visible = false;
    }
  }

  makePerson(color, pose) {
    const g = new THREE.Group();
    // userData wajib: city.update() menggerakkan pejalan kaki dari nilai ini —
    // tanpa init, wander/speed undefined -> posisi jadi NaN dan orangnya hilang.
    g.userData = { speed: 0.8 + this.rnd() * 0.9, dir: this.rnd() * Math.PI * 2, wander: this.rnd() * 4 };
    const rnd = this.rnd;
    const h = 0.85 + rnd() * 0.3; // variasi tinggi badan
    const skin = [0xe8b98a, 0xc98d5f, 0x8a5a3a, 0xf0c8a0][(rnd() * 4) | 0];
    const pants = [0x2a2a33, 0x2a3444, 0x4a3a2a, 0x3a3a4a, 0x5a2a2a][(rnd() * 5) | 0];
    const bodyR = 0.32 + rnd() * 0.1;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyR, bodyR + 0.08, 1.1, 8), this.mat(color));
    body.position.y = 0.85; g.add(body);
    // Garis dada / rompi kontras — baju tidak lagi satu warna polos
    if (rnd() < 0.3) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.1), this.mat([0xf5e6c8, 0x2a2a33, 0xf2c230, 0xe8e8e8][(rnd() * 4) | 0]));
      stripe.position.set(0, 1.05, bodyR + 0.02); g.add(stripe);
    }
    // Lengan di sisi badan (tidak lagi kapsul polos)
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.85, 6), this.mat(color));
      arm.position.set(sx * (bodyR + 0.1), 0.95, 0);
      arm.rotation.z = sx * 0.12;
      g.add(arm);
    }
    // Pose 'browse': lengan kanan terangkat ke depan (sedang memilih barang di kios)
    if (pose === 'browse') {
      const armR = g.children[g.children.length - 1];
      armR.rotation.x = -1.15;
      armR.position.set(bodyR + 0.1, 1.15, 0.3);
      g.userData.speed = 0.25; // hampir diam di depan kios
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), this.mat(skin));
    head.position.y = 1.65; g.add(head);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), this.mat(pants));
    legs.position.y = 0.3; g.add(legs);
    // Topi / cap / tudung — variasi kepala
    const hatRoll = rnd();
    if (hatRoll < 0.18) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 8), this.mat([0xd8a020, 0x2e5ec2, 0xc24a4a, 0x3a3a3a][(rnd() * 4) | 0]));
      cap.position.y = 1.92; g.add(cap);
    } else if (hatRoll < 0.32) {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8), this.mat(0xd9b380));
      brim.position.y = 1.9; g.add(brim);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 8), this.mat(0xd9b380));
      top.position.y = 2.05; g.add(top);
    } else if (rnd() < 0.45) {
      // Rambut gelap (bila tidak bertopi)
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.33, 8, 8), this.mat([0x1a1a1a, 0x3a2a1a, 0x5a5a5a, 0x8a6a3a][(rnd() * 4) | 0]));
      hair.scale.set(1, 0.55, 1);
      hair.position.y = 1.86; g.add(hair);
    }
    // Tas / keranjang / ransel — sebagian pejalan kaki membawa barang
    const bagRoll = rnd();
    if (bagRoll < 0.2) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.16), this.mat([0x8a4ac2, 0x2e7a4a, 0xd84a4a, 0x6b4a2a][(rnd() * 4) | 0]));
      bag.position.set(bodyR + 0.22, 0.9, 0.1); g.add(bag);
    } else if (bagRoll < 0.38) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.18), this.mat([0x3a5a7a, 0x7a3a3a, 0x4a6a3a][(rnd() * 3) | 0]));
      pack.position.set(0, 1.0, -bodyR - 0.12); g.add(pack);
    } else if (bagRoll < 0.5) {
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.3, 8), this.mat(0x8a6a3a));
      basket.position.set(bodyR + 0.2, 0.55, 0.25); g.add(basket);
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), this.mat(0xe84a4a));
      fruit.position.set(bodyR + 0.2, 0.75, 0.25); g.add(fruit);
    }
    g.scale.setScalar(h);
    return g;
  }

  spawnPedestrians(n) {
    const rnd = this.rnd;
    const cols = [0xc24a4a, 0x4a7ac2, 0x4ac27a, 0xd8a020, 0x8a4ac2, 0xe8e8e8, 0x3a3a3a];
    for (let i = 0; i < n; i++) {
      const p = this.makePerson(cols[(rnd() * cols.length) | 0]);
      const onRoadX = WORLD.roadXs[(rnd() * WORLD.roadXs.length) | 0];
      const onRoadZ = WORLD.roadZs[(rnd() * WORLD.roadZs.length) | 0];
      if (rnd() > 0.5) p.position.set(onRoadX + 7 + rnd() * 3, 0, -180 + rnd() * 360);
      else p.position.set(-180 + rnd() * 360, 0, onRoadZ + 7 + rnd() * 3);
      p.userData = { speed: 1 + rnd() * 1.5, dir: rnd() * Math.PI * 2, wander: rnd() * 4 };
      this.scene.add(p);
      this.pedestrians.push(p);
    }
  }

  spawnTraffic(n) {
    const rnd = this.rnd;
    const cols = [0xc2c2c2, 0x2e5ec2, 0xd8a020, 0x3fae6a, 0x8a8f96, 0xe8e8e8];
    const kinds = ['sedan', 'sedan', 'taxi', 'pickup', 'van', 'sedan'];
    for (let i = 0; i < n; i++) {
      const col = cols[(rnd() * cols.length) | 0];
      const kind = kinds[(rnd() * kinds.length) | 0];
      const car = this.makeCar(col === 0xd8a020 && kind === 'taxi' ? 0xf2c230 : col, false, kind);
      const rx = WORLD.roadXs[(rnd() * WORLD.roadXs.length) | 0];
      car.position.set(rx + (rnd() > 0.5 ? 2.2 : -2.2), 0, -180 + rnd() * 360);
      car.rotation.y = rnd() > 0.5 ? 0 : Math.PI;
      car.userData = { speed: 8 + rnd() * 8, roadX: rx };
      this.scene.add(car);
      this.traffic.push(car);
    }
  }

  makeCar(color, police, kind = 'sedan') {
    const g = new THREE.Group();
    const glass = new THREE.MeshLambertMaterial({ color: 0x14202e });
    const glassLight = new THREE.MeshLambertMaterial({ color: 0x2e4a66 });
    const dark = new THREE.MeshLambertMaterial({ color: 0x111114 });
    const chrome = new THREE.MeshLambertMaterial({ color: 0xb8bec6 });
    const tyre = new THREE.MeshLambertMaterial({ color: 0x141416 });
    const shade = (hex, f) => new THREE.Color(hex).multiplyScalar(f).getHex();
    // Bayangan lembut di bawah mobil (tanpa shadow map, murah + selalu kelihatan)
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1.35, 2.6, 1);
    shadow.position.y = 0.08;
    g.add(shadow);

    const bodyCol = police ? 0xe8e8e8 : color;
    const accentCol = police ? 0x1a1a22 : shade(color, 0.7);
    if (kind === 'van') {
      // Naga Van: badan kotak tinggi, kaca depan + strip jendela samping
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.35, 4.3), this.mat(bodyCol));
      body.position.y = 1.0; g.add(body);
      const shield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.08), glassLight);
      shield.position.set(0, 1.35, 2.16); shield.rotation.x = -0.12; g.add(shield);
      for (const sx of [-1, 1]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 2.6), glass);
        strip.position.set(sx * 0.99, 1.35, -0.3); g.add(strip);
      }
    } else if (kind === 'pickup') {
      // Elang Pickup: kabin depan + bak terbuka di belakang
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.3), this.mat(bodyCol));
      body.position.y = 0.55; g.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.3), glass);
      cabin.position.set(0, 1.05, 1.1); g.add(cabin);
      const shield = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.8), glassLight);
      shield.position.set(0, 1.1, 1.85); shield.rotation.x = -0.45; g.add(shield);
      const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 2.0), this.mat(accentCol));
      bedFloor.position.set(0, 0.85, -1.05); g.add(bedFloor);
      for (const [bx, bz, bw, bd] of [[-0.88, -1.05, 0.12, 2.0], [0.88, -1.05, 0.12, 2.0], [0, -2.0, 1.85, 0.12]]) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.5, bd), this.mat(bodyCol));
        wall.position.set(bx, 1.05, bz); g.add(wall);
      }
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), this.mat(0x8a6a3a));
      crate.position.set(0.2, 1.2, -1.1); g.add(crate);
    } else {
      // Sedan / taksi / sport: badan bawah + kap + bagasi + kabin kaca
      const low = kind === 'sport' ? -0.06 : 0;
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 4.3), this.mat(bodyCol));
      body.position.y = 0.55 + low; g.add(body);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.3, 1.0), this.mat(accentCol));
      hood.position.set(0, 0.48 + low, 1.7); g.add(hood);
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.3, 0.8), this.mat(accentCol));
      trunk.position.set(0, 0.48 + low, -1.75); g.add(trunk);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.0), glass);
      cabin.position.set(0, 1.05 + low, -0.2); g.add(cabin);
      const shield = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.9), glassLight);
      shield.position.set(0, 1.08 + low, 0.85); shield.rotation.x = -0.45; g.add(shield);
      const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.8), glassLight);
      rearWin.position.set(0, 1.08 + low, -1.2); rearWin.rotation.x = 0.45; g.add(rearWin);
      for (const sx of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 1.7), glass);
        win.position.set(sx * 0.82, 1.05 + low, -0.2); g.add(win);
      }
      if (kind === 'sport') {
        // Garuda GT: spoiler + strip emas samping + roda lebih besar
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.35), this.mat(0x1a1a22));
        spoiler.position.set(0, 1.12, -2.0); g.add(spoiler);
        for (const sx of [-0.6, 0.6]) {
          const sup = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), this.mat(0x1a1a22));
          sup.position.set(sx, 0.95, -2.0); g.add(sup);
        }
        for (const sx of [-1, 1]) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 3.6), this.mat(0xf2c230));
          stripe.position.set(sx * 0.96, 0.62, 0); g.add(stripe);
        }
      }
      if (kind === 'taxi') {
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.5), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }));
        sign.position.set(0, 1.42, -0.2); g.add(sign);
        for (const sx of [-1, 1]) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 3.4), this.mat(0x1a1a22));
          stripe.position.set(sx * 0.96, 0.6, 0); g.add(stripe);
        }
      }
    }
    // Roda hitam + pelek abu-abu (selalu kelihatan)
    const wheelR = kind === 'sport' ? 0.45 : 0.42;
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.3, 12);
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 10);
    for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
      const w = new THREE.Mesh(wheelGeo, tyre);
      w.rotation.z = Math.PI / 2; w.position.set(wx, wheelR, wz); g.add(w);
      const hub = new THREE.Mesh(hubGeo, chrome);
      hub.rotation.z = Math.PI / 2; hub.position.set(wx, wheelR, wz); g.add(hub);
    }
    // Lampu depan putih + lampu belakang merah + grille + bumper
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c8 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a22 });
    for (const sx of [-0.6, 0.6]) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), headMat);
      head.position.set(sx, 0.55, 2.17); g.add(head);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), tailMat);
      tail.position.set(sx, 0.55, -2.17); g.add(tail);
    }
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.06), dark);
    grille.position.set(0, 0.45, 2.17); g.add(grille);
    for (const bz of [2.2, -2.2]) {
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.18, 0.15), this.mat(0x6a6d72));
      bumper.position.set(0, 0.32, bz); g.add(bumper);
    }
    if (police) {
      // Mobil polisi: light bar merah-biru + strip hitam di pintu + kap hitam
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.4), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
      bar.position.set(-0.3, 1.5, -0.2); g.add(bar);
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.4), new THREE.MeshBasicMaterial({ color: 0x2a5aff }));
      bar2.position.set(0.55, 1.5, -0.2); g.add(bar2);
      const hoodBlack = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.06, 1.0), this.mat(0x1a1a22));
      hoodBlack.position.set(0, 0.64, 1.7); g.add(hoodBlack);
      for (const sx of [-1, 1]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 3.2), this.mat(0x1a1a22));
        stripe.position.set(sx * 0.96, 0.6, 0); g.add(stripe);
      }
    }
    return g;
  }

  makeHeliMesh(scale = 1) {
    const g = new THREE.Group();
    const white = this.mat(0xf2f2f2);
    const red = this.mat(0xc22e2e);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4.6), white);
    g.add(cabin);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.4, 4.62), red);
    stripe.position.y = -0.2; g.add(stripe);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), this.mat(0x1a2a3a));
    nose.position.set(0, 0.1, 2.8); g.add(nose);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 5.2), white);
    tail.position.set(0, 0.35, -4.6); g.add(tail);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.8, 1.2), red);
    fin.position.set(0, 1.1, -7); g.add(fin);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.12, 0.5), this.mat(0x222226));
    rotor.position.y = 1.15; g.add(rotor);
    const rotor2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 9.5), this.mat(0x222226));
    rotor2.position.y = 1.15; g.add(rotor2);
    g.userData.rotor = rotor; g.userData.rotor2 = rotor2;
    for (const [sx, sz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), this.mat(0x333338));
      leg.position.set(sx, -1.25, sz); g.add(leg);
    }
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 4.4), this.mat(0x333338));
    skid.position.set(-0.9, -1.8, 0); g.add(skid);
    const skid2 = skid.clone(); skid2.position.x = 0.9; g.add(skid2);
    // Kerucut sorot: puncak di heli, melebar ke tanah (tinggi 40, disesuaikan di aimSpotlight)
    const coneGeo = new THREE.ConeGeometry(7, 40, 20, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = -20;
    g.add(cone);
    g.userData.cone = cone;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(7, 20), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.22, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -39.7;
    g.add(pool);
    g.userData.pool = pool;
    g.scale.setScalar(scale);
    return g;
  }

  placeWreck(x, z) {
    const g = this.makeCar(0x1c1c20, false, 'sedan');
    g.rotation.y = 0.5;
    g.rotation.z = 0.06; // miring seperti habis tabrakan
    g.position.set(x, 0, z);
    this.scene.add(g);
    this.wreck = g;
    // Api + asap di atas bangkai (dibesarkan supaya mobil terbakar terbaca dari jauh)
    const flame = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.6, 8), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    flame.position.set(x, 2.6, z); this.scene.add(flame);
    const flame2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.6, 8), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
    flame2.position.set(x + 0.4, 2.3, z + 0.3); this.scene.add(flame2);
    this.explosion = flame;
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.9 + i * 0.35, 8, 8), new THREE.MeshLambertMaterial({ color: 0x555560, transparent: true, opacity: 0.55 }));
      puff.position.set(x + (i - 2) * 0.4, 3.5 + i * 1.1, z);
      this.scene.add(puff);
      this.smoke.push(puff);
    }
    return g;
  }

  // Ledakan di jalan: lidah api tidak beraturan (bukan bola bulat seperti matahari),
  // pangkal merah-gelap + ujung kuning, asap hitam tebal, bara beterbangan, bekas gosong.
  placeExplosion(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    // Bekas gosong di aspal
    const scorch = new THREE.Mesh(new THREE.CircleGeometry(5.6, 20), new THREE.MeshBasicMaterial({ color: 0x0a0a0c, transparent: true, opacity: 0.65, depthWrite: false }));
    scorch.rotation.x = -Math.PI / 2; scorch.position.set(x, 0.09, z); this.scene.add(scorch);
    // Lidah api: kerucut miring dengan ukuran/arah beda-beda, menempel di jalan.
    // Dibesarkan (~1,5x) supaya api seimbang dengan kolom asap; 2 lidah tambahan
    // di sisi bangkai (ledakan (123,-163), bangkai (120,-156)) supaya api menyatu
    // dengan mobil terbakar. Tetap kerucut miring tidak beraturan — bukan bola.
    const tongues = [
      { r: 2.6, h: 5.0, c: 0xc22e08, dx: -0.9, dz: 0.3, rx: 0.16, rz: 0.2, y: 2.4 },
      { r: 2.1, h: 6.6, c: 0xff6a00, dx: 0.6, dz: -0.4, rx: -0.2, rz: -0.24, y: 3.2 },
      { r: 1.6, h: 4.8, c: 0xff8a1a, dx: 0.1, dz: 1.0, rx: 0.1, rz: -0.18, y: 2.3 },
      { r: 1.3, h: 3.8, c: 0xffd23a, dx: -0.3, dz: -0.8, rx: -0.12, rz: 0.14, y: 2.8 },
      { r: 1.0, h: 2.8, c: 0xffe98a, dx: 1.1, dz: 0.7, rx: 0.22, rz: 0.2, y: 2.0 },
      { r: 1.1, h: 3.2, c: 0xff5a00, dx: -1.4, dz: -0.5, rx: 0.05, rz: 0.3, y: 1.6 },
      { r: 1.8, h: 4.2, c: 0xff6a00, dx: -2.2, dz: 2.2, rx: 0.2, rz: -0.3, y: 2.0 },
      { r: 1.4, h: 3.4, c: 0xff8a1a, dx: 1.8, dz: 1.6, rx: -0.24, rz: 0.22, y: 1.7 },
    ];
    for (const f of tongues) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(f.r, f.h, 7), new THREE.MeshBasicMaterial({ color: f.c }));
      cone.position.set(f.dx, f.y, f.dz);
      cone.rotation.set(f.rx, 0, f.rz);
      g.add(cone);
    }
    // Bara kecil beterbangan di sekitar pangkal api
    for (let i = 0; i < 10; i++) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd23a : 0xff5a00 }));
      const a = this.rnd() * Math.PI * 2, rr = 1.6 + this.rnd() * 3.2;
      e.position.set(Math.cos(a) * rr, 0.4 + this.rnd() * 2.4, Math.sin(a) * rr);
      e.rotation.set(this.rnd() * 3, this.rnd() * 3, this.rnd() * 3);
      g.add(e);
    }
    // Serpihan puing mobil di sekitar ledakan
    for (let i = 0; i < 5; i++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.5 + this.rnd() * 0.5, 0.2, 0.4), this.mat(0x1c1c20));
      const a = this.rnd() * Math.PI * 2, rr = 2.5 + this.rnd() * 2.5;
      d.position.set(Math.cos(a) * rr, 0.15, Math.sin(a) * rr);
      d.rotation.y = this.rnd() * Math.PI;
      g.add(d);
    }
    this.scene.add(g);
    // Kolom asap hitam tebal di atas api (ikut naik di update lewat this.smoke)
    for (let i = 0; i < 7; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.1 + i * 0.42, 8, 8), new THREE.MeshLambertMaterial({ color: 0x1a1a20, transparent: true, opacity: 0.82 }));
      puff.position.set(x + (this.rnd() - 0.5) * 1.8, 4.6 + i * 1.25, z + (this.rnd() - 0.5) * 1.8);
      this.scene.add(puff);
      this.smoke.push(puff);
    }
    this.explosion = g;
    return g;
  }

  addMarker(x, z, color = 0xffc230) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }));
    m.position.set(x, 0.25, z);
    this.scene.add(m);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    beam.position.set(x, 7, z);
    this.scene.add(beam);
    this.markers.push(m, beam);
    return m;
  }

  clearMarkers() {
    for (const m of this.markers) this.scene.remove(m);
    this.markers = [];
  }

  districtAt(x, z) {
    let best = DISTRICTS[DISTRICTS.length - 1], bd = 1e9;
    for (const d of DISTRICTS) {
      const dd = (d.x - x) * (d.x - x) + (d.z - z) * (d.z - z);
      if (dd < bd) { bd = dd; best = d; }
    }
    return best.name;
  }

  setNight(on) {
    this.night = on;
    if (on) {
      this.hemi.intensity = 0.9;
      this.sun.intensity = 0.7;
      this.scene.background = this.skyNight;
      this.scene.fog = new THREE.Fog(0x1a1438, 60, 200);
    } else {
      this.hemi.intensity = 0.85;
      this.sun.intensity = 1.0;
      this.scene.background = this.skyDusk;
      this.scene.fog = new THREE.Fog(0x3a2350, 90, 260);
    }
  }

  // Lampu gantung (string lights) di atas lorong pasar: tiang + kabel + bola hangat
  addStringLights(x1, x2, z, y) {
    const S = this.scene;
    for (const px of [x1, x2]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, y, 6), this.mat(0x2a2a2e));
      pole.position.set(px, y / 2, z); S.add(pole);
    }
    const wire = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), 0.05, 0.05), this.mat(0x1a1a1a));
    wire.position.set((x1 + x2) / 2, y, z); S.add(wire);
    const n = 9;
    for (let i = 0; i < n; i++) {
      const bx = x1 + (x2 - x1) * (i + 0.5) / n;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
      bulb.position.set(bx, y - 0.25, z); S.add(bulb);
    }
  }

  aimSpotlight(heli) {
    if (!heli) return;
    const h = Math.max(6, heli.position.y);
    const s = heli.scale.x || 1; // kerucut + kolam cahaya adalah anak grup heli yang ikut ter-skala
    const cone = heli.userData.cone, pool = heli.userData.pool;
    if (cone) {
      cone.scale.y = h / 40 / s;
      cone.position.y = -h / 2 / s;
    }
    if (pool) pool.position.y = (-h + 0.3) / s;
  }

  update(dt, t) {
    // Pejalan kaki berkeliaran pelan
    for (const p of this.pedestrians) {
      p.userData.wander -= dt;
      if (p.userData.wander <= 0) {
        p.userData.dir = Math.random() * Math.PI * 2;
        p.userData.wander = 2 + Math.random() * 4;
      }
      p.position.x += Math.cos(p.userData.dir) * p.userData.speed * dt;
      p.position.z += Math.sin(p.userData.dir) * p.userData.speed * dt;
      p.position.x = Math.max(-185, Math.min(185, p.position.x));
      p.position.z = Math.max(-185, Math.min(185, p.position.z));
      p.rotation.y = -p.userData.dir;
    }
    // Lalu lintas lurus di jalurnya
    for (const c of this.traffic) {
      const fwd = c.rotation.y === 0 ? -1 : 1;
      c.position.z += fwd * c.userData.speed * dt;
      if (c.position.z < -200) c.position.z = 200;
      if (c.position.z > 200) c.position.z = -200;
    }
    // Asap naik pelan
    for (let i = 0; i < this.smoke.length; i++) {
      const p = this.smoke[i];
      p.position.y += dt * 0.6;
      if (p.position.y > 10) p.position.y = 3.5;
    }
    if (this.explosion) {
      const s = 1 + Math.sin(t * 6) * 0.08;
      this.explosion.scale.setScalar(s);
    }
    if (this.heli) {
      this.heli.userData.rotor.rotation.y = t * 22;
      this.heli.userData.rotor2.rotation.y = t * 22;
    }
  }
}
