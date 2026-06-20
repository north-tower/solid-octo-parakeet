import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const requireFromScript = createRequire(import.meta.url);
const electronDir = path.dirname(requireFromScript.resolve('electron/package.json'));
const electronRequire = createRequire(path.join(electronDir, 'package.json'));
const { downloadArtifact } = electronRequire('@electron/get');
const { version } = electronRequire('./package.json');
const platformPath = process.platform === 'win32' ? 'electron.exe' : 'electron';
const distDir = path.join(electronDir, 'dist');
const binaryPath = path.join(distDir, platformPath);
const pathFile = path.join(electronDir, 'path.txt');

async function ensureElectron() {
  if (fs.existsSync(binaryPath) && fs.existsSync(pathFile)) {
    console.log('Electron binary already installed.');
    return;
  }

  console.log(`Installing Electron ${version}...`);

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    platform: process.platform,
    arch: process.arch,
    checksums: electronRequire('./checksums.json'),
  });

  console.log(`Downloaded ${zipPath}`);

  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${distDir.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: 'inherit' },
    );
  } else {
    const extract = electronRequire('extract-zip');
    await extract(zipPath, { dir: distDir });
  }

  await fs.promises.writeFile(pathFile, platformPath);

  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Electron binary missing after install: ${binaryPath}`);
  }

  console.log('Electron installed successfully.');
}

ensureElectron().catch((error) => {
  console.error(error);
  process.exit(1);
});
