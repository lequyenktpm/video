import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { GoogleGenAI, Type } from '@google/genai';
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
  getDefaultSecondaryVoiceForLanguage,
  getQualityEncodingParams,
  getSubtitleWrapBudget,
  hasCjkChars,
  hasVietnameseDiacritics,
  isBilingualLanguage,
  parseAiWebOrJsonOutput,
  planNarrationSegments,
  splitCueIntoShortSubCues,
  splitScriptSentences,
  stripNarrationTags,
  validateRenderConfig,
} from './src/shared/mptEngine';
import {
  BgmPreset,
  GroundingSource,
  LanguageCode,
  MaterialSource,
  MediaAssetItem,
  RenderJobConfig,
  RenderJobStatus,
  ScenePreviewItem,
  ScriptStyle,
  SubtitleCue,
  TopicSuggestion,
  TtsProvider,
  VideoAspectRatio,
  VideoQuality,
  VoiceOptionId,
} from './src/shared/types';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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
  const lang = voiceId.startsWith('ja-') ? 'ja' : voiceId.startsWith('en-') ? 'en' : 'vi';
  const isMale =
    voiceId.includes('NamMinh') || voiceId.includes('Guy') || voiceId.includes('Keita');
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

function getElevenLabsVoiceId(voiceId: VoiceOptionId): string {
  const voiceMap: Record<VoiceOptionId, string> = {
    'vi-VN-HoaiMyNeural': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'vi-VN-NamMinhNeural': 'pNInz6obpgDQGcFmaJgB', // Adam
    'en-US-JennyNeural': 'EXAVITQu4vr4xnSDxMaL', // Sarah
    'en-US-GuyNeural': 'ErXwobaYiN019PkySvjV', // Antoni
    'ja-JP-NanamiNeural': 'MF3mGyEYCl7XYWbV9V6O', // Elli
    'ja-JP-KeitaNeural': 'TxGEqnHWrfWFTfGW9XjX', // Josh
  };
  return voiceMap[voiceId] ?? '21m00Tcm4TlvDq8ikWAM';
}

async function createSilenceMp3(durationSec: number, outPath: string): Promise<void> {
  const safeDur = Math.max(0.25, Math.min(5.0, durationSec));
  await runFfmpeg(
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `anullsrc=r=24000:cl=mono`,
      '-t',
      safeDur.toFixed(2),
      '-c:a',
      'libmp3lame',
      '-b:a',
      '96k',
      outPath,
    ],
    12000
  );
}

