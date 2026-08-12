import GUI from 'lil-gui';
import { settings, ELEMENTS, MODES } from '../config/settings.js';
import { PresetManager } from './PresetManager.js';
import { t, locale, onChange as subscribeLocaleChange } from './i18n.js';

/**
 * 실시간 VFX 에디터.
 *
 * 모든 컨트롤은 `config/settings.js`의 필드에 직접 바인딩된다. 모든 셰이더,
 * 입자 시스템, 광원, 포스트 패스가 매 프레임 그 필드를 *읽기* 때문에 어떤
 * 컨트롤도 onChange 핸들러가 필요 없다: 슬라이더를 움직이면 진행 중인 시전,
 * 미래의 캐스트, 환경, 포스트 스택이 동시에 — 재빌드도 셰이더 재컴파일도 없이
 * 업데이트된다.
 *
 * i18n 연동:
 *   각 컨트롤은 라벨을 `t(key)` 로 표시하고, `__i18nKey` 메타데이터로 키를 보관.
 *   언어가 바뀌면 모든 컨트롤러를 순회하며 표시 라벨을 다시 그린다.
 */
export class Editor {
  /**
   * @param {object} hooks { onClear, onToast } 콜백 훅
   */
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.presets = new PresetManager();

    this.gui = new GUI({ title: t('editor.title'), width: 320 });
    this.gui.domElement.style.setProperty('--title-height', '30px');

    this._presetState = { name: t('preset.defaultName'), selected: this.presets.names[0] ?? '' };

    this._buildPresets();
    this._buildGlobal();
    this._buildTrail();
    for (const element of ELEMENTS) this._buildElement(element);
    this._buildEnvironment();
    this._buildPost();
    this._buildCamera();
    this._buildCharacter();
    this._buildWalk();

    // 원소 폴더는 기본으로 닫혀 있고 — 전역 폴더만 첫 진입점으로 열린다.
    this.gui.folders.forEach((folder) => folder.close());
    this.globalFolder.open();

