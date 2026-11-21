// Kota Senja v5 — entrypoint program/v1 (Node 22, standard library only).
//
// The game itself lives in game/ (plain static files: game/index.html plus its ES
// modules and the vendored three.js build; a desktop browser loads it offline, no
// network request anywhere). This program hands the game in: it stages game/ and
// screenshots/ into the grader's output directory and writes dossier.json there,
// the summary the judge reads, built with the vendored make.fun library.
//
// Run it the way the grader does:
//   MAKEFUN_OUTPUT_DIR=/tmp/out-test node main.ts
// (inside the grader's container the output directory is /output.)
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Batas yang dipakai penilai (lihat reference/gate.json di kit): text_max_bytes
// membentuk ukuran dossier; sisanya menolak entry yang penilai juga tolak —
// lebih dari 4 screenshot atau satu di atas 256 KiB; lebih dari 993 file di
// game/ atau total di atas 48 MiB; atau satu path game di atas 1000 byte.
const SCORER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const destRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function listFilesRecursively(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFilesRecursively(full));
    else if (entry.isFile()) found.push(full);
  }
  return found.sort();
}

function checkInputs() {
  const gameDir = path.join(repoRoot, 'game');
  const shotsDir = path.join(repoRoot, 'screenshots');
  if (!fs.existsSync(path.join(gameDir, 'index.html'))) {
    throw new Error('game/index.html tidak ditemukan di ' + repoRoot);
  }
  const gameFiles = listFilesRecursively(gameDir);
  if (gameFiles.length > SCORER_CAPS.game_max_files) {
    throw new Error('game/ berisi ' + gameFiles.length + ' file, melebihi batas ' + SCORER_CAPS.game_max_files);
  }
  const shotFiles = fs.existsSync(shotsDir)
    ? fs.readdirSync(shotsDir).filter((n) => /\.(png|jpe?g)$/i.test(n)).sort()
    : [];
  if (shotFiles.length === 0 || shotFiles.length > SCORER_CAPS.screenshots.max) {
    throw new Error('screenshots/ harus berisi 1 sampai 4 gambar, ditemukan ' + shotFiles.length);
  }
  for (const name of shotFiles) {
    const size = fs.statSync(path.join(shotsDir, name)).size;
    if (size > SCORER_CAPS.screenshots.max_bytes) {
      throw new Error('screenshot ' + name + ' sebesar ' + size + ' byte, melebihi 256 KiB');
    }
  }
  return { gameFiles, shotFiles };
}

function publish() {
  const { gameFiles, shotFiles } = checkInputs();
  fs.mkdirSync(destRoot, { recursive: true });
  fs.cpSync(path.join(repoRoot, 'game'), path.join(destRoot, 'game'), { recursive: true });
  const shotsOut = path.join(destRoot, 'screenshots');
  fs.mkdirSync(shotsOut, { recursive: true });
  for (const name of shotFiles) {
    fs.copyFileSync(path.join(repoRoot, 'screenshots', name), path.join(shotsOut, name));
  }
  const dossierText = buildDossier(destRoot, SCORER_CAPS);
  fs.writeFileSync(path.join(destRoot, 'dossier.json'), dossierText);
  const totalBytes = gameFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  console.log(
    'Kota Senja v5 -> ' + destRoot +
    ' | game: ' + gameFiles.length + ' file, ' + totalBytes + ' byte' +
    ' | screenshots: ' + shotFiles.join(', ') +
    ' | dossier: ' + dossierText.length + ' byte',
  );
}

publish();