async function synthesizeWithElevenLabs(
  text: string,
  voiceId: VoiceOptionId,
  outPath: string
): Promise<{ ok: boolean; reason?: 'missing_key' | 'api_error'; detail?: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      reason: 'missing_key',
      detail: 'Chưa cấu hình ELEVENLABS_API_KEY trong Secrets trên server.',
    };
  }

  const elevenVoiceId = getElevenLabsVoiceId(voiceId);
  try {
    const res = await fetchWithTimeout(
      `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
      12000
    );

    if (!res.ok) {
      return {
        ok: false,
        reason: 'api_error',
        detail: `ElevenLabs trả về HTTP ${res.status}`,
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 400) {
      return { ok: false, reason: 'api_error', detail: 'Dữ liệu âm thanh ElevenLabs rỗng.' };
    }
    fs.writeFileSync(outPath, buf);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'api_error',
      detail: err instanceof Error ? err.message : 'Lỗi kết nối ElevenLabs',
    };
  }
}

async function synthesizeChunkWithFallback(params: {
  text: string;
  voiceId: VoiceOptionId;
  ttsProvider: TtsProvider;
  voiceRate: number;
  outPath: string;
}): Promise<{
  engineUsed: string;
  recoveredFromEdgeError: boolean;
  fallbackNote?: string;
}> {
  const tempPath = `${params.outPath}.base.mp3`;
  let engineUsed = 'Google TTS Miễn phí';
  let recoveredFromEdgeError = false;
  let fallbackNote: string | undefined;
  let ok = false;

  if (params.ttsProvider === 'elevenlabs') {
    const elRes = await synthesizeWithElevenLabs(params.text, params.voiceId, tempPath);
    if (elRes.ok) {
      ok = true;
      engineUsed = 'ElevenLabs Multilingual v2';
    } else {
      fallbackNote = `${elRes.detail ?? 'ElevenLabs chưa sẵn sàng'} -> Tự chuyển sang Google TTS Miễn phí.`;
      ok = await synthesizeWithGoogleFreeTts(params.text, params.voiceId, tempPath);
    }
  } else if (params.ttsProvider === 'edge_auto') {
    ok = await synthesizeWithEdgeTts(params.text, params.voiceId, tempPath);
    if (ok) {
      engineUsed = 'Microsoft Edge Neural TTS';
    } else {
      recoveredFromEdgeError = true;
      fallbackNote = 'Edge-TTS bị Microsoft chặn 403 -> Đã tự chuyển sang Google TTS Miễn phí.';
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
    return { engineUsed, recoveredFromEdgeError, fallbackNote };
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

  return { engineUsed, recoveredFromEdgeError, fallbackNote };
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
 * Free keyless auto-language translator for queries, topics & exact stock media terms.
 */
async function translateToTargetLang(text: string, tl: 'en' | 'ja' | 'vi'): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';
  if (tl === 'en' && /^[\x00-\x7F\s]+$/.test(clean)) return clean;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } }, 4000);
    if (!res.ok) return '';
    const json = (await res.json()) as Array<Array<[string]>>;
    return (json[0] ?? []).map((seg) => seg[0] ?? '').join('').trim();
  } catch {
    return '';
  }
}

async function translateToEn(text: string): Promise<string> {
  return translateToTargetLang(text, 'en');
}

function isTopicPureForLanguage(title: string, language: LanguageCode): boolean {
  const clean = title.trim();
  if (!clean) return false;
  if (language === 'ja' || language === 'en') {
    if (hasVietnameseDiacritics(clean)) return false;
  }
  return true;
}

function extractCoreWikiQuery(subject: string): string {
  return subject
    .replace(/^(?:top\s*\d+|sự thật về|bí mật về|bí ẩn về|vì sao|tại sao|điều gì|làm thế nào|cách|khám phá|\d+\s*(?:sự thật|điều|bí mật|thói quen))\s+/i, '')
    .replace(/[?!.…「」『』【】"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function queryWikipediaByKeyword(
  keyword: string,
  wikiHost: string
): Promise<{
  title?: string;
  sentences: string[];
  englishTitle?: string;
  articleUrl?: string;
}> {
  const cleanQ = keyword.trim();
  if (!cleanQ) return { sentences: [] };
  try {
    const searchUrl = `https://${wikiHost}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&srlimit=3&format=json`;
    const sRes = await fetchWithTimeout(
      searchUrl,
      { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
      4500
    );
    if (!sRes.ok) return { sentences: [] };
    const sJson = (await sRes.json()) as { query?: { search?: Array<{ title: string }> } };
    const titles = (sJson.query?.search ?? []).map((s) => s.title).filter(Boolean);
    if (titles.length === 0) return { sentences: [] };

    for (const title of titles.slice(0, 2)) {
      const detailUrl = `https://${wikiHost}/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts|info|langlinks&exintro=1&explaintext=1&exsentences=14&inprop=url&lllang=en&format=json`;
      const dRes = await fetchWithTimeout(
        detailUrl,
        { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } },
        4500
      );
      if (!dRes.ok) continue;
      const dJson = (await dRes.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title: string;
              extract?: string;
              fullurl?: string;
              langlinks?: Array<{ lang: string; '*': string }>;
            }
          >;
        };
      };
      const page = Object.values(dJson.query?.pages ?? {})[0];
      if (!page?.extract) continue;
      const rawSentences = page.extract
        .split(/(?<=[.!?。！？])\s*|\n+/)
        .map((s) => s.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim())
        .filter((s) => s.length >= 16 && s.length <= 210);
      if (rawSentences.length === 0) continue;
      const englishTitle =
        wikiHost.startsWith('en.')
          ? page.title
          : page.langlinks?.find((l) => l.lang === 'en')?.['*'];
      return {
        title: page.title,
        sentences: rawSentences,
        englishTitle,
        articleUrl: page.fullurl || `https://${wikiHost}/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      };
    }
    return { sentences: [] };
  } catch {
    return { sentences: [] };
  }
}

/**
 * Fetches real Wikipedia facts (vi/en/ja) + official English title + real article URL for any topic (0 API key).
 */
async function fetchWikipediaFacts(
  subject: string,
  language: LanguageCode = 'vi'
): Promise<{
  title?: string;
  sentences: string[];
  englishTitle?: string;
  articleUrl?: string;
  sourceWikiLang?: 'vi' | 'en' | 'ja';
}> {
  const targetWikiLang: 'vi' | 'en' | 'ja' =
    language === 'ja' || language === 'ja_en' ? 'ja' : language === 'en' ? 'en' : 'vi';
  const primaryHost = `${targetWikiLang}.wikipedia.org`;
  const coreQuery = extractCoreWikiQuery(subject);

  // 1. Try exact subject and core noun query on target Wikipedia
  for (const candidateQ of Array.from(new Set([subject.trim(), coreQuery])).filter(Boolean)) {
    const hit = await queryWikipediaByKeyword(candidateQ, primaryHost);
    if (hit.sentences.length >= 2) {
      return { ...hit, sourceWikiLang: targetWikiLang };
    }
  }

  // 2. Fallback to English Wikipedia (translate verified English Wikipedia facts into target language)
  if (targetWikiLang !== 'en') {
    const enTerm = await translateToEn(coreQuery || subject);
    if (enTerm) {
      const enHit = await queryWikipediaByKeyword(enTerm, 'en.wikipedia.org');
      if (enHit.sentences.length >= 2) {
        const translatedSentences = await Promise.all(
          enHit.sentences.slice(0, 8).map(async (s) => {
            const tr = await translateToTargetLang(s, targetWikiLang);
            return tr || s;
          })
        );
        const trTitle = (await translateToTargetLang(enHit.title || enTerm, targetWikiLang)) || enHit.title;
        return {
          title: trTitle,
          sentences: translatedSentences.filter((s) => s.length >= 12),
          englishTitle: enHit.title,
          articleUrl: enHit.articleUrl,
          sourceWikiLang: 'en',
        };
      }
    }
  }

  return { sentences: [] };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isCleanEncyclopediaTitle(title: string, desc = ''): boolean {
  const combined = `${title} ${desc}`.toLowerCase();
  if (title.trim().length < 3 || /^\d+$/.test(title.trim())) return false;
  if (
    /^(main page|trang chính|メインページ|special:|wikipedia:|portal:|chủ đề:|thể loại:|category:|tập tin:|file:|template:|list of |danh sách )/i.test(
      title.trim()
    )
  ) {
    return false;
  }
  if (/(định hướng|disambiguation|曖昧さ回避|trang định hướng wikimedia)/i.test(combined)) {
    return false;
  }
  if (/\b(xxx|porn|pornography|sex|sexual|erotic|nude|nudity|hentai)\b|(?:giao phối|tình dục|khiêu dâm|khỏa thân|アダルト|性交)/i.test(combined)) {
    return false;
  }
  return true;
}

async function fetchGoogleNewsSnippets(
  query: string,
  language: LanguageCode
): Promise<Array<{ title: string; url: string; source?: string }>> {
  const hl = language === 'ja' || language === 'ja_en' ? 'ja' : language === 'en' ? 'en' : 'vi';
  const gl = hl === 'ja' ? 'JP' : hl === 'en' ? 'US' : 'VN';
  const ceid = `${gl}:${hl}`;
  const cleanQ = extractCoreWikiQuery(query) || query.trim();
  const rssUrl = cleanQ
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQ)}&hl=${hl}&gl=${gl}&ceid=${ceid}`
    : `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;
  const queryTokens = cleanQ
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^(the|and|for|của|những|trong|về|một|các|nhiều|này|với)$/i.test(w));

  try {
    const res = await fetchWithTimeout(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 4500);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    const out: Array<{ title: string; url: string; source?: string }> = [];
    for (const itemXml of items.slice(0, 8)) {
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const rawTitle = decodeHtmlEntities((titleMatch?.[1] ?? '').trim())
        .replace(/\s+-\s+[^-]+$/, '')
        .trim();
      const url = (linkMatch?.[1] ?? '').trim();
      if (rawTitle.length < 10 || !url || !isTopicPureForLanguage(rawTitle, language)) continue;
      if (queryTokens.length > 0) {
        const lowerTitle = rawTitle.toLowerCase();
        const matchesQuery =
          lowerTitle.includes(cleanQ.toLowerCase()) ||
          (queryTokens.length > 3 &&
            queryTokens.filter((t) =>
              new RegExp(`(?:^|[^\\p{L}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^\\p{L}])`, 'iu').test(rawTitle)
            ).length >= 3);
        if (!matchesQuery) continue;
      }
      out.push({
        title: rawTitle,
        url,
        source: sourceMatch?.[1] ? decodeHtmlEntities(sourceMatch[1].trim()) : undefined,
      });
      if (out.length >= 4) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function discoverRealWikipediaTopics(
  query: string,
  language: LanguageCode
): Promise<{ topics: TopicSuggestion[]; sources: GroundingSource[] }> {
  const wikiLang: 'vi' | 'en' | 'ja' =
    language === 'ja' || language === 'ja_en' ? 'ja' : language === 'en' ? 'en' : 'vi';
  const wikiHost = `${wikiLang}.wikipedia.org`;
  const topics: TopicSuggestion[] = [];
  const sources: GroundingSource[] = [];
  const seen = new Set<string>();

  if (query.trim()) {
    try {
      const searchUrl = `https://${wikiHost}/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query.trim())}&gsrlimit=8&prop=extracts|info&exintro=1&explaintext=1&exsentences=2&inprop=url&format=json`;
      const res = await fetchWithTimeout(searchUrl, { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } }, 5000);
      if (res.ok) {
        const json = (await res.json()) as {
          query?: {
            pages?: Record<
              string,
              { title: string; extract?: string; fullurl?: string }
            >;
          };
        };
        const pages = Object.values(json.query?.pages ?? {});
        for (const p of pages) {
          const title = p.title?.trim();
          if (
            !title ||
            seen.has(title.toLowerCase()) ||
            !isTopicPureForLanguage(title, language) ||
            !isCleanEncyclopediaTitle(title, p.extract ?? '')
          ) {
            continue;
          }
          seen.add(title.toLowerCase());
          const url =
            p.fullurl || `https://${wikiHost}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
          const firstSentence = (p.extract ?? '')
            .split(/(?<=[.!?。！？])\s+/)[0]
            ?.trim()
            .slice(0, 110);
          topics.push({
            title,
            angle: firstSentence
              ? `Wikipedia có thực: ${firstSentence}`
              : 'Bài viết bách khoa Wikipedia có thực',
            sourceType: 'ai',
            sourceUrl: url,
          });
          sources.push({ title: `Wikipedia: ${title}`, url });
          if (topics.length >= 6) break;
        }
      }
    } catch {
      // Ignore Wikipedia search error
    }
    return { topics, sources };
  }

  // No query -> fetch today's real Wikipedia Featured / Most Read / On-This-Day articles!
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  try {
    const feedUrl = `https://${wikiHost}/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`;
    const res = await fetchWithTimeout(feedUrl, { headers: { 'User-Agent': 'MoneyPrinterTurboVN/2.0' } }, 5500);
    if (res.ok) {
      const feed = (await res.json()) as {
        tfa?: {
          normalizedtitle?: string;
          title?: string;
          description?: string;
          extract?: string;
          content_urls?: { desktop?: { page?: string } };
        };
        mostread?: {
          articles?: Array<{
            normalizedtitle?: string;
            title?: string;
            description?: string;
            extract?: string;
            content_urls?: { desktop?: { page?: string } };
          }>;
        };
        onthisday?: Array<{
          year?: number;
          text?: string;
          pages?: Array<{
            normalizedtitle?: string;
            title?: string;
            content_urls?: { desktop?: { page?: string } };
          }>;
        }>;
      };

      const pushWikiArticle = (
        rawTitle?: string,
        desc?: string,
        url?: string,
        prefix = 'Bài viết Wikipedia có thực'
      ) => {
        const title = (rawTitle ?? '').replace(/_/g, ' ').trim();
        if (!isCleanEncyclopediaTitle(title, desc)) {
          return;
        }
        if (seen.has(title.toLowerCase()) || !isTopicPureForLanguage(title, language)) return;
        seen.add(title.toLowerCase());
        const resolvedUrl =
          url || `https://${wikiHost}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
        topics.push({
          title,
          angle: desc ? `${prefix}: ${desc.slice(0, 90)}` : prefix,
          sourceType: 'ai',
          sourceUrl: resolvedUrl,
        });
        sources.push({ title: `Wikipedia: ${title}`, url: resolvedUrl });
      };

      if (feed.tfa) {
        pushWikiArticle(
          feed.tfa.normalizedtitle || feed.tfa.title,
          feed.tfa.description || feed.tfa.extract,
          feed.tfa.content_urls?.desktop?.page,
          'Bài chọn lọc có thực'
        );
      }

      const otdList = feed.onthisday ?? [];
      for (const ev of otdList.slice(0, 3)) {
        const p = ev.pages?.[0];
        if (ev.text && ev.year && isTopicPureForLanguage(ev.text, language)) {
          const evTitle = p?.normalizedtitle || p?.title || ev.text.slice(0, 75);
          pushWikiArticle(
            evTitle,
            `Ngày này năm ${ev.year}: ${ev.text}`,
            p?.content_urls?.desktop?.page,
            'Sự kiện lịch sử có thật'
          );
        }
      }

      const mostRead = [...(feed.mostread?.articles ?? [])];
      for (let i = mostRead.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mostRead[i], mostRead[j]] = [mostRead[j], mostRead[i]];
      }
      for (const art of mostRead) {
        if (topics.length >= 6) break;
        pushWikiArticle(
          art.normalizedtitle || art.title,
          art.description || art.extract,
          art.content_urls?.desktop?.page,
          'Đọc nhiều trên Wikipedia'
        );
      }
    }
  } catch {
    // Ignore feed error
  }

  return { topics, sources };
}

const ROTATING_SEEDS: Record<'ja' | 'en' | 'vi', string[]> = {
  ja: ['宇宙の謎 雑学', '心理学 面白い事実', '世界の歴史 不思議', '最新の科学技術 トレンド'],
  en: ['psychology facts human brain', 'space discoveries astronomy', 'ancient history mysteries', 'everyday physics secrets'],
  vi: ['bí ẩn vũ trụ khoa học', 'tâm lý học hành vi thú vị', 'lịch sử thế giới ít người biết', 'công nghệ tương lai đời sống'],
};

async function discoverTopicsViaGoogleFree(
  query: string,
  language: LanguageCode
): Promise<{ topics: TopicSuggestion[]; sources: GroundingSource[] }> {
  const hl = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi';
  const gl = language === 'ja' ? 'JP' : language === 'en' ? 'US' : 'VN';
  const ceid = language === 'ja' ? 'JP:ja' : language === 'en' ? 'US:en' : 'VN:vi';
  const pool = ROTATING_SEEDS[hl];
  const seed = query.trim() || pool[Math.floor(Math.random() * pool.length)];

  const topics: TopicSuggestion[] = [];
  const sources: GroundingSource[] = [];
  const seen = new Set<string>();

  const [suggestRes, newsRes] = await Promise.allSettled([
    fetchWithTimeout(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${encodeURIComponent(seed)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      4500
    ),
    fetchWithTimeout(
      query.trim()
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(seed)}&hl=${hl}&gl=${gl}&ceid=${ceid}`
        : `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      5000
    ),
  ]);

  if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
    try {
      const xml = await newsRes.value.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
      for (const itemXml of items.slice(0, 8)) {
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
        const rawTitle = decodeHtmlEntities((titleMatch?.[1] ?? '').trim())
          .replace(/\s+-\s+[^-]+$/, '')
          .trim();
        const url = (linkMatch?.[1] ?? '').trim();
        if (
          rawTitle.length >= 8 &&
          isTopicPureForLanguage(rawTitle, language) &&
          !seen.has(rawTitle.toLowerCase())
        ) {
          seen.add(rawTitle.toLowerCase());
          topics.push({
            title: rawTitle,
            angle: 'Tin tức & xu hướng từ Google News',
            sourceType: 'google_search',
            sourceUrl: url || undefined,
          });
          if (url) {
            sources.push({ title: rawTitle, url });
          }
        }
        if (topics.length >= 4) break;
      }
    } catch {
      // Ignore XML parse failure
    }
  }

  if (suggestRes.status === 'fulfilled' && suggestRes.value.ok) {
    try {
      const json = (await suggestRes.value.json()) as [string, string[]];
      const suggestions = Array.isArray(json?.[1]) ? json[1] : [];
      for (const s of suggestions) {
        const clean = String(s).trim();
        if (
          clean.length >= 4 &&
          isTopicPureForLanguage(clean, language) &&
          !seen.has(clean.toLowerCase())
        ) {
          seen.add(clean.toLowerCase());
          topics.push({
            title: clean,
            angle: 'Gợi ý tìm kiếm phổ biến trên Google',
            sourceType: 'google_search',
            sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(clean)}`,
          });
        }
        if (topics.length >= 6) break;
      }
    } catch {
      // Ignore autocomplete parse failure
    }
  }

  return { topics, sources };
}

