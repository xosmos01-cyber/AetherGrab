const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const binaryManager = require('./binaryManager');

class MediaEngine {
  constructor() {
    this.activeProcesses = new Map(); // downloadId -> childProcess
  }

  getEnv() {
    const env = { ...process.env };
    const binDir = path.dirname(binaryManager.getFfmpeg());
    env.PATH = binDir + (process.platform === 'win32' ? ';' : ':') + (env.PATH || '');
    return env;
  }

  extractVideoId(url) {
    const value = String(url || '').trim();
    let match = value.match(/[?&]v=([\w-]{11})(?:[&#]|$)/i) ||
                value.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts|embed)\/)([\w-]{11})(?:[/?#]|$)/i);
    if (match) return match[1];

    match = value.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)(?:[/?#]|$)/i) ||
            value.match(/instagram\.com\/stories\/[^/?#]+\/([\w-]+)(?:[/?#]|$)/i) ||
            value.match(/(?:www\.)?snapchat\.com\/(?:spotlight|t|add|story|stories|p)\/([\w-]+)(?:[/?#]|$)/i) ||
            value.match(/(?:story|t)\.snapchat\.com\/(?:p\/)?([\w-]+)(?:[/?#]|$)/i);
    if (match) return match[1];

    return '';
  }

  parseTimecode(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d{1,3})?$/.test(text)) return NaN;
    const parts = text.split(':');
    if (parts.length > 3) return NaN;
    const componentCount = parts.length;
    const seconds = parseFloat(parts.pop());
    const minutes = parts.length ? parseInt(parts.pop(), 10) : 0;
    const hours = parts.length ? parseInt(parts.pop(), 10) : 0;
    if (componentCount === 3 && minutes >= 60) return NaN;
    if (componentCount >= 2 && seconds >= 60) return NaN;
    return hours * 3600 + minutes * 60 + seconds;
  }

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00';
    const whole = Math.floor(seconds);
    const h = Math.floor(whole / 3600);
    const m = Math.floor((whole % 3600) / 60);
    const s = whole % 60;
    return (h ? `${h}:${String(m).padStart(2, '0')}` : m) + ':' + String(s).padStart(2, '0');
  }

  buildTimecodeRange(startText, endText, precise) {
    const start = this.parseTimecode(startText);
    const end = this.parseTimecode(endText);

    if (start === null && end === null) return null;
    if (isNaN(start) || isNaN(end)) {
      throw new Error('Use SS, MM:SS, or HH:MM:SS timestamps (e.g. 1:23:45).');
    }
    const s = start === null ? 0 : start;
    const e = end === null ? Infinity : end;
    if (e <= s) {
      throw new Error('End timestamp must be greater than start timestamp.');
    }

    const fileTag = `${this.formatDuration(s).replace(/:/g, 'h')}-${isFinite(e) ? this.formatDuration(e).replace(/:/g, 'h') : 'end'}`;
    return {
      start: s,
      end: e,
      precise: !!precise,
      argument: `*${s}-${isFinite(e) ? e : 'inf'}`,
      label: `${this.formatDuration(s)} - ${this.formatDuration(e)}`,
      fileTag: fileTag,
    };
  }

  buildCookieArgs(cookieSource, customCookieFile) {
    if (!cookieSource || cookieSource === 'none') return [];
    if (cookieSource === 'custom' && customCookieFile && fs.existsSync(customCookieFile)) {
      return ['--cookies', customCookieFile];
    }
    if (['chrome', 'edge', 'firefox', 'brave', 'opera', 'vivaldi'].includes(cookieSource)) {
      return ['--cookies-from-browser', cookieSource];
    }
    return [];
  }

  friendlyError(log) {
    const t = String(log).toLowerCase();
    if (/dpapi|failed to decrypt/.test(t)) return 'Browser cookie decryption failed. Close the browser or select None.';
    if (/private video/.test(t)) return 'This video is private.';
    if (/age|confirm your age/.test(t) && /restricted|sign in|confirm/.test(t)) return 'This video requires an age-verified signed-in account.';
    if (/country|region/.test(t) && /blocked|available/.test(t)) return 'This video is not available in your country/region.';
    if (/members.only/.test(t)) return 'This is a members-only video.';
    if (/removed|video unavailable/.test(t)) return 'This video is unavailable or has been removed.';
    if (/429|too many requests/.test(t)) return 'YouTube rate-limited the request. Please wait a few minutes and retry.';
    if (/ffmpeg/.test(t) && /not found|missing/.test(t)) return 'FFmpeg executable missing or non-functional.';
    if (/sign in|login/.test(t)) return 'Sign-in required to access this media.';
    return 'Media processing failed. Check the URL, permissions, and network connection.';
  }

  async probeMetadata(rawUrl, cookieSource, customCookieFile) {
    return new Promise((resolve, reject) => {
      const ytdlp = binaryManager.getYtDlp();
      const cookieArgs = this.buildCookieArgs(cookieSource, customCookieFile);

      const args = [
        '--dump-single-json',
        '--no-playlist',
        '--no-warnings',
        '--no-color',
        '--socket-timeout', '30',
        ...cookieArgs,
        rawUrl
      ];

      let stdout = '';
      let stderr = '';
      const proc = spawn(ytdlp, args, { windowsHide: true, env: this.getEnv() });

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code !== 0 || !stdout.trim()) {
          return reject(new Error(this.friendlyError(stderr || stdout)));
        }

        try {
          const info = JSON.parse(stdout);
          const rawFormats = info.formats || [];
          const formats = [];

          rawFormats.forEach((f) => {
            if (!f.format_id) return;
            const hasVideo = f.vcodec && f.vcodec !== 'none';
            const hasAudio = f.acodec && f.acodec !== 'none';
            const kind = hasVideo && hasAudio ? 'mixed' : (hasVideo ? 'video' : (hasAudio ? 'audio' : 'unknown'));

            const res = f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : '');
            const bitrate = f.tbr ? `${Math.round(f.tbr)} kbps` : (f.abr ? `${Math.round(f.abr)} kbps` : '');
            const ext = (f.ext || '').toUpperCase();
            const note = f.format_note || f.format || '';

            formats.push({
              id: f.format_id,
              ext: f.ext,
              kind: kind,
              resolution: res,
              bitrate: bitrate,
              fps: f.fps ? `${f.fps}fps` : '',
              vcodec: f.vcodec || '',
              acodec: f.acodec || '',
              filesize: f.filesize || f.filesize_approx || 0,
              description: `${kind.toUpperCase()} · ${res || ext} ${bitrate ? '· ' + bitrate : ''} ${f.vcodec ? '(' + f.vcodec + ')' : ''} ${note}`.trim()
            });
          });

          resolve({
            id: info.id,
            title: info.title || 'Untitled Media',
            thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails.length ? info.thumbnails[info.thumbnails.length - 1].url : ''),
            duration: info.duration || 0,
            formattedDuration: this.formatDuration(info.duration),
            uploader: info.uploader || info.channel || 'Unknown Creator',
            viewCount: info.view_count || 0,
            likeCount: info.like_count || 0,
            formats: formats,
            webpage_url: info.webpage_url || rawUrl
          });
        } catch (e) {
          reject(new Error('Failed to parse media metadata: ' + e.message));
        }
      });

      proc.on('error', (err) => {
        reject(new Error('Could not execute yt-dlp: ' + err.message));
      });
    });
  }

  buildDownloadArgs(options) {
    const {
      url,
      quality = '1080',
      formatMode = 'video+audio',
      exactFormatId = '',
      outputFolder,
      cookieSource = 'none',
      customCookieFile = '',
      timecode = null
    } = options;

    const ffmpegPath = binaryManager.getFfmpeg();
    const hasFfmpeg = fs.existsSync(ffmpegPath);

    // Note: --windows-filenames is intentionally excluded to preserve Unicode titles (Hindi, Emojis, etc.)
    const args = [
      '--no-playlist',
      '--newline',
      '--no-overwrites',
      '--concurrent-fragments', '4',
      '--retries', '10',
      '--fragment-retries', '10',
      '--no-mtime',
      '--socket-timeout', '30',
      ...this.buildCookieArgs(cookieSource, customCookieFile)
    ];

    const highRes = quality === '1440' || quality === '2160';
    const maxH = quality === 'best' || exactFormatId ? 4320 : parseInt(quality, 10) || 1080;
    const cap = `[height<=${maxH}]`;
    const recode = 'VideoConvertor:-c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a aac -b:a 320k';

    if (timecode && timecode.argument) {
      args.push('--download-sections', timecode.argument, '--live-from-start');
      if (timecode.precise) args.push('--force-keyframes-at-cuts');
    }

    if (exactFormatId) {
      if (formatMode === 'video+audio') {
        args.push('-f', `${exactFormatId}+bestaudio[ext=m4a]/${exactFormatId}+bestaudio/${exactFormatId}`, '--merge-output-format', 'mp4');
      } else if (formatMode === 'audio') {
        args.push('-f', 'bestaudio[ext=m4a]/bestaudio');
        if (hasFfmpeg) args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      } else {
        args.push('-f', exactFormatId);
      }
    } else if (formatMode === 'audio') {
      args.push('-f', 'bestaudio[ext=m4a]/bestaudio');
      if (hasFfmpeg) args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (formatMode === 'video+audio') {
      if (hasFfmpeg && highRes) {
        args.push('-f', `bestvideo${cap}+bestaudio/best${cap}`, '-S', 'res,br', '--merge-output-format', 'mkv', '--recode-video', 'mp4', '--postprocessor-args', recode);
      } else if (hasFfmpeg) {
        args.push('-f', `bestvideo[vcodec^=avc1]${cap}+bestaudio[ext=m4a]/bestvideo${cap}+bestaudio/best${cap}`, '-S', 'res,vcodec:h264,br', '--merge-output-format', 'mp4');
      } else {
        args.push('-f', `best[ext=mp4]${cap}/best${cap}`, '-S', 'res,vcodec:h264,br');
      }
    } else {
      // Video only
      args.push('-f', `bestvideo[vcodec^=avc1]${cap}/bestvideo${cap}/best${cap}`, '-S', 'res,vcodec:h264,br');
    }

    if (hasFfmpeg) {
      args.push('--ffmpeg-location', ffmpegPath);
    }

    const suffix = timecode ? ` [cut ${timecode.fileTag}]` : '';
    const outputTemplate = path.join(outputFolder, `%(title)s [%(id)s]${suffix}.%(ext)s`);
    args.push('-o', outputTemplate, url);

    return args;
  }

  findOutputFile(outputFolder, videoId, log, timecode) {
    const finalExtensions = ['.mp4', '.mp3', '.m4a', '.webm', '.mkv', '.mov'];

    // 1. Check stdout log for Destination or Merger lines
    const patterns = [
      /\[ExtractAudio\]\s*Destination:\s*([^\r\n]+\.(?:mp3|m4a))/ig,
      /\[Merger\].*?"([^"]+\.(?:mp4|mkv|webm))"/ig,
      /Destination:\s*([^\r\n]+\.(?:mp4|mp3|m4a|webm|mkv))/ig
    ];

    for (let p = 0; p < patterns.length; p++) {
      let match;
      let latest = '';
      while ((match = patterns[p].exec(log))) {
        latest = match[1].trim();
      }
      if (latest && fs.existsSync(latest)) {
        return latest;
      }
    }

    // 2. Scan outputFolder for files matching [videoId] and sort by most recent mtimeMs
    if (outputFolder && fs.existsSync(outputFolder)) {
      try {
        const files = fs.readdirSync(outputFolder).filter((name) => {
          const lower = name.toLowerCase();
          const hasExt = finalExtensions.some(ext => lower.endsWith(ext));
          const notTemp = !lower.endsWith('.part') && !lower.endsWith('.ytdl') && !lower.includes('.part-') && !/\.f\d+\./.test(lower);
          const matchesId = videoId ? name.includes(`[${videoId}]`) : true;
          const matchesCut = timecode ? name.includes(`[cut ${timecode.fileTag}]`) : true;
          return hasExt && notTemp && matchesId && matchesCut;
        });

        if (files.length > 0) {
          files.sort((a, b) => {
            return fs.statSync(path.join(outputFolder, b)).mtimeMs - fs.statSync(path.join(outputFolder, a)).mtimeMs;
          });
          return path.join(outputFolder, files[0]);
        }
      } catch (e) {}
    }

    // 3. Fallback: newest video/audio file created in outputFolder in the last 3 minutes
    if (outputFolder && fs.existsSync(outputFolder)) {
      try {
        const now = Date.now();
        const files = fs.readdirSync(outputFolder).filter((name) => {
          const lower = name.toLowerCase();
          const hasExt = finalExtensions.some(ext => lower.endsWith(ext));
          const notTemp = !lower.endsWith('.part') && !lower.endsWith('.ytdl') && !lower.includes('.part-') && !/\.f\d+\./.test(lower);
          return hasExt && notTemp;
        });

        if (files.length > 0) {
          files.sort((a, b) => {
            return fs.statSync(path.join(outputFolder, b)).mtimeMs - fs.statSync(path.join(outputFolder, a)).mtimeMs;
          });
          const newest = path.join(outputFolder, files[0]);
          const stat = fs.statSync(newest);
          if (now - stat.mtimeMs < 180000) {
            return newest;
          }
        }
      } catch (e) {}
    }

    return '';
  }

  cleanupTempFiles(outputFolder, downloadId) {
    if (!outputFolder || !fs.existsSync(outputFolder)) return;
    try {
      const files = fs.readdirSync(outputFolder);
      files.forEach((name) => {
        if (
          /\.(?:part|ytdl|temp)$/i.test(name) ||
          /\.part-|\.f\d+\.(?:mp4|m4a|webm|mkv)$/i.test(name)
        ) {
          try {
            fs.unlinkSync(path.join(outputFolder, name));
          } catch (e) {}
        }
      });
    } catch (e) {}
  }

  startDownload(downloadId, options, callbacks) {
    const { onOutput, onProgress, onError, onSuccess, onCancelled } = callbacks;
    let cancelled = false;

    const ytdlp = binaryManager.getYtDlp();
    let downloadArgs = this.buildDownloadArgs(options);

    const runProcess = (args, attemptOptions = { allowCookieRetry: true, allowAgeRetry: true }) => {
      if (cancelled) return;

      let fullLog = '';
      let lastResolution = '';

      onOutput(`$ ${ytdlp} ${args.join(' ')}\n`);

      const proc = spawn(ytdlp, args, { windowsHide: true, env: this.getEnv() });
      this.activeProcesses.set(downloadId, proc);

      proc.stdout.on('data', (data) => {
        if (cancelled) return;
        const text = data.toString();
        fullLog += text;
        onOutput(text);

        // Real-time stdout progress regex parsing
        const pctMatch = text.match(/(\d+(?:\.\d+)?)%/);
        const speedMatch = text.match(/(\d+(?:\.\d+)?[KMGT]?i?B\/s)/i);
        const etaMatch = text.match(/ETA\s+(\d{2}:\d{2}(?::\d{2})?)/i);
        const sizeMatch = text.match(/(\d+(?:\.\d+)?[KMGT]?i?B)\s+of\s+(\d+(?:\.\d+)?[KMGT]?i?B)/i);
        const resMatch = text.match(/(?:\d{3,4}x)?(\d{3,4})p?\b/);

        if (resMatch) lastResolution = resMatch[1] + 'p';

        const progressData = {
          percent: pctMatch ? parseFloat(pctMatch[1]) : null,
          speed: speedMatch ? speedMatch[1] : null,
          eta: etaMatch ? etaMatch[1] : null,
          downloadedSize: sizeMatch ? sizeMatch[1] : null,
          totalSize: sizeMatch ? sizeMatch[2] : null,
          statusText: text.includes('[Merger]') ? 'Merging video & audio streams with FFmpeg...' :
                     text.includes('[ExtractAudio]') ? 'Extracting audio stream...' :
                     text.includes('[VideoConvertor]') ? 'Converting video stream...' : 'Downloading media...'
        };

        onProgress(progressData);
      });

      proc.stderr.on('data', (data) => {
        if (cancelled) return;
        const text = data.toString();
        fullLog += text;
        onOutput(text);
      });

      proc.on('close', (code) => {
        this.activeProcesses.delete(downloadId);
        if (cancelled) {
          this.cleanupTempFiles(options.outputFolder, downloadId);
          return onCancelled();
        }

        // Retry handler for DPAPI / Cookie Decryption errors
        if (code !== 0 && attemptOptions.allowCookieRetry && /dpapi|failed to decrypt|could not copy.*cookie/i.test(fullLog)) {
          onOutput('\n[System Retry] Cookie authentication failed. Retrying download without browser cookies...\n');
          const cleanArgs = args.filter((a, i) => a !== '--cookies' && a !== '--cookies-from-browser' && (i === 0 || (args[i - 1] !== '--cookies' && args[i - 1] !== '--cookies-from-browser')));
          return runProcess(cleanArgs, { ...attemptOptions, allowCookieRetry: false });
        }

        // Retry handler for age-restricted videos
        if (code !== 0 && attemptOptions.allowAgeRetry && /age|confirm your age|sign in to confirm/i.test(fullLog)) {
          onOutput('\n[System Retry] Age-restricted content detected. Applying embedded player client fallback...\n');
          const bypassArgs = ['--extractor-args', 'youtube:player_client=tv_embedded,web_embedded,mediaconnect,default', ...args];
          return runProcess(bypassArgs, { ...attemptOptions, allowAgeRetry: false });
        }

        if (code !== 0) {
          this.cleanupTempFiles(options.outputFolder, downloadId);
          return onError(this.friendlyError(fullLog));
        }

        // Accurately locate the final completed file on disk
        const videoId = options.metadataId || this.extractVideoId(options.url);
        const completedFilePath = this.findOutputFile(options.outputFolder, videoId, fullLog, options.timecode);

        let finalSize = 0;
        if (completedFilePath && fs.existsSync(completedFilePath)) {
          try {
            finalSize = fs.statSync(completedFilePath).size;
          } catch (e) {}
        }

        onSuccess({
          filePath: completedFilePath,
          fileName: completedFilePath ? path.basename(completedFilePath) : 'Downloaded Media',
          fileSize: finalSize,
          resolution: lastResolution || (options.formatMode === 'audio' ? 'Audio' : options.quality + 'p')
        });
      });
    };

    runProcess(downloadArgs);

    return {
      cancel: () => {
        cancelled = true;
        const proc = this.activeProcesses.get(downloadId);
        if (proc && proc.pid) {
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', String(proc.pid), '/t', '/f'], { windowsHide: true });
            } else {
              proc.kill('SIGTERM');
            }
          } catch (e) {}
        }
        this.activeProcesses.delete(downloadId);
        this.cleanupTempFiles(options.outputFolder, downloadId);
      }
    };
  }
}

module.exports = new MediaEngine();
