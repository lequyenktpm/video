import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeScriptLinePresentation,
  buildAssFromCues,
  buildCountdownCues,
  buildDualSubtitleCues,
  buildMediaClipsPlan,
  buildMoneyPrinterPrompt,
  buildScenePromptsFromScript,
  buildSmartVietnameseScriptFromFacts,
  buildSrtFromCues,
  computeVisualMatchScore,
  detectLineContextVisual,
  detectLineLanguage,
  doesVoiceMatchLanguage,
  extractEnglishSearchTerms,
  extractInlineEmotionTag,
  formatVoiceOptionLabel,
  generateOfflineVietnameseScript,
  getCanvasDimensions,
  getDefaultSecondaryVoiceForLanguage,
  getDefaultVoiceForLanguage,
  getNeutralBgThemeMeta,
  getPresetsForLanguage,
  getQualityEncodingParams,
  getScriptLengthSummary,
  getSubtitleWrapBudget,
  getVoiceCatalogItem,
  hasVietnameseDiacritics,
  hexToAssBgr,
  isBilingualLanguage,
  isElevenLabsVoiceId,
  isKnownPresetSubject,
  isOutroTag,
  isTitleOrIntroTag,
  NEUTRAL_BG_THEMES,
  normalizeOutputSubdir,
  parseAiWebOrJsonOutput,
  pickStudyEnergyEmoji,
  planNarrationSegments,
  planXfadeMergeBatches,
  RANDOM_XFADE_POOL,
  resolveCountdownCenterY,
  resolveSmooth2411XfadeTransition,
  resolveXfadeTransition,
  safeParseJsonResponse,
  sanitizeSceneComponentsList,
  slugifyOutputFilename,
  SMOOTH_2411_XFADE_POOL,
  splitCueIntoShortSubCues,
  splitScriptSentences,
  splitTtsTextChunks,
  stripNarrationTags,
  tokenizeSubtitleForEffect,
  updateScriptLinePreservingTag,
  validateRenderConfig,
  VOICE_CATALOG,
  wrapSubtitleLine,
  RawSegmentTiming,
} from './mptEngine';
import {
  build2411CardSpecForLine,
  build2411CardSvg,
  buildContextualSceneComponentsForScript,
  isGenericSpeakerLabel,
  resolveStudio2411AnimationIn,
  STUDIO_2411_ANIMATION_OPTIONS,
  STUDIO_2411_THEMES,
  STUDIO_2411_VARIANT_OPTIONS,
  wrapSvgCardLines,
} from './studioComponents2411';
import {
  buildCuratedBackgroundSvg,
  CURATED_BACKGROUNDS,
  detectCuratedCategoryFromTopic,
  selectCuratedBackgroundsForConfig,
} from './curatedBackgrounds';
import { RenderJobConfig, Studio2411AnimationIn, SubtitleConfig } from './types';

test('getCanvasDimensions and getQualityEncodingParams support 480p, 720p, and 1080p', () => {
  assert.deepEqual(getCanvasDimensions('9:16'), { width: 720, height: 1280 });
  assert.deepEqual(getCanvasDimensions('16:9'), { width: 1280, height: 720 });
  assert.deepEqual(getCanvasDimensions('1:1'), { width: 720, height: 720 });
  assert.deepEqual(getCanvasDimensions('9:16', '480p'), { width: 480, height: 854 });
  assert.deepEqual(getCanvasDimensions('9:16', '1080p'), { width: 1080, height: 1920 });
  assert.equal(getQualityEncodingParams('480p').crf, '22');
  assert.equal(getQualityEncodingParams('720p').crf, '20');
  assert.equal(getQualityEncodingParams('1080p').crf, '18');
});

test('splitScriptSentences splits Vietnamese and Japanese narration cleanly under maxLen', () => {
  const text =
    'Bạn có biết đại dương sâu thẳm chứa rất nhiều bí ẩn? Hãy cùng khám phá ngay bây giờ, từng lớp nước xanh thẳm sẽ hé lộ những sinh vật phát sáng kỳ diệu chưa từng thấy.';
  const chunks = splitScriptSentences(text, 90);
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 90, `Chunk exceeded 90 chars: ${chunk}`);
  }

  const jaText = '富士山は日本で最も高い山です。春には美しい桜が咲き誇ります！';
  const jaChunks = splitScriptSentences(jaText, 72);
  assert.equal(jaChunks.length, 2);
});

test('splitCueIntoShortSubCues and wrapSubtitleLine handle Latin and Japanese CJK without spaces', () => {
  const rawCues = [
    {
      index: 1,
      startSec: 0,
      endSec: 6.0,
      text: 'Hơn tám mươi phần trăm đại dương sâu thẳm trên Trái Đất vẫn chưa từng được con người đặt chân tới.',
    },
  ];
  const shortCues = splitCueIntoShortSubCues(rawCues, 42);
  assert.ok(shortCues.length >= 2);
  assert.equal(shortCues[0].startSec, 0);
  assert.equal(shortCues[shortCues.length - 1].endSec, 6.0);
  for (let i = 0; i < shortCues.length - 1; i++) {
    assert.ok(Math.abs(shortCues[i].endSec - shortCues[i + 1].startSec) < 0.001);
  }

  const jaCue = [
    {
      index: 1,
      startSec: 0,
      endSec: 4.0,
      text: '深海の暗い世界では、自ら光を放つ不思議な生き物たちが静かに暮らしています。',
    },
  ];
  const jaShort = splitCueIntoShortSubCues(jaCue, 38);
  assert.ok(jaShort.length >= 2);
  assert.equal(jaShort[jaShort.length - 1].endSec, 4.0);

  const wrappedJa = wrapSubtitleLine('これはとても長い日本語の字幕テスト文章です', 14);
  assert.ok(wrappedJa.includes('\n'));
});

test('hexToAssBgr converts RGB hex colors to ASS BBGGRR format', () => {
  assert.equal(hexToAssBgr('#FACC15'), '&H0015CCFA');
  assert.equal(hexToAssBgr('#FFFFFF'), '&H00FFFFFF');
  assert.equal(hexToAssBgr('invalid'), '&H00FFFFFF');
});

test('buildAssFromCues supports karaoke, pop_zoom, fade_slide, typewriter, Secondary style, and Japanese fonts', () => {
  const cues = [
    { index: 1, startSec: 0, endSec: 3.5, text: 'Khám phá đại dương xanh thẳm', voiceSlot: 'primary' as const },
    { index: 2, startSec: 3.5, endSec: 7.2, text: 'Watch out for her!', voiceSlot: 'secondary' as const },
  ];

  const srt = buildSrtFromCues(cues);
  assert.ok(srt.includes('00:00:00,000 --> 00:00:03,500'));

  const baseSub: SubtitleConfig = {
    enabled: true,
    fontName: 'DejaVu Sans',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 42,
    textColor: '#FFFFFF',
    highlightColor: '#FACC15',
    strokeColor: '#000000',
    strokeWidth: 2.2,
    boxStyle: 'outline',
    effect: 'karaoke',
  };

  const assKaraoke = buildAssFromCues(cues, baseSub, 720, 1280);
  assert.ok(assKaraoke.includes('PlayResX: 720'));
  assert.ok(assKaraoke.includes('&H0015CCFA,&H00FFFFFF'));
  assert.ok(assKaraoke.includes('Style: Secondary,'));
  assert.ok(assKaraoke.includes(',Secondary,'));
  assert.ok(assKaraoke.includes('{\\kf'));

  const assPop = buildAssFromCues(cues, { ...baseSub, effect: 'pop_zoom' }, 720, 1280);
  assert.ok(assPop.includes('\\fscx58\\fscy58\\t('));

  const assSlide = buildAssFromCues(cues, { ...baseSub, effect: 'fade_slide' }, 720, 1280);
  assert.ok(assSlide.includes('\\move(') && assSlide.includes('\\fad(220,150)'));

  const assTypewriter = buildAssFromCues(cues, { ...baseSub, effect: 'typewriter' }, 720, 1280);
  assert.ok(assTypewriter.includes('\\alpha&HFF&\\t('));

  const assJa = buildAssFromCues(
    [{ index: 1, startSec: 0, endSec: 3, text: '東京の夜景はとても美しいです' }],
    { ...baseSub, fontName: 'Noto Sans' },
    720,
    1280
  );
  assert.ok(assJa.includes('Style: Default,Noto Sans,'));
  assert.ok(tokenizeSubtitleForEffect('東京の夜景').length >= 2);
});

test('buildMoneyPrinterPrompt and parseAiWebOrJsonOutput parse JSON, subject, and plain AI Web text', () => {
  const prompt = buildMoneyPrinterPrompt({
    subject: 'Bí ẩn rãnh Mariana',
    language: 'ja',
    scriptStyle: 'curious_facts',
    sentenceCount: 12,
  });
  assert.ok(prompt.includes('12 dòng'));
  assert.ok(prompt.includes('日本語'));

  const allInOnePrompt = buildMoneyPrinterPrompt({
    subject: '',
    language: 'ja',
    scriptStyle: 'curious_facts',
    sentenceCount: 6,
    mode: 'all_in_one',
  });
  assert.ok(allInOnePrompt.includes('All-in-One'));
  assert.ok(allInOnePrompt.includes('"subject"'));
  assert.ok(allInOnePrompt.includes('100%自然な日本語'));

  const parsedJson = parseAiWebOrJsonOutput(
    '```json\n{"subject":"深海の光の謎","script":"深海には不思議な生き物がいます。\\n自ら光を放つ魚もいます。","terms":["deep sea jellyfish"],"mediaSearchQueries":["bioluminescent jellyfish deep ocean","deep sea anglerfish dark water"]}\n```',
    'Chủ đề cũ'
  );
  assert.equal(parsedJson?.subject, '深海の光の謎');
  assert.equal(parsedJson?.script, '深海には不思議な生き物がいます。\n自ら光を放つ魚もいます。');
  assert.deepEqual(parsedJson?.terms, ['deep sea jellyfish']);
  assert.equal(parsedJson?.scenePrompts.length, 2);

  const parsedArray = parseAiWebOrJsonOutput(
    '{"script":["Dòng 1 từ AI.","Dòng 2 từ AI."],"terms":["pyramids"]}',
    'Kim tự tháp'
  );
  assert.equal(parsedArray?.script, 'Dòng 1 từ AI.\nDòng 2 từ AI.');

  const parsedPlain = parseAiWebOrJsonOutput('1. Dòng đầu tiên rất hay.\n2. Dòng thứ hai về đại dương.', 'Đại dương');
  assert.ok(parsedPlain?.script.includes('Dòng đầu tiên rất hay.'));
  assert.ok((parsedPlain?.scenePrompts.length ?? 0) >= 2);
});

test('language presets avoid Vietnamese bleed in Japanese and English presets', () => {
  const jaPresets = getPresetsForLanguage('ja');
  const enPresets = getPresetsForLanguage('en');
  assert.ok(jaPresets.length >= 3);
  assert.ok(enPresets.length >= 3);
  for (const p of jaPresets) {
    assert.equal(hasVietnameseDiacritics(p), false);
    assert.equal(isKnownPresetSubject(p), true);
  }
  for (const p of enPresets) {
    assert.equal(hasVietnameseDiacritics(p), false);
    assert.equal(isKnownPresetSubject(p), true);
  }
  assert.equal(isKnownPresetSubject('Chủ đề hoàn toàn riêng của tôi'), false);
});

test('flexible sentence counts (2..25) and Japanese/English/Vietnamese generation work properly', () => {
  const shortVi = generateOfflineVietnameseScript('Đại dương', 'vi', 2);
  assert.equal(shortVi.script.split('\n').length, 2);

  const longVi = generateOfflineVietnameseScript('Đại dương', 'vi', 14);
  assert.equal(longVi.script.split('\n').length, 14);
  assert.equal(longVi.scenePrompts.length, 14);

  const jaScript = generateOfflineVietnameseScript('富士山', 'ja', 8);
  assert.equal(jaScript.script.split('\n').length, 8);
  assert.ok(jaScript.script.includes('富士山'));

  const summary = getScriptLengthSummary(14);
  assert.equal(summary.tierLabel, 'Dài');
  assert.ok(summary.estSec > 60);

  assert.equal(getDefaultVoiceForLanguage('ja'), 'ja-JP-NanamiNeural');
  assert.equal(doesVoiceMatchLanguage('ja-JP-KeitaNeural', 'ja'), true);
  assert.equal(doesVoiceMatchLanguage('vi-VN-HoaiMyNeural', 'ja'), false);
  assert.equal(isBilingualLanguage('vi_ja'), true);
  assert.equal(isBilingualLanguage('ja_en'), true);
  assert.equal(getDefaultSecondaryVoiceForLanguage('vi_ja'), 'ja-JP-NanamiNeural');
  assert.equal(getDefaultSecondaryVoiceForLanguage('ja_en'), 'en-US-JennyNeural');
});

