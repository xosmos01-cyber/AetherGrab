const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync, spawn } = require('child_process');

class BinaryManager {
  constructor() {
    this.appDataDir = path.join(process.env.APPDATA || os.homedir(), 'AetherGrab', 'bin');
    this.ensureAppDataBin();
    this.customPath = '';
  }

  ensureAppDataBin() {
    try {
      if (!fs.existsSync(this.appDataDir)) {
        fs.mkdirSync(this.appDataDir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create AppData bin directory:', e);
    }
  }

  setCustomPath(dirPath) {
    if (dirPath && fs.existsSync(dirPath)) {
      this.customPath = dirPath;
    }
  }

  getBinaryPath(name) {
    const filename = process.platform === 'win32' ? `${name}.exe` : name;

    // 1. Custom User Path
    if (this.customPath) {
      const customFile = path.join(this.customPath, filename);
      if (fs.existsSync(customFile)) return customFile;
    }

    // 2. AppData Directory (%APPDATA%/AetherGrab/bin/)
    const appDataFile = path.join(this.appDataDir, filename);
    if (fs.existsSync(appDataFile)) return appDataFile;

    // 3. Process Resources (Bundled app in electron builder)
    if (process.resourcesPath) {
      const resourceFile = path.join(process.resourcesPath, 'bin', filename);
      if (fs.existsSync(resourceFile)) return resourceFile;
    }

    // 4. Local workspace src-electron/bin/ or old project/bin/
    const localBin = path.join(__dirname, 'bin', filename);
    if (fs.existsSync(localBin)) return localBin;

    const oldProjectBin = path.join(__dirname, '..', 'old project', 'bin', filename);
    if (fs.existsSync(oldProjectBin)) return oldProjectBin;

    // 5. Check System PATH
    try {
      const testRun = spawnSync(filename, ['--version'], { timeout: 3000, windowsHide: true });
      if (testRun.status === 0) return filename;
    } catch (e) {}

    return filename; // Fallback to executable name
  }

  getYtDlp() {
    return this.getBinaryPath('yt-dlp');
  }

  getFfmpeg() {
    return this.getBinaryPath('ffmpeg');
  }

  getFfprobe() {
    return this.getBinaryPath('ffprobe');
  }

  getDeno() {
    return this.getBinaryPath('deno');
  }

  async updateYtDlp(onProgress) {
    return new Promise((resolve) => {
      const ytDlp = this.getYtDlp();
      if (onProgress) onProgress('Checking for yt-dlp updates...');

      // Run yt-dlp -U
      try {
        const proc = spawn(ytDlp, ['-U'], { windowsHide: true });
        let output = '';

        proc.stdout.on('data', (d) => {
          output += d.toString();
          if (onProgress) onProgress(d.toString().trim());
        });
        proc.stderr.on('data', (d) => {
          output += d.toString();
          if (onProgress) onProgress(d.toString().trim());
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, message: output.trim() || 'yt-dlp is up to date.' });
          } else {
            resolve({ success: false, message: output.trim() || `Update failed with code ${code}` });
          }
        });

        proc.on('error', (err) => {
          resolve({ success: false, message: err.message });
        });
      } catch (e) {
        resolve({ success: false, message: e.message });
      }
    });
  }

  getVersions() {
    let ytdlpVer = 'Unknown';
    let ffmpegVer = 'Missing';
    let denoVer = 'Missing';

    try {
      const ytdlpProc = spawnSync(this.getYtDlp(), ['--version'], { timeout: 4000, windowsHide: true });
      if (ytdlpProc.status === 0) {
        ytdlpVer = ytdlpProc.stdout.toString().trim();
      }
    } catch (e) {}

    try {
      const ffmpegProc = spawnSync(this.getFfmpeg(), ['-version'], { timeout: 4000, windowsHide: true });
      if (ffmpegProc.status === 0) {
        const match = ffmpegProc.stdout.toString().match(/ffmpeg version ([^\s]+)/i);
        ffmpegVer = match ? match[1] : 'Installed';
      }
    } catch (e) {}

    try {
      const denoProc = spawnSync(this.getDeno(), ['--version'], { timeout: 4000, windowsHide: true });
      if (denoProc.status === 0) {
        const match = denoProc.stdout.toString().match(/deno ([^\s]+)/i);
        denoVer = match ? match[1] : 'Installed';
      }
    } catch (e) {}

    return {
      ytdlp: ytdlpVer,
      ffmpeg: ffmpegVer,
      deno: denoVer,
      paths: {
        ytdlp: this.getYtDlp(),
        ffmpeg: this.getFfmpeg(),
        ffprobe: this.getFfprobe(),
        deno: this.getDeno(),
        appData: this.appDataDir,
      }
    };
  }
}

module.exports = new BinaryManager();
