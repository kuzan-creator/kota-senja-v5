// Kota Senja v5 — data statis: distrik, kru, senjata, kendaraan, radio, misi.
// Semua nama orisinal Indonesia. Tidak ada aset atau nama dari pihak ketiga.
export const WORLD = {
  size: 420,
  roadXs: [-120, -60, 0, 60, 120],
  roadZs: [-150, -90, -30, 30, 90, 150],
  seaX: 190,
  bayZ: -190,
};

export const DISTRICTS = [
  { name: 'Pantai Senja', x: 150, z: -40 },
  { name: 'Pasar Baru', x: 0, z: -30 },
  { name: 'Pelabuhan', x: -40, z: 150 },
  { name: 'Bukit Hijau', x: -140, z: -120 },
  { name: 'Kampung Nelayan', x: 140, z: -160 },
  { name: 'Terminal', x: -130, z: 130 },
  { name: 'Kota Senja', x: 0, z: 60 },
];

export const CREW = [
  { id: 'dedi', name: 'Dedi "Si Gesit" Prasetyo', role: 'Pengemudi', skill: 'Plat Palsu', key: 'Z', cd: 45, desc: 'Wanted turun 2 bintang', initials: 'DP' },
  { id: 'sari', name: 'Sari "Montir" Wulandari', role: 'Mekanik', skill: 'Perbaikan Kilat', key: 'X', cd: 60, desc: 'Mobil pulih 100%', initials: 'SW' },
  { id: 'bimo', name: 'Bimo "Mata Elang" Santoso', role: 'Pengintai', skill: 'Mata Elang', key: 'C', cd: 40, desc: 'Tandai target & polisi', initials: 'BS' },
];

export const WEAPONS = [
  { id: 'pistol', name: 'Pistol', ammo: '∞', reserve: '∞', damage: 34, rate: 0.28 },
  { id: 'smg', name: 'SMG', ammo: 120, reserve: 240, damage: 18, rate: 0.09 },
  { id: 'shotgun', name: 'Shotgun', ammo: 24, reserve: 48, damage: 22, rate: 0.7, pellets: 5 },
  { id: 'rifle', name: 'Rifle', ammo: 30, reserve: 90, damage: 55, rate: 0.5 },
  { id: 'pelontar', name: 'Pelontar', locked: true },
  { id: 'badai', name: 'Badai', locked: true },
];

export const VEHICLES = [
  { id: 'garuda', name: 'Garuda GT', top: 118, accel: 26, color: 0xc22e2e },
  { id: 'komodo', name: 'Komodo S', top: 96, accel: 20, color: 0x2e5ec2 },
  { id: 'elang', name: 'Elang Pickup', top: 88, accel: 17, color: 0xd8a020 },
  { id: 'kancil', name: 'Kancil City', top: 82, accel: 16, color: 0x3fae6a },
  { id: 'naga', name: 'Naga Van', top: 76, accel: 14, color: 0x8a8f96 },
];

export const RADIOS = [
  { id: 'senja', name: 'Senja FM 98.6', genre: 'Dangdut Senja', bpm: 112, scale: [0, 3, 5, 7, 10] },
  { id: 'pantai', name: 'Pantai FM 91.2', genre: 'Pop Pantai', bpm: 96, scale: [0, 2, 4, 7, 9] },
  { id: 'ombak', name: 'Ombak FM 104.5', genre: 'Rock Ombak', bpm: 132, scale: [0, 3, 5, 6, 10] },
];

export const RANKS = [
  { name: 'Tukang', min: 0, max: 1500 },
  { name: 'Fixer', min: 1500, max: 3000 },
  { name: 'Bandar', min: 3000, max: 5200 },
  { name: 'Raja Senja', min: 5200, max: 99999 },
];

export const POLICE_UNITS = [
  { id: 'Senja-11', role: 'Pursuit' },
  { id: 'Pantai-23', role: 'Ramming' },
  { id: 'Pasar-07', role: 'Flanking' },
  { id: 'Pelabuhan-31', role: 'Pursuit' },
  { id: 'Bukit-05', role: 'Blockade' },
];

