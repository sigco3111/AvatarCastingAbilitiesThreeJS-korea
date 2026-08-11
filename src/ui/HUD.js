import { ELEMENTS, ELEMENT_META, MODES, MODE_META } from '../config/settings.js';
import { ELEMENT_SIGILS } from './glyphs.js';

/**
 * Heads-up display: mode switch, element selector, controls, live stats and
 * toasts.
 *
 * Plain DOM — no framework. The switches are the only interactive parts; they
 * mirror the keyboard shortcuts and report back through `onSelect` / `onMode`.
 */
export class HUD {
  constructor(root) {
    this.root = root;
    this.onSelect = null;
    this.onMode = null;
    this._toastTimer = 0;
    this._statsAccumulator = 0;
    this._frames = 0;
    this._fps = 0;

    root.innerHTML = `
      <div class="hud__panel hud__title">
        원소 조형 샌드박스
        <span data-blurb>경로를 그리고, 마우스를 떼면 시전합니다.</span>
      </div>

      <div class="hud__panel hud__stats">
        <div>FPS <b data-stat="fps">—</b></div>
        <div>파티클 <b data-stat="particles">0</b></div>
        <div>드로우 콜 <b data-stat="calls">0</b></div>
        <div>시전 중 <b data-stat="abilities">0</b></div>
      </div>

      <div class="hud__panel hud__help">
        <div><strong>왼쪽 마우스 드래그</strong> — 바닥에 경로를 그립니다</div>
        <div><strong>마우스 떼기</strong> — 선택한 원소를 시전합니다</div>
        <div><strong>오른쪽 드래그</strong> — 카메라를 회전합니다</div>
        <div><strong>스크롤</strong> — 줌 인 / 아웃</div>
        <div style="margin-top:6px">
          <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> 원소 선택 &nbsp;
          <kbd>Q</kbd><kbd>E</kbd> 순환
        </div>
        <div><kbd>G</kbd> 에디터 &nbsp; <kbd>C</kbd> 모두 지우기 &nbsp; <kbd>P</kbd> 일시정지 &nbsp; <kbd>H</kbd> 도움말 숨기기</div>
        <div><kbd>T</kbd> 앉기 / 서기 &nbsp; <kbd>M</kbd> 시전 / 탑승 모드</div>
      </div>

      <div class="hud__modes">
        ${MODES.map((mode) => {
          const meta = MODE_META[mode];
          return `
            <div class="mode-card" data-mode="${mode}">
              <span class="mode-card__glyph">${meta.glyph}</span>${meta.label}
            </div>`;
        }).join('')}
        <span class="hud__modes-key">M</span>
      </div>

      <div class="hud__elements">
        ${ELEMENTS.map((element, index) => {
          const meta = ELEMENT_META[element];
          return `
            <div class="element-card" data-element="${element}" style="--accent:${meta.accent}">
              <div class="element-card__key">${index + 1}</div>
              <div class="element-card__glyph">${ELEMENT_SIGILS[element] ?? meta.glyph}</div>
              <div class="element-card__label">${meta.label}</div>
            </div>`;
        }).join('')}
      </div>

      <div class="hud__toast" data-toast></div>
    `;

    this.cards = new Map();
    for (const card of root.querySelectorAll('.element-card')) {
      this.cards.set(card.dataset.element, card);
      card.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        this.onSelect?.(card.dataset.element);
      });
    }

    this.modeCards = new Map();
    for (const card of root.querySelectorAll('.mode-card')) {
      this.modeCards.set(card.dataset.mode, card);
      card.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        this.onMode?.(card.dataset.mode);
      });
    }

    this.stats = {
      fps: root.querySelector('[data-stat="fps"]'),
      particles: root.querySelector('[data-stat="particles"]'),
      calls: root.querySelector('[data-stat="calls"]'),
      abilities: root.querySelector('[data-stat="abilities"]')
    };
    this.help = root.querySelector('.hud__help');
    this.toast = root.querySelector('[data-toast]');
    this.blurb = root.querySelector('[data-blurb]');
    this.elements = root.querySelector('.hud__elements');
  }

  setElement(element) {
    for (const [key, card] of this.cards) {
      card.classList.toggle('is-active', key === element);
    }
    const meta = ELEMENT_META[element];
    if (meta) this.showToast(`${meta.hint} selected`);
  }

  /** Reflect the interaction mode. Walk mode dims the (unused) element picker. */
  setMode(mode) {
    for (const [key, card] of this.modeCards) {
      card.classList.toggle('is-active', key === mode);
    }
    const meta = MODE_META[mode];
    if (!meta) return;
    this.blurb.textContent = meta.blurb;
    this.elements.classList.toggle('is-dimmed', mode !== 'casting');
  }

  toggleHelp() {
    this.help.classList.toggle('is-hidden');
  }

  showToast(message, duration = 1400) {
    this.toast.textContent = message;
    this.toast.classList.add('is-visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toast.classList.remove('is-visible'), duration);
  }

  /**
   * @param {number} dt
   * @param {() => {particles:number, calls:number, abilities:number}} collect
   *   Called only when the readout actually refreshes, so gathering the numbers
   *   (which means walking the particle pools) stays off the hot path.
   */
  update(dt, collect) {
    this._frames++;
    this._statsAccumulator += dt;
    if (this._statsAccumulator < 0.4) return;

    this._fps = Math.round(this._frames / this._statsAccumulator);
    this._frames = 0;
    this._statsAccumulator = 0;

    const info = collect();
    this.stats.fps.textContent = this._fps;
    this.stats.particles.textContent = info.particles;
    this.stats.calls.textContent = info.calls;
    this.stats.abilities.textContent = info.abilities;
  }
}

/** Boot screen helper. */
export class LoadingScreen {
  constructor() {
    this.element = document.getElementById('loader');
    this.fill = document.getElementById('loader-fill');
    this.status = document.getElementById('loader-status');
  }

  setProgress(ratio, message) {
    this.fill.style.width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
    if (message) this.status.textContent = message;
  }

  hide() {
    this.setProgress(1);
    setTimeout(() => this.element.classList.add('is-hidden'), 220);
  }

  fail(message) {
    this.status.textContent = message;
    this.status.style.color = '#ff7a6a';
  }
}
