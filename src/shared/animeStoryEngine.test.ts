import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIME_STORY_PRESETS,
  computeAnimeRigStates,
  DEFAULT_ANIME_DIALOGUE_SCRIPT,
  detectRoomFromCue,
  parseAnimeDialogueScript,
  renderAnimeBeatSvgFrame,
  tokenizeAnimeKaraokeLine,
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
  assert.equal(openingCue.roomKind, 'room_living');
  assert.equal(openingCue.hasFridgeProp, true);

  // Beat 1: Senpai checks fridge and panics because Garigari-kun is gone!
  const fridgeBeat = story.beats[1];
  assert.equal(fridgeBeat.action, 'check_fridge_panic');
  assert.equal(fridgeBeat.fridgeOpen, true);

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

test('computeAnimeRigStates animates active mouthPhase, full-body leg strides, physical actions, and silence closing', () => {
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
  const enterMid = computeAnimeRigStates({
    story,
    beat: hinataEnterBeat,
    timeSec: 0.65,
    beatProgress: 0.35,
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
  const hinataMid = enterMid.find((r) => r.profile.id === '日向')!;
  const hinataEnd = enterEnd.find((r) => r.profile.id === '日向')!;
  assert.ok(hinataStart.x > hinataEnd.x + 80, 'Hinata must walk onto stage from the right door');
  assert.equal(hinataStart.facing, -1);
  assert.ok(Math.abs(hinataMid.leftThighAngle) > 8 || Math.abs(hinataMid.rightThighAngle) > 8, 'Walking stride must swing legs');

  // Check fridge panic: first turns left toward fridge, then recoils clutching head
  const fridgeBeat = story.beats[1];
  const fridgeInspect = computeAnimeRigStates({
    story,
    beat: fridgeBeat,
    timeSec: 0.25,
    beatProgress: 0.2,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  }).find((r) => r.profile.id === '先輩')!;
  const fridgeRecoil = computeAnimeRigStates({
    story,
    beat: fridgeBeat,
    timeSec: 1.0,
    beatProgress: 0.65,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  }).find((r) => r.profile.id === '先輩')!;
  assert.equal(fridgeInspect.facing, -1);
  assert.ok(fridgeInspect.bodyTiltDeg > 8);
  assert.equal(fridgeRecoil.facing, 1);
  assert.ok(fridgeRecoil.leftArmAngle < -100 && fridgeRecoil.rightArmAngle < -100, 'Clutching head in panic');

  // Deep bow bends torso & knees
  const bowBeat = story.beats.find((b) => b.action === 'bow_deep')!;
  const bowRig = computeAnimeRigStates({
    story,
    beat: bowBeat,
    timeSec: 0.8,
    beatProgress: 0.5,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  }).find((r) => r.profile.id === '日向')!;
  assert.ok(bowRig.bodyTiltDeg > 25 && bowRig.hipDropY > 8);
  assert.ok(bowRig.leftThighAngle < -8 && bowRig.leftShinAngle > 10);

  // Whisper leans close; confront leans forward aggressively
  const whisperBeat = story.beats.find((b) => b.action === 'lean_whisper')!;
  const whisperRig = computeAnimeRigStates({
    story,
    beat: whisperBeat,
    timeSec: 0.7,
    beatProgress: 0.6,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  }).find((r) => r.profile.id === '芳蘭')!;
  assert.ok(whisperRig.bodyTiltDeg > 10 && whisperRig.rightArmAngle < -90);

  const confrontBeat = story.beats.find((b) => b.action === 'lean_confront')!;
  const confrontRig = computeAnimeRigStates({
    story,
    beat: confrontBeat,
    timeSec: 0.7,
    beatProgress: 0.6,
    width: 720,
    height: 1280,
    isPlayingSpeech: true,
  }).find((r) => r.profile.id === '先輩')!;
  assert.ok(confrontRig.rightThighAngle < -10 && confrontRig.rightArmAngle < -70);

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

test('detectRoomFromCue and parseAnimeDialogueScript match story backdrops, multi-scene transitions, and roomOverride', () => {
  assert.equal(detectRoomFromCue('午後の静かなカフェで', 'room_living'), 'cafe_corner');
  assert.equal(detectRoomFromCue('Tại phòng nghỉ công ty', 'room_living'), 'office_desk');
  assert.equal(detectRoomFromCue('Trong lớp học sau giờ tan trường', 'room_living'), 'school_classroom');
  assert.equal(detectRoomFromCue('Cả hai đi bộ ra công viên gần trường', 'school_classroom'), 'street_park');
  assert.equal(detectRoomFromCue('駅前の居酒屋で乾杯', 'room_living'), 'restaurant_izakaya');
  assert.equal(detectRoomFromCue('Nhà ga tàu điện buổi tối', 'room_living'), 'train_station');
  assert.equal(detectRoomFromCue('台所の冷蔵庫の前で', 'room_living'), 'kitchen_fridge');

  const cafeStory = parseAnimeDialogueScript(ANIME_STORY_PRESETS[1].script);
  assert.ok(cafeStory.beats.every((b) => b.roomKind === 'cafe_corner'));
  assert.equal(cafeStory.beats[0].hasFridgeProp, false);

  const officeStory = parseAnimeDialogueScript(ANIME_STORY_PRESETS[2].script);
  assert.ok(officeStory.beats.every((b) => b.roomKind === 'office_desk'));
  assert.equal(officeStory.beats[0].hasFridgeProp, true);

  const multiSceneStory = parseAnimeDialogueScript(ANIME_STORY_PRESETS[3].script);
  assert.equal(multiSceneStory.beats[0].roomKind, 'school_classroom');
  assert.equal(multiSceneStory.beats[1].roomKind, 'school_classroom');
  const parkCueIdx = multiSceneStory.beats.findIndex((b) => b.isStageCue && b.roomKind === 'street_park');
  assert.ok(parkCueIdx > 2, 'Expected mid-story stage cue switching from school_classroom to street_park');
  assert.equal(multiSceneStory.beats[parkCueIdx + 1].roomKind, 'street_park');

  const forcedStory = parseAnimeDialogueScript(ANIME_STORY_PRESETS[3].script, undefined, {
    roomOverride: 'train_station',
  });
  assert.ok(forcedStory.beats.every((b) => b.roomKind === 'train_station'));
});

test('renderAnimeBeatSvgFrame generates full-body SVGs, karaoke tspans, and preserves ASCII tokens in bubble wrapping', () => {
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
      subtitleEffect: 'karaoke',
      highlightColor: '#FACC15',
    });
    const svgB = renderAnimeBeatSvgFrame({
      story,
      beat: talkBeat,
      timeSec: 0.48,
      beatProgress: 0.78,
      width: w,
      height: h,
      sceneStyle: 'dramatic_anime',
      isPlayingSpeech: true,
      subtitleEffect: 'karaoke',
      highlightColor: '#4F46E5',
    });
    assert.ok(svgA.startsWith('<svg ') && svgA.endsWith('</svg>'));
    assert.ok(svgA.includes(`viewBox="0 0 ${w} ${h}"`));
    assert.equal(svgA.includes('<tspan fill="#FACC15">'), false, 'Low-contrast yellow must auto-adapt on light bubble');
    assert.ok(svgA.includes('<tspan fill="#'), 'Expected karaoke highlight tspan in speech bubble');
    assert.ok(svgB.includes('<tspan fill="#4F46E5">'), 'Expected crisp dark highlightColor preserved on light bubble');
    assert.notEqual(svgA, svgB, `Animated SVG frames must change over time for ${w}x${h}`);
  }

  const wrapped = wrapAnimeBubbleLines('日向君、よほどのKYね。先輩怒ってるの？', 11);
  assert.ok(wrapped.every((ln) => !ln.endsWith('K') && !ln.startsWith('Y')));
  assert.ok(wrapped.join('').includes('KY'));
  const jaTokens = tokenizeAnimeKaraokeLine('日向君、よほどのKYね');
  assert.ok(jaTokens.includes('KY'));
});
