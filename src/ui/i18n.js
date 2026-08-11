/**
 * 간단한 i18n 헬퍼.
 *
 * - 기본 로케일: 'ko' (한국어)
 * - localStorage 'bending-sandbox.locale' 키에 저장하여 다음 방문에도 유지
 * - document.documentElement.lang 도 동기화
 * - 변경 시 등록된 콜백 모두 호출 → HUD, Editor 등이 즉시 다시 그려짐
 * - 누락 키는 영어 (영문 본을 SSoT 로 가지며 한국어는 점진적으로 추가)
 *
 * 사용 패턴:
 *   import { t, locale, onChange, applyLocale } from './i18n.js';
 *   const greet = t('hello.world');
 *   onChange(() => this.refresh());
 */

const STORAGE_KEY = 'bending-sandbox.locale';
const DEFAULT_LOCALE = 'ko';

const translations = {
  ko: {
    'app.title': '원소 조형 샌드박스',
    'app.subtitle': 'Draw a path. Release to cast.',
    'app.subtitle.ko': '경로를 그리고, 마우스를 떼면 시전합니다.',
    'loader.summoning': '원소들을 소환하는 중…',
    'toggle.label': '한 / EN',
    'toggle.aria': '언어 전환 (한국어 / English)',

    // Stats
    'stats.fps': 'FPS',
    'stats.particles': '파티클',
    'stats.drawCalls': '드로우 콜',
    'stats.abilities': '시전 중',

    // Help
    'help.title': '조작법',
    'help.drawPath': '왼쪽 마우스 드래그 — 바닥에 경로 그리기',
    'help.release': '마우스 떼기 — 선택한 원소 시전',
    'help.orbit': '오른쪽 드래그 — 카메라 회전',
    'help.zoom': '스크롤 — 줌 인/아웃',
    'help.elements': '<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> 원소 선택 &nbsp; <kbd>Q</kbd><kbd>E</kbd> 순환',
    'help.editor': '<kbd>G</kbd> 에디터 &nbsp; <kbd>C</kbd> 모두 지우기 &nbsp; <kbd>P</kbd> 일시정지 &nbsp; <kbd>H</kbd> 도움말',
    'help.posture': '<kbd>T</kbd> 앉기 / 서기 &nbsp; <kbd>M</kbd> 시전 / 탑승 모드',

    // Modes
    'mode.casting.label': '시전',
    'mode.casting.hint': '시전 모드',
    'mode.casting.blurb': '경로를 그리고 떼면 시전합니다.',
    'mode.walk.label': '탑승',
    'mode.walk.hint': '탑승 모드',
    'mode.walk.blurb': '경로를 그리고 떼면 그 위를 탑니다.',
    'modeKey': 'M',
    'elementsKey': '1 2 3 4',

    // Elements
    'element.fire.label': '불',
    'element.fire.hint': '불 굴리기',
    'element.water.label': '물',
    'element.water.hint': '물 굴리기',
    'element.earth.label': '흙',
    'element.earth.hint': '흙 굴리기',
    'element.wind.label': '공기',
    'element.wind.hint': '공기 굴리기',

    // Editor — title + preset
    'editor.title': 'VFX 에디터',
    'preset.folder': '프리셋',
    'preset.selector': '프리셋',
    'preset.name': '이름',
    'preset.save': '프리셋 저장',
    'preset.load': '프리셋 불러오기',
    'preset.duplicate': '복제',
    'preset.delete': '삭제',
    'preset.exportCurrent': '현재 프리셋 내보내기 (JSON)',
    'preset.exportAll': '모든 프리셋 내보내기',
    'preset.import': 'JSON 가져오기…',
    'preset.reset': '기본값으로 초기화',
    'preset.defaultName': '내 프리셋',
    'toast.saved': '프리셋 저장됨: "{name}"',
    'toast.loaded': '불러옴: "{name}"',
    'toast.duplicated': '복제됨: "{name}"',
    'toast.deleted': '삭제됨: "{name}"',
    'toast.exported': '프리셋 내보내기 완료',
    'toast.imported': '프리셋 가져오기 완료',
    'toast.reset': '기본값으로 초기화됨',

    // Editor — global + folders
    'folder.global': '전역',
    'folder.particles': '파티클',
    'folder.lighting': '조명 & 충격',
    'folder.castTrail': '캐스트 트레일',
    'folder.drawing': '그리기',
    'folder.flight': '비행',
    'folder.flame': '불꽃 모양',
    'folder.turbulence': '난류',
    'folder.temperature': '온도 & 발광',
    'folder.volume': '볼륨 렌더링',
    'folder.fireGradient': '불 그라데이션',
    'folder.embers': '불씨 & 연기',
    'folder.heat': '열 & 폭발',
    'folder.waterBody': '물 본체',
    'folder.surface': '표면',
    'folder.spray': '물보라, 거품 & 안개',

    // Trajectory (global)
    'trajectory.castSpeed': '시전 속도',
    'trajectory.curve': '경로 곡률',
    'trajectory.altitude': '시전 고도',
    'trajectory.spin': '공전 회전',
    'trajectory.lengthScale': '경로 길이 비율',

    // Drawing
    'drawing.thickness': '획 굵기',
    'drawing.smoothing': '스무딩',
    'drawing.cursorDepth': '커서 깊이',

    // Cast trail
    'trail.innerColour': '안쪽 색',
    'trail.outerColour': '바깥 색',

    // Fire — gradient colours
    'fire.core': '코어',
    'fire.mid': '중간',
    'fire.edge': '가장자리',
    'fire.smoke': '연기',
    // Fire — flight
    'fire.updraft': '상승 기류',
    'fire.trailAmp': '트레일 진폭',
    'fire.trailFreq': '트레일 진동수',
    'fire.lateral': '측면 파동',
    // Fire — flame shape
    'fire.flameLength': '불꽃 길이',
    'fire.flameSpread': '불꽃 확산',
    'fire.flameLean': '불꽃 기울기',
    // Fire — turbulence
    'fire.swirl': '소용돌이',
    'fire.swirlSpeed': '소용돌이 속도',
    'fire.noiseAmp': '난류 진폭',
    'fire.noiseScale': '난류 스케일',
    // Fire — temp + radiance
    'fire.tempCore': '코어 온도 (K)',
    'fire.tempEdge': '가장자리 온도 (K)',
    'fire.emissiveBoost': '발광 부스트',
    // Fire — volume
    'fire.coreClarity': '코어 선명도',
    'fire.densityCurve': '밀도 곡선',
    'fire.shadowSoft': '그림자 부드러움',
    // Fire — embers + smoke
    'fire.embersRate': '불씨 분출 (개/초)',
    'fire.emberSize': '불씨 크기',
    'fire.emberLife': '불씨 수명',
    'fire.smokeDensity': '연기 밀도',
    'fire.smokeSpeed': '연기 속도',
    'fire.smokeSize': '연기 크기',
    'fire.smokeLife': '연기 수명',
    // Fire — heat + explosion
    'fire.heatIntensity': '열 강도',
    'fire.heatSize': '열 폭',
    'fire.burstPower': '폭발 강도',
    'fire.burstDuration': '폭발 지속',

    // Water — body
    'water.thickness': '물 두께',
    'water.bodyCurve': '본체 곡률',
    'water.flowSpeed': '흐름 속도',
    // Water — surface
    'water.deepColour': '깊은 색',
    'water.shallowColour': '얕은 색',
    'water.foamColour': '거품 색',
    'water.shine': '광택',
    'water.surfaceFoam': '표면 거품',
    'water.foamSharpness': '거품 날카로움',
    'water.edgeBreak': '가장자리 분해',
    // Water — spray
    'water.sprayRate': '물보라 분출 (개/초)',
    'water.spraySize': '물보라 크기',
    'water.spraySpeed': '물보라 속도',
    'water.sprayLife': '물보라 수명',
    'water.mistRate': '안개 분출 (개/초)',
    'water.mistSize': '안개 크기',
    'water.mistLife': '안개 수명',
    // Water — impact
    'water.splashHeight': '물 튀김 높이',
    'water.splashSpread': '물 튀김 확산',
    'water.splashLife': '물 튀김 수명',
    'water.foamSpread': '거품 확산',
    'water.foamLingering': '거품 잔류',

    // Environment + camera + post + character + walk
    'folder.environment': '환경',
    'folder.post': '포스트 프로세싱',
    'folder.camera': '카메라',
    'folder.character': '캐릭터',
    'folder.walk': '탑승 모드',
    'env.fogDensity': '안개 밀도',
    'env.fogColour': '안개 색',
    'env.skyTint': '하늘 틴트',
    'env.sunIntensity': '태양 광량',
    'env.shadow': '그림자 강도',
    'env.dustMotes': '먼지 모트',
    'post.distortion': '왜곡 강도',
    'post.bloom': '발광 (블룸)',
    'post.grain': '필름 그레인',
    'post.chroma': '색수차',
    'post.vignette': '비네트',
    'camera.fov': '시야각 (FOV)',
    'camera.tightness': '궤도 타이트닝',
    'camera.targetOffset': '타겟 옵셋',
    'character.idleSpeed': '대기 애니메이션 속도',
    'character.lean': '기울기',
    'walk.leapHeight': '도약 높이',
    'walk.bankStrength': '뱅크 강도',
    'walk.releaseBoost': '하마 부스트',

    // Misc
    'common.cancel': '취소',
    'common.confirm': '확인',

    // Environment
    'env.sunColour': '키 라이트 색',
    'env.ambientColour': '주변광 색',
    'env.rimColour': '림 라이트 색',
    'env.floorColour': '바닥 색',
    'env.floorTint': '바닥 틴트',
    'env.fogColour': '안개 색',
    'env.skyTint': '하늘 틴트',
    'env.hemiSky': '하늘 채광',
    'env.hemiGround': '바닥 반사광',
    'env.background': '배경',
    'env.sunIntensity': '태양 광량',
    'env.ambient': '주변광',
    'env.shadowStrength': '그림자 강도',
    'env.dustMotes': '먼지 모트',

    // Trajectory
    'trajectory.castSpeed': '시전 속도',
    'trajectory.curve': '경로 곡률',
    'trajectory.altitude': '시전 고도',
    'trajectory.spin': '공전 회전',
    'trajectory.lengthScale': '경로 길이 비율',

    // Walk subsections
    'walk.leap': '도약',
    'earth.ground': '지면 손상',
    'walk.ball': '공기 구체',

    'element.commonLight': '동적 광원',

    'app.loadingCharacter': '캐릭터 로딩 중…',
    'toast.poseSitting': '가부좌 결로',
    'wind.debris': '잎사귀 & 먼지',
    'toast.effectsCleared': '이펙트가 모두 지워졌습니다',
    'walk.ride': '탑승',
    'toast.pathTooShort': '경로가 짧아 탑승할 수 없습니다',
    'walk.debris': '먼지 & 광원',
    'toast.poseStanding': '서 있는 자세',

    'toast.resumed': '재개됨',
    'app.loadingShaders': '셰이더 컴파일 중…',

    'env.backdrop': '배경, 안개 & 먼지',
    'env.floor': '무대 바닥',

    'earth.rocks': '바위',
    'earth.crust': '지표',
    'earth.debris': '먼지 & 파편',
    'earth.fracture': '파쇄',
    'wind.tornado': '토네이도',
    'env.rim': '림 라이트',
    'wind.spiral': '나선',
    'app.loadingReady': '준비 완료',
    'walk.mode': '모드 (M)',
    'toast.paused': '일시정지됨',
    'app.loadingEnvironment': '환경 로딩 중…'
  },

  en: {
    'app.title': 'Bending Sandbox',
    'app.subtitle': 'Draw a path. Release to cast.',
    'app.subtitle.ko': '경로를 그리고, 마우스를 떼면 시전합니다.',
    'loader.summoning': 'Summoning the elements…',
    'toggle.label': '한 / EN',
    'toggle.aria': 'Toggle language (Korean / English)',

    'stats.fps': 'FPS',
    'stats.particles': 'Particles',
    'stats.drawCalls': 'Draw calls',
    'stats.abilities': 'Abilities',

    'help.title': 'Controls',
    'help.drawPath': '<strong>Hold left mouse</strong> — draw a path on the ground',
    'help.release': '<strong>Release</strong> — cast the selected element',
    'help.orbit': '<strong>Right drag</strong> — orbit the camera',
    'help.zoom': '<strong>Scroll</strong> — zoom in / out',
    'help.elements': '<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> elements &nbsp; <kbd>Q</kbd><kbd>E</kbd> cycle',
    'help.editor': '<kbd>G</kbd> editor &nbsp; <kbd>C</kbd> clear &nbsp; <kbd>P</kbd> pause &nbsp; <kbd>H</kbd> hide',
    'help.posture': '<kbd>T</kbd> sit / stand &nbsp; <kbd>M</kbd> cast / walk',

    'mode.casting.label': 'Cast',
    'mode.casting.hint': 'Casting mode',
    'mode.casting.blurb': 'Draw a path. Release to cast.',
    'mode.walk.label': 'Walk',
    'mode.walk.hint': 'Walk mode',
    'mode.walk.blurb': 'Draw a path. Release to ride it.',
    'modeKey': 'M',
    'elementsKey': '1 2 3 4',

    'element.fire.label': 'Fire',
    'element.fire.hint': 'Firebending',
    'element.water.label': 'Water',
    'element.water.hint': 'Waterbending',
    'element.earth.label': 'Earth',
    'element.earth.hint': 'Earthbending',
    'element.wind.label': 'Air',
    'element.wind.hint': 'Airbending',

    'editor.title': 'VFX Editor',
    'preset.folder': 'Presets',
    'preset.selector': 'preset',
    'preset.name': 'name',
    'preset.save': 'Save preset',
    'preset.load': 'Load preset',
    'preset.duplicate': 'Duplicate',
    'preset.delete': 'Delete',
    'preset.exportCurrent': 'Export current (JSON)',
    'preset.exportAll': 'Export all presets',
    'preset.import': 'Import JSON…',
    'preset.reset': 'Reset to defaults',
    'preset.defaultName': 'My preset',
    'toast.saved': 'Saved preset "{name}"',
    'toast.loaded': 'Loaded "{name}"',
    'toast.duplicated': 'Duplicated to "{name}"',
    'toast.deleted': 'Deleted "{name}"',
    'toast.exported': 'Presets exported',
    'toast.imported': 'Presets imported',
    'toast.reset': 'Reset to defaults',

    'folder.global': 'Global',
    'folder.particles': 'Particles',
    'folder.lighting': 'Lighting & impact',
    'folder.castTrail': 'Cast trail',
    'folder.drawing': 'Drawing',
    'folder.flight': 'Flight',
    'folder.flame': 'Flame shape',
    'folder.turbulence': 'Turbulence',
    'folder.temperature': 'Temperature & radiance',
    'folder.volume': 'Volume rendering',
    'folder.fireGradient': 'Fire gradient',
    'folder.embers': 'Embers & smoke',
    'folder.heat': 'Heat & explosion',
    'folder.waterBody': 'Water body',
    'folder.surface': 'Surface',
    'folder.spray': 'Spray, foam & mist',

    'trajectory.castSpeed': 'cast speed',
    'trajectory.curve': 'curve',
    'trajectory.altitude': 'cast altitude',
    'trajectory.spin': 'orbital spin',
    'trajectory.lengthScale': 'path length scale',

    'drawing.thickness': 'stroke width',
    'drawing.smoothing': 'smoothing',
    'drawing.cursorDepth': 'cursor depth',

    'trail.innerColour': 'inner colour',
    'trail.outerColour': 'outer colour',

    'fire.core': 'core',
    'fire.mid': 'mid',
    'fire.edge': 'edge',
    'fire.smoke': 'smoke',
    'fire.updraft': 'updraft',
    'fire.trailAmp': 'trail amplitude',
    'fire.trailFreq': 'trail frequency',
    'fire.lateral': 'lateral wave',
    'fire.flameLength': 'flame length',
    'fire.flameSpread': 'flame spread',
    'fire.flameLean': 'flame lean',
    'fire.swirl': 'swirl',
    'fire.swirlSpeed': 'swirl speed',
    'fire.noiseAmp': 'noise amplitude',
    'fire.noiseScale': 'noise scale',
    'fire.tempCore': 'core temp (K)',
    'fire.tempEdge': 'edge temp (K)',
    'fire.emissiveBoost': 'emissive boost',
    'fire.coreClarity': 'core clarity',
    'fire.densityCurve': 'density curve',
    'fire.shadowSoft': 'shadow softness',
    'fire.embersRate': 'ember count/s',
    'fire.emberSize': 'ember size',
    'fire.emberLife': 'ember lifetime',
    'fire.smokeDensity': 'smoke density',
    'fire.smokeSpeed': 'smoke speed',
    'fire.smokeSize': 'smoke size',
    'fire.smokeLife': 'smoke lifetime',
    'fire.heatIntensity': 'heat intensity',
    'fire.heatSize': 'heat size',
    'fire.burstPower': 'burst power',
    'fire.burstDuration': 'burst duration',

    'water.thickness': 'thickness',
    'water.bodyCurve': 'body curve',
    'water.flowSpeed': 'flow speed',
    'water.deepColour': 'deep',
    'water.shallowColour': 'shallow',
    'water.foamColour': 'foam',
    'water.shine': 'shine',
    'water.surfaceFoam': 'foam amount',
    'water.foamSharpness': 'foam sharpness',
    'water.edgeBreak': 'edge break-up',
    'water.sprayRate': 'spray count/s',
    'water.spraySize': 'spray size',
    'water.spraySpeed': 'spray speed',
    'water.sprayLife': 'spray lifetime',
    'water.mistRate': 'mist count/s',
    'water.mistSize': 'mist size',
    'water.mistLife': 'mist lifetime',
    'water.splashHeight': 'splash height',
    'water.splashSpread': 'splash spread',
    'water.splashLife': 'splash lifetime',
    'water.foamSpread': 'foam spread',
    'water.foamLingering': 'foam lifetime',

    'folder.environment': 'Environment',
    'folder.post': 'Post-processing',
    'folder.camera': 'Camera',
    'folder.character': 'Character',
    'folder.walk': 'Walk mode',
    'env.fogDensity': 'fog density',
    'env.fogColour': 'fog colour',
    'env.skyTint': 'sky tint',
    'env.sunIntensity': 'sun intensity',
    'env.shadow': 'shadow strength',
    'env.dustMotes': 'dust motes',
    'post.distortion': 'distortion',
    'post.bloom': 'bloom',
    'post.grain': 'film grain',
    'post.chroma': 'chromatic aberration',
    'post.vignette': 'vignette',
    'camera.fov': 'field of view',
    'camera.tightness': 'orbit tightness',
    'camera.targetOffset': 'target offset',
    'character.idleSpeed': 'idle speed',
    'character.lean': 'lean',
    'walk.leapHeight': 'leap height',
    'walk.bankStrength': 'bank strength',
    'walk.releaseBoost': 'release boost',

    'common.cancel': 'Cancel',
    'common.confirm': 'OK',

    'env.sunColour': 'key colour',
    'env.ambientColour': 'ambient colour',
    'env.rimColour': 'rim colour',
    'env.floorColour': 'floor colour',
    'env.floorTint': 'floor tint',
    'env.fogColour': 'fog colour',
    'env.skyTint': 'sky tint',
    'env.hemiSky': 'hemi sky',
    'env.hemiGround': 'hemi bounce',
    'env.background': 'backdrop',
    'env.sunIntensity': 'sun intensity',
    'env.ambient': 'ambient',
    'env.shadowStrength': 'shadow strength',
    'env.dustMotes': 'dust motes',

    'trajectory.castSpeed': 'cast speed',
    'trajectory.curve': 'curve',
    'trajectory.altitude': 'cast altitude',
    'trajectory.spin': 'orbital spin',
    'trajectory.lengthScale': 'path length scale',

    // Walk subsections (English)
    'walk.leap': 'Leap',
    'earth.ground': 'Ground damage',
    'walk.ball': 'Air ball',

    'element.commonLight': 'Dynamic light',

    'app.loadingCharacter': '캐릭터 로딩 중…',
    'toast.poseSitting': '가부좌 결로',
    'wind.debris': 'Leaves & dust',
    'toast.effectsCleared': '이펙트가 모두 지워졌습니다',
    'walk.ride': 'Ride',
    'toast.pathTooShort': '경로가 너무 짧아 탑승할 수 없습니다',
    'walk.debris': 'Dust & light',
    'toast.poseStanding': '서 있는 자세',

    'toast.resumed': '재개됨',
    'app.loadingShaders': '셰이더 컴파일 중…',

    'env.backdrop': 'Backdrop, fog & dust',
    'env.floor': 'Stage floor',

    'earth.rocks': 'Rocks',

    'earth.crust': 'Crust',
    'earth.debris': 'Dust & debris',
    'earth.fracture': 'Fracture',
    'wind.tornado': 'Tornado',

    'env.rim': 'Rim light',
    'wind.spiral': 'Spiral',
    'app.loadingReady': '준비 완료',

    'walk.mode': 'mode (M)',
    'toast.paused': '일시정지됨',

    'app.loadingEnvironment': '환경 로딩 중…'
  }
};

