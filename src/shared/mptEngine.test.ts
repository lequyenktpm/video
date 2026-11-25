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
  generateOfflineVietnameseScript,
  getCanvasDimensions,
  getDefaultSecondaryVoiceForLanguage,
  getDefaultVoiceForLanguage,
  getNeutralBgThemeMeta,
  getPresetsForLanguage,
  getQualityEncodingParams,
  getScriptLengthSummary,
  getSubtitleWrapBudget,
  hasVietnameseDiacritics,
  hexToAssBgr,
  isBilingualLanguage,
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
  resolveXfadeTransition,
  safeParseJsonResponse,
  sanitizeSceneComponentsList,
  slugifyOutputFilename,
  splitCueIntoShortSubCues,
  splitScriptSentences,
  splitTtsTextChunks,
  stripNarrationTags,
  tokenizeSubtitleForEffect,
  updateScriptLinePreservingTag,
  validateRenderConfig,
  wrapSubtitleLine,
  RawSegmentTiming,
} from './mptEngine';
import {
  build2411CardSpecForLine,
  build2411CardSvg,
  buildContextualSceneComponentsForScript,
  STUDIO_2411_ANIMATION_OPTIONS,
  STUDIO_2411_THEMES,
  STUDIO_2411_VARIANT_OPTIONS,
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
  assert.ok(ass.includes('Dialogue: 1,0:00:10.00,0:00:11.00,Countdown,,0,0,0,,'));
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

test('analyzeScriptLinePresentation and detectLineContextVisual identify roles and clean icons', () => {
  const titlePres = analyzeScriptLinePresentation('Tiêu đề: 1分瞬間英作文チャレンジ！');
  assert.equal(titlePres.roleKind, 'title');
  assert.equal(titlePres.roleLabel, 'Mở đầu');
  assert.equal(titlePres.roleIconKey, 'megaphone');
  assert.equal(titlePres.roleTone, 'sky');

  const questionPres = analyzeScriptLinePresentation('Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]');
  assert.equal(questionPres.roleKind, 'question');
  assert.equal(questionPres.roleLabel, 'Người hỏi');
  assert.equal(questionPres.roleIconKey, 'hand_raise');
  assert.equal(questionPres.contextIconKey, 'alert_triangle');
  assert.equal(questionPres.hasPause, true);

  const answerPres = analyzeScriptLinePresentation('English: Watch out for her!');
  assert.equal(answerPres.roleKind, 'answer');
  assert.equal(answerPres.roleLabel, 'Người trả lời');
  assert.equal(answerPres.roleIconKey, 'chat_quote');
  assert.equal(answerPres.roleTone, 'emerald');
  assert.equal(answerPres.contextIconKey, 'alert_triangle');

  const outroPres = analyzeScriptLinePresentation('Outro: Hãy lưu video để ôn tập nhé!');
  assert.equal(outroPres.roleKind, 'outro');
  assert.equal(outroPres.roleLabel, 'Kết bài');
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

test('buildAssFromCues emits RoleBadge and CountdownMeta vector progress bar alongside Countdown', () => {
  const cues = [
    {
      index: 1,
      startSec: 0,
      endSec: 5,
      text: '「彼女には気をつけて！」を英語で言えますか？',
      voiceSlot: 'primary' as const,
      isStickySource: false,
      roleKind: 'question' as const,
      roleLabel: 'Người hỏi',
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

  const ass = buildAssFromCues(cues, subCfg, 720, 1280);
  assert.ok(ass.includes('Style: RoleBadge,'));
  assert.ok(ass.includes('Style: CountdownMeta,'));
  assert.ok(ass.includes(',RoleBadge,'));
  assert.ok(ass.includes('● Người hỏi'));
  assert.ok(ass.includes('THINK'));
  assert.ok(ass.includes('\\p1'));
  assert.ok(ass.includes('\\p0'));

  const assNoBadges = buildAssFromCues(cues, { ...subCfg, showRoleBadges: false }, 720, 1280);
  assert.equal(assNoBadges.includes(',RoleBadge,'), false);
});

test('STUDIO_2411_THEMES, build2411CardSpecForLine, and build2411CardSvg build clean study card SVGs', () => {
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
  assert.equal(spec.iconKey, 'alert_triangle');
  assert.equal(spec.hasPause, true);
  assert.equal(spec.pauseSec, 5);

  const svg = build2411CardSvg({
    spec,
    width: 720,
    height: 1280,
  });
  assert.ok(svg.startsWith('<svg '));
  assert.ok(svg.includes('LISTEN &amp; TRANSLATE'));
  assert.ok(svg.includes('思考タイム · 5s'));
  assert.ok(svg.includes('#F5F3FF'));
  assert.equal(svg.includes('undefined'), false);
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

test('all 14 Studio 2411 variants (including dialogue avatars) render distinct SVGs and AI planner avoids repetition', () => {
  assert.equal(STUDIO_2411_VARIANT_OPTIONS.length, 14);
  assert.equal(STUDIO_2411_ANIMATION_OPTIONS.length, 4);

  const svgsByVariant = new Set<string>();
  const animChoices: Studio2411AnimationIn[] = STUDIO_2411_ANIMATION_OPTIONS.map((o) => o.id);
  for (let i = 0; i < STUDIO_2411_VARIANT_OPTIONS.length; i++) {
    const v = STUDIO_2411_VARIANT_OPTIONS[i].id;
    const anim: Studio2411AnimationIn = animChoices[i % animChoices.length];
    const spec = build2411CardSpecForLine({
      rawLine: 'A: 私の長所は積極性です。 [PAUSE]',
      lineIndex: i,
      totalLines: 14,
      scriptStyle: 'language_challenge',
      themeId: i % 2 === 0 ? 'cards_pastel' : 'word_reveal_dark',
      defaultPauseSec: 5,
      override: {
        variant: v,
        animationIn: anim,
        title: `Tiêu đề ${v}`,
        labels: ['Interviewer', 'Candidate', 'Follow-up'],
        highlightWord: 'Proactive',
        formula: 'Subject + Verb',
        speechText: 'What is your biggest strength?',
        reactionText: 'Natural!',
        progressPct: 72,
      },
    });
    assert.equal(spec.variant, v);
    assert.equal(spec.animationIn, anim);
    assert.equal(spec.speechText, 'What is your biggest strength?');
    assert.equal(spec.reactionText, 'Natural!');

    const svg = build2411CardSvg({ spec, width: 720, height: 1280 });
    assert.ok(svg.startsWith('<svg '));
    assert.equal(svg.includes('undefined'), false);
    assert.equal(svg.includes('NaN'), false);
    svgsByVariant.add(svg);
  }
  assert.equal(svgsByVariant.size, 14, 'All 14 variants must produce distinct SVG visuals');

  const dialogueScript = [
    'Tiêu đề: Phỏng vấn tiếng Nhật - Anh [PAUSE]',
    'Q: あなたの長所と短所を教えてください。 [PAUSE]',
    'English: Please tell me your strengths and weaknesses.',
    'A: 私の長所は積極性です。',
    'English: Instead of very good, say proactive!',
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
  const usedVariants = new Set(planned.map((p) => p.variant));
  assert.ok(
    usedVariants.has('friends-chat') || usedVariants.has('avatar-speech') || usedVariants.has('dialogue-upgrade'),
    'Dialogue/interview script automatically selects character dialogue variants'
  );

  const sanitized = sanitizeSceneComponentsList([
    {
      variant: 'friends-chat',
      animationIn: 'pop-up',
      labels: ['Alex', 'Mia'],
      speechText: 'Could I get an iced latte?',
      reactionText: 'Polite!',
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
  assert.equal(sanitized[0].speechText, 'Could I get an iced latte?');
  assert.equal(sanitized[0].reactionText, 'Polite!');
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