// Misi: stage kind: goto | collect | deliver | race | escape | defeat | follow
// target: [x, z] di peta. time: batas detik (0 = tanpa batas).
export const MISSIONS = [
  { id: 1, name: 'Kunci Pertama', giver: 'Darma', desc: 'Ambil kunci bengkel dari Darma', district: 'Kota Senja', reward: 150, rep: 120,
    stages: [ { kind: 'goto', label: 'Temui Darma di bengkel', target: [18, 42], time: 0 } ] },
  { id: 2, name: 'Tiga Paket Bu Ratna', giver: 'Bu Ratna', desc: 'Ambil 3 paket di kios-kios pasar', district: 'Pasar Baru', reward: 300, rep: 180,
    stages: [ { kind: 'collect', label: 'Kumpulkan paket di kios pasar', targets: [[-14, -46], [10, -18], [-24, -8]], time: 150 } ] },
  { id: 3, name: 'Utang Kopi', giver: 'Bu Ratna', desc: 'Antar kopi ke warung Pak Slamet', district: 'Kampung Nelayan', reward: 250, rep: 150,
    stages: [ { kind: 'deliver', label: 'Antar kopi ke warung (naik mobil)', target: [120, -140], time: 120 } ] },
  { id: 4, name: 'Balapan Senja', giver: 'Dedi', desc: 'Menangi balapan jalanan 4 checkpoint', district: 'Pantai Senja', reward: 600, rep: 300,
    stages: [ { kind: 'race', label: 'Lewati checkpoint balapan', targets: [[150, -60], [120, 60], [30, 120], [-60, 30]], time: 150 } ] },
  { id: 5, name: 'Tagihan Lama', giver: 'Bu Ratna', desc: 'Tagih utang dari dua toko', district: 'Pasar Baru', reward: 700, rep: 220,
    stages: [ { kind: 'collect', label: 'Tagih utang dari toko', targets: [[-40, -30], [40, -60]], time: 180 } ] },
  { id: 6, name: 'Mobil Pesanan', giver: 'Darma', desc: 'Curi Garuda GT dan antar ke garasi', district: 'Pantai Senja', reward: 1200, rep: 420,
    stages: [
      { kind: 'goto', label: 'Curi Garuda GT di boulevard', target: [160, -120], time: 0 },
      { kind: 'deliver', label: 'Bawa Garuda GT ke garasi Darma', target: [18, 42], time: 120 },
      { kind: 'escape', label: 'Lepas dari kejaran, lalu ke garasi Darma', target: [18, 42], time: 75 },
    ] },
  { id: 7, name: 'Mata Elang', giver: 'Bimo', desc: 'Tandai tiga kurir saingan dari atap', district: 'Bukit Hijau', reward: 550, rep: 260,
    stages: [ { kind: 'collect', label: 'Tandai kurir saingan (dekati mereka)', targets: [[-120, -90], [-90, -120], [-140, -40]], time: 180 } ] },
  { id: 8, name: 'Derby Pelabuhan', giver: 'Dedi', desc: 'Balapan dermaga, 4 checkpoint', district: 'Pelabuhan', reward: 900, rep: 380,
    stages: [ { kind: 'race', label: 'Lewati checkpoint dermaga', targets: [[-60, 150], [0, 120], [60, 150], [-20, 90]], time: 150 } ] },
  { id: 9, name: 'Kabur dari Razia', giver: 'Sari', desc: 'Lolos dari razia dan roadblock', district: 'Terminal', reward: 800, rep: 340,
    stages: [ { kind: 'escape', label: 'Lepas dari razia polisi', target: [-130, 130], time: 90 } ] },
  { id: 10, name: 'Kiriman Tengah Malam', giver: 'Bu Ratna', desc: 'Antar kiriman ke gudang pelabuhan', district: 'Pelabuhan', reward: 650, rep: 280,
    stages: [ { kind: 'deliver', label: 'Antar kiriman ke gudang pelabuhan', target: [-60, 160], time: 150 } ] },
  { id: 11, name: 'Perebutan Terminal', giver: 'Darma', desc: 'Usir empat preman terminal', district: 'Terminal', reward: 1100, rep: 450,
    stages: [ { kind: 'defeat', label: 'Kalahkan preman terminal', target: [-130, 130], count: 4, time: 240 } ] },
  { id: 12, name: 'Raja Senja', giver: 'Darma', desc: 'Finale: rebut mahkota jalanan Senja', district: 'Pantai Senja', reward: 2500, rep: 900,
    stages: [
      { kind: 'goto', label: 'Temui Darma di boulevard', target: [150, -100], time: 0 },
      { kind: 'follow', label: 'Ikuti mobil Bos Pantai', target: [120, -60], time: 90 },
      { kind: 'escape', label: 'Lolos dan kembali ke garasi Darma', target: [18, 42], time: 90 },
    ] },
];

export const DIALOGUES = {
  intro: { speaker: 'Darma', initials: 'DR', text: 'Selamat datang di Kota Senja, Raka. Kota ini milik yang berani.' },
  mission: { speaker: 'Bu Ratna', initials: 'BR', text: 'Garuda GT itu harus sampai ke garasi sebelum senja habis, Raka.' },
  market: { speaker: 'Bu Ratna', initials: 'BR', text: 'Tiga paket, Raka. Jangan sampai ketinggalan satu pun.' },
  police: { speaker: 'Kota Senja PD', initials: 'PD', text: 'Semua unit, tersangka di boulevard. Tangkap hidup-hidup!' },
};