const CURATED_KNOWLEDGE_TOPICS: Record<'ja' | 'en' | 'vi', TopicSuggestion[]> = {
  ja: [
    { title: 'なぜ人間は寝ている間に記憶を整理できるのか？', angle: '脳科学・雑学', sourceType: 'ai' },
    { title: '宇宙空間で音がまったく聞こえない本当の理由', angle: '物理・宇宙', sourceType: 'ai' },
    { title: '古代ローマのコンクリートが2000年以上崩れない秘密', angle: '歴史・建築', sourceType: 'ai' },
    { title: '東京の鉄道が秒単位で正確に運行できる驚きの仕組み', angle: 'テクノロジー・日本', sourceType: 'ai' },
    { title: '猫が狭い箱にどうしても入りたがる心理学的な理由', angle: '動物行動学', sourceType: 'ai' },
    { title: '飛行機が雲の上を飛ぶと揺れが少なくなる科学', angle: '日常の科学', sourceType: 'ai' },
    { title: '世界で最もお金持ちが実践している朝の3つの習慣', angle: 'ライフハック', sourceType: 'ai' },
    { title: '南極の氷の下に眠る知られざる湖のミステリー', angle: '地球の謎', sourceType: 'ai' },
  ],
  en: [
    { title: 'Why Your Brain Deletes Most Memories While You Sleep', angle: 'Neuroscience hook', sourceType: 'ai' },
    { title: 'How Ancient Roman Concrete Heals Its Own Cracks', angle: 'History & engineering', sourceType: 'ai' },
    { title: 'Why Time Feels Twice As Fast After Age 30', angle: 'Psychology insight', sourceType: 'ai' },
    { title: 'What Really Happens Inside A Black Hole Horizon', angle: 'Space physics', sourceType: 'ai' },
    { title: '3 Tiny Morning Habits That Rewire Focus In 10 Minutes', angle: 'Productivity tips', sourceType: 'ai' },
    { title: 'The Japanese Train Engineering Trick Behind Zero Delays', angle: 'Engineering marvel', sourceType: 'ai' },
    { title: 'Why Glass Is Technically Neither Solid Nor Liquid', angle: 'Everyday science', sourceType: 'ai' },
    { title: 'The Lost Underground Cities Built Thousands Of Years Ago', angle: 'Ancient mystery', sourceType: 'ai' },
  ],
  vi: [
    { title: 'Vì sao não bộ tự xóa bớt ký ức cũ mỗi đêm bạn ngủ?', angle: 'Khoa học thần kinh', sourceType: 'ai' },
    { title: 'Bí mật khiến bê tông La Mã cổ đại bền vững hơn 2.000 năm', angle: 'Lịch sử & Kỹ thuật', sourceType: 'ai' },
    { title: 'Tại sao càng trưởng thành ta càng thấy 1 năm trôi qua nhanh hơn?', angle: 'Tâm lý học nhận thức', sourceType: 'ai' },
    { title: 'Điều gì thực sự xảy ra nếu Trái Đất ngừng quay trong 1 giây?', angle: 'Vật lý giả tưởng', sourceType: 'ai' },
    { title: '3 thói quen 10 phút giúp tỉnh táo gấp đôi mà không cần cà phê', angle: 'Mẹo hiệu suất', sourceType: 'ai' },
    { title: 'Bí ẩn thành phố ngầm khổng lồ chứa 20.000 người dưới lòng đất Thổ Nhĩ Kỳ', angle: 'Khám phá cổ đại', sourceType: 'ai' },
    { title: 'Tại sao máy bay thương mại luôn bay ở độ cao 10.000 mét?', angle: 'Khoa học hàng không', sourceType: 'ai' },
    { title: 'Nghịch lý kinh tế: Vì sao sản phẩm càng đắt lại càng bán chạy?', angle: 'Kinh tế & Hành vi', sourceType: 'ai' },
  ],
};

