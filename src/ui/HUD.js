import { ELEMENTS, MODES } from '../config/settings.js';
import { ELEMENT_SIGILS } from './glyphs.js';
import { t, locale, toggleLocale, onChange as subscribeLocaleChange } from './i18n.js';

const ACCENTS = {
  fire: '#ff6a1a',
  water: '#31b6ff',
  earth: '#b98a4d',
  wind: '#c9f0ff'
};

const MODE_GLYPHS = {
  casting: '✦',
  walk: '◎'
};

/**
 * 부팅 로딩 화면.
 *
 * 정적 HTML에 박힌 #loader 위에 진행도 + 상태 메시지를 얹는다. 모든 텍스트는
 * i18n 키를 통해 표시되며, 언어 변경 시 자동으로 다시 그려진다.
 */
export class LoadingScreen {
  constructor() {
    this.el = document.getElementById('loader');
    this.fill = document.getElementById('loader-fill');
    this.status = document.getElementById('loader-status');
    this._unsubscribe = subscribeLocaleChange(() => this._refresh());
    this._refresh();
  }

  _refresh() {
    if (this.status && !this.status.dataset.custom) {
      this.status.textContent = t('loader.summoning');
    }
  }

  setProgress(ratio, statusText) {
    if (this.fill) this.fill.style.width = `${Math.round(ratio * 100)}%`;
    if (this.status && statusText) {
      this.status.dataset.custom = '1';
      this.status.textContent = statusText;
    }
  }

  hide() {
    if (this.el) this.el.classList.add('loader--hidden');
  }

  fail(message) {
    if (this.el) this.el.classList.add('loader--failed');
    if (this.status) {
      this.status.dataset.custom = '1';
      this.status.textContent = message;
    }
  }

  dispose() {
    this._unsubscribe?.();
  }
}

/**
 * 헤드 업 디스플레이: 모드 전환, 원소 선택, 단축키 도움말, 라이브 스탯, 토스트,
 * 한/EN 언어 토글 단추.
 *
 * 순수 DOM — 프레임워크 없음. 모드 / 원소 카드는 이벤트 위임(`pointerdown`)으로
 * 한 번만 바인딩되어 매 새로고침마다 핸들러가 새로 붙지 않는다. 키보드 단축키와
 * 동기화되어 `onSelect` / `onMode` / `onLocaleToggle` 으로 보고한다.
 */
export class HUD {
  constructor(root) {
    this.root = root;
    this.onSelect = null;
    this.onMode = null;
    this.onLocaleToggle = null;
    this._toastTimer = 0;

    this._renderShell();
    this._installClickDelegates();
    this._refresh();

    this._unsubscribeLocale = subscribeLocaleChange(() => this._refresh());
  }

