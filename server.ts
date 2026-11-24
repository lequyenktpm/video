import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import {
  buildAssFromCues,
  buildMediaClipsPlan,
  buildMoneyPrinterPrompt,
  buildScenePromptsFromScript,
  buildSmartVietnameseScriptFromFacts,
  buildSrtFromCues,
  extractEnglishSearchTerms,
  generateOfflineVietnameseScript,
  getCanvasDimensions,
  parseAiWebOrJsonOutput,
  splitCueIntoShortSubCues,
  splitScriptSentences,
  validateRenderConfig,
} from './src/shared/mptEngine';
import {
  BgmPreset,
  MaterialSource,
  MediaAssetItem,
  RenderJobConfig,
  RenderJobStatus,
  ScenePreviewItem,
  ScriptStyle,
  SubtitleCue,
  TtsProvider,
  VideoAspectRatio,
  VoiceOptionId,
} from './src/shared/types';

const execFileAsync = promisify(execFile);

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, '.mpt_data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const OUTPUTS_DIR = path.join(DATA_DIR, 'outputs');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const BGM_DIR = path.join(DATA_DIR, 'bgm');

for (const dir of [DATA_DIR, UPLOADS_DIR, OUTPUTS_DIR, CACHE_DIR, BGM_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function runFfmpeg(args: string[], timeoutMs = 90000): Promise<void> {
  await execFileAsync('ffmpeg', args, { timeout: timeoutMs, maxBuffer: 12 * 1024 * 1024 });
}

async function probeDurationSec(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      { timeout: 10000 }
    );
    const parsed = parseFloat(stdout.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2.5;
  } catch {
    return 2.5;
  }
}

async function ensureBuiltinBgm(): Promise<void> {
  const tracks: Array<{ file: string; expr: string }> = [
    {
      file: 'lofi_chill.mp3',
      expr: '0.16*sin(2*PI*261.63*t)+0.12*sin(2*PI*329.63*t)+0.10*sin(2*PI*392.00*t)+0.08*sin(2*PI*493.88*t)*(0.6+0.4*sin(2*PI*0.5*t))',
    },
    {
      file: 'tech_upbeat.mp3',
      expr: '0.15*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*2*t))+0.12*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*4*t))+0.09*sin(2*PI*440*t)',
    },
    {
      file: 'cinema_ambient.mp3',
      expr: '0.18*sin(2*PI*146.83*t)+0.14*sin(2*PI*220*t)*(0.7+0.3*sin(2*PI*0.25*t))+0.10*sin(2*PI*349.23*t)*(0.6+0.4*sin(2*PI*0.4*t))',
    },
  ];

  for (const t of tracks) {
    const outPath = path.join(BGM_DIR, t.file);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 2000) continue;
    try {
      await runFfmpeg(
        [
          '-y',
          '-f',
          'lavfi',
          '-i',
          `aevalsrc=${t.expr}:s=24000:d=24`,
          '-af',
          'lowpass=f=1800,afade=t=in:st=0:d=1.5,afade=t=out:st=22.5:d=1.5',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '96k',
          outPath,
        ],
        20000
      );
    } catch (err) {
      console.warn(`Could not pre-generate ${t.file}:`, err);
    }
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function synthesizeWithEdgeTts(
  text: string,
  voiceId: VoiceOptionId,
  outPath: string
): Promise<boolean> {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Edge-TTS timeout')), 4500);
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => {
        clearTimeout(timer);
        resolve();
      });
      audioStream.on('error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    const combined = Buffer.concat(chunks);
    if (combined.length < 400) return false;
    fs.writeFileSync(outPath, combined);
    return true;
  } catch {
    return false;
  }
}

async function synthesizeWithGoogleFreeTts(
  text: string,
  voiceId: VoiceOptionId,
  outPath: string
): Promise<boolean> {
  const lang = voiceId.startsWith('en-') ? 'en' : 'vi';
  const isMale = voiceId.includes('NamMinh') || voiceId.includes('Guy');
  const rawPath = `${outPath}.raw.mp3`;

  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } },
      8000
    );
    if (!res.ok) return false;
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 400) return false;
    fs.writeFileSync(rawPath, buf);

    if (isMale) {
      await runFfmpeg(
        [
          '-y',
          '-i',
          rawPath,
          '-af',
          'asetrate=24000*0.90,aresample=24000,atempo=1.11',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '96k',
          outPath,
        ],
        15000
      );
      fs.rmSync(rawPath, { force: true });
    } else {
      fs.renameSync(rawPath, outPath);
    }
    return true;
  } catch {
    fs.rmSync(rawPath, { force: true });
    return false;
  }
}

async function synthesizeChunkWithFallback(params: {
  text: string;
  voiceId: VoiceOptionId;
  ttsProvider: TtsProvider;
  voiceRate: number;
  outPath: string;
}): Promise<{ engineUsed: string; recoveredFromEdgeError: boolean }> {
  const tempPath = `${params.outPath}.base.mp3`;
  let engineUsed = 'Google TTS Miễn phí';
  let recoveredFromEdgeError = false;
  let ok = false;

  if (params.ttsProvider === 'edge_auto') {
    ok = await synthesizeWithEdgeTts(params.text, params.voiceId, tempPath);
    if (ok) {
      engineUsed = 'Microsoft Edge Neural TTS';
    } else {
      recoveredFromEdgeError = true;
      ok = await synthesizeWithGoogleFreeTts(params.text, params.voiceId, tempPath);
    }
  } else {
    ok = await synthesizeWithGoogleFreeTts(params.text, params.voiceId, tempPath);
  }

  if (!ok) {
    const wordCount = Math.max(3, params.text.split(/\s+/).length);
    const estSec = Math.min(8, Math.max(1.8, wordCount * 0.34));
    engineUsed = 'Tổng hợp âm thanh dự phòng (Offline)';
    await runFfmpeg(
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `aevalsrc=0.02*sin(2*PI*220*t):s=24000:d=${estSec.toFixed(2)}`,
        '-c:a',
        'libmp3lame',
        '-b:a',
        '64k',
        params.outPath,
      ],
      15000
    );
    return { engineUsed, recoveredFromEdgeError };
  }

  const rate = Math.max(0.75, Math.min(1.6, params.voiceRate));
  if (Math.abs(rate - 1.0) > 0.02) {
    await runFfmpeg(
      [
        '-y',
        '-i',
        tempPath,
        '-af',
        `atempo=${rate.toFixed(2)}`,
        '-c:a',
        'libmp3lame',
        '-b:a',
        '96k',
        params.outPath,
      ],
      15000
    );
    fs.rmSync(tempPath, { force: true });
  } else {
    fs.renameSync(tempPath, params.outPath);
  }

  return { engineUsed, recoveredFromEdgeError };
}

/**
 * Searches Internet Archive (archive.org) for real public-domain / CC MP4 stock videos (0 API keys).
 */