/** 현재 로케일 (반응형). 항상 'ko' 또는 'en'. */
let currentLocale = readStoredLocale() ?? DEFAULT_LOCALE;
const subscribers = new Set();

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ko' || stored === 'en') return stored;
  } catch (_) { /* ignore */ }
  return null;
}

function persistLocale(value) {
  try { localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* ignore */ }
}

/** `t('preset.saved', { name: 'foo' })` */
export function t(key, params) {
  const dict = translations[currentLocale] ?? translations[DEFAULT_LOCALE];
  let raw = dict[key];
  if (raw === undefined) {
    raw = translations.en[key] ?? key;
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      raw = raw.replaceAll(`{${k}}`, String(v));
    }
  }
  return raw;
}

/** 현재 로케일 (반응형). */
export function locale() {
  return currentLocale;
}

/** 변경 구독. 콜백은 언어 변경 직후 호출됨. */
export function onChange(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** 로케일 토글 ('ko' ↔ 'en'). UI 라벨은 즉시 다시 그려지고 콜백 모두 호출. */
export function applyLocale(next) {
  if (next !== 'ko' && next !== 'en') return;
  if (next === currentLocale) return;
  currentLocale = next;
  persistLocale(next);
  try {
    document.documentElement.lang = next;
  } catch (_) { /* SSR / 비-DOM 환경 */ }
  for (const cb of subscribers) {
    try { cb(next); } catch (err) { console.warn('[i18n] subscriber threw', err); }
  }
}

export function toggleLocale() {
  applyLocale(currentLocale === 'ko' ? 'en' : 'ko');
}

// 첫 로드 시 lang 동기화 (모듈 평가 시점)
try {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLocale;
  }
} catch (_) { /* ignore SSR / non-DOM */ }