  _renderShell() {
    this.root.innerHTML = `
      <div class="hud__panel hud__title">
        <span data-app-title></span>
        <span data-blurb></span>
        <!-- 한/영 토글 단추 — 타이틀 패널 안 우측에 절대 배치 (lil-gui와 절대 겹치지 않음) -->
        <button class="hud__lang-toggle" data-lang-toggle type="button" aria-label="한/영 토글">
          <span class="hud__lang-toggle__cur" data-lang-cur></span>
          <span class="hud__lang-toggle__sep">·</span>
          <span class="hud__lang-toggle__alt" data-lang-alt></span>
        </button>
      </div>

      <div class="hud__panel hud__help" data-help-panel>
        <div data-help="drawPath"></div>
        <div data-help="release"></div>
        <div data-help="orbit"></div>
        <div data-help="zoom"></div>
        <div style="margin-top:6px" data-help="elements"></div>
        <div data-help="editor"></div>
        <div data-help="posture"></div>
      </div>

      <div class="hud__panel hud__stats">
        <div><span data-stats-label="fps"></span> <b data-stat="fps">—</b></div>
        <div><span data-stats-label="particles"></span> <b data-stat="particles">0</b></div>
        <div><span data-stats-label="drawCalls"></span> <b data-stat="calls">0</b></div>
        <div><span data-stats-label="abilities"></span> <b data-stat="abilities">0</b></div>
      </div>

      <div class="hud__modes" data-modes></div>
      <div class="hud__elements" data-elements></div>

      <div class="hud__toast" data-toast></div>
    `;

    this.stats = {
      fps: this.root.querySelector('[data-stat="fps"]'),
      particles: this.root.querySelector('[data-stat="particles"]'),
      calls: this.root.querySelector('[data-stat="calls"]'),
      abilities: this.root.querySelector('[data-stat="abilities"]')
    };
    this.help = this.root.querySelector('[data-help-panel]');
    this.toast = this.root.querySelector('[data-toast]');
    this.blurb = this.root.querySelector('[data-blurb]');
    this.elements = this.root.querySelector('[data-elements]');
    this.modes = this.root.querySelector('[data-modes]');
    this.appTitle = this.root.querySelector('[data-app-title]');
    this.langToggle = this.root.querySelector('[data-lang-toggle]');
    this.langCur = this.root.querySelector('[data-lang-cur]');
    this.langAlt = this.root.querySelector('[data-lang-alt]');
    this.statsPanel = this.root.querySelector('.hud__stats');

    this.langToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleLocale();
      this.onLocaleToggle?.(locale());
    });
  }

  _installClickDelegates() {
    // 모드 / 원소 카드 이벤트 위임 — root 한 곳에서만 핸들러 등록
    this.root.addEventListener('pointerdown', (event) => {
      const modeCard = event.target.closest('.mode-card');
      if (modeCard) {
        event.stopPropagation();
        this.onMode?.(modeCard.dataset.mode);
        return;
      }
      const elementCard = event.target.closest('.element-card');
      if (elementCard) {
        event.stopPropagation();
        this.onSelect?.(elementCard.dataset.element);
      }
    });
  }

  _refresh() {
    // 타이틀 + blurb
    this.appTitle.textContent = t('app.title');
    this.blurb.textContent = locale() === 'ko' ? t('app.subtitle.ko') : t('app.subtitle');

    // stats 라벨
    for (const [key, label] of [
      ['fps', 'stats.fps'],
      ['particles', 'stats.particles'],
      ['drawCalls', 'stats.drawCalls'],
      ['abilities', 'stats.abilities']
    ]) {
      const span = this.root.querySelector(`[data-stats-label="${key}"]`);
      if (span) span.textContent = t(label);
    }

    // help
    for (const key of ['drawPath', 'release', 'orbit', 'zoom', 'elements', 'editor', 'posture']) {
      const node = this.root.querySelector(`[data-help="${key}"]`);
      if (node) node.innerHTML = t(`help.${key}`);
    }

    // 모드 카드 (선택 표시 갱신 위해 다시 그림)
    this._renderModeCards();
    this._renderElementCards();

    // 토글 단추 라벨
    this.langCur.textContent = locale() === 'ko' ? '한국어' : 'EN';
    this.langAlt.textContent = locale() === 'ko' ? 'EN' : '한국어';
  }

  _renderModeCards() {
    if (!this.modes) return;
    this.modes.innerHTML = MODES.map((mode) => {
      const label = t(`mode.${mode}.label`);
      const glyph = MODE_GLYPHS[mode] ?? '';
      return `
        <div class="mode-card" data-mode="${mode}">
          <span class="mode-card__glyph">${glyph}</span>${label}
        </div>`;
    }).join('') + `<span class="hud__modes-key">${t('modeKey')}</span>`;
  }

  _renderElementCards() {
    if (!this.elements) return;
    this.elements.innerHTML = ELEMENTS.map((element, index) => {
      const label = t(`element.${element}.label`);
      return `
        <div class="element-card" data-element="${element}" style="--accent:${ACCENTS[element]}">
          <div class="element-card__key">${index + 1}</div>
          <div class="element-card__glyph">${ELEMENT_SIGILS[element] ?? ''}</div>
          <div class="element-card__label">${label}</div>
        </div>`;
    }).join('');
  }

  /* -------------------------------------------------------------- */
  /* 외부 API (App.js 가 호출)                                       */
  /* -------------------------------------------------------------- */

  setElement(element) {
    this._currentElement = element;
    for (const card of this.root.querySelectorAll('.element-card')) {
      card.classList.toggle('element-card--active', card.dataset.element === element);
    }
  }

  setMode(mode) {
    this._currentMode = mode;
    for (const card of this.root.querySelectorAll('.mode-card')) {
      card.classList.toggle('mode-card--active', card.dataset.mode === mode);
    }
  }

  setStatus(text) {
    const status = document.getElementById('loader-status');
    if (status) status.textContent = text;
  }

  setTitleBlurb(text) {
    if (this.blurb) this.blurb.textContent = text;
  }

  setModeBlurb(text) { /* 모드 카드가 자체 표시하므로 호환용 no-op */ }

  toggleHelp() {
    if (this.help) this.help.classList.toggle('hud__help--hidden');
  }

  /** 스탯 패널 표시/숨김 (S 키) — 기본 숨김 */
  toggleStats() {
    if (!this.statsPanel) return false;
    const visible = this.statsPanel.classList.toggle('hud__stats--visible');
    return visible;
  }

  /** 옛 호출 호환. raw stats + 콜백 둘 다 받음. */
  update(raw, _legacyCallback) {
    const stats = typeof raw === 'function' ? raw() : raw;
    if (!stats) return;
    this.updateStats({
      fps: stats.fps,
      particles: stats.particles,
      calls: stats.calls ?? stats.drawCalls,
      abilities: stats.abilities
    });
  }

  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add('hud__toast--visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toast.classList.remove('hud__toast--visible');
    }, 1600);
  }

  updateStats({ fps, particles, drawCalls, abilities }) {
    if (typeof fps === 'number') this.stats.fps.textContent = fps.toFixed(0);
    if (typeof particles === 'number') this.stats.particles.textContent = particles.toLocaleString();
    if (typeof drawCalls === 'number') this.stats.calls.textContent = drawCalls.toLocaleString();
    if (typeof abilities === 'number') this.stats.abilities.textContent = abilities.toString();
  }

  dispose() {
    this._unsubscribeLocale?.();
  }
}