test('detectLineLanguage, stripNarrationTags, and planNarrationSegments handle dual-voice bilingual & dialogue scripts', () => {
  assert.equal(detectLineLanguage('Hãy cẩn thận với cô ấy!', 'vi'), 'vi');
  assert.equal(detectLineLanguage('Watch out for her!', 'vi'), 'en');
  assert.equal(detectLineLanguage('彼女には気をつけて！', 'vi'), 'ja');

  assert.equal(
    stripNarrationTags('[VI] Câu hỏi nhanh trong 3 giây! [PAUSE]'),
    'Câu hỏi nhanh trong 3 giây!'
  );
  assert.equal(stripNarrationTags('[V2] Watch out for her!'), 'Watch out for her!');

  const challengeSegs = planNarrationSegments({
    script: '[VI] Hãy cẩn thận với cô ấy! [PAUSE]\n[EN] Watch out for her!\nお疲れ様でした！',
    language: 'bilingual',
    scriptStyle: 'language_challenge',
    voiceId: 'vi-VN-HoaiMyNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 1.2,
  });
  assert.equal(challengeSegs.length, 3);
  assert.equal(challengeSegs[0].voiceId, 'vi-VN-HoaiMyNeural');
  assert.equal(challengeSegs[0].voiceSlot, 'primary');
  assert.ok(challengeSegs[0].pauseAfterSec >= 1.2);
  assert.equal(challengeSegs[1].voiceId, 'en-US-JennyNeural');
  assert.equal(challengeSegs[1].voiceSlot, 'secondary');
  assert.equal(challengeSegs[2].voiceId, 'ja-JP-NanamiNeural');
  assert.equal(challengeSegs[2].detectedLang, 'ja');

  const untaggedJaEn = planNarrationSegments({
    script: '彼女には気をつけて！\nWatch out for her!',
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 1.0,
  });
  assert.equal(untaggedJaEn[0].voiceId, 'ja-JP-NanamiNeural');
  assert.equal(untaggedJaEn[0].pauseAfterSec, 1.0);
  assert.equal(untaggedJaEn[1].voiceId, 'en-US-JennyNeural');

  const dialogueSameLang = planNarrationSegments({
    script: 'Bạn có nghe tin hôm nay chưa?\nCó rồi, thật bất ngờ đúng không!',
    language: 'vi',
    scriptStyle: 'bilingual_dialogue',
    voiceId: 'vi-VN-HoaiMyNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'vi-VN-NamMinhNeural',
    pauseBetweenLinesSec: 0,
  });
  assert.equal(dialogueSameLang[0].voiceId, 'vi-VN-HoaiMyNeural');
  assert.equal(dialogueSameLang[1].voiceId, 'vi-VN-NamMinhNeural');
  assert.equal(dialogueSameLang[1].voiceSlot, 'secondary');
});

test('generateOfflineVietnameseScript generates bilingual language_challenge scripts with source-only 5s drill Intro, [PAUSE] Q&A, and source-only Outro', () => {
  const viEn = generateOfflineVietnameseScript('Phản xạ tiếng Anh', 'bilingual', 6, undefined, 'language_challenge');
  const viEnLines = viEn.script.split('\n');
  assert.equal(viEnLines.length, 6);
  assert.ok(viEnLines[0].includes('5 giây'));
  assert.equal(viEnLines[0].includes('[EN]') || viEnLines[0].includes('English:'), false);
  assert.ok(viEn.script.includes('[PAUSE]'));
  assert.ok(viEn.script.includes('English:') || viEn.script.includes('[EN]'));
  assert.ok(viEnLines[viEnLines.length - 1].startsWith('Outro:'));
  assert.ok(viEnLines[viEnLines.length - 1].includes('Lưu video'));

  const viJa = generateOfflineVietnameseScript('Tiếng Nhật giao tiếp', 'vi_ja', 6, undefined, 'language_challenge');
  const viJaLines = viJa.script.split('\n');
  assert.equal(viJaLines.length, 6);
  assert.ok(viJaLines[0].includes('5 giây'));
  assert.equal(viJaLines[0].includes('[JA]'), false);
  assert.ok(viJa.script.includes('[JA]'));
  assert.ok(viJaLines[viJaLines.length - 1].startsWith('Outro:'));
  assert.ok(viJaLines[viJaLines.length - 1].includes('Lưu video'));

  const jaEn = generateOfflineVietnameseScript('瞬間英作文', 'ja_en', 6, undefined, 'language_challenge');
  const jaEnLines = jaEn.script.split('\n');
  assert.equal(jaEnLines.length, 6);
  assert.ok(jaEnLines[0].includes('5秒'));
  assert.equal(jaEnLines[0].includes('English:') || jaEnLines[0].includes('[EN]'), false);
  assert.ok(jaEn.script.includes('English:') || jaEn.script.includes('[EN]'));
  assert.ok(jaEnLines[jaEnLines.length - 1].startsWith('Outro:'));
  assert.ok(jaEnLines[jaEnLines.length - 1].includes('保存'));

  const shortPlain = parseAiWebOrJsonOutput('Hi\nHello', 'Greeting');
  assert.equal(shortPlain?.script, 'Hi\nHello');
});

test('extractEnglishSearchTerms avoids false substring matches and builds scene prompts', () => {
  const pyramidTerms = extractEnglishSearchTerms('Tại sao các kim tự tháp Ai Cập cổ đại lại bền vững?', '');
  assert.ok(pyramidTerms.some((t) => t.includes('pyramids')));
  assert.ok(!pyramidTerms.some((t) => t.includes('nebula') || t.includes('jellyfish')));

  const smart = buildSmartVietnameseScriptFromFacts({
    subject: 'Kim tự tháp Ai Cập',
    language: 'vi',
    scriptStyle: 'curious_facts',
    sentenceCount: 4,
    wikiTitle: 'Kim tự tháp Ai Cập',
    wikiSentences: [
      'Có tất cả 138 kim tự tháp đã được khám phá ở Ai Cập tính đến gần đây.',
      'Kim tự tháp Djoser là lâu đời nhất, được xây dựng vào khoảng năm 2630 trước công nguyên.',
    ],
    englishTerms: ['Egyptian pyramids', 'Giza desert'],
  });
  assert.ok(smart.script.includes('138 kim tự tháp'));
  assert.equal(smart.scenePrompts.length, 4);

  const terms = extractEnglishSearchTerms('Bí ẩn rãnh Mariana và sứa phát sáng', '');
  assert.ok(terms.some((t) => t.includes('mariana') || t.includes('bioluminescent')));
  const scenes = buildScenePromptsFromScript(['Câu 1 về rãnh Mariana.', 'Câu 2 về sứa phát sáng.'], 'Đại dương', terms);
  assert.equal(scenes.length, 2);
  assert.ok(scenes[0].includes('no text'));
});

test('generateOfflineVietnameseScript and buildMediaClipsPlan produce valid outputs', () => {
  const generated = generateOfflineVietnameseScript('Thói quen buổi sáng', 'vi', 4);
  assert.ok(generated.script.includes('15 phút'));
  assert.equal(generated.scenePrompts.length, 4);

  const plan = buildMediaClipsPlan(3, 18, 5, 'random', 123);
  assert.equal(plan.length, 4);
});

test('validateRenderConfig rejects empty script and accepts valid config', () => {
  const validConfig: RenderJobConfig = {
    subject: 'Đại dương',
    language: 'vi',
    scriptStyle: 'curious_facts',
    sentenceCount: 4,
    llmProvider: 'pollinations',
    script: 'Xin chào mọi người.',
    terms: ['ocean waves'],
    scenePrompts: ['ocean waves sunset'],
    materialSource: 'hybrid_real',
    selectedMediaIds: [],
    aspectRatio: '9:16',
    concatMode: 'sequential',
    transitionMode: 'fade',
    clipDurationSec: 5,
    ttsProvider: 'google_free',
    voiceId: 'vi-VN-HoaiMyNeural',
    voiceRate: 1.0,
    voiceVolume: 1.0,
    bgmPreset: 'lofi_chill',
    bgmVolume: 0.2,
    subtitle: {
      enabled: true,
      fontName: 'DejaVu Sans',
      position: 'bottom',
      customPositionPct: 80,
      fontSize: 48,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 3,
      boxStyle: 'dark_box',
      effect: 'karaoke',
    },
  };

  assert.equal(validateRenderConfig(validConfig), null);
  assert.ok(validateRenderConfig({ ...validConfig, script: '   ' }) !== null);
});

test('getSubtitleWrapBudget and buildAssFromCues scale font size and safe margins across 480p, 720p, and 1080p', () => {
  const sub: SubtitleConfig = {
    enabled: true,
    fontName: 'Noto Sans',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 38,
    textColor: '#FFFFFF',
    highlightColor: '#FACC15',
    strokeColor: '#000000',
    strokeWidth: 2.0,
    boxStyle: 'outline',
    effect: 'karaoke',
  };

  const b480 = getSubtitleWrapBudget(sub, 480, 854, false);
  const b720 = getSubtitleWrapBudget(sub, 720, 1280, false);
  const b1080 = getSubtitleWrapBudget(sub, 1080, 1920, false);

  assert.equal(b480.scaledFontSize, 25);
  assert.equal(b720.scaledFontSize, 38);
  assert.equal(b1080.scaledFontSize, 57);
  assert.ok(b480.marginH >= 38);
  assert.ok(b480.maxCharsPerLine >= 12 && b480.maxCharsPerLine <= 44);

  const ass480 = buildAssFromCues(
    [{ index: 1, startSec: 0, endSec: 3, text: 'Đây là dòng phụ đề thử nghiệm không tràn khung hình' }],
    sub,
    480,
    854
  );
  assert.ok(ass480.includes('Style: Default,Noto Sans,25,'));
  assert.ok(ass480.includes(',38,38,115,1'));

  const unbroken = wrapSubtitleLine('Superlongwordwithoutanyspacesanywhere123456', 14);
  assert.ok(unbroken.includes('\n'));
});

