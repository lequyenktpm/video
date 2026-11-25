import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIME_STORY_PRESETS,
  computeAnimeRigStates,
  DEFAULT_ANIME_DIALOGUE_SCRIPT,
  parseAnimeDialogueScript,
  renderAnimeBeatSvgFrame,
  wrapAnimeBubbleLines,
} from './animeStoryEngine';

test('parseAnimeDialogueScript detects characters, off-stage arrival door cue, emotions, and inline acting notes', () => {
  const story = parseAnimeDialogueScript(DEFAULT_ANIME_DIALOGUE_SCRIPT);

  assert.equal(story.title, '会話 1: 親しき中にも礼儀あり');
  assert.deepEqual(
    story.characters.map((c) => c.id),
    ['先輩', '芳蘭', '日向']
  );

  // Male characters sharing KeitaNeural still have clearly differentiated pitch ratios
  const senpai = story.characters.find((c) => c.id === '先輩')!;
  const houran = story.characters.find((c) => c.id === '芳蘭')!;
  const hinata = story.characters.find((c) => c.id === '日向')!;
  assert.equal(senpai.gender, 'male');
  assert.equal(houran.gender, 'female');
  assert.equal(hinata.gender, 'male');
  assert.ok(senpai.pitchRatio < 0.96);
  assert.ok(hinata.pitchRatio > 1.08);

  // Beat 0: opening stage cue in Senpai's room -> only Senpai & Houran are present initially!
  const openingCue = story.beats[0];
  assert.equal(openingCue.isStageCue, true);
  assert.deepEqual(openingCue.presentCharacterIds, ['先輩', '芳蘭']);
  assert.equal(openingCue.doorOpen, false);

  // Beat before Hinata arrives keeps Hinata off-stage
  const arrivalIdx = story.beats.findIndex((b) => b.isStageCue && b.doorOpen);
  assert.ok(arrivalIdx > 3, 'Expected entrance cue after opening dialogue');
  assert.equal(story.beats[arrivalIdx - 1].presentCharacterIds.includes('日向'), false);

  // Arrival beat slides door open and introduces 日向 with walk_in animation
  const arrivalBeat = story.beats[arrivalIdx];
  assert.equal(arrivalBeat.doorOpen, true);
  assert.equal(arrivalBeat.enteringCharacterId, '日向');
  assert.ok(arrivalBeat.presentCharacterIds.includes('日向'));

  // Inline acting cue （小声で） is stripped from spokenText and sets whisper emotion + lean_whisper action
  const whisperBeat = story.beats.find((b) => b.speakerId === '芳蘭' && b.emotion === 'whisper');
  assert.ok(whisperBeat, 'Expected whisper beat for 芳蘭');
  assert.equal(whisperBeat.actingNote, '小声で');
  assert.equal(whisperBeat.spokenText.includes('小声で'), false);
  assert.equal(whisperBeat.action, 'lean_whisper');
  assert.equal(whisperBeat.fx, 'whisper_wave');

  // Deep bow apology & wry smile cue
  const bowBeat = story.beats.find((b) => b.speakerId === '日向' && b.action === 'bow_deep');
  assert.ok(bowBeat, 'Expected deep bow apology beat for 日向');
  const wryBeat = story.beats.find((b) => b.speakerId === '日向' && b.emotion === 'wry_smile');
  assert.ok(wryBeat, 'Expected wry smile beat at the end');
  assert.equal(wryBeat.actingNote, '苦笑い');
  assert.equal(wryBeat.spokenText.includes('苦笑い'), false);
});

test('computeAnimeRigStates animates active mouthPhase, walk_in trajectory, and silence closing', () => {
  const story = parseAnimeDialogueScript(DEFAULT_ANIME_DIALOGUE_SCRIPT);
  const hinataEnterBeat = story.beats.find((b) => b.isStageCue && b.enteringCharacterId === '日向')!;

  const enterStart = computeAnimeRigStates({
    story,
    beat: hinataEnterBeat,
    timeSec: 0.1,
    beatProgress: 0.05,
    width: 720,
    height: 1280,
    isPlayingSpeech: false,
  });
  const enterEnd = computeAnimeRigStates({
    story,
    beat: hinataEnterBeat,
    timeSec: 1.5,
    beatProgress: 0.95,
    width: 720,
    height: 1280,
    isPlayingSpeech: false,
  });
  const hinataStart = enterStart.find((r) => r.profile.id === '日向')!;
  const hinataEnd = enterEnd.find((r) => r.profile.id === '日向')!;
  assert.ok(hinataStart.x > hinataEnd.x + 80, 'Hinata must walk onto stage from the right door');

  const talkBeat = story.beats.find((b) => !b.isStageCue && b.speakerId === '先輩')!;
  const talkingA = computeAnimeRigStates({
    story,
    beat: talkBeat,
    timeSec: 0.14,
    beatProgress: 0.2,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  });
  const talkingB = computeAnimeRigStates({
    story,
    beat: talkBeat,
    timeSec: 0.27,
    beatProgress: 0.4,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  });
  const silent = computeAnimeRigStates({
    story,
    beat: talkBeat,
    timeSec: 0.27,
    beatProgress: 0.9,
    width: 720,
    height: 1280,
    isPlayingSpeech: false,
  });
  const senpaiA = talkingA.find((r) => r.profile.id === '先輩')!;
  const houranA = talkingA.find((r) => r.profile.id === '芳蘭')!;
  const senpaiB = talkingB.find((r) => r.profile.id === '先輩')!;
  const senpaiSilent = silent.find((r) => r.profile.id === '先輩')!;

  assert.equal(senpaiA.isSpeaking, true);
  assert.equal(houranA.isSpeaking, false, 'Only the active speaker moves their mouth');
  assert.notEqual(senpaiA.mouthPhase, senpaiB.mouthPhase);
  assert.equal(senpaiSilent.isSpeaking, false);
  assert.equal(senpaiSilent.mouthPhase, 0);
});

test('renderAnimeBeatSvgFrame generates valid SVGs across 9:16, 16:9, 1:1 and preserves ASCII tokens in bubble wrapping', () => {
  const story = parseAnimeDialogueScript(ANIME_STORY_PRESETS[2].script);
  assert.equal(story.characters.length, 3);
  const talkBeat = story.beats.find((b) => !b.isStageCue)!;

  for (const [w, h] of [
    [720, 1280],
    [1280, 720],
    [1080, 1080],
  ]) {
    const svgA = renderAnimeBeatSvgFrame({
      story,
      beat: talkBeat,
      timeSec: 0.15,
      beatProgress: 0.25,
      width: w,
      height: h,
      sceneStyle: 'room_warm',
      isPlayingSpeech: true,
    });
    const svgB = renderAnimeBeatSvgFrame({
      story,
      beat: talkBeat,
      timeSec: 0.48,
      beatProgress: 0.65,
      width: w,
      height: h,
      sceneStyle: 'dramatic_anime',
      isPlayingSpeech: true,
    });
    assert.ok(svgA.startsWith('<svg ') && svgA.endsWith('</svg>'));
    assert.ok(svgA.includes(`viewBox="0 0 ${w} ${h}"`));
    assert.notEqual(svgA, svgB, `Animated SVG frames must change over time for ${w}x${h}`);
  }

  const wrapped = wrapAnimeBubbleLines('日向君、よほどのKYね。先輩怒ってるの？', 11);
  assert.ok(wrapped.every((ln) => !ln.endsWith('K') && !ln.startsWith('Y')));
  assert.ok(wrapped.join('').includes('KY'));
});
