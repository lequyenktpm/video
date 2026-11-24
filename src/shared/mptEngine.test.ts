import test from 'node:test';
import assert from 'node:assert/strict';
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
  hexToAssBgr,
  parseAiWebOrJsonOutput,
  splitCueIntoShortSubCues,
  splitScriptSentences,
  validateRenderConfig,
} from './mptEngine';
import { RenderJobConfig } from './types';

test('getCanvasDimensions returns exact HD dimensions for 9:16, 16:9, and 1:1', () => {
  assert.deepEqual(getCanvasDimensions('9:16'), { width: 720, height: 1280 });
  assert.deepEqual(getCanvasDimensions('16:9'), { width: 1280, height: 720 });
  assert.deepEqual(getCanvasDimensions('1:1'), { width: 720, height: 720 });
});

test('splitScriptSentences splits Vietnamese narration cleanly under maxLen', () => {
  const text =
    'Bạn có biết đại dương sâu thẳm chứa rất nhiều bí ẩn? Hãy cùng khám phá ngay bây giờ, từng lớp nước xanh thẳm sẽ hé lộ những sinh vật phát sáng kỳ diệu chưa từng thấy.';
  const chunks = splitScriptSentences(text, 90);
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 90, `Chunk exceeded 90 chars: ${chunk}`);
  }
});

test('splitCueIntoShortSubCues breaks long sentences into 1-2 line timed beats', () => {
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
});

test('hexToAssBgr converts RGB hex colors to ASS BBGGRR format', () => {
  assert.equal(hexToAssBgr('#FACC15'), '&H0015CCFA');
  assert.equal(hexToAssBgr('#FFFFFF'), '&H00FFFFFF');
  assert.equal(hexToAssBgr('invalid'), '&H00FFFFFF');
});

test('buildAssFromCues supports outline and dark_box styles with Vietnamese UTF-8', () => {
  const cues = [
    { index: 1, startSec: 0, endSec: 3.5, text: 'Khám phá đại dương xanh thẳm' },
    { index: 2, startSec: 3.5, endSec: 7.2, text: 'Ánh sáng mặt trời chỉ xuống được 200m.' },
  ];

  const srt = buildSrtFromCues(cues);
  assert.ok(srt.includes('00:00:00,000 --> 00:00:03,500'));

  const assOutline = buildAssFromCues(
    cues,
    {
      enabled: true,
      fontName: 'DejaVu Sans',
      position: 'bottom',
      customPositionPct: 84,
      fontSize: 42,
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2.2,
      boxStyle: 'outline',
    },
    720,
    1280
  );
  assert.ok(assOutline.includes('PlayResX: 720'));
  assert.ok(assOutline.includes(',1,2.2,1,2,'));
  assert.ok(assOutline.includes('Khám phá đại dương'));
});

test('buildMoneyPrinterPrompt and parseAiWebOrJsonOutput parse JSON and plain AI Web text', () => {
  const prompt = buildMoneyPrinterPrompt({
    subject: 'Bí ẩn rãnh Mariana',
    language: 'vi',
    scriptStyle: 'curious_facts',
    sentenceCount: 4,
  });
  assert.ok(prompt.includes('scenePrompts'));
  assert.ok(prompt.includes('Bí ẩn rãnh Mariana'));

  const parsedJson = parseAiWebOrJsonOutput(
    '```json\n{"script":"Câu 1 hay.\\nCâu 2 bất ngờ.","terms":["mariana trench"],"scenePrompts":["deep ocean trench"]}\n```',
    'Bí ẩn rãnh Mariana'
  );
  assert.equal(parsedJson?.script, 'Câu 1 hay.\nCâu 2 bất ngờ.');
  assert.deepEqual(parsedJson?.terms, ['mariana trench']);
  assert.deepEqual(parsedJson?.scenePrompts, ['deep ocean trench']);

  const parsedArray = parseAiWebOrJsonOutput(
    '{"script":["Dòng 1 từ AI.","Dòng 2 từ AI."],"terms":["pyramids"]}',
    'Kim tự tháp'
  );
  assert.equal(parsedArray?.script, 'Dòng 1 từ AI.\nDòng 2 từ AI.');

  const parsedPlain = parseAiWebOrJsonOutput('1. Dòng đầu tiên rất hay.\n2. Dòng thứ hai về đại dương.', 'Đại dương');
  assert.ok(parsedPlain?.script.includes('Dòng đầu tiên rất hay.'));
  assert.ok((parsedPlain?.scenePrompts.length ?? 0) >= 2);
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
      strokeColor: '#000000',
      strokeWidth: 3,
      boxStyle: 'dark_box',
    },
  };

  assert.equal(validateRenderConfig(validConfig), null);
  assert.ok(validateRenderConfig({ ...validConfig, script: '   ' }) !== null);
});