    this._unsubscribeLocale = subscribeLocaleChange(() => this._refreshLabels());
  }

  /* ------------------------------------------------------------------ */
  /* 헬퍼                                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * 가벼운 range 헬퍼. lil-gui 컨트롤러에 `__i18nKey` 메타데이터를 박아두고,
   * 표시 라벨을 키 기반 번역으로 설정. 폴더 자체에는 가시 라벨을 직접 부여.
   */
  static range(folder, object, key, min, max, step, i18nKey) {
    const controller = folder.add(object, key, min, max, step).name(t(i18nKey ?? key));
    controller.__i18nKey = i18nKey ?? key;
    return controller;
  }

  /**
   * 폴더를 만들면서 동시에 표시 라벨을 i18n 키에서 가져온다. 반환된 폴더에
   * __i18nKey 를 박아두고 _refreshLabels에서 재사용한다.
   */
  static folder(parent, i18nKey) {
    const f = parent.addFolder(t(i18nKey));
    f.__i18nKey = i18nKey;
    return f;
  }

  /** 라벨이 단순 식별자거나 값이 enum인 (boolean/dropdown) 컨트롤용. */
  static label(parent, object, key, i18nKey) {
    const controller = parent.add(object, key).name(t(i18nKey ?? key));
    controller.__i18nKey = i18nKey ?? key;
    return controller;
  }

  /** 색상 슬라이더용 헬퍼. */
  static color(parent, object, key, i18nKey) {
    const controller = parent.addColor(object, key).name(t(i18nKey ?? key));
    controller.__i18nKey = i18nKey ?? key;
    return controller;
  }

  /** 모든 컨트롤러의 표시를 갱신. */
  refresh() {
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
  }

  /** 에디터 패널 자체 표시/숨김. */
  toggle() {
    this._hidden = !this._hidden;
    this.gui.show(!this._hidden);
  }

  /** 모든 컨트롤러/폴더 라벨을 현재 로케일로 다시 그린다. */
  _refreshLabels() {
    this.gui.title(t('editor.title'));

    const visit = (folder) => {
      // 동적 title 콜백이 있으면 먼저 (element별 glyph + label)
      folder.__refreshTitle?.();
      // 일반 title도 다시
      if (folder.__i18nKey) folder.title(t(folder.__i18nKey));
      for (const controller of folder.controllers ?? []) {
        if (controller.__i18nKey) controller.name(t(controller.__i18nKey));
      }
      for (const child of folder.folders ?? []) visit(child);
    };
    for (const folder of this.gui.folders) visit(folder);

    this._presetState.name = t('preset.defaultName');
  }

  /* ------------------------------------------------------------------ */
  /* 프리셋                                                               */
  /* ------------------------------------------------------------------ */

  _buildPresets() {
    const folder = Editor.folder(this.gui, 'preset.folder');
    const state = this._presetState;

    let selector = Editor.label(folder, state, 'selected', 'preset.selector');
    selector = selector.options(this.presets.names.length ? this.presets.names : ['']);

    const refreshOptions = () => {
      const names = this.presets.names;
      selector = selector.options(names.length ? names : ['']);
      selector.name(t('preset.selector'));
      selector.__i18nKey = 'preset.selector';
      selector.setValue(names.includes(state.selected) ? state.selected : (names[0] ?? ''));
    };

    const nameController = Editor.label(folder, state, 'name', 'preset.name');

    Editor.label(folder, {
      save: () => {
        this.presets.save(state.name);
        state.selected = state.name;
        refreshOptions();
        this.hooks.onToast?.(t('toast.saved', { name: state.name }));
      }
    }, 'save', 'preset.save');

    Editor.label(folder, {
      load: () => {
        if (this.presets.load(state.selected)) {
          this.refresh();
          this.hooks.onToast?.(t('toast.loaded', { name: state.selected }));
        }
      }
    }, 'load', 'preset.load');

    Editor.label(folder, {
      duplicate: () => {
        const copy = this.presets.duplicate(state.selected);
        if (copy) {
          state.selected = copy;
          refreshOptions();
          this.hooks.onToast?.(t('toast.duplicated', { name: copy }));
        }
      }
    }, 'duplicate', 'preset.duplicate');

    Editor.label(folder, {
      remove: () => {
        if (this.presets.remove(state.selected)) {
          refreshOptions();
          this.hooks.onToast?.(t('toast.deleted', { name: state.selected }));
        }
      }
    }, 'remove', 'preset.delete');

    Editor.label(folder, { exportOne: () => this.presets.exportJSON() }, 'exportOne', 'preset.exportCurrent');
    Editor.label(folder, { exportAll: () => this.presets.exportAll() }, 'exportAll', 'preset.exportAll');

    Editor.label(folder, {
      가져오기: async () => {
        const result = await this.presets.가져오기FromFile();
        refreshOptions();
        this.refresh();
        const applied = result.applied;
        const 가져오기ed = result.가져오기ed?.length ?? 0;
        this.hooks.onToast?.(
          applied
            ? t('toast.imported')
            : 가져오기ed
              ? t('toast.imported') + ` (${가져오기ed})`
              : t('toast.imported') + ' — 0'
        );
      }
    }, '가져오기', 'preset.import');

    Editor.label(folder, {
      reset: () => {
        this.presets.reset();
        this.refresh();
        this.hooks.onToast?.(t('toast.reset'));
      }
    }, 'reset', 'preset.reset');

    // 토글 시 라벨 재렌더링을 위해 참조 보존
    this._presetNameController = nameController;
    this.presetFolder = folder;
  }

  _buildGlobal() {
    const folder = Editor.folder(this.gui, 'folder.global');
    const g = settings.global;
    const R = Editor.range;

    R(folder, g, 'timeScale', 0.05, 2, 0.01, 'g.timeScale');
    R(folder, g, 'speed', 0.1, 4, 0.01, 'g.speed');
    R(folder, g, 'lifetime', 0.1, 4, 0.01, 'g.lifetime');
    R(folder, g, 'glow', 0, 5, 0.01, 'g.glow');
    R(folder, g, 'shaderIntensity', 0, 2, 0.01, 'g.shaderIntensity');
    R(folder, g, 'opacity', 0, 2, 0.01, 'g.opacity');
    R(folder, g, 'noiseStrength', 0, 3, 0.01, 'g.noiseStrength');
    R(folder, g, 'noiseFrequency', 0.1, 4, 0.01, 'g.noiseFrequency');
    R(folder, g, 'noiseSpeed', 0, 4, 0.01, 'g.noiseSpeed');
    R(folder, g, 'turbulence', 0, 4, 0.01, 'g.turbulence');
    R(folder, g, 'randomness', 0, 2, 0.01, 'g.randomness');
    R(folder, g, 'distortion', 0, 3, 0.01, 'g.distortion');
    R(folder, g, 'fresnel', 0, 3, 0.01, 'g.fresnel');

    const particles = Editor.folder(folder, 'folder.particles');
    R(particles, g, 'particleCount', 0, 3, 0.01, 'g.particleCount');
    R(particles, g, 'particleLifetime', 0.1, 3, 0.01, 'g.particleLifetime');
    R(particles, g, 'particleSpeed', 0.1, 3, 0.01, 'g.particleSpeed');
    R(particles, g, 'particleSize', 0.1, 3, 0.01, 'g.particleSize');
    R(particles, g, 'emissionRate', 0, 3, 0.01, 'g.emissionRate');

    const lighting = Editor.folder(folder, 'folder.lighting');
    R(lighting, g, 'lightIntensity', 0, 4, 0.01, 'g.lightIntensity');
    R(lighting, g, 'lightRadius', 0.1, 4, 0.01, 'g.lightRadius');
    R(lighting, g, 'explosionIntensity', 0, 3, 0.01, 'g.explosionIntensity');
    R(lighting, g, 'cameraShake', 0, 3, 0.01, 'g.cameraShake');
    R(lighting, g, 'animationSpeed', 0, 3, 0.01, 'g.animationSpeed');

    this.globalFolder = folder;
  }

  _buildTrail() {
    const folder = Editor.folder(this.gui, 'folder.castTrail');
    const tr = settings.trail;
    const R = Editor.range;

    R(folder, tr, 'width', 0.05, 3, 0.01, 'trail.width');
    R(folder, tr, 'length', 0.05, 1, 0.01, 'trail.length');
    R(folder, tr, 'opacity', 0, 2, 0.01, 'trail.opacity');
    R(folder, tr, 'glow', 0, 10, 0.01, 'trail.glow');
    Editor.color(folder, tr, 'colorInner', 'trail.innerColour');
    Editor.color(folder, tr, 'colorOuter', 'trail.outerColour');
    R(folder, tr, 'flowSpeed', 0, 6, 0.01, 'trail.flowSpeed');
    R(folder, tr, 'noiseStrength', 0, 2, 0.01, 'trail.noiseStrength');
    R(folder, tr, 'noiseFrequency', 0.1, 8, 0.01, 'trail.noiseFrequency');
    R(folder, tr, 'dissolveSpeed', 0.1, 6, 0.01, 'trail.dissolveSpeed');
    R(folder, tr, 'taper', 0, 1, 0.01, 'trail.taper');
    R(folder, tr, 'softness', 0.02, 1, 0.01, 'trail.softness');
    R(folder, tr, 'sparkle', 0, 3, 0.01, 'trail.sparkle');
    R(folder, tr, 'height', 0.01, 1, 0.01, 'trail.height');

    const input = Editor.folder(folder, 'folder.drawing');
    const inp = settings.input;
    R(input, inp, 'minPointDistance', 0.02, 1, 0.01, 'input.minPointDistance');
    R(input, inp, 'minPathLength', 0.2, 8, 0.1, 'input.minPathLength');
    R(input, inp, 'smoothing', 0, 0.95, 0.01, 'input.smoothing');
    R(input, inp, 'curveTension', 0, 1, 0.01, 'input.curveTension');
    R(input, inp, 'samplesPerUnit', 0.5, 8, 0.1, 'input.samplesPerUnit');
  }

  _buildElement(element) {
    const folder = Editor.folder(this.gui, `element.${element}.folder`);
    folder.__i18nKey = `element.${element}.folder`;
    // folder 이름은 glyph + label 로 동적 표시 (덮어쓰기용 헬퍼 함수)
    folder.__i18nTitle = `${element}`;
    folder.title(`${glyphFor(element)}  ${t(`element.${element}.label`)}`);

    const c = settings[element];
    const R = Editor.range;

    R(folder, c, 'speed', 0.5, 40, 0.1, `${element}.speed`);
    R(folder, c, 'lifetime', 0.2, 10, 0.1, `${element}.lifetime`);

    const build = {
      fire: () => {
        const flight = Editor.folder(folder, 'folder.flight');
        R(flight, c, 'flightHeight', 0, 8, 0.01, 'fire.flightHeight');
        R(flight, c, 'flightArc', 0, 5, 0.01, 'fire.flightArc');

        const shape = Editor.folder(folder, 'folder.flame');
        R(shape, c, 'flameWidth', 0.05, 3, 0.01, 'fire.flameWidth');
        R(shape, c, 'headSize', 1, 5, 0.01, 'fire.headSize');
        R(shape, c, 'flameHeight', 1, 6, 0.01, 'fire.flameHeight');
        R(shape, c, 'streamLength', 0.5, 20, 0.1, 'fire.streamLength');
        R(shape, c, 'wakeSpread', 0, 3, 0.01, 'fire.wakeSpread');
        R(shape, c, 'wakeRise', 0, 3, 0.01, 'fire.wakeRise');
        R(shape, c, 'bulge', 0, 0.8, 0.01, 'fire.bulge');
        R(shape, c, 'bulgeScale', 0.1, 2, 0.01, 'fire.bulgeScale');
        R(shape, c, 'detachment', 0, 1.5, 0.01, 'fire.detachment');
        R(shape, c, 'softness', 0.05, 1, 0.01, 'fire.softness');

        const turb = Editor.folder(folder, 'folder.turbulence');
        R(turb, c, 'vortex', 0, 3, 0.01, 'fire.vortex');
        R(turb, c, 'ringFrequency', 0, 3, 0.01, 'fire.ringFrequency');
        R(turb, c, 'ringSpeed', 0, 6, 0.01, 'fire.ringSpeed');
        R(turb, c, 'flameCurl', 0, 5, 0.01, 'fire.flameCurl');
        R(turb, c, 'flameTurbulence', 0, 6, 0.01, 'fire.flameTurbulence');
        R(turb, c, 'flameWarp', 0, 2, 0.01, 'fire.flameWarp');
        R(turb, c, 'tongueStretch', 0.15, 2, 0.01, 'fire.tongueStretch');
        R(turb, c, 'streamStretch', 0.15, 2, 0.01, 'fire.streamStretch');
        R(turb, c, 'lick', 0, 5, 0.01, 'fire.lick');
        R(turb, c, 'wisps', 0, 2, 0.01, 'fire.wisps');
        R(turb, c, 'shred', 0, 3, 0.01, 'fire.shred');
        R(turb, c, 'flameSpeed', 0, 8, 0.01, 'fire.flameSpeed');
        R(turb, c, 'buoyancy', 0, 6, 0.01, 'fire.buoyancy');
        R(turb, c, 'flicker', 0, 2, 0.01, 'fire.flicker');
        R(turb, c, 'noiseStrength', 0, 3, 0.01, 'fire.noiseStrength');
        R(turb, c, 'noiseFrequency', 0.1, 6, 0.01, 'fire.noiseFrequency');
        R(turb, c, 'detailOctaves', 2, 5, 1, 'fire.detailOctaves');

        const heat = Editor.folder(folder, 'folder.temperature');
        R(heat, c, 'tempCore', 1500, 6000, 10, 'fire.tempCore');
        R(heat, c, 'tempEdge', 800, 3000, 10, 'fire.tempEdge');
        R(heat, c, 'emissionCurve', 1, 8, 0.05, 'fire.emissionCurve');
        R(heat, c, 'heatFocus', 0.4, 4, 0.01, 'fire.heatFocus');
        R(heat, c, 'heatFalloff', 0.2, 4, 0.01, 'fire.heatFalloff');
        R(heat, c, 'heatFollow', 0, 1, 0.01, 'fire.heatFollow');
        R(heat, c, 'tailHeat', 0, 1.5, 0.01, 'fire.tailHeat');
        R(heat, c, 'scatter', 0, 4, 0.01, 'fire.scatter');
        R(heat, c, 'scatterFalloff', 0.2, 8, 0.05, 'fire.scatterFalloff');
        R(heat, c, 'glow', 0, 10, 0.01, 'fire.glow');

        const render = Editor.folder(folder, 'folder.volume');
        R(render, c, 'volumeDensity', 0, 4, 0.01, 'fire.volumeDensity');
        R(render, c, 'soot', 0, 6, 0.01, 'fire.soot');
        R(render, c, 'coreClarity', 0.02, 1, 0.01, 'fire.coreClarity');
        R(render, c, 'opacity', 0, 2, 0.01, 'fire.renderOpacity');
        R(render, c, 'volumeSteps', 6, 72, 1, 'fire.volumeSteps');

        const colors = Editor.folder(folder, 'folder.fireGradient');
        R(colors, c, 'paletteBlend', 0, 1, 0.01, 'fire.paletteBlend');
        Editor.color(colors, c, 'colorCore', 'fire.core');
        Editor.color(colors, c, 'colorMid', 'fire.mid');
        Editor.color(colors, c, 'colorEdge', 'fire.edge');
        Editor.color(colors, c, 'colorSmoke', 'fire.smoke');

        const embers = Editor.folder(folder, 'folder.embers');
        R(embers, c, 'emberRate', 0, 400, 1, 'fire.embersRate');
        R(embers, c, 'emberCount', 0, 3, 0.01, 'fire.emberCount');
        R(embers, c, 'emberSize', 0.01, 0.6, 0.005, 'fire.emberSize');
        R(embers, c, 'emberSpeed', 0, 10, 0.05, 'fire.emberSpeed');
        R(embers, c, 'emberLifetime', 0.1, 5, 0.05, 'fire.emberLife');
        R(embers, c, 'sparkRate', 0, 200, 1, 'fire.sparkRate');
        R(embers, c, 'sparkSpeed', 0, 20, 0.1, 'fire.sparkSpeed');
        R(embers, c, 'smokeDensity', 0, 2, 0.01, 'fire.smokeDensity');
        R(embers, c, 'smokeSpeed', 0, 5, 0.01, 'fire.smokeSpeed');
        R(embers, c, 'smokeSize', 0.1, 5, 0.01, 'fire.smokeSize');
        R(embers, c, 'smokeLifetime', 0.2, 8, 0.05, 'fire.smokeLife');

        const impact = Editor.folder(folder, 'folder.heat');
        R(impact, c, 'heatDistortion', 0, 4, 0.01, 'fire.heatIntensity');
        R(impact, c, 'distortionRadius', 0.2, 6, 0.05, 'fire.distortionRadius');
        R(impact, c, 'explosionSize', 0.2, 10, 0.05, 'fire.explosionSize');
        R(impact, c, 'explosionBrightness', 0, 8, 0.05, 'fire.explosionBrightness');
        R(impact, c, 'explosionShake', 0, 3, 0.01, 'fire.explosionShake');
        R(impact, c, 'explosionFlash', 0, 2, 0.01, 'fire.explosionFlash');
      },

      water: () => {
        const flight = Editor.folder(folder, 'folder.flight');
        R(flight, c, 'height', 0, 4, 0.01, 'water.height');
        R(flight, c, 'surge', 0, 2, 0.01, 'water.surge');
        R(flight, c, 'surgeLength', 0, 6, 0.01, 'water.surgeLength');
        R(flight, c, 'surgeSpeed', 0, 10, 0.01, 'water.surgeSpeed');
        R(flight, c, 'wakeSag', 0, 3, 0.01, 'water.wakeSag');

        const volume = Editor.folder(folder, 'folder.waterBody');
        R(volume, c, 'radius', 0.05, 3, 0.01, 'water.thickness');
        R(volume, c, 'headSize', 1, 5, 0.01, 'water.headSize');
        R(volume, c, 'crest', 1, 4, 0.01, 'water.crest');
        R(volume, c, 'streamLength', 0.5, 24, 0.1, 'water.streamLength');
        R(volume, c, 'waveAmplitude', 0, 1.5, 0.01, 'water.waveAmplitude');
        R(volume, c, 'waveFrequency', 0.1, 8, 0.01, 'water.waveFrequency');
        R(volume, c, 'chop', 0, 3, 0.01, 'water.chop');
        R(volume, c, 'flowSpeed', 0, 6, 0.01, 'water.flowSpeed');
        R(volume, c, 'noiseFrequency', 0.1, 6, 0.01, 'water.noiseFrequency');
        R(volume, c, 'swirl', 0, 4, 0.01, 'water.swirl');
        R(volume, c, 'detail', 0, 2, 0.01, 'water.detail');
        R(volume, c, 'streamStretch', 0.2, 10, 0.05, 'water.streamStretch');
        R(volume, c, 'crestSharpness', 0, 2, 0.01, 'water.crestSharpness');
        R(volume, c, 'volumeSteps', 8, 64, 1, 'water.volumeSteps');

        const surface = Editor.folder(folder, 'folder.surface');
        R(surface, c, 'transparency', 0, 1.5, 0.01, 'water.transparency');
        R(surface, c, 'depthDensity', 0, 4, 0.01, 'water.depthDensity');
        R(surface, c, 'refraction', 0, 4, 0.01, 'water.refraction');
        R(surface, c, 'fresnel', 0, 5, 0.01, 'water.fresnel');
        R(surface, c, 'envIntensity', 0, 4, 0.01, 'water.envIntensity');
        R(surface, c, 'skyReflection', 0, 3, 0.01, 'water.skyReflection');
        R(surface, c, 'specular', 0, 6, 0.01, 'water.specular');
        R(surface, c, 'translucency', 0, 4, 0.01, 'water.translucency');
        R(surface, c, 'foam', 0, 5, 0.01, 'water.surfaceFoam');
        R(surface, c, 'foamSharpness', 0.2, 6, 0.01, 'water.foamSharpness');
        R(surface, c, 'shred', 0, 1.5, 0.01, 'water.edgeBreak');
        R(surface, c, 'shredDepth', 0.02, 2, 0.01, 'water.shredDepth');
        R(surface, c, 'glow', 0, 6, 0.01, 'water.glow');
        R(surface, c, 'opacity', 0, 2, 0.01, 'water.opacity');
        Editor.color(surface, c, 'colorDeep', 'water.deepColour');
        Editor.color(surface, c, 'colorShallow', 'water.shallowColour');
        Editor.color(surface, c, 'colorFoam', 'water.foamColour');

        const spray = Editor.folder(folder, 'folder.spray');
        R(spray, c, 'dropletRate', 0, 800, 1, 'water.dropletRate');
        R(spray, c, 'dropletSize', 0.005, 0.5, 0.005, 'water.dropletSize');
        R(spray, c, 'dropletSpeed', 0, 10, 0.05, 'water.dropletSpeed');
        R(spray, c, 'dropletLifetime', 0.1, 5, 0.05, 'water.dropletLife');
        R(spray, c, 'sprayRate', 0, 600, 1, 'water.sprayRate');
        R(spray, c, 'spraySpeed', 0, 20, 0.1, 'water.spraySpeed');
        R(spray, c, 'foamRate', 0, 200, 1, 'water.foamRate');
        R(spray, c, 'foamSize', 0.05, 3, 0.01, 'water.foamSize');
        R(spray, c, 'foamLifetime', 0.1, 6, 0.05, 'water.foamLife');
        R(spray, c, 'mistDensity', 0, 2, 0.01, 'water.mistRate');
        R(spray, c, 'mistSize', 0.1, 5, 0.01, 'water.mistSize');
        R(spray, c, 'mistLifetime', 0.2, 6, 0.05, 'water.mistLife');
        R(spray, c, 'wakeRate', 0, 30, 0.5, 'water.wakeRate');

        const impact = Editor.folder(folder, 'folder.heat');
        R(impact, c, 'splashSize', 0.2, 12, 0.05, 'water.splashHeight');
        R(impact, c, 'splashIntensity', 0, 5, 0.01, 'water.splashIntensity');
        R(impact, c, 'crownJets', 0, 40, 1, 'water.crownJets');
        R(impact, c, 'foamSpread', 0, 20, 0.1, 'water.foamSpread');
        R(impact, c, 'foamLingering', 0.5, 12, 0.1, 'water.foamLingering');
        R(impact, c, 'rippleSize', 0.5, 20, 0.1, 'water.rippleSize');
        R(impact, c, 'rippleSpeed', 0.1, 4, 0.01, 'water.rippleSpeed');
        R(impact, c, 'explosionShake', 0, 3, 0.01, 'water.explosionShake');
        R(impact, c, 'explosionFlash', 0, 2, 0.01, 'water.explosionFlash');
      },

      earth: () => {
        const crust = Editor.folder(folder, 'earth.crust');
        R(crust, c, 'crustWidth', 0.5, 10, 0.05, 'earth.crustWidth');
        R(crust, c, 'crustDensity', 0.2, 3, 0.01, 'earth.crustDensity');
        R(crust, c, 'plateSize', 0.2, 3, 0.01, 'earth.plateSize');
        R(crust, c, 'plateThickness', 0.02, 1, 0.01, 'earth.plateThickness');
        R(crust, c, 'paintTime', 0.03, 1.5, 0.01, 'earth.paintTime');

        const fracture = Editor.folder(folder, 'earth.fracture');
        R(fracture, c, 'crackDelay', 0.02, 3, 0.01, 'earth.crackDelay');
        R(fracture, c, 'crackSharpness', 0.05, 1.5, 0.01, 'earth.crackSharpness');
        R(fracture, c, 'plateTilt', 0, 1.6, 0.01, 'earth.plateTilt');
        R(fracture, c, 'plateLift', 0, 1.5, 0.01, 'earth.plateLift');
        R(fracture, c, 'plateSpread', 0, 1.5, 0.01, 'earth.plateSpread');

        const rocks = Editor.folder(folder, 'earth.rocks');
        R(rocks, c, 'rockCount', 0.1, 3, 0.01, 'earth.rockCount');
        R(rocks, c, 'rockSpacing', 0.2, 4, 0.01, 'earth.rockSpacing');
        R(rocks, c, 'rockSize', 0.1, 3, 0.01, 'earth.rockSize');
        R(rocks, c, 'rockRandomness', 0, 2, 0.01, 'earth.rockRandomness');
        R(rocks, c, 'riseHeight', 0.1, 4, 0.01, 'earth.riseHeight');
        R(rocks, c, 'riseSpeed', 0.5, 14, 0.05, 'earth.riseSpeed');
        R(rocks, c, 'sinkDelay', 0, 4, 0.01, 'earth.sinkDelay');
        R(rocks, c, 'tumble', 0, 4, 0.01, 'earth.tumble');
        Editor.color(rocks, c, 'colorRock', 'earth.colorRock');
        Editor.color(rocks, c, 'colorRockDark', 'earth.colorRockDark');
        Editor.color(rocks, c, 'colorMoss', 'earth.colorMoss');

        const ground = Editor.folder(folder, 'earth.ground');
        R(ground, c, 'crackWidth', 0, 2, 0.01, 'earth.crackWidth');
        R(ground, c, 'crackDepth', 0, 3, 0.01, 'earth.crackDepth');
        R(ground, c, 'groundDisplacement', 0, 2, 0.01, 'earth.groundDisplacement');
        R(ground, c, 'glow', 0, 4, 0.01, 'earth.glow');

        const debris = Editor.folder(folder, 'earth.debris');
        R(debris, c, 'dustAmount', 0, 3, 0.01, 'earth.dustAmount');
        R(debris, c, 'dustLifetime', 0.2, 6, 0.05, 'earth.dustLife');
        R(debris, c, 'dustSize', 0.1, 5, 0.01, 'earth.dustSize');
        R(debris, c, 'debrisRate', 0, 300, 1, 'earth.debrisRate');
        R(debris, c, 'debrisVelocity', 0, 20, 0.1, 'earth.debrisVelocity');
        R(debris, c, 'debrisSize', 0.01, 0.6, 0.005, 'earth.debrisSize');
        R(debris, c, 'debrisLifetime', 0.1, 5, 0.05, 'earth.debrisLife');
        R(debris, c, 'pebbleRate', 0, 200, 1, 'earth.pebbleRate');

        const impact = Editor.folder(folder, 'folder.heat');
        R(impact, c, 'towerHeight', 0.5, 20, 0.05, 'earth.towerHeight');
        R(impact, c, 'towerWidth', 0.1, 5, 0.01, 'earth.towerWidth');
        R(impact, c, 'towerRiseTime', 0.1, 4, 0.01, 'earth.towerRiseTime');
        R(impact, c, 'towerHold', 0, 8, 0.05, 'earth.towerHold');
        R(impact, c, 'towerRocks', 0, 60, 1, 'earth.towerRocks');
        R(impact, c, 'towerRockRadius', 0.2, 8, 0.05, 'earth.towerRockRadius');
        R(impact, c, 'shakeIntensity', 0, 4, 0.01, 'earth.shakeIntensity');
        R(impact, c, 'shakeDuration', 0.1, 4, 0.01, 'earth.shakeDuration');
        R(impact, c, 'explosionFlash', 0, 2, 0.01, 'earth.explosionFlash');
      },

      wind: () => {
        const spiral = Editor.folder(folder, 'wind.spiral');
        R(spiral, c, 'ribbonCount', 1, 8, 1, 'wind.ribbonCount');
        R(spiral, c, 'ribbonWidth', 0.05, 6, 0.01, 'wind.ribbonWidth');
        R(spiral, c, 'ribbonOpacity', 0, 2, 0.01, 'wind.ribbonOpacity');
        R(spiral, c, 'ribbonLength', 1, 24, 0.1, 'wind.ribbonLength');
        R(spiral, c, 'spiralRadius', 0.05, 4, 0.01, 'wind.spiralRadius');
        R(spiral, c, 'sheetTwist', 0, 3.14, 0.01, 'wind.sheetTwist');
        R(spiral, c, 'rotationSpeed', 0, 20, 0.05, 'wind.rotationSpeed');
        R(spiral, c, 'vortexStrength', 0, 5, 0.01, 'wind.vortexStrength');
        R(spiral, c, 'swirlSpeed', 0, 8, 0.01, 'wind.swirlSpeed');
        R(spiral, c, 'filamentCount', 1, 64, 1, 'wind.filamentCount');
        R(spiral, c, 'filamentSharpness', 0, 1, 0.01, 'wind.filamentSharpness');
        R(spiral, c, 'turbulence', 0, 3, 0.01, 'wind.turbulence');
        R(spiral, c, 'haze', 0, 2, 0.01, 'wind.haze');
        R(spiral, c, 'opacity', 0, 2, 0.01, 'wind.opacity');
        R(spiral, c, 'glow', 0, 5, 0.01, 'wind.glow');
        R(spiral, c, 'fresnel', 0, 5, 0.01, 'wind.fresnel');
        R(spiral, c, 'distortion', 0, 4, 0.01, 'wind.distortion');
        R(spiral, c, 'noiseStrength', 0, 3, 0.01, 'wind.noiseStrength');
        R(spiral, c, 'noiseFrequency', 0.1, 6, 0.01, 'wind.noiseFrequency');
        Editor.color(spiral, c, 'colorInner', 'trail.innerColour');
        Editor.color(spiral, c, 'colorOuter', 'trail.outerColour');

        const debris = Editor.folder(folder, 'wind.debris');
        R(debris, c, 'leafCount', 0, 200, 1, 'wind.leafCount');
        R(debris, c, 'leafSize', 0.02, 0.8, 0.005, 'wind.leafSize');
        R(debris, c, 'leafSpin', 0, 12, 0.05, 'wind.leafSpin');
        R(debris, c, 'leafLifetime', 0.2, 6, 0.05, 'wind.leafLife');
        R(debris, c, 'dustAmount', 0, 3, 0.01, 'wind.dustAmount');
        R(debris, c, 'dustSize', 0.05, 3, 0.01, 'wind.dustSize');
        R(debris, c, 'dustRate', 0, 400, 1, 'wind.dustRate');

        const impact = Editor.folder(folder, 'wind.tornado');
        R(impact, c, 'tornadoHeight', 1, 20, 0.1, 'wind.tornadoHeight');
        R(impact, c, 'tornadoRadius', 0.2, 8, 0.05, 'wind.tornadoRadius');
        R(impact, c, 'tornadoDuration', 0.2, 6, 0.05, 'wind.tornadoDuration');
        R(impact, c, 'tornadoNeck', 0.04, 0.8, 0.01, 'wind.tornadoNeck');
        R(impact, c, 'tornadoShells', 1, 4, 1, 'wind.tornadoShells');
        R(impact, c, 'tornadoRoughness', 0, 0.5, 0.01, 'wind.tornadoRoughness');
        R(impact, c, 'tornadoLean', 0, 1.5, 0.01, 'wind.tornadoLean');
        R(impact, c, 'burstIntensity', 0, 5, 0.01, 'wind.burstIntensity');
        R(impact, c, 'explosionShake', 0, 3, 0.01, 'wind.explosionShake');
        R(impact, c, 'explosionFlash', 0, 2, 0.01, 'wind.explosionFlash');
      }
    };

    build[element]?.();

    // 동적 광원 — 4 원소 모두 공통
    const light = Editor.folder(folder, 'element.commonLight');
    R(light, c, 'lightIntensity', 0, 80, 0.1, 'common.lightIntensity');
    R(light, c, 'lightRadius', 0.5, 40, 0.1, 'common.lightRadius');
    Editor.color(light, c, 'lightColor', 'common.lightColour');

    // 동적 폴더 제목 (element.{name}.folder) 갱신 지원
    folder.__refreshTitle = () => {
      const label = t(`element.${element}.label`);
      folder.title(`${glyphFor(element)}  ${label}`);
    };
  }

  _buildEnvironment() {
    const folder = Editor.folder(this.gui, 'folder.environment');
    const e = settings.environment;
    const R = Editor.range;

    R(folder, e, 'sunIntensity', 0, 8, 0.01, 'env.sunIntensity');
    Editor.color(folder, e, 'sunColor', 'env.sunColour');
    R(folder, e, 'sunAzimuth', 0, Math.PI * 2, 0.01, 'env.sunAzimuth');
    R(folder, e, 'sunElevation', 0.05, 1.5, 0.01, 'env.sunElevation');
    R(folder, e, 'ambientIntensity', 0, 3, 0.01, 'env.ambient');
    Editor.color(folder, e, 'ambientColor', 'env.ambientColour');
    R(folder, e, 'hemiIntensity', 0, 3, 0.01, 'env.hemiIntensity');
    R(folder, e, 'envIntensity', 0, 3, 0.01, 'env.envIntensity');
    R(folder, e, 'shadowRadius', 0, 8, 0.05, 'env.shadowRadius');
    R(folder, e, 'shadowBias', -0.01, 0.001, 0.0001, 'env.shadowBias');
    R(folder, e, 'contactShadow', 0, 1.5, 0.01, 'env.contactShadow');

    const rim = Editor.folder(folder, 'env.rim');
    R(rim, e, 'rimIntensity', 0, 4, 0.01, 'env.rimIntensity');
    Editor.color(rim, e, 'rimColor', 'env.rimColour');
    R(rim, e, 'rimAzimuth', 0, Math.PI * 2, 0.01, 'env.rimAzimuth');
    R(rim, e, 'rimElevation', 0.05, 1.5, 0.01, 'env.rimElevation');
    Editor.color(rim, e, 'hemiSkyColor', 'env.hemiSky');
    Editor.color(rim, e, 'hemiGroundColor', 'env.hemiGround');

    const fog = Editor.folder(folder, 'env.backdrop');
    Editor.color(fog, e, 'backgroundColor', 'env.background');
    Editor.color(fog, e, 'fogColor', 'env.fogColour');
    R(fog, e, 'fogNear', 1, 120, 1, 'env.fogNear');
    R(fog, e, 'fogFar', 10, 400, 1, 'env.fogFar');
    R(fog, e, 'dustAmount', 0, 3, 0.01, 'env.dustMotes');

    const floor = Editor.folder(folder, 'env.floor');
    Editor.color(floor, e, 'floorColor', 'env.floorColour');
    Editor.color(floor, e, 'floorTint', 'env.floorTint');
    R(floor, e, 'floorRoughness', 0.05, 1, 0.01, 'env.floorRoughness');
    R(floor, e, 'floorSheen', 0, 1, 0.01, 'env.floorSheen');
    R(floor, e, 'floorPool', 0, 1, 0.01, 'env.floorPool');
  }

  _buildPost() {
    const folder = Editor.folder(this.gui, 'folder.post');
    const p = settings.post;
    const R = Editor.range;

    Editor.label(folder, p, 'enabled', 'post.enabled');
    R(folder, p, 'exposure', 0.1, 3, 0.01, 'post.exposure');
    R(folder, p, 'bloomStrength', 0, 3, 0.01, 'post.bloomStrength');
    R(folder, p, 'bloomRadius', 0, 1.5, 0.01, 'post.bloomRadius');
    R(folder, p, 'bloomThreshold', 0, 2, 0.01, 'post.bloomThreshold');
    R(folder, p, 'contrast', 0.5, 2, 0.01, 'post.contrast');
    R(folder, p, 'saturation', 0, 2.5, 0.01, 'post.saturation');
    R(folder, p, 'temperature', -0.5, 0.5, 0.01, 'post.temperature');
    R(folder, p, 'lift', -0.2, 0.2, 0.005, 'post.lift');
    R(folder, p, 'gain', 0.5, 2, 0.01, 'post.gain');
    R(folder, p, 'vignette', 0, 1.5, 0.01, 'post.vignette');
    R(folder, p, 'chromaticAberration', 0, 3, 0.01, 'post.chromatic');
    R(folder, p, 'grain', 0, 0.2, 0.001, 'post.grain');
    R(folder, p, 'flashStrength', 0, 2, 0.01, 'post.flash');
  }

  _buildCamera() {
    const folder = Editor.folder(this.gui, 'folder.camera');
    const c = settings.camera;
    const R = Editor.range;

    // 휠은 `distance`를 settings에 직접 쓰므로 슬라이더는 listen().
    R(folder, c, 'distance', 1, 40, 0.1, 'camera.distance').listen();
    R(folder, c, 'minDistance', 1, 20, 0.1, 'camera.minDistance');
    R(folder, c, 'maxDistance', 4, 40, 0.1, 'camera.maxDistance');
    R(folder, c, 'zoomSpeed', 0.1, 3, 0.01, 'camera.zoomSpeed');
    R(folder, c, 'fov', 20, 90, 0.5, 'camera.fov');
    R(folder, c, 'targetHeight', 0, 4, 0.01, 'camera.targetHeight');
    R(folder, c, 'minPolar', 0.05, 1.5, 0.01, 'camera.minPitch');
    R(folder, c, 'maxPolar', 0.2, 1.55, 0.01, 'camera.maxPitch');
    R(folder, c, 'damping', 0.001, 0.5, 0.001, 'camera.damping');
    R(folder, c, 'autoFrame', 0, 1, 0.01, 'camera.autoFrame');

    Editor.label(folder, { clear: () => this.hooks.onClear?.() }, 'clear', 'camera.clear');
  }

  _buildCharacter() {
    const folder = Editor.folder(this.gui, 'folder.character');
    const c = settings.character;
    const R = Editor.range;

    // 컨트롤러가 `pose`를 매 프레임 폴링하므로 드롭다운은 핸들러 불요.
    Editor.label(folder, c, 'pose', 'character.pose');
    R(folder, c, 'blendTime', 0.05, 3, 0.01, 'character.blendTime');
    R(folder, settings.global, 'animationSpeed', 0.1, 3, 0.01, 'character.idleSpeed');

    // 아래 항목들은 seated pose 가 바뀔 때마다 재구성된다.
    R(folder, c, 'breathing', 0, 3, 0.01, 'character.breathing');
    R(folder, c, 'breathRate', 0.05, 1, 0.01, 'character.breathRate');
    R(folder, c, 'legSpread', 0.6, 1.4, 0.01, 'character.legSpread');
    R(folder, c, 'torsoLean', -20, 20, 0.5, 'character.torsoLean');
    R(folder, c, 'seatClearance', 0, 0.08, 0.002, 'character.seatClearance');
    R(folder, c, 'handHeight', 0, 0.25, 0.005, 'character.handHeight');
    Editor.label(folder, c, 'handsOnKnees', 'character.handsOnKnees');
  }

  _buildWalk() {
    const folder = Editor.folder(this.gui, 'folder.walk');
    const c = settings.walk;
    const R = Editor.range;

    folder.__refreshTitle = () => {
      const label = t('mode.walk.label');
      folder.title(`◎  ${label}`);
    };
    folder.__refreshTitle();

    // App이 매 프레임 `settings.mode`를 폴링하므로 핸들러 불요.
    const modeController = folder.add(settings, 'mode', MODES).name(t('mode.walk.label') + ' / ' + t('mode.casting.label'));
    modeController.__i18nKey = 'walk.mode';

    const leap = Editor.folder(folder, 'walk.leap');
    R(leap, c, 'jumpSpeed', 1, 20, 0.1, 'walk.jumpSpeed');
    R(leap, c, 'jumpHeight', 0, 6, 0.05, 'walk.jumpHeight');
    R(leap, c, 'jumpMin', 0.1, 2, 0.05, 'walk.jumpMin');
    R(leap, c, 'jumpMax', 0.2, 3, 0.05, 'walk.jumpMax');
    R(leap, c, 'tuck', 0, 1, 0.01, 'walk.tuck');
    R(leap, c, 'poseBlend', 0.05, 2, 0.01, 'walk.poseBlend');
    R(leap, c, 'landShake', 0, 3, 0.01, 'walk.landShake');

    const ride = Editor.folder(folder, 'walk.ride');
    R(ride, c, 'speed', 0.5, 16, 0.1, 'walk.speed');
    R(ride, c, 'accel', 0.01, 3, 0.01, 'walk.accel');
    R(ride, c, 'brake', 0.05, 3, 0.01, 'walk.brake');
    R(ride, c, 'dismountTime', 0.1, 2, 0.01, 'walk.dismountTime');
    R(ride, c, 'hover', 0, 0.5, 0.005, 'walk.hover');
    R(ride, c, 'seatSink', 0, 1, 0.01, 'walk.seatSink');
    R(ride, c, 'bob', 0, 0.3, 0.005, 'walk.bob');
    R(ride, c, 'bobRate', 0.2, 8, 0.05, 'walk.bobRate');
    R(ride, c, 'lean', 0, 60, 0.5, 'walk.lean');
    R(ride, c, 'leanRate', 0.2, 6, 0.05, 'walk.leanRate');
    R(ride, c, 'leanDamping', 0.00005, 0.2, 0.00005, 'walk.leanDamping');
    R(ride, c, 'turnDamping', 0.000001, 0.01, 0.000001, 'walk.turnDamping');
    Editor.label(ride, c, 'returnHome', 'walk.returnHome');

    const ball = Editor.folder(folder, 'walk.ball');
    R(ball, c, 'radius', 0.1, 1.5, 0.01, 'walk.radius');
    R(ball, c, 'squash', 0, 0.6, 0.01, 'walk.squash');
    R(ball, c, 'spin', 0, 8, 0.01, 'walk.spin');
    R(ball, c, 'bands', 2, 20, 1, 'walk.bands');
    R(ball, c, 'twist', 0, 8, 0.01, 'walk.twist');
    R(ball, c, 'filamentSharp', 0, 1, 0.01, 'walk.filamentSharp');
    R(ball, c, 'turbulence', 0, 3, 0.01, 'walk.turbulence');
    R(ball, c, 'haze', 0, 2, 0.01, 'walk.haze');
    R(ball, c, 'wobble', 0, 0.5, 0.01, 'walk.wobble');
    R(ball, c, 'fresnel', 0, 5, 0.01, 'walk.fresnel');
    R(ball, c, 'opacity', 0, 2, 0.01, 'walk.opacity');
    R(ball, c, 'glow', 0, 5, 0.01, 'walk.glow');
    Editor.color(ball, c, 'colorInner', 'trail.innerColour');
    Editor.color(ball, c, 'colorOuter', 'trail.outerColour');

    const debris = Editor.folder(folder, 'walk.debris');
    R(debris, c, 'dustRate', 0, 600, 1, 'walk.dustRate');
    R(debris, c, 'dustSize', 0.05, 3, 0.01, 'walk.dustSize');
    R(debris, c, 'dustLifetime', 0.1, 4, 0.05, 'walk.dustLife');
    R(debris, c, 'lightIntensity', 0, 40, 0.1, 'walk.lightIntensity');
    R(debris, c, 'lightRadius', 0.5, 30, 0.1, 'walk.lightRadius');
    Editor.color(debris, c, 'lightColor', 'common.lightColour');

    this.walkFolder = folder;
  }

  /** 리소스 정리 (Vercel 환경에선 거의 호출되지 않음). */
  dispose() {
    this._unsubscribeLocale?.();
    this.gui.destroy();
  }
}

/** 원소별 HUD 글리프 (원본 settings.ELEMENT_META.glyph와 동기화). */
function glyphFor(element) {
  return ({ fire: '🜂', water: '🜄', earth: '🜃', wind: '🜁' })[element] ?? '';
}