async function searchArchiveOrgMp4s(terms: string[], limit = 6): Promise<MediaAssetItem[]> {
  const results: MediaAssetItem[] = [];
  const seenIds = new Set<string>();
  const queries = terms.length > 0 ? terms.slice(0, 3) : ['ocean waves', 'nature forest'];

  for (const term of queries) {
    if (results.length >= limit) break;
    try {
      const cleanWords = term
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(' ');
      if (!cleanWords) continue;

      const searchQ = encodeURIComponent(`mediatype:movies AND (${cleanWords})`);
      const searchUrl = `https://archive.org/advancedsearch.php?q=${searchQ}&fl[]=identifier,title&rows=5&output=json`;
      const res = await fetchWithTimeout(
        searchUrl,
        { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
        5000
      );
      if (!res.ok) continue;

      const json = (await res.json()) as {
        response?: { docs?: Array<{ identifier: string; title?: string }> };
      };
      const docs = json.response?.docs ?? [];

      const metadataChecks = await Promise.all(
        docs.slice(0, 4).map(async (doc) => {
          if (seenIds.has(doc.identifier)) return null;
          seenIds.add(doc.identifier);
          try {
            const metaRes = await fetchWithTimeout(
              `https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`,
              { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
              4500
            );
            if (!metaRes.ok) return null;
            const meta = (await metaRes.json()) as {
              files?: Array<{ name: string; format?: string; size?: string }>;
            };
            const files = meta.files ?? [];
            const mp4File = files.find((f) => {
              if (!f.name.toLowerCase().endsWith('.mp4')) return false;
              const sz = Number(f.size ?? 0);
              return sz > 120 * 1024 && sz <= 14 * 1024 * 1024;
            });
            if (!mp4File) return null;
            const sz = Number(mp4File.size ?? 0);
            return {
              id: `ia_${doc.identifier}`,
              name: doc.title || mp4File.name,
              kind: 'video' as const,
              source: 'archive_free' as const,
              url: `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp4File.name)}`,
              previewThumbUrl: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
              mimeType: 'video/mp4',
              sizeBytes: sz,
            } satisfies MediaAssetItem;
          } catch {
            return null;
          }
        })
      );

      for (const item of metadataChecks) {
        if (item && results.length < limit) {
          results.push(item);
        }
      }
    } catch {
      // Ignore transient network error
    }
  }

  return results;
}

/**
 * Free keyless Vietnamese -> English translator for exact stock media queries & scene prompts.
 */
async function translateViToEn(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';
  if (/^[\x00-\x7F\s]+$/.test(clean)) return clean;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } }, 4000);
    if (!res.ok) return '';
    const json = (await res.json()) as Array<Array<[string]>>;
    const translated = (json[0] ?? []).map((seg) => seg[0] ?? '').join('').trim();
    return translated;
  } catch {
    return '';
  }
}

/**
 * Fetches real Vietnamese Wikipedia facts + official English title for any topic (0 API key).
 */
async function fetchWikipediaFacts(subject: string): Promise<{
  title?: string;
  sentences: string[];
  englishTitle?: string;
}> {
  try {
    const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(subject)}&srlimit=1&format=json`;
    const sRes = await fetchWithTimeout(
      searchUrl,
      { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
      4500
    );
    if (!sRes.ok) return { sentences: [] };
    const sJson = (await sRes.json()) as { query?: { search?: Array<{ title: string }> } };
    const title = sJson.query?.search?.[0]?.title;
    if (!title) return { sentences: [] };

    const detailUrl = `https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts|langlinks&exintro=1&explaintext=1&exsentences=6&lllang=en&format=json`;
    const dRes = await fetchWithTimeout(
      detailUrl,
      { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
      4500
    );
    if (!dRes.ok) return { title, sentences: [] };
    const dJson = (await dRes.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title: string;
            extract?: string;
            langlinks?: Array<{ lang: string; '*': string }>;
          }
        >;
      };
    };
    const page = Object.values(dJson.query?.pages ?? {})[0];
    if (!page?.extract) return { title, sentences: [] };
    const rawSentences = page.extract
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 22 && s.length <= 185);
    const englishTitle = page.langlinks?.find((l) => l.lang === 'en')?.['*'];
    return { title: page.title, sentences: rawSentences, englishTitle };
  } catch {
    return { sentences: [] };
  }
}

/**
 * Searches Wikimedia Commons for crisp real photographs AND videos (excluding collages/diagrams/SVGs).
 */
async function searchWikimediaCommons(terms: string[], limit = 10): Promise<MediaAssetItem[]> {
  const results: MediaAssetItem[] = [];
  const seenUrls = new Set<string>();
  const queries = terms.length > 0 ? terms : ['ocean waves', 'nature landscape'];

  for (const term of queries.slice(0, 3)) {
    for (const typeFilter of ['filetype:bitmap', 'filetype:video']) {
      if (results.length >= limit) break;
      try {
        const q = encodeURIComponent(`${term} ${typeFilter}`);
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime|size|dimensions&iiurlwidth=1280&format=json`;
        const res = await fetchWithTimeout(
          apiUrl,
          { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0 (https://github.com)' } },
          5000
        );
        if (!res.ok) continue;
        const json = (await res.json()) as {
          query?: {
            pages?: Record<
              string,
              {
                pageid: number;
                title: string;
                imageinfo?: Array<{
                  url: string;
                  thumburl?: string;
                  mime: string;
                  size: number;
                  width?: number;
                  height?: number;
                }>;
              }
            >;
          };
        };
        const pages = Object.values(json.query?.pages ?? {});
        for (const page of pages) {
          const info = page.imageinfo?.[0];
          if (!info?.url) continue;
          const lowerTitle = page.title.toLowerCase();
          if (/(collage|diagram|map|chart|icon|logo|plan|blueprint|poster|stamp|coin)/i.test(lowerTitle)) {
            continue;
          }
          const isVideo = info.mime.startsWith('video/') || info.mime === 'application/ogg';
          const isImage = info.mime === 'image/jpeg' || info.mime === 'image/png';
          if (!isVideo && !isImage) continue;
          if (isVideo && (info.size > 15 * 1024 * 1024 || info.size < 25 * 1024)) continue;
          if (isImage) {
            if (info.size < 20 * 1024) continue;
            if ((info.width ?? 0) < 550 || (info.height ?? 0) < 350) continue;
          }
          const mediaUrl = isImage && info.thumburl ? info.thumburl : info.url;
          if (seenUrls.has(mediaUrl)) continue;
          seenUrls.add(mediaUrl);
          results.push({
            id: `wm_${page.pageid}`,
            name: page.title.replace(/^File:/, ''),
            kind: isVideo ? 'video' : 'image',
            source: 'wikimedia_free',
            url: mediaUrl,
            previewThumbUrl: info.thumburl ?? (isImage ? mediaUrl : undefined),
            mimeType: info.mime,
            sizeBytes: info.size,
          });
          if (results.length >= limit) break;
        }
      } catch {
        // Ignore single query error
      }
    }
  }

  return results;
}

function isValidImageOrVideoBuffer(buf: Buffer, kind: 'image' | 'video'): boolean {
  if (buf.length < 6000) return false;
  const headStr = buf.slice(0, 64).toString('utf8').trim().toLowerCase();
  if (headStr.startsWith('<!doctype') || headStr.startsWith('<html') || headStr.startsWith('{')) {
    return false;
  }
  if (kind === 'image') {
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isWebp = buf.slice(0, 4).toString('ascii') === 'RIFF';
    return isJpeg || isPng || isWebp;
  }
  return buf.length > 25000;
}

/**
 * Generates a crisp, watermark-free scene illustration matching the exact narration sentence
 * via Pollinations AI Image (0 API key).
 */
async function fetchPollinationsSceneImage(params: {
  prompt: string;
  width: number;
  height: number;
  outPath: string;
  seed: number;
}): Promise<boolean> {
  const { prompt, width, height, outPath, seed } = params;
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 8000) {
    return true;
  }
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
      22000
    );
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!isValidImageOrVideoBuffer(buf, 'image')) return false;
    fs.writeFileSync(outPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function downloadRemoteMedia(
  url: string,
  kind: 'image' | 'video',
  outPath: string
): Promise<boolean> {
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
    return true;
  }
  try {
    const res = await fetchWithTimeout(
      url,
      { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
      12000
    );
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!isValidImageOrVideoBuffer(buf, kind)) return false;
    fs.writeFileSync(outPath, buf);
    return true;
  } catch {
    return false;
  }
}

interface ResolvedSceneAsset {
  index: number;
  sentence: string;
  prompt: string;
  kind: 'video' | 'image';
  localPath: string;
  remoteUrl?: string;
  previewUrl: string;
  thumbUrl?: string;
  sourceLabel: string;
}

