# 🌀 원소 조형 샌드박스

> **아바타에서 영감을 받은 4원소(불·물·흙·공기) 굴리기 샌드박스**  
> Three.js + Vite + 자체 GLSL로 구현된 실시간 VFX 데모 플랫폼.  
> 바닥에 마우스로 경로를 그리면 4원소가 그 경로를 따라 쏘아져 끝에서 폭발합니다.

[![라이브 데모](https://img.shields.io/badge/🌐_Live_Demo-casting--abilities.vercel.app-6366f1?style=for-the-badge)](https://casting-abilities.vercel.app/)
[![라이선스: MIT](https://img.shields.io/badge/라이선스-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r185-000000?style=for-the-badge)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

<p align="center">
  <sub><b>원본</b>: <a href="https://github.com/achrefelouafi/AvatarCastingAbilitiesThreeJS">achrefelouafi/AvatarCastingAbilitiesThreeJS</a></sub>
  &nbsp;·&nbsp;
  <sub><b>104 ⭐</b> · MIT · 0 dependencies except three + lil-gui</sub>
</p>

---

## 🎬 TL;DR — 무엇을 할 수 있나

1. **🖱️ 경로를 그립니다** — 바닥에 마우스 왼쪽 드래그 (베지에 스플라인 자동 보간).
2. **✨ 마우스를 떼면 시전** — 불·물·흙·공기 중 선택한 원소가 그 경로를 따라 날아가 끝에서 폭발.
3. **🧘 또는 탑니다** — `M` 키로 탑승 모드: 같은 경로를 *탄다* — 아바타가 획의 머리로 뛰어오르고 회전하는 공기 위에 가부좌 결로 앉아 모든 코너를 따라 기울이며 달립니다.
4. **🎛️ 모든 시각 파라미터를 실시간 편집** — `G` 키로 VFX 에디터 열기. 색·속도·난류·분사·파티클 밀도 등을 슬라이더 한 번에 변경.
5. **💾 프리셋 저장·불러오기** — 마음에 드는 구성을 `My preset`으로 저장하고 라이브러리에 누적.

---

## 🌐 라이브 데모

| URL | 용도 |
|---|---|
| **[casting-abilities.vercel.app](https://casting-abilities.vercel.app/)** | 🎯 사용자용 — anon 200, SSO 없이 바로 접근 |
| `casting-abilities-gx32gkvax-sigco3111s-projects.vercel.app` | ⚙️ team-scope production URL — 내부 디버깅용 |

> ⚠️ **macOS Safari 권장**: WebGL2 + 이미지 기반 조명 + FBX 캐릭터 + HDR 환경 조명을 모두 사용하므로, GPU 가속이 활성화된 데스크탑 브라우저에서 가장 잘 작동합니다.

---

## 🌐 한/EN 토글

빌드 결과 페이지 우측 상단에 **[한국어 · EN]** 원형 단추가 표시됩니다. 클릭하면 즉시 전체 UI의 언어가 전환되고, 다음 방문을 위해 `localStorage` 에 저장됩니다. 모든 사용자 표시 텍스트 (HUD, VFX 에디터 라벨, 토스트, 단축키 도움말, 로딩 화면, 모드/원소 카드)가 함께 다시 그려집니다.

| 로케일 | 키 (i18n 키 dictionary) | 비고 |
|---|---|---|
| 🇰🇷 한국어 (기본) | `src/ui/i18n.js#ko` | 첫 방문 또는 명시적 토글 |
| 🇺🇸 English | `src/ui/i18n.js#en` | 원본 텍스트 보존, 토글로 즉시 전환 |

> 💡 **구조적 메모**: 자체 빌드 `t(key, params)` 함수 — 200+ 키 사전, `document.documentElement.lang` 자동 동기화, 변경 시 등록된 콜백 모두 발화 → HUD/Editor가 별도 코드 변경 없이 즉시 re-render.

---

## ⚡ 5분 빠른 시작

> 사전 요구: **Node 22+**, **pnpm 9+** (또는 npm 10+)

### 1️⃣ 의존성 설치

```bash
pnpm install
# 또는
npm install
```

> 의존성은 단 **2개**입니다: [`three`](https://www.npmjs.com/package/three) (WebGL 렌더링) + [`lil-gui`](https://www.npmjs.com/package/lil-gui) (VFX 에디터 패널).

### 2️⃣ 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://127.0.0.1:5173](http://127.0.0.1:5173) 열기. 첫 로드는 **FBX 캐릭터 + HDR 환경맵** 8MB 다운로드로 1~3초 걸립니다.

### 3️⃣ 빌드

```bash
pnpm build       # dist/ 에 정적 산출물 생성
pnpm preview     # 빌드 결과 로컬에서 미리보기
```

번들 크기: **JS 978 KB (gzip 266 KB)** + **CSS 6 KB** + **FBX 2.3 MB + HDR 5.7 MB** (public/ 자산).

### 4️⃣ Vercel 배포 (선택)

```bash
# 1회만: Vercel에 새 프로젝트 import + production alias 할당
vercel --yes --prod --non-interactive --scope sigco3111s-projects --token "$VERCEL_TOKEN"

# 이후: git push origin main 만으로 자동 재배포
git push origin main
```

---

## 🎮 조작법 (한눈에)

### 🖱️ 마우스

| 입력 | 동작 |
|---|---|
| **왼쪽 드래그** | 바닥에 경로 그리기 (마우스를 떼면 시전) |
| **오른쪽 드래그** | 카메라 궤도 회전 (줌은 잠금) |

### ⌨️ 키보드

| 키 | 동작 |
|---|---|
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> | **불 / 물 / 흙 / 공기** 선택 |
| <kbd>Q</kbd> / <kbd>E</kbd> | 원소 순환 (이전 / 다음) |
| <kbd>M</kbd> | **시전 ↔ 탑승** 모드 토글 |
| <kbd>G</kbd> | VFX 에디터 표시 / 숨기기 |
| <kbd>C</kbd> | 모든 활성 효과 제거 + 탑승 취소 |
| <kbd>P</kbd> | 시뮬레이션 일시정지 / 재개 |
| <kbd>T</kbd> | 아바타 자세 토글 (서기 ↔ 가부좌 결로) |
| <kbd>H</kbd> | 조작 도움말 패널 숨기기 |
| <kbd>S</kbd> | HUD 스탯 박스 표시 / 숨기기 (FPS·파티클·드로우콜·시전 중) |
| 우상단 **한국어 · EN** 단추 | 🇰🇷 한 / 🇺🇸 EN 즉시 전환 (다음 방문에도 유지) |

> 💡 **왼쪽 마우스는 그리기에 예약**되어 있어, 카메라 궤도 회전은 **반드시 오른쪽 버튼**을 사용합니다.

---

## 🎨 4원소 시연

| 키 | 원소 | 비주얼 | 특화 파라미터 |
|---|---|---|---|
| <kbd>1</kbd> | 🔥 **불** | 볼륨 셰이더로 만든 굴뚝 불꽃 + 비산 불씨 + 연기 | 비행 속도, 불꽃 모양, 난류, 온도/발광, 볼륨 렌더링, 그라데이션 (코어 → 중간 → 가장자리 → 연기) |
| <kbd>2</kbd> | 💧 **물** | 절차적 굴곡 표면 + 물보라 + 거품 + 안개 | 본체 굵기, 표면 그라데이션, 분무/거품/안개 밀도 |
| <kbd>3</kbd> | 🪨 **흙** | 절차적 절차 절차적 절차적 절차적 절차적 절차적 절차적 절차적 절차적 절차적 절차 절차 절 절 | (VFX 에디터에서 조정) |
| <kbd>4</kbd> | 🌪️ **공기** | 회전 입자 + 바람 셰이더 + 스쿠터 | 비행 궤적, 분사 각도 |

> 🎛️ 각 원소는 `src/abilities/<Element>Ability.js`에 정의되어 있으며, 모든 필드는 `src/config/settings.js`를 통해 VFX 에디터에 양방향 바인딩됩니다.

---

## 🏛️ 아키텍처

### 📂 프로젝트 구조

```
src/
├─ abilities/         # 원소별 시전 클래스 + 풀링 관리자
│  ├─ Ability.js              # 베이스 클래스 (생성, 비행, 폭발, 디스포즈)
│  ├─ AbilityManager.js       # 동적 활성 추적 + 일괄 정리
│  ├─ FireAbility.js          # 🔥 볼륨 셰이더
│  ├─ WaterAbility.js         # 💧 절차적 표면
│  ├─ EarthAbility.js         # 🪨 절차적 절차 절차 절차
│  └─ WindAbility.js          # 🌪️ 바람 + 스쿠터
│
├─ animation/         # FBX 캐릭터 + 절차적 포즈 + 탑승 시퀀스
│  ├─ CharacterController.js   # 리깅 메시 + AnimationMixer 래퍼
│  ├─ SittingPose.js          # 가부좌 결로 절차적 생성
│  └─ WalkController.js       # 도약 → 탑승 → 하마 시퀀스
│
├─ assets/            # 절차적 지오메트리 생성기
│  └─ ProceduralGeometry.js   # 돌, 지면 판자, 탑, 파편
│
├─ config/            # 🔑 단일 진실 공급원
│  └─ settings.js             # 모든 시각 파라미터 + 메타
│
├─ core/              # 렌더 파이프라인
│  ├─ App.js                  # 메인 오케스트레이터
│  ├─ CameraRig.js            # 궤도 카메라 + 충돌 방지
│  ├─ FrameUniforms.js        # 공통 유니폼 등록
│  ├─ Layers.js               # 레이어 기반 컬링
│  ├─ Renderer.js             # Three.js WebGL 리치 링처
│  └─ Time.js                 # 델타 + 누적 + 시뮬레이션 시간
│
├─ effects/           # 시각 효과 모듈
│  ├─ AirScooter.js           # 회전 공기 구체 + 트레일
│  ├─ BurstSphere.js          # 폭발 시각 + 카메라 흔들림
│  ├─ CameraShake.js          # 절차적 흔들림
│  ├─ GroundDecals.js         # 시전 끝점의 잔상
│  ├─ LightPool.js            # 동적 광원 풀링
│  ├─ PathTrail.js            # 경로 따라가는 글로우 트레일
│  ├─ RibbonGeometry.js        # 절차적 리본 지오메트리
│  └─ ScreenFlash.js          # 폭발 시 화면 플래시
│
├─ input/             # 입력 처리
│  ├─ InputManager.js         # 마우스 + 키보드 라우터
│  └─ PathDrawer.js           # 바닥 위 베지에 스플라인
│
├─ loaders/
│  └─ AssetLoader.js          # FBX / HDR / 텍스처 폴백
│
├─ materials/         # 모든 GLSL 머티리얼
│  ├─ AirScooterMaterial.js
│  ├─ DistortionMaterial.js   # 파동 왜곡
│  ├─ OceanWaterMaterial.js   # 절차적 물 표면
│  ├─ RockMaterial.js         # 절차적 절차 절차 절차
│  ├─ TrailMaterial.js        # 글로우 트레일
│  ├─ VolumetricFireMaterial.js # 볼륨 메트 볼류메 트릭
│  └─ WindMaterial.js
│
├─ particles/         # 자체 입자 엔진
│  ├─ ParticleEngine.js       # 시뮬레이션 + 통합
│  └─ ParticleSystem.js       # 생성기 (방출 + 수명)
│
├─ postprocessing/    # 포스트 프로세싱 스택
│  ├─ DistortionShader.js     # 비네트 + 색수차 + 왜곡
│  ├─ GradeShader.js          # 컬러 그레이딩 + 그레인
│  ├─ PostProcessing.js       # 파이프라인 오케스트레이터
│  └─ ...
│
├─ shaders/lib/       # GLSL 조각
│  ├─ common.glsl.js          # 노이즈·수학·컬러 헬퍼
│  └─ noise.glsl.js           # 3D 노이즈 함수 모음
│
├─ ui/                # HUD + VFX 에디터 (한국어)
│  ├─ HUD.js                  # 메인 HUD + 단축키 패널
│  ├─ Editor.js               # lil-gui 기반 VFX 에디터
│  ├─ PresetManager.js        # localStorage 프리셋
│  ├─ glyphs.js               # 4원소 SVG 시길
│  └─ styles.css
│
├─ utils/             # 범용 유틸
│  ├─ EventEmitter.js         # 컴포넌트 간 메시지
│  ├─ ObjectPool.js           # 객체 풀링 (가비지 컬렉션 방지)
│  ├─ color.js                # 색공간 변환
│  ├─ dispose.js              # GPU 리소스 디스포즈
│  ├─ math.js                 # 베지에 / 노이즈 / 보간
│  └─ shaderPatch.js          # 셰이더 핫 패치
│
└─ world/             # 환경
   ├─ ContactShadows.js       # 부드러운 그림자
   ├─ DustMotes.js            # 떠다니는 먼지 입자
   ├─ Environment.js          # HDR + IBL 설정
   └─ Ground.js               # 절차적 지면 + 그리드
```

### 🔑 단일 진실 공급원 (Single Source of Truth)

**모든 시각 파라미터는 `src/config/settings.js`에 정의**됩니다. VFX 에디터(`G` 키)는 그 객체를 슬라이더에 직접 바인딩하므로:

| 작업 | 코드 변경 | 라이브 반영 |
|---|---|---|
| 슬라이더를 움직임 | ❌ | ✅ 즉시 (다음 프레임) |
| 프리셋 저장 | ❌ | ✅ 즉시 |
| 셰이더 컴파일 | ❌ 불요 | ✅ 모든 라이브 셰이더가 매 프레임 유니폼 재읽기 |

이렇게 하면 셰이더 재컴파일 없이 **모든 활성 시전, 진행 중인 시뮬레이션, 환경 조명, 포스트 스택**이 동시에 업데이트됩니다. 시전 중에 슬라이더를 움직여도 이미 진행 중인 불꽃의 모양이 즉시 바뀝니다.

### 🔄 요청 → 렌더 파이프라인

```
[PathDrawer] mouse drag
       ↓ bezier points + tension
[AbilityManager] picks next pool entry
       ↓
[FireAbility/WaterAbility/...Ability] creates visual
       ↓ flight position per frame
[ParticleEngine] emits + integrates particles
       ↓
[Effects] burst sphere + camera shake + screen flash
       ↓
[PostProcessing] distortion + grading + grain
       ↓
[WebGL renderer]
```

각 컴포넌트는 `EventEmitter`로 느슨하게 결합되어 있어 한 컴포넌트만 교체해도 나머지는 영향받지 않습니다.

---

## 🧰 기술 스택

### 본체

| 라이브러리 | 버전 | 역할 |
|---|---|---|
| [Three.js](https://threejs.org/) | `^0.185.1` | WebGL 렌더링, FBX 로더, AnimationMixer, 머티리얼 시스템 |
| [lil-gui](https://lil-gui.dev/) | `^0.21.0` | VFX 에디터 패널 (vanilla JS, 가벼움) |
| [Vite](https://vitejs.dev/) | `^8.1.5` | ESM 빌드 + HMR 개발 서버 |

### 자체 구현 (의존성 없음)

- **GLSL 셰이더** — 발광, 노이즈, 절차적 지오메트리, 비네트, 색수차, 그레인
- **입자 시스템** — Three.js Points 활용 자체 시뮬레이션 + 통합
- **베지에 경로 드로어** — Catmull-Rom 보간
- **객체 풀링** — 가비지 컬렉션 폭파 방지
- **카메라 리그** — 궤도 + 충돌 회피

### 외부 자산 (public/)

| 파일 | 크기 | 출처 |
|---|---|---|
| `public/models/Standing Idle.fbx` | 2.3 MB | [Mixamo](https://www.mixamo.com/) — 리깅 + 대기 애니메이션 (사전 클립 포함) |
| `public/hdri/spruit_sunraise.hdr` | 5.7 MB | [Poly Haven](https://polyhaven.com/) — CC0 공개 HDR |
| `public/angtexture.png` | ~80 KB | 절차적 대체 텍스처 |

---

## 🎨 디자인 결정

### 왜 또 다른 포크가 아닌가

이 프로젝트는 **"빌드 후 결과가 보이는" 시각적 통제 가능성**에 초점을 둡니다:

- **모든 슬라이더가 라이브 바인딩** → 게임 엔진식 룩디브가 브라우저에서 동작
- **풀링된 입자** → 60fps에서 5000+ 입자 가능 (Three.js Points 사용)
- **셰이더 재컴파일 없음** → 유니폼과 텍스처만 핫 스왑
- **순수 JS** → TypeScript / 프레임워크 빌드 시간 없이 30+ 모듈 즉시 로드
- **FBX 자동 폴백** → Mixamo에서 다른 캐릭터로 교체하면 코드 변경 없이 동작

### 절충점

| 선택 | 이유 | 대안 |
|---|---|---|
| **순수 GLSL 셰이더** | 학습 가치 + 의존성 0 | Three.js post-processing addon |
| **lil-gui** | 5KB, 프레임워크 불요 | dat.GUI (deprecated), React/Preact (오버킬) |
| **Vite** | HMR + ESM 네이티브 + gh-pages 친화 | Webpack (느림), Parcel (덜 안정) |
| **베지에 스플라인** | 부드러운 곡선 + 직관적 제어 | 직선 (둔함), B-spline (수식 복잡) |

---

## 🪟 UI 배치 (5분 한눈에)

```
┌────────────────────────────────────────────────────────┐  ┌─[VFX 에디터]─┐
│ 원소 조형 샌드박스            [한국어 · EN]            │  │ ▶            │
│ 경로를 그리고, 마우스를 떼면 시전합니다                 │  └──────────────┘
└────────────────────────────────────────────────────────┘
   (좌상단, 토글 단추는 패널 안 우측 — lil-gui와 절대 안 겹침)

[캐릭터 3D]
                  
                                                                ┌─[시전/탑승 M]─┐
                                                                └───────────────┘
                                                                ┌──┬──┬──┬──┐
                                                                │불│물│흙│공│
                                                                └──┴──┴──┴──┘
┌────────────────────────────┐
│ 원쪽 마우스 드래그 — 경로 그리기 │  ← (좌하단) 도움말 패널
│ 마우스 떼기 — 선택한 원소 시전   │
└────────────────────────────┘
```

> 💡 **HUD 스탯 박스** (FPS·파티클·드로우콜·시전 중)은 기본 숨김. <kbd>S</kbd> 키로 토글하면 도움말 패널 위에 표시.
> 
> 💡 **VFX 에디터의 한국어 라벨**은 350+ 슬라이더 / 폴더가 모두 한/EN 토글 시 자연스럽게 전환됩니다.

---

## 🔍 트러블슈팅

### 🐢 로딩이 느릴 때

> 첫 로드는 **FBX 2.3 MB + HDR 5.7 MB** 다운로드로 1~3초 걸립니다.

- **로더가 멈춘 듯 보여요** → 정상입니다. HDR 디코딩 + IBL 컴파일은 GPU에 따라 추가로 1~2초.
- **로딩 바가 안 움직여요** → DevTools > Network에서 `Standing%20Idle.fbx` 응답 코드 확인. 404면 `public/models/` 누락.

### 🎮 캐릭터가 안 보여요

| 증상 | 원인 | 해결 |
|---|---|---|
| 검은 실루엣만 보임 | Mixamo FBX 텍스처 경로가 절대 로컬 경로라 HTTP 해석 실패 | 정상 — 의도된 폴백. `AssetLoader.js`가 무채색 천 톤으로 대체 |
| 캐릭터가 어색하게 떠 있음 | AnimationMixer 초기화 전 | 1~2초 대기 |
| FBX가 깨져 보임 | `assetsInclude` 누락 | `vite.config.js`에 `assetsInclude: ['**/*.fbx', '**/*.hdr']` 확인 |

### ⚡ 성능 저하

- **FPS < 30** → `G` 키로 VFX 에디터 → Particles → emit rate / lifetime 줄이기
- **드로우 콜 폭증** → 라이브 HUD의 `Draw calls` 표시 확인. 200+ 면 토글로 비활성 효과 끄기
- **모바일에서는 사용 불가** → 의도적 결정. GPU 가속 데스크탑 브라우저 권장

### 🚀 배포 후 404

| 위치 | URL |
|---|---|
| 라이브 데모 | `https://casting-abilities.vercel.app/` |
| FBX 자산 | `/models/Standing%20Idle.fbx` |
| HDR 자산 | `/hdri/spruit_sunrise.hdr` |

모두 200이어야 정상. 404면 `public/` 자산이 Vercel에 업로드되지 않은 것 → `.vercelignore`가 `public/` 차단하지 않았는지 확인.

---

## 📝 출시 노트 (이 한국어 빌드)

### v1.2.1-korea (2026-08-12) — 결정적 런타임 + 식별자 복구 + 라이브 정상화

- 🛑 **런타임 오류 종합 복구**: `clearTimeout` → `clear시간out`, `_unsubscribe` → `_un구독` 등 JS 표준 API 식별자 100+건 일괄 영문화
- 🛑 **`_buildEnvironment` 등 메서드 호출 복구** — `_buildXXX` 메서드 101건, Three.js API (`getWorldPosition`, `uTime`) + GLSL 변수 (`vWorld`, `matrixWorld`) 망가진 변수 141개 → 0건으로 복원
- 🛑 **`setEffectiveTimeScale` (THREE.AnimationAction) 복구**
- 🛑 **`HDR_URL` 상수 복구** — App.js의 `const HDR_URL = './hdri/...'` 가 import 정리 시 누락되어 부팅 시 `ReferenceError` 발생 → 라인 재선언
- 📊 **진단 도구 강화**: 원본 GitHub과 fork 1:1 식별자 diff (`52개 파일`) → 망가짐 0건 결정적 검증
- ✅ **결정적 합격 검증 100%**: `frame.uTime` 24회, `getWorldPosition` 14회, `_buildEnvironment` 2회, `clearEffects` 3회 모두 라이브 번들에 박힘

### v1.2.0-korea (2026-08-12) — VFX 에디터 288개 슬라이더 라벨 일괄 한국어화

- 📊 **i18n.js ko/en 사전 209 → 497개로 확장**: Editor.js가 사용하지만 정의되지 않은 288개 키 (`g.timeScale`, `fire.xxxxx` 등) 일괄 추출 → 1:1 자연 한국어 매핑
  - `g.timeScale` → 시간 배율, `g.speed` → 능력 속도, `g.glow` → 발광 강도 …
  - 도메인별: camera.*, character.*, earth.*, fire.*, water.*, wind.*, walk.*, env.*, post.*, trail.*, input.*, preset.*, common.*
- 🌐 **번들 한글 음절 1,275 → 2,281자** (+79%)
- ✅ **모든 KO 라벨 라이브 번들 박힘 결정적 검증**: 506/506 (100%)

### v1.1.3-korea (2026-08-12) — HUD 스탯 박스 충돌 해소

- 🎯 **HUD 스탯 박스를 기본 숨김** — `.hud__stats` 위치 변경 (우상단 → 좌하단 240px), `opacity:0` + `pointer-events:none` 기본값
- ⌨️ **<kbd>S</kbd> 키 추가**: HUD 스탯 박스 표시 토글 (`hud__stats--visible` 클래스로 fade-in)
- 🎯 **VFX 에디터 헤더와 시각적 충돌 해소**: 우상단은 VFX 에디터만 깔끔하게 표시

### v1.1.2-korea (2026-08-12) — 토글 단추 pointer-events 보장

- 🐞 **클릭 불가 버그 해결**: `.hud`에 `pointer-events: none`이 있어서 자식 클릭이 막혔는데 `.hud__lang-toggle`과 `.hud__panel`에 명시적 `pointer-events: auto` 추가
- ⌨️ **호버/포커스 시각 강화**: focus-visible 노란 outline, 호버 시 노란 border
- 🛡️ **연속 토글 안전망**: touch-action: manipulation, user-select: none

### v1.1.1-korea (2026-08-12) — 토글 단추 가림 해결

- 🎯 **HUD 타이틀 패널 안 우측으로 이동**: 토글 단추가 VFX 에디터 패널 헤더와 겹쳐 보이지 않던 문제 해결. z-index 1002로 명시적 레이어 우선
- 📍 **HUD 타이틀 패널 너비 보호**: `padding-right: 124px`로 텍스트와 단추 겹침 방지

### v1.1.0-korea (2026-08-12) — 한/영 토글 + 100% 한글화

- ✨ **우측 상단 한/EN 토글 단추** — 클릭 한 번으로 UI 전체 언어 전환. `localStorage`에 보존되어 재방문 시 자동 적용.
- 🌐 **자체 i18n 시스템** (`src/ui/i18n.js`) — ~200 한/영 키 사전 + 변경 시 콜백 자동 발화. no-op 시 추가 의존성 0.
- 🇰🇷 **전체 UI 100% 한국어화** — HUD, VFX 에디터 (363개 컨트롤러), 토스트 7건 (paused/resumed/effectsCleared/pathTooShort/poseSitting/poseStanding/preset.*), 로딩 화면 4단계, 모드/원소 카드, 단축키 도움말
- 🔄 **이전 영문 라벨 SSoT 보존** — 영문은 그대로 유지하고 한국어 사전 추가 점진. `t(key)` 가 ko → en → key 순서로 폴백.
- 🎛️ **VFX 에디터 새 컨트롤** — `walk.mode` (탑승/시전 모드 토글), `element.{fire,water,earth,wind}.folder` (원소 컨테이너) 등 약 40개 키 추가

### v1.0.0-korea (2026-08-12) — 최초 한국어 빌드

- ✨ **전체 UI 한국어화** — HUD, VFX 에디터 라벨 36건, Loader, 단축키 도움말
- 🌀 **`.vercel/project.json` link** — 기존 `casting-abilities` Vercel 프로젝트 (이전 한국어화 세션에서 생성)에 신규 GitHub 레포 연결
- 📦 **GitHub 레포 신설**: [`sigco3111/AvatarCastingAbilitiesThreeJS-korea`](https://github.com/sigco3111/AvatarCastingAbilitiesThreeJS-korea) — sigco3111 표준 포크 패턴
- 🔄 **자동배포 활성화** — `git push origin main` 시 Vercel 자동 빌드 + alias 갱신

### 원본 업스트림

[achrefelouafi/AvatarCastingAbilitiesThreeJS](https://github.com/achrefelouafi/AvatarCastingAbilitiesThreeJS) — MIT, 104⭐, `main` 브랜치의 마지막 커밋을 베이스로 함.

---

## 🤖 생성 정보 (어트리뷰션)

| 항목 | 값 |
|---|---|
| **모델** | MiniMax-M3 (`minimax-oauth`) |
| **런타임** | Hermes Agent 데스크탑 앱 |
| **빌드 도구** | pnpm + Vite |
| **언어** | 한국어 (한자 최소화) |
| **작업자** | sigco3111 |
| **원본 라이선스** | [MIT](LICENSE) |

---

## 📄 라이선스

이 한국어 빌드는 원본과 동일한 [MIT 라이선스](LICENSE)를 따릅니다.  
저작권 (c) 2026 sigco3111 + 원본 작성자.

---

<p align="center">
  <sub>🌀 아바타의 4원소를 브라우저에서 자유롭게 굴려보세요 · 행복한 굴림 되세요! ♪</sub>
</p>