test('safeParseJsonResponse throws friendly error instead of JSON syntax crash on HTML responses', async () => {
  const htmlRes = new Response('<!doctype html><html><body>502 Bad Gateway</body></html>', {
    status: 502,
    headers: { 'Content-Type': 'text/html' },
  });
  await assert.rejects(
    () => safeParseJsonResponse(htmlRes, 'Lỗi mặc định'),
    /phản hồi HTML \(HTTP 502\)/
  );

  const okRes = new Response(JSON.stringify({ ok: true, count: 3 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  const parsed = await safeParseJsonResponse<{ ok: boolean; count: number }>(okRes);
  assert.deepEqual(parsed, { ok: true, count: 3 });
});

test('buildMoneyPrinterPrompt embeds verifiedFacts and non-fabrication rule', () => {
  const prompt = buildMoneyPrinterPrompt({
    subject: 'Đại kim tự tháp Giza',
    language: 'vi',
    scriptStyle: 'curious_facts',
    sentenceCount: 4,
    verifiedFacts: ['Đại kim tự tháp Giza cao ban đầu 146,6 mét và được xây dựng vào khoảng năm 2560 TCN.'],
  });
  assert.ok(prompt.includes('NGUYÊN TẮC SỰ THẬT'));
  assert.ok(prompt.includes('146,6 mét'));
});

test('buildCountdownCues, splitCueIntoShortSubCues, and 5s smart learning pacing work together', () => {
  const segs = planNarrationSegments({
    script: [
      '[VI] Chào mừng các bạn đến với thử thách 5 giây!',
      '[VI] Câu 1: "Hãy cẩn thận với cô ấy!" nói tiếng Anh sao? [PAUSE]',
      '[EN] Watch out for her!',
      '[VI] Lưu video lại nhé!',
    ].join('\n'),
    language: 'bilingual',
    scriptStyle: 'language_challenge',
    voiceId: 'vi-VN-HoaiMyNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 5,
  });

  assert.equal(segs.length, 4);
  assert.ok(segs[0].pauseAfterSec < 1, 'Intro should have brief natural pause');
  assert.equal(segs[1].pauseAfterSec, 5, 'Question with [PAUSE] should wait 5s');
  assert.ok(segs[2].pauseAfterSec < 1, 'Answer should not wait 5s');
  assert.equal(segs[3].pauseAfterSec, 0, 'Outro has no trailing pause');

  const countdown = buildCountdownCues(10, 5, 20);
  assert.equal(countdown.length, 5);
  assert.deepEqual(
    countdown.map((c) => c.text),
    ['5', '4', '3', '2', '1']
  );
  assert.equal(countdown[0].startSec, 10);
  assert.equal(countdown[4].endSec, 15);
  assert.equal(countdown[0].isCountdown, true);

  const preserved = splitCueIntoShortSubCues(
    [
      { index: 1, startSec: 0, endSec: 4.5, text: 'Watch out for her right now in the busy street', voiceSlot: 'secondary' },
      ...countdown,
    ],
    22
  );
  const secondaryChunks = preserved.filter((c) => !c.isCountdown);
  const cdChunks = preserved.filter((c) => c.isCountdown);
  assert.ok(secondaryChunks.length >= 2);
  assert.ok(secondaryChunks.every((c) => c.voiceSlot === 'secondary'));
  assert.equal(cdChunks.length, 5);
  assert.deepEqual(
    cdChunks.map((c) => c.text),
    ['5', '4', '3', '2', '1']
  );

  const ass = buildAssFromCues(
    preserved,
    {
      enabled: true,
      fontName: 'Noto Sans',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 38,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 2,
      boxStyle: 'outline',
      effect: 'karaoke',
    },
    720,
    1280
  );
  assert.ok(ass.includes('Style: Countdown,Noto Sans,'));
  assert.ok(ass.includes('Dialogue: 1,0:00:10.00,0:00:11.00,CountdownMeta,,0,0,0,,'));
  assert.ok(ass.includes('Dialogue: 2,0:00:10.00,0:00:11.00,Countdown,,0,0,0,,'));
  assert.ok(ass.includes('5'));
});

test('planNarrationSegments supports Q&A multi-sentence interview scripts with target repeat, full answer recap, and ending summary', () => {
  const interviewScript = [
    'Q: あなたの長所と短所を教えてください。',
    'English: Please tell me your strengths and weaknesses.',
    '',
    'A: 私の長所は積極性です。',
    'English: My strength is my proactive nature.',
    '学生時代、スピーチ大会やサークルの成果発表会にも積極的に参加しました。',
    'English: During my student days, I actively participated in speech contests and club presentation events.',
    '短所は周りの人にも積極性を求めるところです。',
    'English: My weakness is that I also demand proactiveness from those around me.',
    'ですから、サークルでは、先に相手の都合や希望を聞いて調整するように気をつけていました。',
    'English: Therefore, in my club, I was careful to first ask about the other person\'s circumstances and wishes, and then adjust accordingly.',
  ].join('\n');

  assert.equal(stripNarrationTags('Q: あなたの長所と短所を教えてください。'), 'あなたの長所と短所を教えてください。');
  assert.equal(stripNarrationTags('English: Please tell me your strengths and weaknesses.'), 'Please tell me your strengths and weaknesses.');

  const segs = planNarrationSegments({
    subject: 'Phỏng vấn điểm mạnh điểm yếu Nhật - Anh',
    script: interviewScript,
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 5,
    targetRepeatCount: 1,
    targetRepeatPauseSec: 2,
    fullAnswerRecapMode: 'target_full',
    summarizeAtEnd: true,
  });

  // Every English translation line should be read twice (1 initial + 1 repeat) with a 2s repeat pause
  const firstEnHits = segs.filter(
    (s) => s.segmentKind === 'speech' && s.text === 'Please tell me your strengths and weaknesses.'
  );
  assert.equal(firstEnHits.length, 2);
  assert.equal(firstEnHits[0].pauseAfterSec, 2);
  assert.equal(firstEnHits[0].pauseKind, 'repeat');
  assert.equal(firstEnHits[0].voiceId, 'en-US-JennyNeural');

  // Full answer recap should contain all 4 English answer sentences joined together
  const recapSegs = segs.filter((s) => s.segmentKind === 'recap');
  assert.ok(recapSegs.length >= 2);
  const recapJoined = recapSegs.map((s) => s.text).join(' ');
  assert.ok(recapJoined.includes('My strength is my proactive nature.'));
  assert.ok(recapJoined.includes('During my student days'));
  assert.ok(recapJoined.includes('My weakness is'));
  assert.ok(recapJoined.includes('Therefore, in my club'));

  // Ending summary should be appended
  const summarySegs = segs.filter((s) => s.segmentKind === 'summary');
  assert.ok(summarySegs.length >= 1);
  assert.ok(summarySegs[0].text.includes('今日のまとめ'));
});

test('planNarrationSegments supports 2x target repeats and knowledge ending summary', () => {
  const segs = planNarrationSegments({
    subject: 'Bí ẩn đại dương',
    script: [
      'Hơn 80% đại dương vẫn chưa được khám phá.',
      'Nhiều loài sứa biển có khả năng tự phát sáng trong bóng tối.',
      'Theo dõi kênh để khám phá thêm nhé!',
    ].join('\n'),
    language: 'vi',
    scriptStyle: 'curious_facts',
    voiceId: 'vi-VN-HoaiMyNeural',
    pauseBetweenLinesSec: 0,
    summarizeAtEnd: true,
  });

  const summaryIdx = segs.findIndex((s) => s.segmentKind === 'summary');
  assert.ok(summaryIdx > 0);
  assert.ok(summaryIdx < segs.length - 1, 'Summary should appear right before the outro CTA');
  assert.ok(segs[summaryIdx].text.includes('Tóm tắt kiến thức hôm nay'));

  const doubleRepeat = planNarrationSegments({
    script: '[VI] Xin chào! [PAUSE]\n[EN] Hello there!',
    language: 'bilingual',
    scriptStyle: 'language_challenge',
    voiceId: 'vi-VN-HoaiMyNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 3,
    targetRepeatCount: 2,
    targetRepeatPauseSec: 2.5,
  });
  const enReads = doubleRepeat.filter((s) => s.text === 'Hello there!');
  assert.equal(enReads.length, 3);
  assert.equal(enReads[0].pauseAfterSec, 2.5);
  assert.equal(enReads[1].pauseAfterSec, 2.5);
  assert.equal(enReads[0].pauseKind, 'repeat');
});

test('resolveXfadeTransition, slugifyOutputFilename, and normalizeOutputSubdir work cleanly', () => {
  assert.equal(resolveXfadeTransition('none', 0), 'none');
  assert.equal(resolveXfadeTransition('slide', 0), 'slideleft');
  assert.equal(resolveXfadeTransition('circleopen', 0), 'circleopen');
  const r0 = resolveXfadeTransition('random', 0, 100);
  const r1 = resolveXfadeTransition('random', 1, 100);
  assert.ok((RANDOM_XFADE_POOL as readonly string[]).includes(r0));
  assert.ok((RANDOM_XFADE_POOL as readonly string[]).includes(r1));
  assert.notEqual(r0, r1);

  const oceanName = slugifyOutputFilename('Bí ẩn đại dương sâu thẳm chưa từng được giải mã');
  assert.equal(oceanName.includes('_'), false);
  assert.ok(oceanName.startsWith('🌊 '));
  assert.ok(oceanName.includes('Bí ẩn đại dương'));

  const challengeName = slugifyOutputFilename('Phản xạ 5s: "Hãy cẩn thận với cô ấy!"');
  assert.equal(challengeName.includes('_'), false);
  assert.ok(challengeName.startsWith('⚡ '));
  assert.ok(challengeName.includes('Phản xạ 5s Hãy cẩn thận với cô ấy'));

  const emptyFallback = slugifyOutputFilename('   ');
  assert.equal(emptyFallback.includes('_'), false);
  assert.ok(emptyFallback.includes('Video học tập'));

  assert.equal(normalizeOutputSubdir(''), 'output');
  assert.equal(normalizeOutputSubdir('output'), 'output');
  assert.equal(normalizeOutputSubdir('hoc_tieng_anh'), 'output/hoc_tieng_anh');
  assert.equal(normalizeOutputSubdir('output/phong_van/../bi_mat'), 'output/phong_van/bi_mat');
});

test('buildDualSubtitleCues keeps source text visible below target text until the next source sentence begins', () => {
  const records: RawSegmentTiming[] = [
    {
      text: '私の長所は積極性です。',
      startSec: 0,
      endSec: 2.5,
      voiceSlot: 'primary',
      segmentKind: 'speech',
      pauseAfterSec: 0.5,
    },
    {
      text: 'My strength is my proactive nature.',
      startSec: 3.0,
      endSec: 5.5,
      voiceSlot: 'secondary',
      segmentKind: 'speech',
      pauseAfterSec: 2.0,
      pauseKind: 'repeat',
    },
    {
      text: 'My strength is my proactive nature.',
      startSec: 7.5,
      endSec: 10.0,
      voiceSlot: 'secondary',
      segmentKind: 'speech',
      pauseAfterSec: 0.5,
    },
    {
      text: '学生時代、スピーチ大会にも参加しました。',
      startSec: 10.5,
      endSec: 13.5,
      voiceSlot: 'primary',
      segmentKind: 'speech',
      pauseAfterSec: 0.5,
    },
    {
      text: 'During my student days, I participated in speech contests.',
      startSec: 14.0,
      endSec: 17.5,
      voiceSlot: 'secondary',
      segmentKind: 'speech',
      pauseAfterSec: 0,
    },
  ];

  const dualCues = buildDualSubtitleCues(records, { stickyDualSubtitle: true });

  // First source stays pinned from 2.5s until 10.5s (exact start of second source sentence)
  const firstSticky = dualCues.find(
    (c) => c.isStickySource && c.text === '私の長所は積極性です。'
  );
  assert.ok(firstSticky);
  assert.equal(firstSticky.startSec, 2.5);
  assert.equal(firstSticky.endSec, 10.5);

  // Target repeat passes collapse into ONE continuous cue (no duplicate cue or static hold)
  const targetCues = dualCues.filter((c) => c.voiceSlot === 'secondary');
  assert.equal(targetCues.length, 2);
  assert.equal(targetCues[0].text, 'My strength is my proactive nature.');
  assert.equal(targetCues[0].startSec, 3.0);
  assert.equal(targetCues[0].endSec, 10.0);
  assert.equal(targetCues[0].animDurationSec, 2.5);
  assert.equal(dualCues.some((c) => c.isStaticHold), false);

  // Target cues carry companionSourceLines so ASS places them ABOVE StickySource
  assert.ok(targetCues.every((c) => (c.companionSourceLines ?? 0) >= 1));

  // splitCueIntoShortSubCues keeps sticky intact, preserves companionSourceLines & animDurationSec
  const split = splitCueIntoShortSubCues(dualCues, 28);
  const splitSticky = split.filter((c) => c.isStickySource);
  assert.equal(splitSticky.length, 2);
  const splitTargets = split.filter((c) => c.voiceSlot === 'secondary');
  assert.ok(splitTargets.every((c) => (c.companionSourceLines ?? 0) >= 1));
  assert.ok(splitTargets.some((c) => c.animDurationSec !== undefined));

  // SRT export skips overlapping sticky duplicate rows
  const srt = buildSrtFromCues(split);
  assert.ok(!srt.includes('私の長所は積極性です。\n\n2\n00:00:02,500'));

  // ASS output uses crisp M PLUS 1p for Japanese StickySource, independent sourceFontSize, and places Secondary above StickySource
  const ass = buildAssFromCues(
    split,
    {
      enabled: true,
      fontName: 'Noto Sans',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 38,
      sourceFontSize: 30,
      textColor: '#FFFFFF',
      highlightColor: '#2DD4BF',
      strokeColor: '#0F172A',
      strokeWidth: 2,
      boxStyle: 'outline',
      effect: 'karaoke',
    },
    720,
    1280
  );
  assert.ok(ass.includes('Style: StickySource,M PLUS 1p,30,'));
  const secondaryLine = ass.split('\n').find((l) => l.includes(',Secondary,'));
  assert.ok(secondaryLine);
  const fields = secondaryLine.split(',');
  const marginVOverride = Number(fields[7]);
  assert.ok(marginVOverride > 173, `Expected target MarginV (${marginVOverride}) > bottom margin 173`);
});

test('5s thinking countdown triggers ONLY on main Q&A content pairs and skips Title, Subtitle, Outro, Recap, Summary', () => {
  const fullScript = [
    'Tiêu đề: 面接時、日本語で自己PRする方法',
    'English: How to recommend yourself in Japanese during an interview.',
    'Tiêu đề nhỏ: 自分の長所と短所について',
    'English: About your strengths and weaknesses.',
    'Q: あなたの長所と短所を教えてください。',
    'English: Please tell me your strengths and weaknesses.',
    'A: 私の長所は積極性です。',
    'English: My strength is my proactive nature.',
    '短所は周りの人にも積極性を求めるところです。',
    'English: My weakness is that I also demand proactiveness from those around me.',
  ].join('\n');

  assert.equal(isTitleOrIntroTag('Tiêu đề: 面接時、日本語で自己PRする方法'), true);
  assert.equal(isTitleOrIntroTag('Tiêu đề nhỏ: 自分の長所と短所について'), true);
  assert.equal(isOutroTag('Outro: Thank you!'), true);

  const segs = planNarrationSegments({
    subject: '面接時、日本語で自己PRする方法',
    script: fullScript,
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 5,
    targetRepeatCount: 1,
    targetRepeatPauseSec: 2,
    fullAnswerRecapMode: 'target_full',
    summarizeAtEnd: true,
  });

  const titleSeg = segs.find((s) => s.text.includes('自己PRする方法'));
  const subtitleSeg = segs.find((s) => s.text.includes('長所と短所について'));
  assert.ok(titleSeg && subtitleSeg);
  assert.notEqual(titleSeg.pauseKind, 'thinking');
  assert.ok(titleSeg.pauseAfterSec < 1);
  assert.notEqual(subtitleSeg.pauseKind, 'thinking');
  assert.ok(subtitleSeg.pauseAfterSec < 1);

  const qSeg = segs.find((s) => s.text === 'あなたの長所と短所を教えてください。');
  const a1Seg = segs.find((s) => s.text === '私の長所は積極性です。');
  const a2Seg = segs.find((s) => s.text === '短所は周りの人にも積極性を求めるところです。');
  assert.equal(qSeg?.pauseKind, 'thinking');
  assert.equal(qSeg?.pauseAfterSec, 5);
  assert.equal(a1Seg?.pauseKind, 'thinking');
  assert.equal(a1Seg?.pauseAfterSec, 5);
  assert.equal(a2Seg?.pauseKind, 'thinking');
  assert.equal(a2Seg?.pauseAfterSec, 5);

  const recapAndSummary = segs.filter((s) => s.segmentKind === 'recap' || s.segmentKind === 'summary');
  assert.ok(recapAndSummary.length >= 2);
  assert.ok(recapAndSummary.every((s) => s.pauseKind !== 'thinking'));
});

test('laser ASS effect, independent sourceFontSize, from_user_script prompt, and inline subtitle updater work', () => {
  const cues = [
    {
      index: 1,
      startSec: 0,
      endSec: 3,
      text: '私の長所は積極性です。',
      voiceSlot: 'primary' as const,
      isStickySource: true,
      companionTargetLines: 1,
    },
    {
      index: 2,
      startSec: 1,
      endSec: 6,
      animDurationSec: 2,
      text: 'My strength is proactive.',
      voiceSlot: 'secondary' as const,
      companionSourceLines: 1,
    },
  ];
  const assLaser = buildAssFromCues(
    cues,
    {
      enabled: true,
      fontName: 'M PLUS 1p',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 44,
      sourceFontSize: 28,
      textColor: '#FFFFFF',
      highlightColor: '#38BDF8',
      strokeColor: '#020617',
      strokeWidth: 2.2,
      boxStyle: 'outline',
      effect: 'laser',
    },
    720,
    1280
  );
  assert.ok(assLaser.includes('Style: Secondary,M PLUS 1p,44,'));
  assert.ok(assLaser.includes('Style: StickySource,M PLUS 1p,28,'));
  assert.ok(assLaser.includes('\\blur2.2'));
  assert.ok(assLaser.includes('\\1c&H00F8BD38'));

  const prompt = buildMoneyPrinterPrompt({
    subject: '面接時、日本語で自己PRする方法',
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    sentenceCount: 6,
    mode: 'from_user_script',
    rawScript: 'Tiêu đề: 面接時、日本語で自己PRする方法\nQ: あなたの長所を教えてください。\nEnglish: Please tell me your strengths.',
    mediaTypeFilter: 'video_only',
    visualMood: 'bright',
    aspectRatio: '9:16',
    dualVoiceEnabled: true,
    pauseBetweenLinesSec: 5,
    targetRepeatCount: 1,
    fullAnswerRecapMode: 'target_full',
    summarizeAtEnd: true,
    stickyDualSubtitle: true,
    subtitleEffect: 'laser',
  });
  assert.ok(prompt.includes('Tiêu đề: 面接時、日本語で自己PRする方法'));
  assert.ok(prompt.includes('"visualMood": "bright"'));
  assert.ok(prompt.includes('"mediaTypeFilter": "video_only"'));
  assert.ok(prompt.includes('laser'));

  const parsedUserScript = parseAiWebOrJsonOutput(
    'Tiêu đề: 面接時、日本語で自己PRする方法\nEnglish: How to recommend yourself.',
    ''
  );
  assert.equal(parsedUserScript?.subject, '面接時、日本語で自己PRする方法');

  const raw = [
    'Q: あなたの長所を教えてください。 [PAUSE]',
    'English: Please tell me your strengths.',
  ].join('\n');
  const updatedQ = updateScriptLinePreservingTag(raw, 0, 'あなたの長所は何ですか？');
  assert.ok(updatedQ.startsWith('Q: あなたの長所は何ですか？ [PAUSE]'));
  const updatedEn = updateScriptLinePreservingTag(updatedQ, 1, 'What are your key strengths?');
  assert.ok(updatedEn.includes('\nEnglish: What are your key strengths?'));
});

test('single language with 2-voice style alternates cleanly and from_user_script prompt instructs full analysis', () => {
  const jaSingleDualQa = planNarrationSegments({
    script: [
      'Q: 面接で一番大切なことは何ですか？ [PAUSE]',
      'A: 結論から簡潔に伝えることです。',
    ].join('\n'),
    language: 'ja',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'ja-JP-KeitaNeural',
    pauseBetweenLinesSec: 5,
  });
  assert.equal(jaSingleDualQa.length, 2);
  assert.equal(jaSingleDualQa[0].voiceId, 'ja-JP-NanamiNeural');
  assert.equal(jaSingleDualQa[0].voiceSlot, 'primary');
  assert.equal(jaSingleDualQa[0].pauseKind, 'thinking');
  assert.equal(jaSingleDualQa[1].voiceId, 'ja-JP-KeitaNeural');
  assert.equal(jaSingleDualQa[1].voiceSlot, 'secondary');

  const jaSingleUntagged = planNarrationSegments({
    script: [
      'あなたの趣味は何ですか？',
      '休日に写真を撮ることです。',
    ].join('\n'),
    language: 'ja',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'ja-JP-KeitaNeural',
    pauseBetweenLinesSec: 5,
  });
  assert.equal(jaSingleUntagged[0].voiceId, 'ja-JP-NanamiNeural');
  assert.equal(jaSingleUntagged[1].voiceId, 'ja-JP-KeitaNeural');

  const rawPrompt = buildMoneyPrinterPrompt({
    subject: '',
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    sentenceCount: 6,
    mode: 'from_user_script',
    rawScript: 'Tôi thích đọc sách mỗi tối để mở rộng kiến thức.',
    pauseBetweenLinesSec: 5,
  });
  assert.ok(rawPrompt.includes('PHÂN TÍCH & TÁCH CÂU'));
  assert.ok(rawPrompt.includes('CHÈN NHỊP ĐẾM NGƯỢC 5s `[PAUSE]`'));
  assert.ok(rawPrompt.includes('Tiêu đề:'));
  assert.ok(rawPrompt.includes('Tôi thích đọc sách mỗi tối để mở rộng kiến thức.'));
});

test('countdown avoids overlapping tall/center/top subtitles, Intro/Outro stay 1x, and filenames have no underscores + study emoji', () => {
  // 1. Collision avoidance math: center & top & rising bottom subtitles
  const cdHeight = 100;
  const stageH = 1280;
  // Center subtitle (y=580..700) -> countdown must move cleanly UP above 580 (bottom <= 580) or DOWN below 700
  const yCenterSub = resolveCountdownCenterY([{ topPx: 580, bottomPx: 700 }], cdHeight, stageH);
  assert.ok(
    yCenterSub + cdHeight / 2 <= 580 || yCenterSub - cdHeight / 2 >= 700,
    `Countdown center ${yCenterSub} overlapped center subtitle [580, 700]`
  );
  // Top subtitle (y=115..260) -> countdown must push BELOW 260
  const yTopSub = resolveCountdownCenterY([{ topPx: 115, bottomPx: 260 }], cdHeight, stageH);
  assert.ok(yTopSub - cdHeight / 2 >= 260, `Countdown ${yTopSub} overlapped top subtitle`);
  // Rising tall bottom subtitle (y=560..1110) -> countdown must push higher above 560
  const yTallBottom = resolveCountdownCenterY([{ topPx: 560, bottomPx: 1110 }], cdHeight, stageH);
  assert.ok(yTallBottom + cdHeight / 2 <= 560, `Countdown ${yTallBottom} overlapped tall bottom subtitle`);

  // Build ASS with center subtitle + countdown and confirm \pos(360, Y) moves away from 640
  const centerAss = buildAssFromCues(
    [
      { index: 1, startSec: 1, endSec: 6, text: 'あなたの長所と短所を教えてください。', voiceSlot: 'primary', isStickySource: true },
      ...buildCountdownCues(1, 5, 2),
    ],
    {
      enabled: true,
      fontName: 'M PLUS 1p',
      position: 'center',
      customPositionPct: 50,
      fontSize: 42,
      sourceFontSize: 34,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 2,
      boxStyle: 'outline',
      effect: 'karaoke',
    },
    720,
    1280
  );
  const posMatch = centerAss.match(/\\pos\(360,(\d+)\)/);
  assert.ok(posMatch, 'Expected ASS countdown \\pos(360, Y)');
  const assCdY = Number(posMatch[1]);
  assert.notEqual(assCdY, 640, 'Countdown must shift away from center subtitle at 640px');

  const twoBandCenterY = resolveCountdownCenterY(
    [
      { topPx: 45, bottomPx: 220 },
      { topPx: 295, bottomPx: 390 },
    ],
    52,
    434
  );
  assert.ok(
    twoBandCenterY - 26 >= 220 && twoBandCenterY + 26 <= 295,
    `Countdown centerY=${twoBandCenterY} must sit cleanly between upper card (bottom=220) and lower subtitle (top=295)`
  );

  // 2. Intro ("1-Minute Instant Translation Challenge!") and Outro only read & display strictly ONCE
  const segs = planNarrationSegments({
    subject: 'Instant Translation Interview',
    script: [
      '1-Minute Instant Translation Challenge!',
      'Q: あなたの長所は何ですか？',
      'English: What is your strength?',
      'Outro: Great job today! See you next time!',
    ].join('\n'),
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 5,
    targetRepeatCount: 2,
    targetRepeatPauseSec: 2,
    summarizeAtEnd: true,
  });

  const introReads = segs.filter((s) => s.text.includes('1-Minute Instant Translation Challenge'));
  assert.equal(introReads.length, 1, 'Intro must only be read once even when targetRepeatCount=2');
  assert.equal(introReads[0].isIntroOrOutro, true);
  assert.notEqual(introReads[0].pauseKind, 'thinking');

  const outroReads = segs.filter((s) => s.text.includes('See you next time'));
  assert.equal(outroReads.length, 1, 'Outro must only be read once even when targetRepeatCount=2');
  assert.equal(outroReads[0].isIntroOrOutro, true);

  const enAnswerReads = segs.filter((s) => s.text === 'What is your strength?');
  assert.equal(enAnswerReads.length, 3, 'Main Q&A answer still repeats 1 + 2 = 3 times');

  const cues = buildDualSubtitleCues([
    { text: '1-Minute Instant Translation Challenge!', startSec: 0, endSec: 2.2, voiceSlot: 'secondary', isIntroOrOutro: true },
    { text: 'あなたの長所は何ですか？', startSec: 2.6, endSec: 4.5, voiceSlot: 'primary', countdownStartSec: 4.5, countdownEndSec: 9.5 },
    { text: 'What is your strength?', startSec: 9.5, endSec: 11.5, voiceSlot: 'secondary' },
    { text: 'Great job today! See you next time!', startSec: 12.0, endSec: 14.5, voiceSlot: 'secondary', isIntroOrOutro: true },
  ]);
  assert.equal(cues.filter((c) => c.text.includes('1-Minute')).length, 1);
  assert.equal(cues.filter((c) => c.text.includes('See you next time')).length, 1);

  // 3. Underscore-free filenames with study-energy emojis matched to topic
  assert.equal(pickStudyEnergyEmoji('面接時、日本語で自己PRする方法'), '💼');
  assert.equal(pickStudyEnergyEmoji('Bí ẩn não bộ con người'), '🧠');
  const interviewFilename = slugifyOutputFilename('Phỏng vấn điểm mạnh_điểm yếu Nhật Anh', 'Video', {
    language: 'ja_en',
  });
  assert.equal(interviewFilename.includes('_'), false);
  assert.ok(interviewFilename.startsWith('💼 '));
});

test('analyzeScriptLinePresentation and detectLineContextVisual identify English instructional roles and clean icons', () => {
  const titlePres = analyzeScriptLinePresentation('Tiêu đề: 1分瞬間英作文チャレンジ！');
  assert.equal(titlePres.roleKind, 'title');
  assert.equal(titlePres.roleLabel, 'Intro');
  assert.equal(titlePres.roleIconKey, 'megaphone');
  assert.equal(titlePres.roleTone, 'sky');

  const questionPres = analyzeScriptLinePresentation('Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]');
  assert.equal(questionPres.roleKind, 'question');
  assert.equal(questionPres.roleLabel, 'Question');
  assert.equal(questionPres.roleIconKey, 'hand_raise');
  assert.equal(questionPres.contextIconKey, 'alert_triangle');
  assert.equal(questionPres.hasPause, true);

  const answerPres = analyzeScriptLinePresentation('English: Watch out for her!');
  assert.equal(answerPres.roleKind, 'answer');
  assert.equal(answerPres.roleLabel, 'Answer');
  assert.equal(answerPres.roleIconKey, 'chat_quote');
  assert.equal(answerPres.roleTone, 'emerald');
  assert.equal(answerPres.contextIconKey, 'alert_triangle');

  const outroPres = analyzeScriptLinePresentation('Outro: Hãy lưu video để ôn tập nhé!');
  assert.equal(outroPres.roleKind, 'outro');
  assert.equal(outroPres.roleLabel, 'Closing');
  assert.equal(outroPres.roleIconKey, 'bell');

  assert.equal(detectLineContextVisual('Tại đáy rãnh Mariana, sinh vật biển tự phát sáng').contextIconKey, 'waves');
  assert.equal(detectLineContextVisual('Pha tách cà phê espresso buổi sáng').contextIconKey, 'coffee');
  assert.equal(detectLineContextVisual('Phỏng vấn điểm mạnh điểm yếu ở công ty').contextIconKey, 'briefcase');
  assert.equal(detectLineContextVisual('Hơn 80% đại dương chưa được khám phá').contextIconKey, 'waves');
  assert.equal(detectLineContextVisual('Top 3 thói quen giúp tăng 45% hiệu suất').contextIconKey, 'bar_chart');
});

test('computeVisualMatchScore rejects diagrams/logos/creepy imagery and rewards sentence keyword overlap', () => {
  const diagramScore = computeVisualMatchScore(
    'Deep ocean food chain diagram infographic.svg',
    ['deep', 'ocean'],
    ['ocean']
  );
  assert.equal(diagramScore, -10);

  const flagScore = computeVisualMatchScore('Flag of Japan.svg', ['japan', 'tokyo'], ['city']);
  assert.equal(flagScore, -10);

  const creepyScore = computeVisualMatchScore('Creepy horror skull skeleton ghost', ['night', 'street'], ['city']);
  assert.equal(creepyScore, -10);

  const medicalScore = computeVisualMatchScore('Bloody surgery room autopsy corpse', ['hospital', 'science'], ['people']);
  assert.equal(medicalScore, -10);

  const strongMatch = computeVisualMatchScore(
    'Bioluminescent jellyfish swimming in deep ocean dark water',
    ['jellyfish', 'deep', 'ocean'],
    ['underwater']
  );
  const weakSubjectOnly = computeVisualMatchScore(
    'Abstract minimal underwater texture',
    ['jellyfish', 'deep', 'ocean'],
    ['underwater']
  );
  const unrelatedMatch = computeVisualMatchScore(
    'Red sports car driving on highway',
    ['jellyfish', 'deep', 'ocean'],
    ['underwater']
  );

  assert.ok(strongMatch >= 16);
  assert.equal(weakSubjectOnly, 2);
  assert.equal(unrelatedMatch, 0);
});

test('NEUTRAL_BG_THEMES and getNeutralBgThemeMeta cover dark and light studio themes', () => {
  assert.equal(NEUTRAL_BG_THEMES.length, 5);
  const defaultMeta = getNeutralBgThemeMeta(undefined);
  assert.equal(defaultMeta.id, 'slate_studio');
  assert.equal(defaultMeta.isLight, false);

  const warmPaper = getNeutralBgThemeMeta('warm_paper');
  assert.equal(warmPaper.isLight, true);
  assert.equal(warmPaper.accentHex, '#0d6efd');

  const cleanGrid = getNeutralBgThemeMeta('clean_grid');
  assert.equal(cleanGrid.isLight, true);
});

test('buildAssFromCues emits English RoleBadge, Component 2411 countdown, and protects light background contrast', () => {
  const cues = [
    {
      index: 1,
      startSec: 0,
      endSec: 5,
      text: '「彼女には気をつけて！」を英語で言えますか？',
      voiceSlot: 'primary' as const,
      isStickySource: false,
      roleKind: 'question' as const,
      roleLabel: 'Question',
    },
    {
      index: 2,
      startSec: 5,
      endSec: 10,
      text: '「彼女には気をつけて！」を英語で言えますか？',
      voiceSlot: 'primary' as const,
      isStickySource: true,
    },
    ...buildCountdownCues(5, 5, 10),
  ];

  const subCfg: SubtitleConfig = {
    enabled: true,
    fontName: 'M PLUS 1p',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 38,
    sourceFontSize: 28,
    textColor: '#FFFFFF',
    highlightColor: '#2DD4BF',
    strokeColor: '#0F172A',
    strokeWidth: 2,
    boxStyle: 'outline',
    effect: 'karaoke',
    showRoleBadges: true,
  };

  const assDark = buildAssFromCues(cues, subCfg, 720, 1280);
  assert.ok(assDark.includes('Style: RoleBadge,'));
  assert.ok(assDark.includes('Style: CountdownMeta,'));
  assert.ok(assDark.includes(',RoleBadge,'));
  assert.ok(assDark.includes('● Question'));
  assert.ok(assDark.includes('THINK'));
  assert.ok(assDark.includes('\\p1'));
  assert.ok(assDark.includes('\\p0'));

  const assLight2411 = buildAssFromCues(cues, subCfg, 720, 1280, {
    isLightBackground: true,
    use2411CountdownStyle: true,
  });
  assert.ok(assLight2411.includes('Style: CountdownMeta,'));
  assert.ok(assLight2411.includes('THINK TIME'));
  // Bright white textColor (#FFFFFF) must auto-convert to high-contrast dark ink (&H002A170F) on light backgrounds
  assert.ok(assLight2411.includes('&H002A170F'));
  assert.equal(assLight2411.includes('Style: StickySource,M PLUS 1p,28,&H00F0E8E2'), false);

  const assNoBadges = buildAssFromCues(cues, { ...subCfg, showRoleBadges: false }, 720, 1280);
  assert.equal(assNoBadges.includes(',RoleBadge,'), false);
});

test('STUDIO_2411_THEMES, build2411CardSpecForLine, and build2411CardSvg build non-truncated English study card SVGs', () => {
  assert.equal(STUDIO_2411_THEMES.length, 5);
  const spec = build2411CardSpecForLine({
    rawLine: 'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    lineIndex: 1,
    totalLines: 6,
    scriptStyle: 'language_challenge',
    themeId: 'cards_pastel',
    defaultPauseSec: 5,
  });
  assert.equal(spec.layoutKind, 'quiz_prompt');
  assert.equal(spec.kickerLabel, 'LISTEN & TRANSLATE');
  assert.equal(spec.animationIn, 'random');
  assert.notEqual(spec.resolvedAnimationIn, 'random');
  assert.equal(spec.iconKey, 'alert_triangle');
  assert.equal(spec.hasPause, true);
  assert.equal(spec.pauseSec, 5);

  const wrappedLong = wrapSvgCardLines(
    'My weakness is that I sometimes focus too much on small details before stepping back to review the big picture.',
    32
  );
  assert.ok(wrappedLong.length >= 3);
  assert.equal(wrappedLong.join(' ').includes('…'), false);
  assert.equal(wrappedLong.join(' ').includes('...'), false);

  const svg = build2411CardSvg({
    spec,
    width: 720,
    height: 1280,
  });
  assert.ok(svg.startsWith('<svg '));
  assert.equal(svg.includes('LISTEN &amp; TRANSLATE'), false);
  assert.ok(svg.includes('THINK TIME · 5S'));
  assert.ok(svg.includes('#F5F3FF'));
  assert.equal(svg.includes('undefined'), false);
  assert.equal(svg.includes('…'), false);
});

test('splitTtsTextChunks and planXfadeMergeBatches safely scale long videos', () => {
  const longRecap =
    'My strength is my proactive nature. During my student days, I actively participated in speech contests and club presentation events. My weakness is that I also demand proactiveness from those around me, so I learned to listen carefully first.';
  const chunks = splitTtsTextChunks(longRecap, 95);
  assert.ok(chunks.length >= 3);
  for (const ch of chunks) {
    assert.ok(ch.length <= 95, `Chunk too long: ${ch.length}`);
  }
  assert.equal(chunks.join(' '), longRecap);

  const jaLong =
    '私の長所は積極性です。学生時代、スピーチ大会やサークルの成果発表会にも積極的に参加しました。短所は周りの人にも積極性を求めるところです。ですから、先に相手の都合や希望を聞いて調整するように気をつけていました。';
  const jaChunks = splitTtsTextChunks(jaLong, 60);
  assert.ok(jaChunks.length >= 2);
  for (const ch of jaChunks) {
    assert.ok(ch.length <= 60);
  }

  assert.deepEqual(planXfadeMergeBatches(['a']), [['a']]);
  assert.deepEqual(planXfadeMergeBatches(['a', 'b', 'c', 'd', 'e', 'f']), [
    ['a', 'b', 'c', 'd', 'e', 'f'],
  ]);
  const sevenBatches = planXfadeMergeBatches(['1', '2', '3', '4', '5', '6', '7'], 6);
  assert.equal(sevenBatches.length, 2);
  assert.ok(sevenBatches.every((b) => b.length >= 2), 'Must avoid orphan 1-clip xfade batch');

  const thirtyClips = Array.from({ length: 30 }, (_, i) => `clip_${i}.mp4`);
  const batches30 = planXfadeMergeBatches(thirtyClips, 6);
  assert.equal(batches30.length, 5);
  assert.equal(batches30.flat().length, 30);
});

test('all 14 Studio 2411 variants render distinct SVGs without truncation, support random animations, and track examples/prevTargetText', () => {
  assert.equal(STUDIO_2411_VARIANT_OPTIONS.length, 14);
  assert.equal(STUDIO_2411_ANIMATION_OPTIONS.length, 5);
  assert.equal(STUDIO_2411_ANIMATION_OPTIONS[0].id, 'random');

  const resolved0 = resolveStudio2411AnimationIn('random', 0);
  const resolved1 = resolveStudio2411AnimationIn('random', 1);
  assert.notEqual(resolved0, 'random');
  assert.notEqual(resolved0, resolved1);

  const svgsByVariant = new Set<string>();
  const animChoices: Studio2411AnimationIn[] = STUDIO_2411_ANIMATION_OPTIONS.map((o) => o.id);
  for (let i = 0; i < STUDIO_2411_VARIANT_OPTIONS.length; i++) {
    const v = STUDIO_2411_VARIANT_OPTIONS[i].id;
    const anim: Studio2411AnimationIn = animChoices[i % animChoices.length];
    const spec = build2411CardSpecForLine({
      rawLine: 'A: 私の長所は積極性です。学生時代にはスピーチ大会やチーム発表にも進んで参加しました。 [PAUSE]',
      lineIndex: i,
      totalLines: 14,
      scriptStyle: 'language_challenge',
      themeId: i % 2 === 0 ? 'cards_pastel' : 'word_reveal_dark',
      defaultPauseSec: 5,
      prevTargetText: i > 0 ? 'Watch out for her!' : undefined,
      override: {
        variant: v,
        animationIn: anim,
        title: `Scene ${v}`,
        labels: ['Interviewer', 'Candidate', 'Follow-up'],
        highlightWord: 'Proactive',
        formula: 'Subject + Verb',
        speechText: 'What is your biggest strength when leading a cross-functional project under tight deadlines?',
        reactionText: 'Natural!',
        exampleText: 'e.g. I proactively organized our weekly team check-ins.',
        prevTargetText: i > 0 ? 'Watch out for her!' : undefined,
        progressPct: 72,
      },
    });
    assert.equal(spec.variant, v);
    assert.equal(spec.animationIn, anim);
    assert.equal(
      spec.speechText,
      'What is your biggest strength when leading a cross-functional project under tight deadlines?'
    );
    assert.equal(spec.reactionText, 'Natural!');
    if (v === 'friends-chat') {
      assert.equal(spec.exampleText, undefined);
    } else {
      assert.equal(spec.exampleText, 'e.g. I proactively organized our weekly team check-ins.');
    }

    const svg = build2411CardSvg({ spec, width: 720, height: 1280 });
    assert.ok(svg.startsWith('<svg '));
    assert.equal(svg.includes('undefined'), false);
    assert.equal(svg.includes('NaN'), false);
    assert.equal(svg.includes('…'), false, `Variant ${v} truncated text with ellipsis`);
    if (v === 'friends-chat') {
      assert.equal(svg.includes('e.g. I proactively'), false, 'friends-chat must suppress Hint/example strip');
    } else {
      assert.ok(svg.includes('e.g. I proactively'), `Variant ${v} should include exampleText footer strip`);
    }
    svgsByVariant.add(svg);
  }
  assert.equal(svgsByVariant.size, 14, 'All 14 variants must produce distinct SVG visuals');

  const dialogueScript = [
    'Tiêu đề: Phỏng vấn tiếng Nhật - Anh [PAUSE]',
    'Q: あなたの長所と短所を教えてください。 [PAUSE]',
    'English: Please tell me your strengths and weaknesses.',
    'A: 私の長所は積極性です。 [PAUSE]',
    'English: My strength is proactiveness.',
    'Outro: ありがとうございました！',
  ].join('\n');

  const planned = buildContextualSceneComponentsForScript({
    script: dialogueScript,
    scriptStyle: 'bilingual_dialogue',
    pauseBetweenLinesSec: 5,
  });
  assert.equal(planned.length, 6);
  for (let i = 1; i < planned.length; i++) {
    assert.notEqual(planned[i].variant, planned[i - 1].variant, 'Planner avoids consecutive duplicate variants');
  }
  assert.ok(
    planned[3].prevTargetText?.includes('Please tell me your strengths'),
    'Later question/scene remembers previous target phrase for learner recall'
  );
  assert.ok(
    planned.some((p) => Boolean(p.exampleText && !p.exampleText.includes('...'))),
    'Planner provides concrete exampleText without placeholder ellipsis'
  );
  const usedVariants = new Set(planned.map((p) => p.variant));
  assert.ok(
    usedVariants.has('friends-chat') || usedVariants.has('avatar-speech') || usedVariants.has('dialogue-upgrade'),
    'Dialogue/interview script automatically selects character dialogue variants'
  );

  const sanitized = sanitizeSceneComponentsList([
    {
      variant: 'friends-chat',
      animationIn: 'random',
      labels: ['Alex', 'Mia'],
      speechText: 'Could I get an iced latte?',
      reactionText: 'Polite!',
      exampleText: 'e.g. Could I have one to go?',
      prevTargetText: 'Wait a second!',
    },
    {
      variant: 'dialogue-upgrade',
      speechText: 'Very good',
      highlightWord: 'Outstanding',
      reactionText: 'Natural!',
    },
  ]);
  assert.ok(sanitized && sanitized.length === 2);
  assert.equal(sanitized[0].variant, 'friends-chat');
  assert.equal(sanitized[0].animationIn, 'random');
  assert.equal(sanitized[0].speechText, 'Could I get an iced latte?');
  assert.equal(sanitized[0].reactionText, 'Polite!');
  assert.equal(sanitized[0].exampleText, 'e.g. Could I have one to go?');
  assert.equal(sanitized[0].prevTargetText, 'Wait a second!');
  assert.equal(sanitized[1].variant, 'dialogue-upgrade');
});

test('curated background library categorizes study, interview, and life topics without AI', () => {
  assert.equal(CURATED_BACKGROUNDS.length, 9);
  assert.equal(detectCuratedCategoryFromTopic('Phỏng vấn việc làm Nhật - Anh', 'language_challenge'), 'interview');
  assert.equal(detectCuratedCategoryFromTopic('Bí ẩn vũ trụ và đại dương', 'curious_facts'), 'life');
  assert.equal(detectCuratedCategoryFromTopic('Phản xạ từ vựng N3 mỗi ngày', 'language_challenge'), 'study');

  const interviewBgs = selectCuratedBackgroundsForConfig({
    subject: 'Phỏng vấn điểm mạnh điểm yếu',
    scriptStyle: 'language_challenge',
    category: 'all',
    bgId: 'auto',
    count: 5,
  });
  assert.equal(interviewBgs.length, 5);
  assert.ok(interviewBgs.slice(0, 3).every((b) => b.category === 'interview'));

  const strictInterviewBgs = selectCuratedBackgroundsForConfig({
    subject: 'Anything',
    category: 'interview',
    bgId: 'auto',
    count: 5,
  });
  assert.equal(strictInterviewBgs.length, 5);
  assert.ok(strictInterviewBgs.every((b) => b.category === 'interview'));

  const lockedBg = selectCuratedBackgroundsForConfig({
    subject: 'Anything',
    category: 'study',
    bgId: 'life_twilight_cosmos',
    count: 3,
  });
  assert.equal(lockedBg.length, 3);
  assert.ok(lockedBg.every((b) => b.id === 'life_twilight_cosmos'));

  const bgSvg = buildCuratedBackgroundSvg(CURATED_BACKGROUNDS[0].id, 1080, 1920);
  assert.ok(bgSvg.startsWith('<svg '));
  assert.ok(bgSvg.includes('viewBox="0 0 1080 1920"'));
  assert.equal(bgSvg.includes('undefined'), false);
});

test('Component 2411 wraps long CJK+English copy without ellipsis/overflow and keeps friends-chat anti-spoiler bubbles', () => {
  const longCjk =
    '「急がなくて大丈夫ですよ、自分のペースでしっかり確認してから提出してくださいね」を自然な英語で言えますか？ [PAUSE]';
  const wrapped = wrapSvgCardLines(longCjk, 18, 4);
  assert.ok(wrapped.length >= 2);
  assert.equal(wrapped.join('').includes('...'), false);
  assert.equal(wrapped.join('').includes('…'), false);

  for (const v of STUDIO_2411_VARIANT_OPTIONS) {
    const spec = build2411CardSpecForLine({
      rawLine: 'Q: 私の長所は、周囲の状況を見ながら主体的に行動し、課題解決に向けて粘り強く取り組めるところです。 [PAUSE]',
      lineIndex: 1,
      totalLines: 6,
      scriptStyle: 'language_challenge',
      themeId: 'cards_pastel',
      defaultPauseSec: 5,
      prevTargetText: 'Watch out for her!',
      override: {
        variant: v.id,
        animationIn: 'random',
        title: 'Proactive Problem Solving Under Tight Deadlines',
        labels: ['Interviewer', 'Candidate'],
        speechText: 'My strength is taking initiative early when cross-functional issues come up during tight releases.',
        exampleText: 'Hint: State your core strength first, then give one concrete workplace behavior.',
        prevTargetText: 'Watch out for her!',
        progressPct: 45,
      },
    });
    assert.equal(spec.animationIn, 'random');
    const svg = build2411CardSvg({ spec, width: 720, height: 1280 });
    assert.equal(svg.includes('NaN'), false, `Variant ${v.id} produced NaN`);
    assert.equal(svg.includes('undefined'), false, `Variant ${v.id} produced undefined`);
    assert.equal(svg.includes('…'), false, `Variant ${v.id} truncated with ellipsis`);
    assert.equal(svg.includes('...'), false, `Variant ${v.id} truncated with ...`);
  }

  // Two-speaker friends-chat: prompt slide must NOT spoil answer, and shows user turn prompt bubble
  const quizChatSpec = build2411CardSpecForLine({
    rawLine: 'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    lineIndex: 1,
    totalLines: 4,
    scriptStyle: 'language_challenge',
    themeId: 'cards_pastel',
    defaultPauseSec: 5,
    override: { variant: 'friends-chat', animationIn: 'random' },
  });
  assert.equal(quizChatSpec.layoutKind, 'quiz_prompt');
  assert.equal(quizChatSpec.exampleText, undefined);
  const quizChatSvg = build2411CardSvg({
    spec: quizChatSpec,
    width: 720,
    height: 1280,
    animFrame: 1,
    speakerAPose: 'idle',
    speakerBPose: 'thinking',
    countdownActive: true,
  });
  assert.ok(quizChatSvg.includes('Think 5s'));
  assert.ok(quizChatSvg.includes('<circle'));
  assert.equal(quizChatSvg.includes('Your Turn'), false);
  assert.equal(quizChatSvg.includes('5S TRANSLATION DRILL'), false);

  // Two-speaker friends-chat answer slide: Speaker A shows promptPreviewText, Speaker B shows translated answer
  const answerChatSpec = build2411CardSpecForLine({
    rawLine: 'English: Watch out for her!',
    lineIndex: 2,
    totalLines: 4,
    isSecondarySlot: true,
    scriptStyle: 'language_challenge',
    themeId: 'cards_pastel',
    defaultPauseSec: 5,
    promptPreviewText: '「彼女には気をつけて！」',
    override: { variant: 'friends-chat', animationIn: 'random' },
  });
  const answerChatSvg = build2411CardSvg({ spec: answerChatSpec, width: 720, height: 1280 });
  assert.ok(answerChatSvg.includes('彼女には気をつけて'));
  assert.ok(answerChatSvg.includes('Watch out for her!'));
});

test('buildAssFromCues adapts dark text to dark backgrounds bidirectionally and draws smooth rounded countdown', () => {
  const cues = [
    {
      index: 1,
      startSec: 0,
      endSec: 5,
      text: 'Watch out for her!',
      voiceSlot: 'secondary' as const,
      roleKind: 'answer' as const,
      roleLabel: 'Answer',
    },
    ...buildCountdownCues(1, 5, 2),
  ];

  // Dark text (#0F172A) paired with dark background must flip to white (&H00FFFFFF) so text is readable
  const assOnDark = buildAssFromCues(
    cues,
    {
      enabled: true,
      fontName: 'Noto Sans',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 38,
      sourceFontSize: 30,
      textColor: '#0F172A',
      highlightColor: '#4F46E5',
      strokeColor: '#FFFFFF',
      strokeWidth: 2,
      boxStyle: 'outline',
      effect: 'karaoke',
    },
    720,
    1280,
    {
      isLightBackground: false,
      use2411CountdownStyle: true,
    }
  );
  assert.ok(assOnDark.includes('Style: Secondary,Noto Sans,38,&H0015CCFA,&H00FFFFFF,'));
  const assOnDarkStatic = buildAssFromCues(
    cues,
    {
      enabled: true,
      fontName: 'Noto Sans',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 38,
      sourceFontSize: 30,
      textColor: '#0F172A',
      highlightColor: '#4F46E5',
      strokeColor: '#FFFFFF',
      strokeWidth: 2,
      boxStyle: 'outline',
      effect: 'static',
    },
    720,
    1280,
    { isLightBackground: false, use2411CountdownStyle: true }
  );
  assert.ok(assOnDarkStatic.includes('Style: Default,Noto Sans,38,&H00FFFFFF,'));
  assert.ok(assOnDarkStatic.includes('Style: Secondary,Noto Sans,38,&H0015CCFA,'));
  assert.ok(assOnDark.includes('Style: Countdown,'));
  assert.ok(assOnDark.includes('Style: CountdownMeta,'));
  assert.ok(assOnDark.includes('THINK TIME'));
  // Rounded Bootstrap ASS card uses Bezier curves (' b ') instead of sharp polygons only
  assert.ok(assOnDark.includes('\\p1'));
  assert.ok(assOnDark.includes('}m '));
  assert.ok(assOnDark.includes(' b '));

  // Light background keeps crisp dark ink without thick white stroke halo
  const assOnLight = buildAssFromCues(
    cues,
    {
      enabled: true,
      fontName: 'Noto Sans',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 38,
      sourceFontSize: 30,
      textColor: '#0F172A',
      highlightColor: '#4F46E5',
      strokeColor: '#FFFFFF',
      strokeWidth: 2,
      boxStyle: 'outline',
      effect: 'karaoke',
    },
    720,
    1280,
    {
      isLightBackground: true,
      use2411CountdownStyle: true,
    }
  );
  assert.ok(assOnLight.includes('Style: Secondary,Noto Sans,38,&H00E5464F,&H002A170F,'));

  const prompt = buildMoneyPrinterPrompt({
    subject: 'Office conversation challenge',
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    sentenceCount: 6,
    mode: 'all_in_one',
    dualVoiceEnabled: true,
  });
  assert.ok(prompt.includes('"animationIn": "random"'));
  assert.ok(prompt.includes('English'));
  assert.ok(prompt.includes('friends-chat'));
});

test('spoiler-free quiz hints, dualVoiceEnabled friends-chat consistency, aligned ASS CountdownVec, and multi-aspect SVG cards', () => {
  // 1. Quiz prompts must NEVER leak English opening words like "Watch..." or "Take..."
  const spoilerCases = [
    'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    'Q: 「無理しないでね」はどう言いますか？ [PAUSE]',
    'Q: コーヒーを注文するとき何と言いますか？ [PAUSE]',
    'Q: 丁寧にお礼を言いたいときは？ [PAUSE]',
  ];
  for (const rawLine of spoilerCases) {
    const spec = build2411CardSpecForLine({
      rawLine,
      lineIndex: 1,
      totalLines: 6,
      scriptStyle: 'language_challenge',
      dualVoiceEnabled: true,
      pauseBetweenLinesSec: 5,
      defaultPauseSec: 5,
      override: {
        exampleText: 'Hint: Try "Watch..." / "Take..." right away!',
      },
    } as Parameters<typeof build2411CardSpecForLine>[0]);
    const ex = (spec.exampleText ?? '').toLowerCase();
    assert.equal(ex.includes('watch'), false, `Hint leaked "watch": ${spec.exampleText}`);
    assert.equal(ex.includes('take'), false, `Hint leaked "take": ${spec.exampleText}`);
    assert.equal(ex.includes('could i'), false, `Hint leaked "could i": ${spec.exampleText}`);
    assert.equal(ex.includes('appreciate'), false, `Hint leaked "appreciate": ${spec.exampleText}`);
    assert.equal(ex.includes('...'), false, `Hint contained spoiler ellipsis: ${spec.exampleText}`);
    assert.equal(spec.variant, 'friends-chat', 'Dual voice locks quiz prompt to friends-chat');
  }

  // 2. dualVoiceEnabled locks all slides in buildContextualSceneComponentsForScript to 'friends-chat'
  const dualScript = [
    'Tiêu đề: 今から日本語を読み上げます。5秒以内に英語で言ってみましょう！',
    'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    'English: Watch out for her!',
    'Q: 「無理しないでね」はどう言いますか？ [PAUSE]',
    'English: Take it easy and don’t push yourself too hard!',
    'Outro: いくつ言えましたか？気に入ったら保存して練習しましょう！',
  ].join('\n');
  const dualPlanned = buildContextualSceneComponentsForScript({
    script: dualScript,
    scriptStyle: 'language_challenge',
    dualVoiceEnabled: true,
    pauseBetweenLinesSec: 5,
    existingOverrides: [
      { variant: 'css-browser-mockup' },
      { variant: 'avatar-speech' },
    ],
  });
  assert.equal(dualPlanned.length, 6);
  assert.ok(
    dualPlanned.every((item) => item.variant === 'friends-chat'),
    `Expected every slide in dual-voice mode to be friends-chat, got: ${dualPlanned.map((i) => i.variant).join(', ')}`
  );

  // 3. ASS CountdownVec renders with BorderStyle=1, \an7\pos(...)\bord0, and aligned trackLeft across 9:16, 16:9, 1:1
  const subCfg: SubtitleConfig = {
    enabled: true,
    fontName: 'M PLUS 1p',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 38,
    sourceFontSize: 28,
    textColor: '#0F172A',
    highlightColor: '#4F46E5',
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
    boxStyle: 'outline',
    effect: 'karaoke',
  };
  const cdCues = [
    {
      index: 1,
      startSec: 0,
      endSec: 5,
      text: '「彼女には気をつけて！」を英語で言えますか？',
      voiceSlot: 'primary' as const,
      roleKind: 'question' as const,
      roleLabel: 'Question',
    },
    ...buildCountdownCues(0, 5, 2),
  ];

  for (const [w, h, ratioLabel] of [
    [720, 1280, '9:16'],
    [1280, 720, '16:9'],
    [720, 720, '1:1'],
  ] as const) {
    const ass = buildAssFromCues(cdCues, { ...subCfg, showRoleBadges: true }, w, h, {
      isLightBackground: true,
      use2411CountdownStyle: true,
    });
    assert.ok(ass.includes('Style: CountdownVec,'), `${ratioLabel} missing CountdownVec style`);
    assert.ok(ass.includes('\\an7\\pos('), `${ratioLabel} vector layers must anchor with \\an7\\pos`);
    // Track and fill layers must share identical left/top pos coordinates
    const barMatches = [...ass.matchAll(/Dialogue: [12],[^,]+,[^,]+,CountdownVec,,0,0,0,,\{\\an7\\pos\((\d+),(\d+)\)\\p1/g)];
    assert.ok(barMatches.length >= 2, `${ratioLabel} should emit aligned track + fill bar vectors`);
    assert.equal(barMatches[barMatches.length - 1][1], barMatches[barMatches.length - 2][1], `${ratioLabel} fill bar X must match track X`);
    assert.equal(barMatches[barMatches.length - 1][2], barMatches[barMatches.length - 2][2], `${ratioLabel} fill bar Y must match track Y`);

    // Check card top clears cardReserveBottom and track top clears RoleBadge baseline
    const cardBorderMatch = ass.match(/Dialogue: 0,[^,]+,[^,]+,CountdownVec,,0,0,0,,\{\\an7\\pos\((\d+),(\d+)\)\\p1\\1c&H/);
    const badgeMatch = ass.match(/RoleBadge,,0,0,0,,\{\\an2\\pos\(\d+,(\d+)\)/);
    assert.ok(cardBorderMatch && badgeMatch, `${ratioLabel} should emit both CountdownVec border and RoleBadge`);
    const cardTopY = Number(cardBorderMatch[2]) + 2;
    const trackTopY = Number(barMatches[barMatches.length - 2][2]);
    const roleBadgeY = Number(badgeMatch[1]);
    const cardReserveBottom = Math.round(h * (w > h ? 0.495 : w === h ? 0.475 : 0.445));
    assert.ok(cardTopY >= cardReserveBottom - 2, `${ratioLabel} countdown top (${cardTopY}) collided with study card (${cardReserveBottom})`);
    assert.ok(trackTopY < roleBadgeY - 12, `${ratioLabel} countdown track (${trackTopY}) collided with RoleBadge (${roleBadgeY})`);
  }

  // 4. All 14 variants render cleanly in 16:9 (1280x720), 1:1 (720x720), and 9:16 (720x1280) with legible typography
  for (const [w, h] of [
    [1280, 720],
    [720, 720],
    [720, 1280],
  ]) {
    for (const v of STUDIO_2411_VARIANT_OPTIONS) {
      const spec = build2411CardSpecForLine({
        rawLine: 'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
        lineIndex: 1,
        totalLines: 6,
        scriptStyle: 'language_challenge',
        themeId: 'cards_pastel',
        defaultPauseSec: 5,
        override: { variant: v.id, animationIn: 'random' },
      });
      const svg = build2411CardSvg({ spec, width: w, height: h });
      assert.ok(svg.includes(`viewBox="0 0 ${w} ${h}"`), `${v.id} ${w}x${h} viewBox mismatch`);
      assert.equal(svg.includes('NaN'), false, `${v.id} ${w}x${h} NaN`);
      assert.equal(svg.includes('undefined'), false, `${v.id} ${w}x${h} undefined`);
      assert.equal(svg.includes('…'), false, `${v.id} ${w}x${h} ellipsis`);
    }
  }
});

test('decluttered Studio 2411 cards, synced speaker poses, rawLineIndex anti-spoiler planning, and smooth transitions', () => {
  // 1. Generic speaker labels are filtered, explicit names are preserved
  for (const fake of ['Host', 'Challenge', 'Summary', 'Practice', 'Prompt', 'Your Turn', 'Reply', 'Speaker', 'Candidate', 'Interviewer', 'Speaker 1']) {
    assert.equal(isGenericSpeakerLabel(fake), true, `Expected generic label: ${fake}`);
  }
  assert.equal(isGenericSpeakerLabel('Alex'), false);
  assert.equal(isGenericSpeakerLabel('Mia'), false);

  // 2. Intro/outro friends-chat omits duplicate Row 2 instructions, generic pills, header bar, and footer labels
  const introSpec = build2411CardSpecForLine({
    rawLine: 'Tiêu đề: 今から日本語を読み上げます。5秒以内に英語で言ってみましょう！',
    lineIndex: 0,
    totalLines: 6,
    isIntroOrOutro: true,
    scriptStyle: 'language_challenge',
    dualVoiceEnabled: true,
    themeId: 'cards_pastel',
    defaultPauseSec: 5,
  });
  assert.equal(introSpec.exampleText, undefined);
  const introSvg = build2411CardSvg({
    spec: introSpec,
    width: 720,
    height: 1280,
    fontName: 'M PLUS 1p',
    animFrame: 0,
    speakerAPose: 'talking',
    speakerBPose: 'idle',
  });
  assert.equal(introSvg.includes('5S TRANSLATION DRILL'), false);
  assert.equal(introSvg.includes('Listen &amp; translate aloud'), false);
  assert.equal(introSvg.includes('>Host<'), false);
  assert.equal(introSvg.includes('>Challenge<'), false);
  assert.equal(introSvg.includes('RANDOM'), false);
  assert.ok(introSvg.includes('M PLUS 1p'));

  // 3. Real names render cleanly when explicitly provided
  const namedSpec = build2411CardSpecForLine({
    rawLine: 'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    lineIndex: 1,
    totalLines: 6,
    scriptStyle: 'language_challenge',
    dualVoiceEnabled: true,
    override: { variant: 'friends-chat', labels: ['Alex', 'Mia'] },
  });
  const namedSvg = build2411CardSvg({ spec: namedSpec, width: 720, height: 1280 });
  assert.ok(namedSvg.includes('>Alex<'));
  assert.ok(namedSvg.includes('>Mia<'));

  // 4. Multi-frame SVG animation varies talking mouth/hand and 3-dot thinking indicator
  const animFrames = ([0, 1, 2, 3] as const).map((animFrame) =>
    build2411CardSvg({
      spec: namedSpec,
      width: 720,
      height: 1280,
      animFrame,
      speakerAPose: 'idle',
      speakerBPose: 'thinking',
      countdownActive: true,
    })
  );
  assert.equal(new Set(animFrames).size, 4, 'Thinking animation frames 0..3 must all differ');

  // 5. showRoleBadges defaults to hidden in buildAssFromCues unless explicitly enabled
  const baseCues = [
    {
      index: 1,
      startSec: 0,
      endSec: 3,
      text: '今から日本語を読み上げます。',
      voiceSlot: 'primary' as const,
      roleKind: 'title' as const,
      roleLabel: 'Intro',
      contextLabel: 'Timing',
    },
  ];
  const baseSubCfg: SubtitleConfig = {
    enabled: true,
    fontName: 'M PLUS 1p',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 38,
    sourceFontSize: 28,
    textColor: '#0F172A',
    highlightColor: '#4F46E5',
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
    boxStyle: 'outline',
    effect: 'karaoke',
  };
  const assDefault = buildAssFromCues(baseCues, baseSubCfg, 720, 1280);
  const assWithBadge = buildAssFromCues(baseCues, { ...baseSubCfg, showRoleBadges: true }, 720, 1280);
  assert.equal(assDefault.includes('Dialogue: 3,0:00:00.00,0:00:03.00,RoleBadge'), false);
  assert.equal(assWithBadge.includes('RoleBadge,,0,0,0,,'), true);

  // 6. planNarrationSegments preserves rawLineIndex across split sentences, repeats, and summary
  const segs = planNarrationSegments({
    script: [
      'Tiêu đề: 今から日本語を読み上げます。5秒以内に英語で言ってみましょう！',
      'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
      'English: Watch out for her!',
      'Q: 「無理しないでね」はどう言いますか？ [PAUSE]',
      'English: Take it easy!',
      'Outro: お疲れ様でした！',
    ].join('\n'),
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 5,
    targetRepeatCount: 1,
    fullAnswerRecapMode: 'off',
    summarizeAtEnd: true,
  });
  const q1Seg = segs.find((s) => s.text.includes('彼女には気をつけて'));
  const a1Segs = segs.filter((s) => s.text === 'Watch out for her!');
  const q2Seg = segs.find((s) => s.text.includes('無理しないでね'));
  const sumSeg = segs.find((s) => s.segmentKind === 'summary');
  assert.equal(q1Seg?.rawLineIndex, 1);
  assert.equal(a1Segs.length, 2);
  assert.ok(a1Segs.every((s) => s.rawLineIndex === 2));
  assert.equal(q2Seg?.rawLineIndex, 3);
  assert.equal(sumSeg?.rawLineIndex, undefined);

  // 7. Smooth 2411 transition pool never uses harsh wipes/pixelize
  for (let i = 0; i < 12; i++) {
    const tr = resolveSmooth2411XfadeTransition('random', i, 42);
    assert.ok((SMOOTH_2411_XFADE_POOL as readonly string[]).includes(tr), `Unexpected harsh transition: ${tr}`);
  }
  assert.equal(resolveSmooth2411XfadeTransition('fade', 0, 0), 'fade');
});

test('Studio 2411 filters Lesson Topic labels, preserves unbroken PR tokens, and shrinks short friends-chat bubbles', () => {
  assert.equal(isGenericSpeakerLabel('Lesson Topic'), true);
  assert.equal(isGenericSpeakerLabel('Topic'), true);
  assert.equal(isGenericSpeakerLabel('Host'), true);
  assert.equal(isGenericSpeakerLabel('先輩'), false);
  assert.equal(isGenericSpeakerLabel('Alex'), false);

  const wrappedPr = wrapSvgCardLines('面接時、日本語で自己PRする方法', 12, 3);
  assert.ok(wrappedPr.every((ln) => !ln.endsWith('P') && !ln.startsWith('R')));
  assert.ok(wrappedPr.join('').includes('PR'));

  const introSpec = build2411CardSpecForLine({
    rawLine: 'Tiêu đề: 面接時、日本語で自己PRする方法',
    lineIndex: 0,
    totalLines: 6,
    isSecondarySlot: false,
    isIntroOrOutro: true,
    scriptStyle: 'language_challenge',
    dualVoiceEnabled: true,
    themeId: 'cards_pastel',
    override: { variant: 'friends-chat', labels: ['Lesson Topic', ''] },
  });
  assert.equal(introSpec.labels[0], '');

  const shortSvg = build2411CardSvg({
    spec: {
      ...introSpec,
      speechText: 'こんにちは',
      reactionText: '',
      exampleText: '',
      prevTargetText: '',
      promptPreviewText: '',
    },
    width: 720,
    height: 1280,
  });
  const longSvg = build2411CardSvg({
    spec: {
      ...introSpec,
      speechText: '面接で自分の強みとこれまでの経験を分かりやすく具体的に自己PRする方法を一緒に練習しましょう。',
      reactionText: '',
      exampleText: '',
      prevTargetText: '',
      promptPreviewText: '',
    },
    width: 720,
    height: 1280,
  });

  assert.equal(shortSvg.includes('Lesson Topic'), false);
  assert.equal(shortSvg.includes('Lesson Topi'), false);
  // Extract bubble rect height from first friends-chat bubble (height="..." ... rx="16")
  const extractHeights = (svg: string) =>
    Array.from(svg.matchAll(/<rect[^>]+height="(\d+)"[^>]+rx="16"/g)).map((m) => Number(m[1]));
  const shortH = Math.max(...extractHeights(shortSvg));
  const longH = Math.max(...extractHeights(longSvg));
  assert.ok(shortH > 0 && shortH < longH - 20, `Expected compact short bubble (${shortH}) < long bubble (${longH})`);
});

test('VOICE_CATALOG exposes Edge Neural voices across vi/ja/en with explicit TTS labels and legacy el-* guard', () => {
  assert.ok(VOICE_CATALOG.length >= 15, `Expected at least 15 catalog voices, got ${VOICE_CATALOG.length}`);
  const edgeVoices = VOICE_CATALOG.filter((v) => v.ttsProvider === 'edge_auto');
  assert.equal(edgeVoices.length, VOICE_CATALOG.length);

  for (const v of VOICE_CATALOG) {
    const formatted = formatVoiceOptionLabel(v);
    assert.ok(formatted.startsWith(`[${v.ttsLabel}] `), `Voice label missing TTS tag: ${formatted}`);
    assert.equal(getVoiceCatalogItem(v.id)?.id, v.id);
    assert.equal(isElevenLabsVoiceId(v.id), false);
  }

  assert.equal(isElevenLabsVoiceId('el-rachel'), true);
  assert.equal(isElevenLabsVoiceId('ja-JP-DaichiNeural'), false);
  assert.equal(doesVoiceMatchLanguage('vi-VN-HoaiMyNeural', 'vi'), true);
  assert.equal(doesVoiceMatchLanguage('ja-JP-DaichiNeural', 'ja'), true);
  assert.equal(doesVoiceMatchLanguage('en-US-JennyNeural', 'en'), true);
});

test('planNarrationSegments preserves Edge primary/secondary voices, extracts [check_fridge_panic], and embeds emotion tags in SRT', () => {
  const lineWithEmotion = 'A: [check_fridge_panic] 「冷蔵庫が空っぽだ！」を英語で言うと？ [PAUSE]';
  assert.equal(extractInlineEmotionTag(lineWithEmotion), 'check_fridge_panic');
  assert.equal(
    stripNarrationTags(lineWithEmotion),
    '「冷蔵庫が空っぽだ！」を英語で言うと？'
  );

  const segs = planNarrationSegments({
    script: [
      lineWithEmotion,
      'B: [relieved] The fridge is completely empty!',
    ].join('\n'),
    language: 'ja_en',
    scriptStyle: 'language_challenge',
    voiceId: 'ja-JP-NanamiNeural',
    dualVoiceEnabled: true,
    secondaryVoiceId: 'en-US-JennyNeural',
    pauseBetweenLinesSec: 5,
  });

  assert.equal(segs.length, 2);
  assert.equal(segs[0].voiceId, 'ja-JP-NanamiNeural');
  assert.equal(segs[0].voiceSlot, 'primary');
  assert.equal(segs[0].emotionTag, 'check_fridge_panic');
  assert.equal(segs[0].text.includes('check_fridge_panic'), false);
  assert.equal(segs[1].voiceId, 'en-US-JennyNeural');
  assert.equal(segs[1].voiceSlot, 'secondary');
  assert.equal(segs[1].emotionTag, 'relieved');
  assert.equal(segs[1].text.includes('relieved'), false);

  const timings: RawSegmentTiming[] = [
    {
      text: segs[0].text,
      voiceSlot: 'primary',
      emotionTag: segs[0].emotionTag,
      startSec: 0,
      endSec: 2.4,
    },
    {
      text: segs[1].text,
      voiceSlot: 'secondary',
      emotionTag: segs[1].emotionTag,
      startSec: 2.6,
      endSec: 4.9,
    },
  ];
  const srt = buildSrtFromCues(buildDualSubtitleCues(timings));
  assert.ok(srt.includes('[check_fridge_panic]'), `Expected [check_fridge_panic] in SRT:\n${srt}`);
  assert.ok(srt.includes('[relieved]'), `Expected [relieved] in SRT:\n${srt}`);
});

test('friends-chat and dualVoiceEnabled suppress Hint strip and prevTargetText in Studio 2411 card spec', () => {
  const friendsChatSpec = build2411CardSpecForLine({
    rawLine: 'B: Watch out for her!',
    lineIndex: 1,
    totalLines: 4,
    isSecondarySlot: true,
    dualVoiceEnabled: true,
    scriptStyle: 'language_challenge',
    override: { variant: 'friends-chat' },
    prevTargetText: '彼女には気をつけて！',
  });

  assert.equal(friendsChatSpec.variant, 'friends-chat');
  assert.equal(friendsChatSpec.exampleText, undefined);
  assert.equal(friendsChatSpec.prevTargetText, undefined);
});

test('friends-chat answer card expands >= 1/3 frame height and wraps long English target answers without truncation', () => {
  const longEnglishAnswer =
    "Take it easy and don't push yourself too hard when everything feels overwhelming!";
  const answerSpec = build2411CardSpecForLine({
    rawLine: `English: ${longEnglishAnswer}`,
    lineIndex: 2,
    totalLines: 6,
    isSecondarySlot: true,
    dualVoiceEnabled: true,
    scriptStyle: 'language_challenge',
    override: { variant: 'friends-chat' },
    promptPreviewText: 'Khi mọi thứ quá tải thì đừng tự ép bản thân quá mức nhé!',
  });

  const portraitSvg = build2411CardSvg({
    spec: answerSpec,
    width: 720,
    height: 1280,
    speakerAPose: 'idle',
    speakerBPose: 'talking',
  });

  assert.equal(portraitSvg.includes('…'), false, 'Long English answer must not be ellipsized');
  assert.equal(portraitSvg.includes('...'), false, 'Long English answer must not truncate with ...');
  assert.equal(portraitSvg.includes('NaN'), false);
  assert.equal(portraitSvg.includes('undefined'), false);

  // Outer card rect carries stroke-width="2.5"; confirm card height >= 33% of 1280 (~1/3 frame height)
  const cardMatch = portraitSvg.match(/<rect x="36" y="\d+" width="648" height="(\d+)"[^>]+stroke-width="2\.5"/);
  assert.ok(cardMatch, 'Expected outer friends-chat card rect in portrait SVG');
  const outerCardH = Number(cardMatch[1]);
  assert.ok(
    outerCardH >= Math.round(1280 * 0.33),
    `Expected friends-chat Q&A card height (${outerCardH}) >= 1/3 of 1280 (${Math.round(1280 * 0.33)})`
  );

  // Confirm words from start & end of the long English sentence all render in SVG tspans/text
  assert.ok(portraitSvg.includes('Take it easy'));
  assert.ok(portraitSvg.includes('overwhelming!'));
});

test('buildContextualSceneComponentsForScript pairs [VI] prompt with [EN] answer without duplicating English into Speaker A', () => {
  const script = [
    'Tiêu đề: Thực hành phản xạ tiếng Anh mỗi ngày!',
    '[VI] Câu 1: Khi mọi thứ quá tải thì đừng tự ép bản thân quá mức nhé! [PAUSE]',
    '[EN] Take it easy and do not push yourself too hard when everything feels overwhelming!',
    'Outro: Lưu video lại để luyện tập thêm nhé!',
  ].join('\n');

  const comps = buildContextualSceneComponentsForScript({
    script,
    scriptStyle: 'language_challenge',
    dualVoiceEnabled: true,
    pauseBetweenLinesSec: 5,
  });

  assert.equal(comps.length, 4);
  assert.equal(comps[1].promptPreviewText, undefined);
  assert.equal(
    comps[2].promptPreviewText,
    'Câu 1: Khi mọi thứ quá tải thì đừng tự ép bản thân quá mức nhé!'
  );
  assert.equal(
    comps[2].speechText,
    'Take it easy and do not push yourself too hard when everything feels overwhelming!'
  );

  const answerSpec = build2411CardSpecForLine({
    rawLine: '[EN] Take it easy and do not push yourself too hard when everything feels overwhelming!',
    lineIndex: 2,
    totalLines: 4,
    isSecondarySlot: true,
    dualVoiceEnabled: true,
    scriptStyle: 'language_challenge',
    override: comps[2],
  });
  const svg = build2411CardSvg({ spec: answerSpec, width: 720, height: 1280 });
  assert.ok(svg.includes('Khi mọi thứ quá tải'));
  assert.ok(svg.includes('overwhelming!'));
});