function buildFallbackTopics(query: string, language: LanguageCode): TopicSuggestion[] {
  const clean = query.trim();
  const targetLang: 'ja' | 'en' | 'vi' =
    language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi';

  if (clean && isTopicPureForLanguage(clean, language)) {
    if (targetLang === 'ja') {
      return [
        { title: `${clean}に隠された意外と知らない3つの事実`, angle: '雑学・フック3秒', sourceType: 'ai' },
        { title: `なぜ${clean}は多くの専門家から注目されているのか？`, angle: 'ストーリー解説', sourceType: 'ai' },
        { title: `${clean}の仕組みを30秒でわかりやすく解説`, angle: '時短解説', sourceType: 'ai' },
        { title: `${clean}の知られざる歴史と未来のトレンド`, angle: 'トレンド分析', sourceType: 'ai' },
      ];
    }
    if (targetLang === 'en') {
      return [
        { title: `3 Surprising Facts About ${clean} Most People Miss`, angle: 'Curiosity hook', sourceType: 'ai' },
        { title: `The Hidden Science Behind ${clean}`, angle: 'Visual explainer', sourceType: 'ai' },
        { title: `How ${clean} Quietly Shapes Our Everyday World`, angle: 'Storytelling', sourceType: 'ai' },
        { title: `What Happens When You Look Closer at ${clean}?`, angle: 'Short documentary', sourceType: 'ai' },
      ];
    }
    return [
      { title: `3 sự thật bất ngờ về ${clean} ít người từng nghe`, angle: 'Hook tò mò 3 giây', sourceType: 'ai' },
      { title: `Khoa học giải mã bí ẩn đằng sau ${clean}`, angle: 'Giải thích trực quan', sourceType: 'ai' },
      { title: `Điều gì xảy ra nếu nhìn cận cảnh vào ${clean}?`, angle: 'Kể chuyện cuốn hút', sourceType: 'ai' },
      { title: `Những góc nhìn mới nhất về ${clean} năm nay`, angle: 'Xu hướng nổi bật', sourceType: 'ai' },
    ];
  }

  // Rotate curated knowledge pool so every discovery yields fresh, non-repetitive topics
  const pool = [...CURATED_KNOWLEDGE_TOPICS[targetLang]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
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
  videoQuality?: VideoQuality;
  selectedMediaIds: string[];
  customScenes?: ScenePreviewItem[];
  onLog?: (msg: string) => void;
}): Promise<{ cacheKey: string; assets: ResolvedSceneAsset[] }> {
  const rawSentences = splitScriptSentences(params.script)
    .map((s) => stripNarrationTags(s))
    .filter(Boolean);
  const effectiveSentences =
    rawSentences.length > 0 ? rawSentences : [params.subject || 'Khám phá điều kỳ diệu quanh ta'];

  // Preserve user/AI-provided English terms directly! Only translate if empty or non-ASCII.
  let searchTerms = params.terms.map((t) => t.trim()).filter((t) => t.length >= 2 && /^[\x00-\x7F\s,.-]+$/.test(t));
  if (searchTerms.length === 0) {
    const translatedSubject = await translateToEn(params.subject);
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
  const { width, height } = getCanvasDimensions(
    params.aspectRatio,
    params.videoQuality ?? '720p'
  );

  // If user edited/replaced/deleted scenes in the storyboard, honor them directly!
  if (params.customScenes && params.customScenes.length > 0) {
    const customResolved: ResolvedSceneAsset[] = [];
    for (let idx = 0; idx < params.customScenes.length; idx++) {
      const scene = params.customScenes[idx];
      const url = scene.previewUrl ?? '';
      if (url.startsWith('/files/uploads/')) {
        const fname = sanitizeName(decodeURIComponent(url.replace('/files/uploads/', '')));
        const localPath = path.join(UPLOADS_DIR, fname);
        if (fs.existsSync(localPath)) {
          customResolved.push({
            index: idx,
            sentence: scene.sentence || effectiveSentences[idx % effectiveSentences.length],
            prompt: scene.prompt,
            kind: scene.kind,
            localPath,
            previewUrl: url,
            thumbUrl: scene.thumbUrl,
            sourceLabel: scene.sourceLabel || 'Tệp tải lên',
          });
          continue;
        }
      } else if (url.startsWith('/files/cache/')) {
        const rel = url.replace('/files/cache/', '').replace(/\.\./g, '');
        const localPath = path.join(CACHE_DIR, rel);
        if (fs.existsSync(localPath)) {
          customResolved.push({
            index: idx,
            sentence: scene.sentence || effectiveSentences[idx % effectiveSentences.length],
            prompt: scene.prompt,
            kind: scene.kind,
            localPath,
            previewUrl: url,
            thumbUrl: scene.thumbUrl,
            sourceLabel: scene.sourceLabel,
          });
          continue;
        }
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        if (scene.kind === 'video' && url.includes('mixkit.co')) {
          customResolved.push({
            index: idx,
            sentence: scene.sentence || effectiveSentences[idx % effectiveSentences.length],
            prompt: scene.prompt,
            kind: 'video',
            localPath: '',
            remoteUrl: url,
            previewUrl: url,
            thumbUrl: scene.thumbUrl,
            sourceLabel: scene.sourceLabel || 'Mixkit Stock HD',
          });
          continue;
        }
        const ext = scene.kind === 'image' ? '.jpg' : '.mp4';
        const customFile = `custom_${crypto.createHash('sha1').update(url).digest('hex').slice(0, 10)}${ext}`;
        const customPath = path.join(sceneCacheDir, customFile);
        const ok = await downloadRemoteMedia(url, scene.kind, customPath);
        if (ok) {
          customResolved.push({
            index: idx,
            sentence: scene.sentence || effectiveSentences[idx % effectiveSentences.length],
            prompt: scene.prompt,
            kind: scene.kind,
            localPath: customPath,
            previewUrl: `/files/cache/${cacheKey}/${customFile}`,
            thumbUrl: scene.thumbUrl,
            sourceLabel: scene.sourceLabel,
          });
          continue;
        }
        if (scene.kind === 'video') {
          customResolved.push({
            index: idx,
            sentence: scene.sentence || effectiveSentences[idx % effectiveSentences.length],
            prompt: scene.prompt,
            kind: 'video',
            localPath: '',
            remoteUrl: url,
            previewUrl: url,
            thumbUrl: scene.thumbUrl,
            sourceLabel: scene.sourceLabel,
          });
          continue;
        }
      }
    }

    if (customResolved.length > 0) {
      params.onLog?.(`Sử dụng ${customResolved.length} phân cảnh đã chọn/chỉnh sửa.`);
      return { cacheKey, assets: customResolved };
    }
  }

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

    const segments = planNarrationSegments(config);
    if (segments.length === 0) {
      throw new Error('Nội dung lời thoại đang trống.');
    }

    const usedVoices = Array.from(new Set(segments.map((s) => s.voiceId)));
    if (usedVoices.length > 1) {
      updateJob(
        jobId,
        {},
        `Chế độ 2 giọng đọc đang bật: kết hợp ${usedVoices.join(' + ')} theo từng câu.`
      );
    }

    // 1. Synthesize each segment with its resolved voiceId & insert thinking pauses where specified
    const cues: SubtitleCue[] = [];
    const audioParts: string[] = [];
    let cursorSec = 0;
    let loggedRecovery = false;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const partPath = path.join(workDir, `tts_${i}.mp3`);
      const ttsRes = await synthesizeChunkWithFallback({
        text: seg.text,
        voiceId: seg.voiceId,
        ttsProvider: config.ttsProvider,
        voiceRate: config.voiceRate,
        outPath: partPath,
      });

      if ((ttsRes.recoveredFromEdgeError || ttsRes.fallbackNote) && !loggedRecovery) {
        loggedRecovery = true;
        updateJob(
          jobId,
          {},
          ttsRes.fallbackNote ??
            'Đã phát hiện lỗi Edge-TTS (Microsoft 403) -> tự chuyển sang Google TTS Miễn phí.'
        );
      }

      const dur = await probeDurationSec(partPath);
      cues.push({
        index: cues.length + 1,
        startSec: cursorSec,
        endSec: cursorSec + dur,
        text: seg.text,
        voiceSlot: seg.voiceSlot,
      });
      audioParts.push(partPath);
      cursorSec += dur;

      if (seg.pauseAfterSec > 0) {
        const pausePath = path.join(workDir, `pause_${i}.mp3`);
        await createSilenceMp3(seg.pauseAfterSec, pausePath);
        const pauseDur = await probeDurationSec(pausePath);
        audioParts.push(pausePath);
        if (config.scriptStyle === 'language_challenge' || config.scriptStyle === 'quiz_riddle') {
          cues.push({
            index: cues.length + 1,
            startSec: cursorSec,
            endSec: cursorSec + pauseDur,
            text: '⏱ 3... 2... 1...',
            voiceSlot: 'primary',
          });
        }
        cursorSec += pauseDur;
      }

      const pct = 8 + Math.round(((i + 1) / segments.length) * 20);
      updateJob(jobId, {
        progressPct: pct,
        stepLabel: `Đang tạo giọng đọc ${i + 1}/${segments.length} (${seg.detectedLang.toUpperCase()})...`,
      });
    }

    const voiceListPath = path.join(workDir, 'voice_concat.txt');
    fs.writeFileSync(
      voiceListPath,
      audioParts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
      'utf-8'
    );
    const voiceAllPath = path.join(workDir, 'voice_all.mp3');
    // Re-encode mono 24kHz so multiple TTS voices & silence segments merge cleanly with exact timing
    await runFfmpeg(
      [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        voiceListPath,
        '-ar',
        '24000',
        '-ac',
        '1',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '96k',
        voiceAllPath,
      ],
      30000
    );

    const totalVoiceSec = Math.max(3, await probeDurationSec(voiceAllPath));
    updateJob(
      jobId,
      { progressPct: 32, stepLabel: 'Đang tìm video & ảnh AI khớp từng câu lời thoại...' },
      `Đã hoàn tất giọng đọc (${totalVoiceSec.toFixed(1)}s, ${segments.length} nhịp đọc, ${usedVoices.length} giọng).`
    );

    // 2. Resolve real per-sentence visual assets (honoring custom edited scenes first)
    const { assets } = await resolveSceneAssets({
      subject: config.subject,
      script: config.script,
      terms: config.terms,
      scenePrompts: config.scenePrompts ?? [],
      materialSource: config.materialSource,
      aspectRatio: config.aspectRatio,
      videoQuality: config.videoQuality,
      selectedMediaIds: config.selectedMediaIds,
      customScenes: config.customScenes,
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
    const { width, height } = getCanvasDimensions(
      config.aspectRatio,
      config.videoQuality ?? '720p'
    );
    const qualityParams = getQualityEncodingParams(config.videoQuality ?? '720p');
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

    const hasCjkSub = cues.some((c) => hasCjkChars(c.text));
    const wrapBudget = getSubtitleWrapBudget(config.subtitle, width, height, hasCjkSub);
    const shortSubCues = splitCueIntoShortSubCues(cues, wrapBudget.maxCueChars);
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

    if (bgmPath) {
      const filters: string[] = [];
      if (config.subtitle.enabled) {
        filters.push(`[0:v]ass='${escapedAss}'[vout]`);
      }
      filters.push(
        `[1:a]volume=${voiceVol.toFixed(2)}[va]`,
        `[2:a]volume=${bgmVol.toFixed(2)}[ba]`,
        `[va][ba]amix=inputs=2:duration=first:dropout_transition=2[aout]`
      );
      finalArgs.push(
        '-filter_complex',
        filters.join(';'),
        '-map',
        config.subtitle.enabled ? '[vout]' : '0:v',
        '-map',
        '[aout]'
      );
    } else {
      if (config.subtitle.enabled) {
        finalArgs.push('-vf', `ass='${escapedAss}'`);
      }
      finalArgs.push('-af', `volume=${voiceVol.toFixed(2)}`, '-map', '0:v', '-map', '1:a');
    }

    finalArgs.push(
      '-t',
      totalVoiceSec.toFixed(2),
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-profile:v',
      'main',
      '-level',
      '4.0',
      '-crf',
      qualityParams.crf,
      '-maxrate',
      qualityParams.maxrate,
      '-bufsize',
      qualityParams.bufsize,
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      qualityParams.audioBitrate,
      '-movflags',
      '+faststart',
      mp4OutPath
    );

    await runFfmpeg(finalArgs, 180000);

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

  app.use(
    '/files/outputs',
    express.static(OUTPUTS_DIR, {
      acceptRanges: true,
      setHeaders: (res, filePath) => {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.srt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      },
    })
  );
  app.use('/files/uploads', express.static(UPLOADS_DIR));
  app.use('/files/bgm', express.static(BGM_DIR));
  app.use('/files/cache', express.static(CACHE_DIR));

  // Forced-attachment download endpoint so downloading works reliably inside iframes & browsers
  app.get('/api/download/:filename', (req, res) => {
    const safeFile = sanitizeName(req.params.filename);
    const fullPath = path.join(OUTPUTS_DIR, safeFile);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Không tìm thấy tệp video hoặc phụ đề.' });
      return;
    }
    const requestedName = sanitizeName(String(req.query.name || safeFile));
    res.setHeader('Cache-Control', 'no-store');
    res.download(fullPath, requestedName);
  });

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
      elevenLabsConfigured: Boolean(process.env.ELEVENLABS_API_KEY?.trim()),
    });
  });

  // 2a. Discover Video Topics via AI or Google Search (with Gemini Grounding + Free Fallbacks)
  app.post('/api/topics/discover', async (req, res) => {
    const mode = req.body?.mode === 'google_search' ? 'google_search' : 'ai';
    const rawQuery = String(req.body?.query ?? '').trim();
    const language = (req.body?.language ?? 'vi') as LanguageCode;
    const langLabel =
      language === 'ja'
        ? '100% tiếng Nhật (日本語)'
        : language === 'en'
        ? '100% tiếng Anh (English)'
        : language === 'vi_ja'
        ? 'song ngữ Việt-Nhật (học tiếng Nhật)'
        : language === 'ja_en'
        ? 'song ngữ Nhật-Anh (học tiếng Anh cho người Nhật)'
        : language === 'bilingual'
        ? 'song ngữ Việt-Anh (học tiếng Anh)'
        : '100% tiếng Việt';

    // Translate user seed keyword into target language if it contains mismatched Vietnamese script
    let query = rawQuery;
    if (rawQuery && (language === 'ja' || language === 'en') && hasVietnameseDiacritics(rawQuery)) {
      const translated = await translateToTargetLang(rawQuery, language);
      query = translated || '';
    }

    const ai = getGeminiClient();

    if (mode === 'google_search') {
      if (ai) {
        try {
          const searchPrompt = query
            ? `Tìm kiếm trên Google các thông tin, sự thật thú vị hoặc xu hướng mới nhất liên quan đến "${query}". Sau đó đề xuất 5 chủ đề video ngắn (TikTok / Shorts / Reels) hấp dẫn viết bằng ${langLabel}. Trả về JSON array gồm các object có "title" và "angle".`
            : `Tìm kiếm trên Google các chủ đề khoa học, công nghệ, khám phá hoặc xu hướng nổi bật đang được quan tâm hiện nay. Đề xuất 5 chủ đề video ngắn hấp dẫn viết bằng ${langLabel}. Trả về JSON array gồm các object có "title" và "angle".`;

          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: searchPrompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    angle: { type: Type.STRING },
                  },
                  required: ['title', 'angle'],
                },
              },
            },
          });

          const parsed = JSON.parse((response.text ?? '[]').trim()) as Array<{
            title: string;
            angle: string;
          }>;
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
          const sources: GroundingSource[] = chunks
            .map((c) => ({
              title: c.web?.title || 'Nguồn Google Search',
              url: c.web?.uri || '',
            }))
            .filter((s) => Boolean(s.url))
            .slice(0, 5);

          if (Array.isArray(parsed) && parsed.length > 0) {
            const topics: TopicSuggestion[] = parsed.slice(0, 6).map((item, idx) => ({
              title: String(item.title).trim(),
              angle: String(item.angle).trim(),
              sourceType: 'google_search',
              sourceUrl: sources[idx]?.url,
            }));
            res.json({
              topics,
              sources,
              providerUsed: 'Gemini + Google Search Grounding',
            });
            return;
          }
        } catch {
          // Fall through cleanly to keyless Google Search Suggest + Google News RSS
        }
      }

      const freeGoogle = await discoverTopicsViaGoogleFree(query, language);
      if (freeGoogle.topics.length > 0) {
        res.json({
          topics: freeGoogle.topics,
          sources: freeGoogle.sources,
          providerUsed: 'Google Search Suggest & Google News',
        });
        return;
      }

      res.json({
        topics: buildFallbackTopics(query, language),
        sources: [],
        providerUsed: 'Gợi ý chủ đề tự động (Offline)',
      });
      return;
    }

    // Real-article topic discovery: prioritize Wikipedia real articles + Google News RSS over fictional AI invention
    if (ai && mode === 'ai') {
      // Even when Gemini key exists, fetch real Wikipedia/Google News topics first so topics are factual & verifiable!
    }

    const [realWiki, realNews] = await Promise.all([
      discoverRealWikipediaTopics(query, language),
      discoverTopicsViaGoogleFree(query, language),
    ]);

    const combinedTopics: TopicSuggestion[] = [];
    const combinedSources: GroundingSource[] = [];
    const seenTopicTitle = new Set<string>();

    for (const t of [...realWiki.topics, ...realNews.topics]) {
      const k = t.title.toLowerCase();
      if (seenTopicTitle.has(k)) continue;
      seenTopicTitle.add(k);
      combinedTopics.push(t);
      if (combinedTopics.length >= 6) break;
    }
    for (const s of [...realWiki.sources, ...realNews.sources]) {
      if (!combinedSources.some((x) => x.url === s.url)) {
        combinedSources.push(s);
      }
      if (combinedSources.length >= 6) break;
    }

    if (combinedTopics.length > 0) {
      res.json({
        topics: combinedTopics,
        sources: combinedSources,
        providerUsed:
          realWiki.topics.length > 0 && realNews.topics.length > 0
            ? 'Wikipedia Bách Khoa & Google News (Bài viết có thực)'
            : realWiki.topics.length > 0
            ? 'Wikipedia (Kiến thức & Bài viết có thực)'
            : 'Google News & Search (Xu hướng thực tế)',
      });
      return;
    }

    if (ai) {
      try {
        const aiPrompt = query
          ? `Hãy gợi ý 5 chủ đề kiến thức, hiện tượng khoa học hoặc sự kiện lịch sử CÓ THẬT xoay quanh "${query}", viết hoàn toàn bằng ${langLabel}. Không bịa đặt. Trả về JSON array gồm "title" và "angle".`
          : `Hãy gợi ý 5 chủ đề kiến thức khoa học, lịch sử hoặc tự nhiên CÓ THẬT (có thể kiểm chứng trên bách khoa toàn thư), viết hoàn toàn bằng ${langLabel}. Trả về JSON array gồm "title" và "angle".`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: aiPrompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  angle: { type: Type.STRING },
                },
                required: ['title', 'angle'],
              },
            },
          },
        });
        const parsed = JSON.parse((response.text ?? '[]').trim()) as Array<{
          title: string;
          angle: string;
        }>;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const sources: GroundingSource[] = chunks
          .map((c) => ({
            title: c.web?.title || 'Nguồn thực tế',
            url: c.web?.uri || '',
          }))
          .filter((s) => Boolean(s.url))
          .slice(0, 5);
        if (Array.isArray(parsed) && parsed.length > 0) {
          res.json({
            topics: parsed.slice(0, 6).map((item, idx) => ({
              title: String(item.title).trim(),
              angle: String(item.angle).trim(),
              sourceType: 'ai' as const,
              sourceUrl: sources[idx]?.url,
            })),
            sources,
            providerUsed: 'Gemini AI + Google Search Grounding',
          });
          return;
        }
      } catch {
        // Fall through to curated real-fact fallback
      }
    }

    res.json({
      topics: buildFallbackTopics(query, language),
      sources: [],
      providerUsed: 'Kho kiến thức thực tế (Offline)',
    });
  });

  // 2b. Upgraded AI Script + Terms + Per-Sentence Scene Prompts grounded on real Wikipedia & News facts
  app.post('/api/generate-script', async (req, res) => {
    const subject = String(req.body?.subject ?? '').trim();
    const language = (req.body?.language ?? 'vi') as LanguageCode;
    const scriptStyle = (req.body?.scriptStyle ?? 'curious_facts') as ScriptStyle;
    const sentenceCount = Math.max(2, Math.min(25, Math.round(Number(req.body?.sentenceCount ?? 4))));
    const llmProvider = String(req.body?.llmProvider ?? 'pollinations');

    if (!subject) {
      res.status(400).json({ error: 'Vui lòng nhập chủ đề video trước khi tạo kịch bản.' });
      return;
    }

    const wikiLang: LanguageCode =
      language === 'ja_en' ? 'ja' : language === 'vi_ja' ? 'vi' : language;
    const [wikiData, newsSnippets, translatedSubject] = await Promise.all([
      fetchWikipediaFacts(subject, wikiLang),
      fetchGoogleNewsSnippets(subject, wikiLang),
      translateToEn(subject),
    ]);

    const verifiedFacts: string[] = [
      ...wikiData.sentences.slice(0, 8),
      ...newsSnippets.slice(0, 3).map((n) => (n.source ? `${n.title} (${n.source})` : n.title)),
    ];

    const verifiedSources: GroundingSource[] = [];
    if (wikiData.articleUrl) {
      verifiedSources.push({
        title: `Wikipedia: ${wikiData.title || subject}`,
        url: wikiData.articleUrl,
      });
    }
    for (const n of newsSnippets.slice(0, 3)) {
      verifiedSources.push({ title: n.title, url: n.url });
    }

    const promptText = buildMoneyPrinterPrompt({
      subject,
      language,
      scriptStyle,
      sentenceCount,
      verifiedFacts,
    });

    const accurateEnglishTerms = Array.from(
      new Set(
        [
          wikiData.englishTitle,
          translatedSubject,
          ...extractEnglishSearchTerms(subject, ''),
        ].filter((s): s is string => Boolean(s && s.trim().length >= 3))
      )
    ).slice(0, 5);

    if (llmProvider === 'offline_vi') {
      const out = buildSmartVietnameseScriptFromFacts({
        subject,
        language,
        scriptStyle,
        sentenceCount,
        wikiTitle: wikiData.title,
        wikiSentences: wikiData.sentences,
        englishTerms: accurateEnglishTerms,
      });
      res.json({
        script: out.script,
        terms: out.terms,
        scenePrompts: out.scenePrompts,
        groundingSources: verifiedSources,
        promptText,
        providerUsed:
          wikiData.sentences.length >= 2
            ? `Wikipedia Thực tế (${language.toUpperCase()})`
            : `Mẫu kịch bản ${language.toUpperCase()} (${scriptStyle}, Offline)`,
        fallbackUsed: false,
      });
      return;
    }

    if (llmProvider === 'gemini_search') {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: promptText,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
          const parsed = parseAiWebOrJsonOutput(response.text ?? '', subject);
          if (parsed) {
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const groundingSources: GroundingSource[] = [
              ...verifiedSources,
              ...chunks
                .map((c) => ({
                  title: c.web?.title || 'Nguồn Google Search',
                  url: c.web?.uri || '',
                }))
                .filter((s) => Boolean(s.url)),
            ].slice(0, 5);

            res.json({
              script: parsed.script,
              terms: parsed.terms.length > 0 ? parsed.terms : accurateEnglishTerms,
              scenePrompts: parsed.scenePrompts,
              groundingSources,
              promptText,
              providerUsed: 'Gemini AI + Google Search Grounding',
              fallbackUsed: false,
            });
            return;
          }
        } catch {
          // Fall through cleanly to Wikipedia + Free Search synthesis
        }
      }
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
              groundingSources: verifiedSources,
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

    if (llmProvider === 'pollinations' || llmProvider === 'gemini_search') {
      try {
        const systemLangNote =
          language === 'ja'
            ? 'あなたは事実に基づくプロの動画脚本家です。推測や創作をせず、提供されたWikipediaやニュースの事実に忠実に自然な日本語でJSONのみ返してください。'
            : language === 'en'
            ? 'You are a fact-based short-form video scriptwriter. Rely strictly on verified facts provided, never fabricate statistics or events, and return valid JSON only.'
            : isBilingualLanguage(language)
            ? 'You are a bilingual language-challenge short video writer. Return valid JSON only with [VI]/[EN]/[JA] line tags and [PAUSE] markers.'
            : 'Bạn là biên kịch video sự thật (fact-based) tiếng Việt. Chỉ dùng thông tin có thật từ dữ liệu xác minh được cung cấp, KHÔNG bịa đặt số liệu hay hư cấu, và chỉ trả về JSON hợp lệ.';

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
                { role: 'system', content: systemLangNote },
                { role: 'user', content: promptText },
              ],
            }),
          },
          14000
        );
        if (aiRes.ok) {
          const text = await aiRes.text();
          const parsed = parseAiWebOrJsonOutput(text, subject);
          const hasGibberish =
            !parsed ||
            parsed.script.length < 25 ||
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
              groundingSources: verifiedSources,
              promptText,
              providerUsed:
                verifiedSources.length > 0
                  ? 'Pollinations AI + Đối chiếu Wikipedia/News thực tế'
                  : 'Pollinations AI (Miễn phí)',
              fallbackUsed: llmProvider === 'gemini_search',
            });
            return;
          }
        }
      } catch {
        // Fall through cleanly to Wikipedia + Translate synthesis
      }
    }

    const smartOut = buildSmartVietnameseScriptFromFacts({
      subject,
      language,
      scriptStyle,
      sentenceCount,
      wikiTitle: wikiData.title,
      wikiSentences:
        wikiData.sentences.length > 0
          ? wikiData.sentences
          : newsSnippets.map((n) => (n.source ? `${n.title}, theo ${n.source}.` : `${n.title}.`)),
      englishTerms: accurateEnglishTerms,
    });

    const smartLines = splitScriptSentences(smartOut.script);
    const translatedPrompts = await Promise.all(
      smartLines.map(async (line, idx) => {
        if (idx >= 8) {
          return smartOut.scenePrompts[idx] ?? `${accurateEnglishTerms[0] ?? 'cinematic scene'}, photorealistic, 8k, no text`;
        }
        const enLine = await translateToEn(line);
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
      groundingSources: verifiedSources,
      promptText,
      providerUsed:
        wikiData.sentences.length >= 2
          ? `Wikipedia Thực tế (${language.toUpperCase()})`
          : newsSnippets.length > 0
          ? `Tin tức Google News (${language.toUpperCase()})`
          : `Bộ sinh kịch bản ${language.toUpperCase()} (Offline)`,
      fallbackUsed: llmProvider === 'pollinations' || llmProvider === 'gemini_search',
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
    const videoQuality = (req.body?.videoQuality ?? '720p') as VideoQuality;
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
        videoQuality,
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

  // 3b. Search alternative replacement clips/images for a single scene
  app.post('/api/scenes/alternatives', async (req, res) => {
    const query = String(req.body?.query ?? '').trim() || 'nature landscape';
    const aspectRatio = (req.body?.aspectRatio ?? '9:16') as VideoAspectRatio;
    const videoQuality = (req.body?.videoQuality ?? '720p') as VideoQuality;

    let searchTerms = extractEnglishSearchTerms(query, '');
    if (/^[a-zA-Z0-9\s,.-]{2,}$/.test(query)) {
      searchTerms = [query, ...searchTerms];
    } else {
      const translated = await translateToEn(query);
      if (translated) searchTerms = [translated, ...searchTerms];
    }

    try {
      const [mixkitItems, wmItems, archiveItems] = await Promise.all([
        searchMixkitVideos(searchTerms.slice(0, 3), 8),
        searchWikimediaCommons(searchTerms.slice(0, 2), 6),
        searchArchiveOrgMp4s(searchTerms.slice(0, 2), 3),
      ]);

      const candidates: ScenePreviewItem[] = [];
      const seen = new Set<string>();

      for (const item of [...mixkitItems, ...wmItems, ...archiveItems]) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        candidates.push({
          index: candidates.length,
          sentence: '',
          prompt: item.name || query,
          kind: item.kind === 'video' ? 'video' : 'image',
          previewUrl: item.url,
          thumbUrl: item.previewThumbUrl,
          sourceLabel:
            item.source === 'mixkit_free'
              ? 'Mixkit Stock HD'
              : item.source === 'archive_free'
              ? 'Archive.org MP4'
              : item.kind === 'video'
              ? 'Wikimedia Video'
              : 'Wikimedia Ảnh thật',
        });
        if (candidates.length >= 10) break;
      }

      // Also provide 1 AI generated image candidate cached locally if user wants illustration
      const { width, height } = getCanvasDimensions(aspectRatio, videoQuality);
      const aiCacheDir = path.join(CACHE_DIR, 'scene_alts');
      fs.mkdirSync(aiCacheDir, { recursive: true });
      const aiFile = `ai_${crypto.createHash('sha1').update(`${query}_${width}_${height}_${Date.now()}`).digest('hex').slice(0, 10)}.jpg`;
      const aiPath = path.join(aiCacheDir, aiFile);
      const aiPrompt = `${searchTerms[0] ?? query}, photorealistic cinematic 8k, no text`;
      const aiOk = await fetchPollinationsSceneImage({
        prompt: aiPrompt,
        width,
        height,
        outPath: aiPath,
        seed: Math.floor(Math.random() * 99999),
      });
      if (aiOk) {
        candidates.unshift({
          index: 0,
          sentence: '',
          prompt: aiPrompt,
          kind: 'image',
          previewUrl: `/files/cache/scene_alts/${aiFile}`,
          thumbUrl: `/files/cache/scene_alts/${aiFile}`,
          sourceLabel: 'Ảnh AI Pollinations',
        });
      }

      res.json({ candidates });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không tìm được cảnh thay thế.',
      });
    }
  });

  // 3c. Generate a single replacement AI scene image for a prompt
  app.post('/api/scenes/ai-image', async (req, res) => {
    const prompt = String(req.body?.prompt ?? '').trim() || 'cinematic nature landscape';
    const aspectRatio = (req.body?.aspectRatio ?? '9:16') as VideoAspectRatio;
    const videoQuality = (req.body?.videoQuality ?? '720p') as VideoQuality;
    const { width, height } = getCanvasDimensions(aspectRatio, videoQuality);

    let cleanEn = prompt;
    if (!/^[a-zA-Z0-9\s,.-]{2,}$/.test(prompt)) {
      const translated = await translateToEn(prompt);
      cleanEn = translated || extractEnglishSearchTerms(prompt, '')[0] || 'cinematic nature scene';
    }

    const aiCacheDir = path.join(CACHE_DIR, 'scene_alts');
    fs.mkdirSync(aiCacheDir, { recursive: true });
    const aiFile = `ai_${Date.now()}_${Math.floor(Math.random() * 999)}.jpg`;
    const aiPath = path.join(aiCacheDir, aiFile);
    const ok = await fetchPollinationsSceneImage({
      prompt: `${cleanEn}, photorealistic cinematic lighting 8k, no text`,
      width,
      height,
      outPath: aiPath,
      seed: Math.floor(Math.random() * 99999),
    });

    if (!ok) {
      res.status(502).json({ error: 'Không tạo được ảnh AI lúc này, thử lại hoặc tải ảnh từ máy.' });
      return;
    }

    res.json({
      scene: {
        index: 0,
        sentence: '',
        prompt: cleanEn,
        kind: 'image',
        previewUrl: `/files/cache/scene_alts/${aiFile}`,
        thumbUrl: `/files/cache/scene_alts/${aiFile}`,
        sourceLabel: 'Ảnh AI Pollinations',
      } satisfies ScenePreviewItem,
    });
  });

  // 4. TTS Preview endpoint (supports both single-voice and dual-voice bilingual sample!)
  app.post('/api/tts-preview', async (req, res) => {
    const rawText =
      String(req.body?.text ?? '').trim() ||
      'Xin chào, đây là bản nghe thử giọng đọc miễn phí của MoneyPrinterTurbo Việt Nam.';
    const rawScript = String(req.body?.script ?? '').trim();
    const language = (req.body?.language ?? 'vi') as LanguageCode;
    const scriptStyle = (req.body?.scriptStyle ?? 'curious_facts') as ScriptStyle;
    const voiceId = (req.body?.voiceId ?? 'vi-VN-HoaiMyNeural') as VoiceOptionId;
    const secondaryVoiceId = (req.body?.secondaryVoiceId ??
      getDefaultSecondaryVoiceForLanguage(language)) as VoiceOptionId;
    const dualVoiceEnabled = Boolean(req.body?.dualVoiceEnabled) || isBilingualLanguage(language);
    const pauseBetweenLinesSec = Number(req.body?.pauseBetweenLinesSec ?? 0);
    const ttsProvider = (req.body?.ttsProvider ?? 'google_free') as TtsProvider;
    const voiceRate = Number(req.body?.voiceRate ?? 1.0);

    const filename = `preview_${Date.now()}.mp3`;
    const outPath = path.join(OUTPUTS_DIR, filename);

    try {
      if (dualVoiceEnabled && rawScript) {
        const planned = planNarrationSegments({
          script: rawScript,
          language,
          scriptStyle,
          voiceId,
          dualVoiceEnabled,
          secondaryVoiceId,
          pauseBetweenLinesSec,
        });

        // Pick first primary + first secondary (or first 2 segments) so user hears both voices!
        const sampleSegs = planned.slice(0, 2);
        const firstSecondaryIdx = planned.findIndex((s) => s.voiceSlot === 'secondary');
        if (firstSecondaryIdx >= 2 && planned[0]) {
          sampleSegs[1] = planned[firstSecondaryIdx];
        }

        if (sampleSegs.length >= 2) {
          const previewWorkDir = path.join(CACHE_DIR, `preview_mix_${Date.now()}`);
          fs.mkdirSync(previewWorkDir, { recursive: true });
          const parts: string[] = [];
          let lastResult: {
            engineUsed: string;
            recoveredFromEdgeError: boolean;
            fallbackNote?: string;
          } = {
            engineUsed: 'Google TTS Miễn phí',
            recoveredFromEdgeError: false,
          };

          for (let i = 0; i < sampleSegs.length; i++) {
            const seg = sampleSegs[i];
            const segPath = path.join(previewWorkDir, `p_${i}.mp3`);
            lastResult = await synthesizeChunkWithFallback({
              text: seg.text,
              voiceId: seg.voiceId,
              ttsProvider,
              voiceRate,
              outPath: segPath,
            });
            parts.push(segPath);
            if (i === 0 && seg.pauseAfterSec > 0) {
              const pGap = path.join(previewWorkDir, 'gap.mp3');
              await createSilenceMp3(Math.min(1.5, seg.pauseAfterSec), pGap);
              parts.push(pGap);
            }
          }

          const listFile = path.join(previewWorkDir, 'list.txt');
          fs.writeFileSync(
            listFile,
            parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
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
              listFile,
              '-ar',
              '24000',
              '-ac',
              '1',
              '-c:a',
              'libmp3lame',
              '-b:a',
              '96k',
              outPath,
            ],
            20000
          );
          fs.rmSync(previewWorkDir, { recursive: true, force: true });

          const durationSec = await probeDurationSec(outPath);
          const voicesUsed = Array.from(new Set(sampleSegs.map((s) => s.voiceId)));
          res.json({
            audioUrl: `/files/outputs/${filename}`,
            engineUsed: `${lastResult.engineUsed} (${voicesUsed.join(' + ')})`,
            recoveredFromEdgeError: lastResult.recoveredFromEdgeError,
            fallbackNote: lastResult.fallbackNote,
            voicesUsed,
            durationSec,
          });
          return;
        }
      }

      const cleanSingle = stripNarrationTags(rawText);
      const previewChunk = splitScriptSentences(cleanSingle, 160)[0] ?? cleanSingle.slice(0, 160);
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
        fallbackNote: result.fallbackNote,
        voicesUsed: [voiceId],
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

  // Never let unknown /api/* requests fall through to Vite/SPA HTML fallback
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Đường dẫn API không tồn tại.' });
  });

  // Global JSON error handler for Multer / JSON body parse / unexpected route errors
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const msg = err instanceof Error ? err.message : 'Lỗi xử lý yêu cầu trên máy chủ.';
    if (req.path.startsWith('/api') || req.path.startsWith('/files')) {
      res.status(400).json({ error: msg });
      return;
    }
    next(err);
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
