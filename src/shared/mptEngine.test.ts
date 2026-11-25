import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssFromCues,
  buildCountdownCues,
  buildMediaClipsPlan,
  buildMoneyPrinterPrompt,
  buildScenePromptsFromScript,
  buildSmartVietnameseScriptFromFacts,
  buildSrtFromCues,
  detectLineLanguage,
  doesVoiceMatchLanguage,
  extractEnglishSearchTerms,
  generateOfflineVietnameseScript,
  getCanvasDimensions,
  getDefaultSecondaryVoiceForLanguage,
  getDefaultVoiceForLanguage,
  getPresetsForLanguage,
  getQualityEncodingParams,
  getScriptLengthSummary,
  getSubtitleWrapBudget,
  hasVietnameseDiacritics,
  hexToAssBgr,
  isBilingualLanguage,
  isKnownPresetSubject,
  parseAiWebOrJsonOutput,
  planNarrationSegments,
  safeParseJsonResponse,
  splitCueIntoShortSubCues,
  splitScriptSentences,
  stripNarrationTags,
  tokenizeSubtitleForEffect,
  validateRenderConfig,
  wrapSubtitleLine,
} from './mptEngine';
import { RenderJobConfig, SubtitleConfig } from './types';

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

test('generateOfflineVietnameseScript generates bilingual language_challenge scripts with Intro, [PAUSE] Q&A, and Outro', () => {
  const viEn = generateOfflineVietnameseScript('Phản xạ tiếng Anh', 'bilingual', 6, undefined, 'language_challenge');
  const viEnLines = viEn.script.split('\n');
  assert.equal(viEnLines.length, 6);
  assert.ok(viEnLines[0].includes('Chào mừng') || viEnLines[0].includes('Sẵn sàng'));
  assert.ok(viEn.script.includes('[PAUSE]'));
  assert.ok(viEn.script.includes('[EN]'));
  assert.ok(viEnLines[viEnLines.length - 1].includes('Lưu video') || viEnLines[viEnLines.length - 1].includes('bình luận'));

  const viJa = generateOfflineVietnameseScript('Tiếng Nhật giao tiếp', 'vi_ja', 6, undefined, 'language_challenge');
  const viJaLines = viJa.script.split('\n');
  assert.equal(viJaLines.length, 6);
  assert.ok(viJaLines[0].includes('sẵn sàng'));
  assert.ok(viJa.script.includes('[JA]'));
  assert.ok(viJaLines[viJaLines.length - 1].includes('Lưu video'));

  const jaEn = generateOfflineVietnameseScript('瞬間英作文', 'ja_en', 6, undefined, 'language_challenge');
  const jaEnLines = jaEn.script.split('\n');
  assert.equal(jaEnLines.length, 6);
  assert.ok(jaEnLines[0].includes('チャレンジ'));
  assert.ok(jaEn.script.includes('[JA]'));
  assert.ok(jaEn.script.includes('[EN]'));
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