/**
 * Searches Mixkit free stock videos (zero API key, zero watermark, 720p HD MP4s)
 * by extracting JSON-LD VideoObject records from Mixkit tag/keyword pages.
 */
async function searchMixkitVideos(terms: string[], limit = 14): Promise<MediaAssetItem[]> {
  const results: MediaAssetItem[] = [];
  const seenUrls = new Set<string>();
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';

  const slugSet = new Set<string>();
  const stopWords = new Set(['the', 'and', 'with', 'from', 'into', 'for', 'shot', 'view', 'deep', 'high', 'free']);

  for (const term of terms.slice(0, 5)) {
    const words = term
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));
    if (words.length >= 2) {
      slugSet.add(words.slice(0, 2).join('-'));
    }
    for (const w of words.slice(0, 3)) {
      slugSet.add(w);
    }
  }

  if (slugSet.size === 0) {
    slugSet.add('nature');
    slugSet.add('ocean');
  }

  const slugs = Array.from(slugSet).slice(0, 6);

  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await fetchWithTimeout(
          `https://mixkit.co/free-stock-video/${encodeURIComponent(slug)}/`,
          { headers: { 'User-Agent': ua } },
          5500
        );
        if (!res.ok) return;
        const html = await res.text();

        // Parse JSON-LD VideoObject blocks embedded cleanly on Mixkit tag pages
        const ldMatches = html.matchAll(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        );
        for (const match of ldMatches) {
          try {
            const parsed = JSON.parse(match[1]) as {
              '@graph'?: Array<{
                '@type'?: string;
                name?: string;
                contentUrl?: string;
                thumbnailUrl?: string;
              }>;
            };
            const graph = parsed['@graph'] ?? [];
            for (const item of graph) {
              if (item['@type'] !== 'VideoObject' || !item.contentUrl) continue;
              const mp4720 = item.contentUrl.replace(/-(?:360|1080)\.mp4$/i, '-720.mp4');
              if (seenUrls.has(mp4720)) continue;
              seenUrls.add(mp4720);
              const idMatch = mp4720.match(/\/(\d+)(?:-video)?-\d+\.mp4/i);
              results.push({
                id: `mixkit_${idMatch?.[1] ?? seenUrls.size}`,
                name: item.name || `${slug} B-roll`,
                kind: 'video',
                source: 'mixkit_free',
                url: mp4720,
                previewThumbUrl: item.thumbnailUrl,
                mimeType: 'video/mp4',
              });
            }
          } catch {
            // Ignore malformed JSON-LD block
          }
        }

        // Fallback regex scan if JSON-LD did not return items
        if (results.length < 4) {
          const bodyIdx = html.indexOf('<body');
          const bodyHtml = bodyIdx >= 0 ? html.slice(bodyIdx) : html;
          const urls = bodyHtml.match(/https:\/\/assets\.mixkit\.co\/videos\/\d+\/\d+-\d+\.mp4/gi) ?? [];
          for (const rawUrl of urls) {
            const mp4720 = rawUrl.replace(/-(?:360|1080)\.mp4$/i, '-720.mp4');
            if (seenUrls.has(mp4720)) continue;
            seenUrls.add(mp4720);
            const idMatch = mp4720.match(/\/(\d+)-\d+\.mp4/i);
            results.push({
              id: `mixkit_${idMatch?.[1] ?? seenUrls.size}`,
              name: `${slug} clip`,
              kind: 'video',
              source: 'mixkit_free',
              url: mp4720,
              mimeType: 'video/mp4',
            });
          }
        }
      } catch {
        // Ignore single slug timeout
      }
    })
  );

  // Broad aesthetic fallback if obscure query yielded too few clips
  if (results.length < 4) {
    try {
      const fbRes = await fetchWithTimeout(
        'https://mixkit.co/free-stock-video/nature/',
        { headers: { 'User-Agent': ua } },
        4500
      );
      if (fbRes.ok) {
        const html = await fbRes.text();
        const urls = html.match(/https:\/\/assets\.mixkit\.co\/videos\/\d+\/\d+-\d+\.mp4/gi) ?? [];
        for (const rawUrl of urls) {
          const mp4720 = rawUrl.replace(/-(?:360|1080)\.mp4$/i, '-720.mp4');
          if (seenUrls.has(mp4720)) continue;
          seenUrls.add(mp4720);
          const idMatch = mp4720.match(/\/(\d+)-\d+\.mp4/i);
          results.push({
            id: `mixkit_fb_${idMatch?.[1] ?? seenUrls.size}`,
            name: 'Cinematic B-roll',
            kind: 'video',
            source: 'mixkit_free',
            url: mp4720,
            mimeType: 'video/mp4',
          });
          if (results.length >= limit) break;
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  return results.slice(0, limit);
}

function getSceneCacheKey(params: {
  subject: string;
  sentences: string[];
  terms: string[];
  scenePrompts: string[];
  materialSource: MaterialSource;
  aspectRatio: VideoAspectRatio;
  selectedMediaIds: string[];
}): string {
  const raw = JSON.stringify({
    s: params.sentences,
    t: params.terms,
    p: params.scenePrompts,
    m: params.materialSource,
    a: params.aspectRatio,
    sel: params.selectedMediaIds,
    subj: params.subject,
  });
  return `scenes_${crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12)}`;
}

async function resolveSceneAssets(params: {
  subject: string;
  script: string;
  terms: string[];
  scenePrompts: string[];
  materialSource: MaterialSource;
  aspectRatio: VideoAspectRatio;
  selectedMediaIds: string[];
  onLog?: (msg: string) => void;
}): Promise<{ cacheKey: string; assets: ResolvedSceneAsset[] }> {
  const sentences = splitScriptSentences(params.script);
  const effectiveSentences =
    sentences.length > 0 ? sentences : [params.subject || 'Khám phá điều kỳ diệu quanh ta'];

  // Preserve user/AI-provided English terms directly! Only translate if empty or non-ASCII.
  let searchTerms = params.terms.map((t) => t.trim()).filter((t) => t.length >= 2 && /^[\x00-\x7F\s,.-]+$/.test(t));
  if (searchTerms.length === 0) {
    const translatedSubject = await translateViToEn(params.subject);
    if (translatedSubject) {
      searchTerms = [translatedSubject];
    } else {
      searchTerms = extractEnglishSearchTerms(params.subject, '');
    }
  }

  const effectivePrompts =
    params.scenePrompts.length >= effectiveSentences.length
      ? params.scenePrompts
      : buildScenePromptsFromScript(effectiveSentences, params.subject, searchTerms);

  const cacheKey = getSceneCacheKey({
    subject: params.subject,
    sentences: effectiveSentences,
    terms: searchTerms,
    scenePrompts: effectivePrompts,
    materialSource: params.materialSource,
    aspectRatio: params.aspectRatio,
    selectedMediaIds: params.selectedMediaIds,
  });

  const sceneCacheDir = path.join(CACHE_DIR, cacheKey);
  fs.mkdirSync(sceneCacheDir, { recursive: true });
  const { width, height } = getCanvasDimensions(params.aspectRatio);

  // Local upload mode
  if (params.materialSource === 'local_upload') {
    const files = fs
      .readdirSync(UPLOADS_DIR)
      .filter((f) => /\.(mp4|webm|mov|jpg|jpeg|png)$/i.test(f));
    const selected =
      params.selectedMediaIds.length > 0
        ? files.filter((f) => params.selectedMediaIds.includes(f))
        : files;

    if (selected.length > 0) {
      const assets: ResolvedSceneAsset[] = effectiveSentences.map((sentence, idx) => {
        const fname = selected[idx % selected.length];
        const isImg = /\.(jpg|jpeg|png)$/i.test(fname);
        return {
          index: idx,
          sentence,
          prompt: effectivePrompts[idx] ?? searchTerms[0] ?? 'uploaded media',
          kind: isImg ? 'image' : 'video',
          localPath: path.join(UPLOADS_DIR, fname),
          previewUrl: `/files/uploads/${encodeURIComponent(fname)}`,
          sourceLabel: 'Tư liệu tải lên từ máy',
        };
      });
      params.onLog?.(`Đã nạp ${selected.length} tệp tư liệu từ máy cho ${assets.length} phân cảnh.`);
      return { cacheKey, assets };
    }
    params.onLog?.('Chưa có tệp tải lên từ máy -> tự động chuyển sang tìm cảnh B-roll HD miễn phí.');
  }

  // Primary: Mixkit 720p real moving B-roll stock videos (fast HTTP range clipping, zero watermark)
  const desiredClipCount = Math.max(8, effectiveSentences.length * 2);
  let mixkitVideos: MediaAssetItem[] = [];
  if (params.materialSource === 'mixkit_video' || params.materialSource === 'hybrid_real') {
    params.onLog?.(`Đang tìm video B-roll HD chuyển động mượt cho: ${searchTerms.slice(0, 3).join(', ')}...`);
    mixkitVideos = await searchMixkitVideos(searchTerms, desiredClipCount + 4);
    if (mixkitVideos.length > 0) {
      params.onLog?.(`Đã tìm thấy ${mixkitVideos.length} video B-roll HD thực tế từ Mixkit.`);
    }
  }

  // If Mixkit returned abundant real moving B-roll clips and user selected mixkit_video or hybrid_real,
  // build a rich pool of distinct moving video assets (2 clips per sentence for crisp ~3s cuts!)
  if (mixkitVideos.length >= 3 && (params.materialSource === 'mixkit_video' || params.materialSource === 'hybrid_real')) {
    const assets: ResolvedSceneAsset[] = [];
    const poolCount = Math.max(effectiveSentences.length, Math.min(mixkitVideos.length, desiredClipCount));
    for (let i = 0; i < poolCount; i++) {
      const clip = mixkitVideos[i % mixkitVideos.length];
      const sentIdx = Math.min(effectiveSentences.length - 1, Math.floor((i * effectiveSentences.length) / poolCount));
      assets.push({
        index: i,
        sentence: effectiveSentences[sentIdx],
        prompt: clip.name,
        kind: 'video',
        localPath: '',
        remoteUrl: clip.url,
        previewUrl: clip.url,
        thumbUrl: clip.previewThumbUrl,
        sourceLabel: 'Mixkit Stock HD',
      });
    }
    return { cacheKey, assets };
  }

  // Fallback stock / AI scenes when user explicitly chose stock_free or pollinations_scene or Mixkit unavailable
  params.onLog?.(`Đang tìm thêm cảnh từ Wikimedia & Archive.org cho: ${searchTerms.slice(0, 3).join(', ')}...`);
  const [archiveItems, wmItems] = await Promise.all([
    searchArchiveOrgMp4s(searchTerms, 4),
    searchWikimediaCommons(searchTerms, 10),
  ]);
  const stockImages = wmItems.filter((i) => i.kind === 'image');
  const stockVideos = [...mixkitVideos, ...wmItems.filter((i) => i.kind === 'video'), ...archiveItems];

  let hookAiAsset: ResolvedSceneAsset | null = null;
  if (params.materialSource === 'pollinations_scene') {
    const hookFile = 'scene_0_ai.jpg';
    const hookPath = path.join(sceneCacheDir, hookFile);
    const aiOk = await fetchPollinationsSceneImage({
      prompt: effectivePrompts[0] ?? `${searchTerms[0]}, cinematic dramatic 8k, no text`,
      width,
      height,
      outPath: hookPath,
      seed: 4200,
    });
    if (aiOk) {
      hookAiAsset = {
        index: 0,
        sentence: effectiveSentences[0],
        prompt: effectivePrompts[0] ?? searchTerms[0],
        kind: 'image',
        localPath: hookPath,
        previewUrl: `/files/cache/${cacheKey}/${hookFile}`,
        sourceLabel: 'Pollinations AI Scene',
      };
    }
  }

  let imgCursor = 0;
  let vidCursor = 0;

  const resolvedList = await Promise.all(
    effectiveSentences.map(async (sentence, idx): Promise<ResolvedSceneAsset | null> => {
      const prompt = effectivePrompts[idx] ?? searchTerms[idx % searchTerms.length] ?? 'cinematic nature scene';
      if (idx === 0 && hookAiAsset) return hookAiAsset;

      if (stockVideos.length > 0 && (params.materialSource === 'stock_free' || idx % 2 === 0)) {
        const vidCandidate = stockVideos[vidCursor++ % stockVideos.length];
        if (vidCandidate.source === 'mixkit_free') {
          return {
            index: idx,
            sentence,
            prompt: vidCandidate.name,
            kind: 'video',
            localPath: '',
            remoteUrl: vidCandidate.url,
            previewUrl: vidCandidate.url,
            sourceLabel: 'Mixkit Stock HD',
          };
        }
        const ext = vidCandidate.mimeType?.includes('ogg') ? '.ogv' : '.mp4';
        const vidFile = `stock_vid_${idx}${ext}`;
        const vidPath = path.join(sceneCacheDir, vidFile);
        const ok = await downloadRemoteMedia(vidCandidate.url, 'video', vidPath);
        if (ok) {
          return {
            index: idx,
            sentence,
            prompt,
            kind: 'video',
            localPath: vidPath,
            previewUrl: `/files/cache/${cacheKey}/${vidFile}`,
            sourceLabel: vidCandidate.source === 'archive_free' ? 'Archive.org MP4' : 'Wikimedia Video',
          };
        }
      }

      if (stockImages.length > 0) {
        const wmImg = stockImages[imgCursor++ % stockImages.length];
        const wmFile = `wm_photo_${idx}.jpg`;
        const wmPath = path.join(sceneCacheDir, wmFile);
        const ok = await downloadRemoteMedia(wmImg.url, 'image', wmPath);
        if (ok) {
          return {
            index: idx,
            sentence,
            prompt,
            kind: 'image',
            localPath: wmPath,
            previewUrl: `/files/cache/${cacheKey}/${wmFile}`,
            sourceLabel: 'Wikimedia Ảnh thật',
          };
        }
      }
      return null;
    })
  );

  const validAssets = resolvedList.filter((a): a is ResolvedSceneAsset => a !== null);

  if (validAssets.length === 0) {
    params.onLog?.('Mạng ngoài không phản hồi -> tạo khung hình dự phòng có lưới ánh sáng.');
    const emergencyPath = path.join(sceneCacheDir, 'offline_scene_0.jpg');
    await runFfmpeg(
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=0x0f172a:s=${width}x${height}:d=1`,
        '-vf',
        `drawgrid=width=64:height=64:thickness=1:color=0x38bdf8@0.22`,
        '-frames:v',
        '1',
        emergencyPath,
      ],
      10000
    );
    return {
      cacheKey,
      assets: effectiveSentences.map((sentence, idx) => ({
        index: idx,
        sentence,
        prompt: effectivePrompts[idx] ?? 'offline',
        kind: 'image',
        localPath: emergencyPath,
        previewUrl: `/files/cache/${cacheKey}/offline_scene_0.jpg`,
        sourceLabel: 'Dự phòng Offline',
      })),
    };
  }

  const finalAssets: ResolvedSceneAsset[] = effectiveSentences.map((sentence, idx) => {
    const exact = validAssets.find((a) => a.index === idx);
    if (exact) return exact;
    const reuse = validAssets[idx % validAssets.length];
    return {
      ...reuse,
      index: idx,
      sentence,
      prompt: effectivePrompts[idx] ?? reuse.prompt,
    };
  });

  return { cacheKey, assets: finalAssets };
}

async function normalizeMediaToClip(params: {
  sourcePath: string;
  remoteUrl?: string;
  kind: 'video' | 'image';
  outPath: string;
  width: number;
  height: number;
  durationSec: number;
  motionVariant: number;
}): Promise<boolean> {
  const { sourcePath, remoteUrl, kind, outPath, width, height, durationSec, motionVariant } = params;
  const safeDur = Math.max(1.2, durationSec);
  const colorGrade = 'eq=contrast=1.05:saturation=1.10';

  try {
    if (kind === 'image') {
      const overW = Math.round(width * 1.12);
      const overH = Math.round(height * 1.12);
      const durStr = safeDur.toFixed(2);
      let cropExpr: string;
      const mode = motionVariant % 4;
      if (mode === 0) {
        cropExpr = `crop=${width}:${height}:x='(iw-${width})*t/${durStr}':y='(ih-${height})/2'`;
      } else if (mode === 1) {
        cropExpr = `crop=${width}:${height}:x='(iw-${width})*(1-t/${durStr})':y='(ih-${height})/2'`;
      } else if (mode === 2) {
        cropExpr = `crop=${width}:${height}:x='(iw-${width})/2':y='(ih-${height})*t/${durStr}'`;
      } else {
        cropExpr = `crop=${width}:${height}:x='(iw-${width})/2':y='(ih-${height})*(1-t/${durStr})'`;
      }

      await runFfmpeg(
        [
          '-y',
          '-loop',
          '1',
          '-framerate',
          '30',
          '-i',
          sourcePath,
          '-vf',
          `scale=${overW}:${overH}:force_original_aspect_ratio=increase,crop=${overW}:${overH},${cropExpr},${colorGrade},fps=30,format=yuv420p`,
          '-t',
          durStr,
          '-an',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-pix_fmt',
          'yuv420p',
          outPath,
        ],
        25000
      );
      return true;
    }

    // Fast HTTP range clip directly from Mixkit 720p CDN URL
    if (remoteUrl) {
      for (const seekSec of [1.2, 0.2]) {
        try {
          await runFfmpeg(
            [
              '-y',
              '-ss',
              seekSec.toFixed(1),
              '-stream_loop',
              '-1',
              '-i',
              remoteUrl,
              '-t',
              safeDur.toFixed(2),
              '-vf',
              `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${colorGrade},fps=30,format=yuv420p`,
              '-an',
              '-c:v',
              'libx264',
              '-preset',
              'ultrafast',
              '-pix_fmt',
              'yuv420p',
              outPath,
            ],
            25000
          );
          if (fs.existsSync(outPath) && fs.statSync(outPath).size > 20000) {
            return true;
          }
        } catch {
          // Retry with shorter seek offset
        }
      }
      return false;
    }

    const rawVidDur = await probeDurationSec(sourcePath);
    const seekSec = rawVidDur > 12 ? 4.0 : rawVidDur > 5 ? 1.2 : 0;

    await runFfmpeg(
      [
        '-y',
        ...(seekSec > 0 ? ['-ss', seekSec.toFixed(1)] : []),
        '-stream_loop',
        '-1',
        '-i',
        sourcePath,
        '-t',
        safeDur.toFixed(2),
        '-vf',
        `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${colorGrade},fps=30,format=yuv420p`,
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-pix_fmt',
        'yuv420p',
        outPath,
      ],
      30000
    );
    return true;
  } catch {
    return false;
  }
}

const jobs = new Map<string, RenderJobStatus>();

function updateJob(jobId: string, patch: Partial<RenderJobStatus>, logLine?: string) {
  const prev = jobs.get(jobId);
  if (!prev) return;
  const logs = logLine ? [...prev.logs, logLine] : prev.logs;
  jobs.set(jobId, { ...prev, ...patch, logs });
}

async function processRenderJob(jobId: string, config: RenderJobConfig): Promise<void> {
  const workDir = path.join(CACHE_DIR, jobId);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    updateJob(
      jobId,
      { status: 'running', progressPct: 6, stepLabel: 'Đang tách câu & tạo giọng đọc từng phân cảnh...' },
      'Bắt đầu quy trình dựng video chuẩn MoneyPrinterTurbo.'
    );

    const sentences = splitScriptSentences(config.script);
    if (sentences.length === 0) {
      throw new Error('Nội dung lời thoại đang trống.');
    }

    // 1. Synthesize each sentence individually so voice cues & scene visuals sync 1-to-1
    const cues: SubtitleCue[] = [];
    const audioParts: string[] = [];
    let cursorSec = 0;
    let loggedRecovery = false;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const partPath = path.join(workDir, `tts_${i}.mp3`);
      const ttsRes = await synthesizeChunkWithFallback({
        text: sentence,
        voiceId: config.voiceId,
        ttsProvider: config.ttsProvider,
        voiceRate: config.voiceRate,
        outPath: partPath,
      });

      if (ttsRes.recoveredFromEdgeError && !loggedRecovery) {
        loggedRecovery = true;
        updateJob(
          jobId,
          {},
          'Đã phát hiện lỗi Edge-TTS (Microsoft 403) -> tự chuyển sang Google TTS Miễn phí.'
        );
      }

      const dur = await probeDurationSec(partPath);
      cues.push({
        index: i + 1,
        startSec: cursorSec,
        endSec: cursorSec + dur,
        text: sentence,
      });
      audioParts.push(partPath);
      cursorSec += dur;

      const pct = 8 + Math.round(((i + 1) / sentences.length) * 20);
      updateJob(jobId, {
        progressPct: pct,
        stepLabel: `Đang tạo giọng đọc câu ${i + 1}/${sentences.length}...`,
      });
    }

    const voiceListPath = path.join(workDir, 'voice_concat.txt');
    fs.writeFileSync(
      voiceListPath,
      audioParts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
      'utf-8'
    );
    const voiceAllPath = path.join(workDir, 'voice_all.mp3');
    await runFfmpeg(
      ['-y', '-f', 'concat', '-safe', '0', '-i', voiceListPath, '-c', 'copy', voiceAllPath],
      20000
    );

    const totalVoiceSec = Math.max(3, await probeDurationSec(voiceAllPath));
    updateJob(
      jobId,
      { progressPct: 32, stepLabel: 'Đang tìm video & ảnh AI khớp từng câu lời thoại...' },
      `Đã hoàn tất giọng đọc (${totalVoiceSec.toFixed(1)}s, ${cues.length} phân cảnh).`
    );

    // 2. Resolve real per-sentence visual assets (Archive.org MP4 + Wikimedia + Pollinations AI scenes)
    const { assets } = await resolveSceneAssets({
      subject: config.subject,
      script: config.script,
      terms: config.terms,
      scenePrompts: config.scenePrompts ?? [],
      materialSource: config.materialSource,
      aspectRatio: config.aspectRatio,
      selectedMediaIds: config.selectedMediaIds,
      onLog: (msg) => updateJob(jobId, {}, msg),
    });

    const scenePreviews: ScenePreviewItem[] = assets.map((a) => ({
      index: a.index,
      sentence: a.sentence,
      prompt: a.prompt,
      kind: a.kind,
      previewUrl: a.previewUrl,
      thumbUrl: a.thumbUrl,
      sourceLabel: a.sourceLabel,
    }));

    updateJob(
      jobId,
      {
        progressPct: 54,
        stepLabel: 'Đang dựng chuyển động máy quay & ghép cảnh theo lời thoại...',
        scenes: scenePreviews,
      },
      `Đã chuẩn bị ${assets.length} hình ảnh/video khớp từng câu kịch bản.`
    );

    // 3. Plan lively ~3-3.5s B-roll cuts across the narration (splitting long sentences into 2 distinct video beats!)
    const { width, height } = getCanvasDimensions(config.aspectRatio);
    const usePerSentenceAlignment = config.concatMode === 'sequential';
    const fadeDur = config.transitionMode !== 'none' && cues.length > 1 ? 0.3 : 0;

    let plannedEntries: Array<{ asset: ResolvedSceneAsset; baseDur: number; renderDur: number }> = [];

    if (usePerSentenceAlignment) {
      let beatCursor = 0;
      cues.forEach((cue, idx) => {
        const sentenceDur = Math.max(1.4, cue.endSec - cue.startSec);
        const isLastSentence = idx === cues.length - 1;
        // Split sentences longer than 4.4s into 2 fast ~3s visual cuts when multiple clips exist
        if (sentenceDur > 4.4 && assets.length > cues.length) {
          const halfDur = sentenceDur / 2;
          plannedEntries.push({
            asset: assets[beatCursor++ % assets.length],
            baseDur: halfDur,
            renderDur: halfDur + fadeDur,
          });
          plannedEntries.push({
            asset: assets[beatCursor++ % assets.length],
            baseDur: halfDur,
            renderDur: isLastSentence ? halfDur + 0.3 : halfDur + fadeDur,
          });
        } else {
          plannedEntries.push({
            asset: assets[beatCursor++ % assets.length],
            baseDur: sentenceDur,
            renderDur: isLastSentence ? sentenceDur + 0.3 : sentenceDur + fadeDur,
          });
        }
      });
    } else {
      const planIndices = buildMediaClipsPlan(
        assets.length,
        totalVoiceSec + 0.6,
        config.clipDurationSec,
        config.concatMode,
        Date.now() % 9999
      );
      plannedEntries = planIndices.map((assetIdx, idx) => {
        const isLast = idx === planIndices.length - 1;
        return {
          asset: assets[assetIdx],
          baseDur: config.clipDurationSec,
          renderDur: isLast ? config.clipDurationSec + 0.3 : config.clipDurationSec + fadeDur,
        };
      });
    }

    const normalizedClips: Array<{ path: string; baseDur: number }> = [];
    for (let i = 0; i < plannedEntries.length; i++) {
      const entry = plannedEntries[i];
      const normPath = path.join(workDir, `clip_norm_${i}.mp4`);
      const ok = await normalizeMediaToClip({
        sourcePath: entry.asset.localPath,
        remoteUrl: entry.asset.remoteUrl,
        kind: entry.asset.kind,
        outPath: normPath,
        width,
        height,
        durationSec: entry.renderDur,
        motionVariant: i,
      });

      if (ok) {
        normalizedClips.push({ path: normPath, baseDur: entry.baseDur });
      } else {
        // Retry with another verified asset in the pool
        const altAsset = assets[(i + 1) % assets.length];
        const retryOk = await normalizeMediaToClip({
          sourcePath: altAsset.localPath,
          remoteUrl: altAsset.remoteUrl,
          kind: altAsset.kind,
          outPath: normPath,
          width,
          height,
          durationSec: entry.renderDur,
          motionVariant: i + 1,
        });
        if (retryOk) {
          normalizedClips.push({ path: normPath, baseDur: entry.baseDur });
        }
      }

      const pct = 55 + Math.round(((i + 1) / plannedEntries.length) * 18);
      updateJob(jobId, { progressPct: pct });
    }

    if (normalizedClips.length === 0) {
      throw new Error('Không thể chuẩn hóa các đoạn cảnh quay thành MP4.');
    }

    // 4. Concatenate / xfade clips smoothly
    const visualTrackPath = path.join(workDir, 'visual_merged.mp4');
    if (config.transitionMode !== 'none' && normalizedClips.length > 1 && normalizedClips.length <= 14) {
      const xfadeType = config.transitionMode === 'slide' ? 'slideleft' : 'fade';
      const inputs: string[] = [];
      normalizedClips.forEach((c) => {
        inputs.push('-i', c.path);
      });

      const filterParts: string[] = [];
      let prevLabel = '[0:v]';
      let currentOffset = normalizedClips[0].baseDur;

      for (let i = 1; i < normalizedClips.length; i++) {
        const nextLabel = `[v${i}]`;
        const outLabel = i === normalizedClips.length - 1 ? '[vout]' : nextLabel;
        filterParts.push(
          `${prevLabel}[${i}:v]xfade=transition=${xfadeType}:duration=${fadeDur.toFixed(2)}:offset=${currentOffset.toFixed(2)}${outLabel}`
        );
        prevLabel = nextLabel;
        currentOffset += normalizedClips[i].baseDur;
      }

      await runFfmpeg(
        [
          '-y',
          ...inputs,
          '-filter_complex',
          filterParts.join(';'),
          '-map',
          '[vout]',
          '-t',
          totalVoiceSec.toFixed(2),
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-pix_fmt',
          'yuv420p',
          visualTrackPath,
        ],
        75000
      );
    } else {
      const concatListPath = path.join(workDir, 'video_concat.txt');
      fs.writeFileSync(
        concatListPath,
        normalizedClips.map((c) => `file '${c.path.replace(/'/g, "'\\''")}'`).join('\n'),
        'utf-8'
      );
      await runFfmpeg(
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatListPath,
          '-t',
          totalVoiceSec.toFixed(2),
          '-c',
          'copy',
          visualTrackPath,
        ],
        30000
      );
    }

    // 5. Split long cues into punchy 1-2 line subtitles & mix voiceover + BGM
    updateJob(jobId, { progressPct: 82, stepLabel: 'Đang gắn phụ đề tiếng Việt & trộn nhạc nền...' });

    const shortSubCues = splitCueIntoShortSubCues(cues, width < height ? 38 : 54);
    const srtContent = buildSrtFromCues(shortSubCues);
    const srtFilename = `${jobId}.srt`;
    const srtOutPath = path.join(OUTPUTS_DIR, srtFilename);
    fs.writeFileSync(srtOutPath, srtContent, 'utf-8');

    const assPath = path.join(workDir, 'subtitles.ass');
    const assContent = buildAssFromCues(shortSubCues, config.subtitle, width, height);
    fs.writeFileSync(assPath, assContent, 'utf-8');

    let bgmPath: string | null = null;
    if (config.bgmPreset === 'lofi_chill') bgmPath = path.join(BGM_DIR, 'lofi_chill.mp3');
    else if (config.bgmPreset === 'tech_upbeat') bgmPath = path.join(BGM_DIR, 'tech_upbeat.mp3');
    else if (config.bgmPreset === 'cinema_ambient') bgmPath = path.join(BGM_DIR, 'cinema_ambient.mp3');
    else if (config.bgmPreset === 'custom' && config.customBgmFilename) {
      const candidate = path.join(UPLOADS_DIR, sanitizeName(config.customBgmFilename));
      if (fs.existsSync(candidate)) bgmPath = candidate;
    }
    if (bgmPath && !fs.existsSync(bgmPath)) {
      bgmPath = null;
    }

    const mp4Filename = `${jobId}.mp4`;
    const mp4OutPath = path.join(OUTPUTS_DIR, mp4Filename);
    const voiceVol = Math.max(0.1, Math.min(2.0, config.voiceVolume));
    const bgmVol = Math.max(0.0, Math.min(1.0, config.bgmVolume));

    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
    const finalArgs: string[] = ['-y', '-i', visualTrackPath, '-i', voiceAllPath];

    if (bgmPath) {
      finalArgs.push('-stream_loop', '-1', '-i', bgmPath);
    }

    if (config.subtitle.enabled) {
      finalArgs.push('-vf', `ass='${escapedAss}'`);
    }

    if (bgmPath) {
      finalArgs.push(
        '-filter_complex',
        `[1:a]volume=${voiceVol.toFixed(2)}[va];[2:a]volume=${bgmVol.toFixed(2)}[ba];[va][ba]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
        '-map',
        '0:v',
        '-map',
        '[aout]'
      );
    } else {
      finalArgs.push('-af', `volume=${voiceVol.toFixed(2)}`, '-map', '0:v', '-map', '1:a');
    }

    finalArgs.push(
      '-t',
      totalVoiceSec.toFixed(2),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      mp4OutPath
    );

    await runFfmpeg(finalArgs, 90000);

    const stat = fs.statSync(mp4OutPath);
    const finalDur = await probeDurationSec(mp4OutPath);

    updateJob(
      jobId,
      {
        status: 'done',
        progressPct: 100,
        stepLabel: 'Hoàn tất xuất video MP4!',
        scenes: scenePreviews,
        videoUrl: `/files/outputs/${mp4Filename}`,
        srtUrl: `/files/outputs/${srtFilename}`,
        durationSec: finalDur,
        fileSizeBytes: stat.size,
      },
      `Xuất thành công ${mp4Filename} (${(stat.size / 1024).toFixed(0)} KB, ${finalDur.toFixed(1)}s).`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định khi xuất video FFmpeg.';
    updateJob(
      jobId,
      {
        status: 'error',
        stepLabel: 'Không thể hoàn tất xuất video',
        errorMessage: message,
      },
      `Lỗi: ${message}`
    );
  }
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = sanitizeName(path.basename(file.originalname, ext)).slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|webm|mov|jpg|jpeg|png|mp3|wav|m4a|ogg)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Định dạng tệp không được hỗ trợ.'));
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.use('/files/outputs', express.static(OUTPUTS_DIR));
  app.use('/files/uploads', express.static(UPLOADS_DIR));
  app.use('/files/bgm', express.static(BGM_DIR));
  app.use('/files/cache', express.static(CACHE_DIR));

  void ensureBuiltinBgm();

  // 1. System check
  app.get('/api/system/check', async (_req, res) => {
    let ffmpegOk = false;
    let fontsOk = false;
    let ollamaModels: string[] = [];

    try {
      await execFileAsync('ffmpeg', ['-version'], { timeout: 3000 });
      ffmpegOk = true;
    } catch {
      ffmpegOk = false;
    }

    try {
      const { stdout } = await execFileAsync('fc-list', [':', 'family'], { timeout: 3000 });
      fontsOk = stdout.includes('DejaVu Sans');
    } catch {
      fontsOk = false;
    }

    try {
      const ollamaRes = await fetchWithTimeout('http://127.0.0.1:11434/api/tags', {}, 1200);
      if (ollamaRes.ok) {
        const json = (await ollamaRes.json()) as { models?: Array<{ name: string }> };
        ollamaModels = (json.models ?? []).map((m) => m.name);
      }
    } catch {
      ollamaModels = [];
    }

    res.json({
      ffmpegOk,
      fontsOk,
      ollamaReachable: ollamaModels.length > 0,
      ollamaModels,
      builtinBgmReady: fs.existsSync(path.join(BGM_DIR, 'lofi_chill.mp3')),
    });
  });

  // 2. Upgraded AI Script + Terms + Per-Sentence Scene Prompts (MoneyPrinterTurbo standard)
  app.post('/api/generate-script', async (req, res) => {
    const subject = String(req.body?.subject ?? '').trim();
    const language = (req.body?.language ?? 'vi') as 'vi' | 'en' | 'bilingual';
    const scriptStyle = (req.body?.scriptStyle ?? 'curious_facts') as ScriptStyle;
    const sentenceCount = Math.max(3, Math.min(8, Number(req.body?.sentenceCount ?? 4)));
    const llmProvider = String(req.body?.llmProvider ?? 'pollinations');

    if (!subject) {
      res.status(400).json({ error: 'Vui lòng nhập chủ đề video trước khi tạo kịch bản.' });
      return;
    }

    const promptText = buildMoneyPrinterPrompt({
      subject,
      language,
      scriptStyle,
      sentenceCount,
    });

    // Fetch factual Wikipedia VN data + free English translation in parallel (<600ms, 0 API key)
    const [wikiData, translatedSubject] = await Promise.all([
      fetchWikipediaFacts(subject),
      translateViToEn(subject),
    ]);

    const accurateEnglishTerms = Array.from(
      new Set(
        [
          wikiData.englishTitle,
          translatedSubject,
          ...extractEnglishSearchTerms(subject, ''),
        ].filter((s): s is string => Boolean(s && s.trim().length >= 3))
      )
    ).slice(0, 4);

    if (llmProvider === 'offline_vi') {
      const out = generateOfflineVietnameseScript(subject, language, sentenceCount, accurateEnglishTerms);
      res.json({
        script: out.script,
        terms: out.terms,
        scenePrompts: out.scenePrompts,
        promptText,
        providerUsed: 'Mẫu kịch bản Tiếng Việt (Offline, 0ms)',
        fallbackUsed: false,
      });
      return;
    }

    if (llmProvider === 'ollama') {
      try {
        const ollamaRes = await fetchWithTimeout(
          'http://127.0.0.1:11434/api/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: String(req.body?.ollamaModel ?? 'qwen2.5:3b'),
              prompt: promptText,
              stream: false,
            }),
          },
          10000
        );
        if (ollamaRes.ok) {
          const data = (await ollamaRes.json()) as { response?: string };
          const parsed = parseAiWebOrJsonOutput(data.response ?? '', subject);
          if (parsed) {
            res.json({
              ...parsed,
              promptText,
              providerUsed: 'Ollama Local (Miễn phí trên máy)',
              fallbackUsed: false,
            });
            return;
          }
        }
      } catch {
        // Fall through cleanly
      }
    }

    // Try Pollinations AI if chosen, validating fluent output & avoiding 402/gibberish
    if (llmProvider === 'pollinations') {
      try {
        const aiRes = await fetchWithTimeout(
          'https://text.pollinations.ai/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'MoneyPrinterTurboVN/2.0',
            },
            body: JSON.stringify({
              model: 'openai',
              seed: Math.floor(Math.random() * 99999),
              messages: [
                {
                  role: 'system',
                  content:
                    'Bạn là biên kịch tiếng Việt chuyên nghiệp cho video ngắn. Viết tiếng Việt chuẩn xác 100%, tự nhiên, không dùng từ tiếng Anh chen ngang vô nghĩa. Chỉ trả về JSON hợp lệ.',
                },
                { role: 'user', content: promptText },
              ],
            }),
          },
          14000
        );
        if (aiRes.ok) {
          const text = await aiRes.text();
          const parsed = parseAiWebOrJsonOutput(text, subject);
          // Reject obvious quantized gibberish or empty responses
          const hasGibberish =
            !parsed ||
            parsed.script.length < 35 ||
            /rumor|tanh mưa|đá ván|lưới sóng/i.test(parsed.script);
          if (parsed && !hasGibberish) {
            const cleanTerms =
              parsed.terms.length > 0 && !parsed.terms.some((t) => t.includes('cinematic nature'))
                ? parsed.terms
                : accurateEnglishTerms;
            res.json({
              script: parsed.script,
              terms: cleanTerms,
              scenePrompts: parsed.scenePrompts,
              promptText,
              providerUsed: 'Pollinations AI (OpenAI Free · Không cần Key)',
              fallbackUsed: false,
            });
            return;
          }
        }
      } catch {
        // Fall through cleanly to Wikipedia VN + Translate synthesis
      }
    }

    // Smart Vietnamese synthesis using real Wikipedia VN facts + Google Translate English terms & scenes
    const smartOut = buildSmartVietnameseScriptFromFacts({
      subject,
      language,
      scriptStyle,
      sentenceCount,
      wikiTitle: wikiData.title,
      wikiSentences: wikiData.sentences,
      englishTerms: accurateEnglishTerms,
    });

    // Translate each Vietnamese sentence to create 1-to-1 accurate English scene prompts
    const smartLines = splitScriptSentences(smartOut.script);
    const translatedPrompts = await Promise.all(
      smartLines.map(async (line, idx) => {
        const enLine = await translateViToEn(line);
        const anchor = accurateEnglishTerms[0] ?? 'cinematic scene';
        return enLine
          ? `${anchor}, ${enLine}, photorealistic cinematic photography, 8k, no text`
          : smartOut.scenePrompts[idx] ?? `${anchor}, photorealistic, 8k, no text`;
      })
    );

    res.json({
      script: smartOut.script,
      terms: accurateEnglishTerms,
      scenePrompts: translatedPrompts,
      promptText,
      providerUsed:
        wikiData.sentences.length >= 2
          ? 'Wikipedia Tiếng Việt + Dịch Cảnh Chuẩn (Miễn phí, 100% chuẩn ngữ pháp)'
          : 'Bộ sinh kịch bản Tiếng Việt Thông minh + Dịch Cảnh Chuẩn (0đ)',
      fallbackUsed: llmProvider === 'pollinations',
    });
  });

  // 3. Preview Per-Sentence Real Scene Storyboard BEFORE rendering
  app.post('/api/preview-scenes', async (req, res) => {
    const subject = String(req.body?.subject ?? '').trim();
    const script = String(req.body?.script ?? '').trim();
    const terms = Array.isArray(req.body?.terms) ? req.body.terms.map(String) : [];
    const scenePrompts = Array.isArray(req.body?.scenePrompts)
      ? req.body.scenePrompts.map(String)
      : [];
    const materialSource = (req.body?.materialSource ?? 'hybrid_real') as MaterialSource;
    const aspectRatio = (req.body?.aspectRatio ?? '9:16') as VideoAspectRatio;
    const selectedMediaIds = Array.isArray(req.body?.selectedMediaIds)
      ? req.body.selectedMediaIds.map(String)
      : [];

    if (!script && !subject) {
      res.status(400).json({ error: 'Vui lòng nhập chủ đề hoặc lời thoại để tìm cảnh quay.' });
      return;
    }

    try {
      const { assets } = await resolveSceneAssets({
        subject,
        script: script || subject,
        terms,
        scenePrompts,
        materialSource,
        aspectRatio,
        selectedMediaIds,
      });

      const scenes: ScenePreviewItem[] = assets.map((a) => ({
        index: a.index,
        sentence: a.sentence,
        prompt: a.prompt,
        kind: a.kind,
        previewUrl: a.previewUrl,
        thumbUrl: a.thumbUrl,
        sourceLabel: a.sourceLabel,
      }));
      res.json({ scenes });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không thể tải xem trước cảnh quay.',
      });
    }
  });

  // 4. TTS Preview endpoint
  app.post('/api/tts-preview', async (req, res) => {
    const text =
      String(req.body?.text ?? '').trim() ||
      'Xin chào, đây là bản nghe thử giọng đọc miễn phí của MoneyPrinterTurbo Việt Nam.';
    const voiceId = (req.body?.voiceId ?? 'vi-VN-HoaiMyNeural') as VoiceOptionId;
    const ttsProvider = (req.body?.ttsProvider ?? 'google_free') as TtsProvider;
    const voiceRate = Number(req.body?.voiceRate ?? 1.0);

    const previewChunk = splitScriptSentences(text, 160)[0] ?? text.slice(0, 160);
    const filename = `preview_${Date.now()}.mp3`;
    const outPath = path.join(OUTPUTS_DIR, filename);

    try {
      const result = await synthesizeChunkWithFallback({
        text: previewChunk,
        voiceId,
        ttsProvider,
        voiceRate,
        outPath,
      });
      const durationSec = await probeDurationSec(outPath);
      res.json({
        audioUrl: `/files/outputs/${filename}`,
        engineUsed: result.engineUsed,
        recoveredFromEdgeError: result.recoveredFromEdgeError,
        durationSec,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không thể tạo âm thanh nghe thử.',
      });
    }
  });

  // 5. Media Library
  app.get('/api/media/list', (_req, res) => {
    const uploaded: MediaAssetItem[] = fs.readdirSync(UPLOADS_DIR).map((file) => {
      const stat = fs.statSync(path.join(UPLOADS_DIR, file));
      const isAudio = /\.(mp3|wav|m4a|ogg)$/i.test(file);
      const isImage = /\.(jpg|jpeg|png)$/i.test(file);
      return {
        id: file,
        name: file.replace(/^\d+_/, ''),
        kind: isAudio ? 'audio' : isImage ? 'image' : 'video',
        source: 'local_upload',
        url: `/files/uploads/${encodeURIComponent(file)}`,
        sizeBytes: stat.size,
      };
    });

    const builtinBgm: MediaAssetItem[] = [
      {
        id: 'lofi_chill',
        name: 'Lofi Chill Nhẹ Nhàng (Miễn phí bản quyền)',
        kind: 'audio',
        source: 'builtin_bgm',
        url: '/files/bgm/lofi_chill.mp3',
      },
      {
        id: 'tech_upbeat',
        name: 'Công Nghệ Nhịp Điệu Sáng Tạo (Miễn phí)',
        kind: 'audio',
        source: 'builtin_bgm',
        url: '/files/bgm/tech_upbeat.mp3',
      },
      {
        id: 'cinema_ambient',
        name: 'Không Gian Điện Ảnh Sâu Lắng (Miễn phí)',
        kind: 'audio',
        source: 'builtin_bgm',
        url: '/files/bgm/cinema_ambient.mp3',
      },
    ];

    res.json({ uploaded, builtinBgm });
  });

  app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Vui lòng chọn tệp video, ảnh hoặc nhạc hợp lệ.' });
      return;
    }
    const file = req.file.filename;
    const isAudio = /\.(mp3|wav|m4a|ogg)$/i.test(file);
    const isImage = /\.(jpg|jpeg|png)$/i.test(file);
    res.json({
      item: {
        id: file,
        name: req.file.originalname,
        kind: isAudio ? 'audio' : isImage ? 'image' : 'video',
        source: 'local_upload',
        url: `/files/uploads/${encodeURIComponent(file)}`,
        sizeBytes: req.file.size,
      } satisfies MediaAssetItem,
    });
  });

  app.delete('/api/media/:id', (req, res) => {
    const safeId = sanitizeName(req.params.id);
    const target = path.join(UPLOADS_DIR, safeId);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
    res.json({ ok: true });
  });

  app.post('/api/media/search-free', async (req, res) => {
    const query = String(req.body?.query ?? '').trim();
    const terms = extractEnglishSearchTerms(query, '');
    const [archiveItems, wmItems] = await Promise.all([
      searchArchiveOrgMp4s(terms, 4),
      searchWikimediaCommons(terms, 6),
    ]);
    res.json({ items: [...archiveItems, ...wmItems], translatedTerms: terms });
  });

  // 6. Render Video Job Lifecycle
  app.post('/api/render-video', (req, res) => {
    const config = req.body as RenderJobConfig;
    const validationError = validateRenderConfig(config);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const jobId = `mpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const initialStatus: RenderJobStatus = {
      jobId,
      status: 'queued',
      progressPct: 3,
      stepLabel: 'Đã xếp hàng tác vụ render...',
      logs: ['Khởi tạo phiên dựng video MoneyPrinterTurbo VN.'],
      createdAtIso: new Date().toISOString(),
    };
    jobs.set(jobId, initialStatus);

    void processRenderJob(jobId, config);
    res.json({ jobId, status: initialStatus });
  });

  app.get('/api/render-status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Không tìm thấy tác vụ render này.' });
      return;
    }
    res.json(job);
  });

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
    app.use(express.static(path.join(ROOT_DIR, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(ROOT_DIR, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`MoneyPrinterTurbo VN server listening on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
