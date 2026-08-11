# 원소 조형 샌드박스 (한국어판) 🌀

> [achrefelouafi/AvatarCastingAbilitiesThreeJS](https://github.com/achrefelouafi/AvatarCastingAbilitiesThreeJS)의 한국어 빌드.
> 애니메이션 '아바타'에서 영감을 받은 **4원소(불·물·흙·공기) 조형 샌드박스** — Three.js + Vite + 자체 GLSL.

바닥에 마우스로 경로를 그리고, 떼면 불·물·흙·공기가 그 경로를 따라 쏘아져 끝에서 폭발합니다. 모든 시각 파라미터는 게임 내 VFX 에디터에서 실시간 조정 가능하며, 프리셋으로 저장할 수 있습니다.

같은 제스처에 두 번째 의미가 있습니다. **탑승 모드**로 전환하면, 그린 경로를 *탄다* — 아바타가 획의 머리로 뛰어올라 회전하는 공기 위에 가부좌 결로를 잡고, 모든 코너를 따라 기울이며 끝까지 달립니다.

---

## 🌐 라이브 데모

[casting-abilities.vercel.app](https://casting-abilities.vercel.app/)

## 🚀 빠른 시작

```bash
pnpm install
pnpm dev
```

Vite이 출력하는 URL을 여세요 (기본 <http://127.0.0.1:5173>).

```bash
pnpm build      # 프로덕션 빌드
pnpm preview    # 빌드 산출물 미리보기
```

### 자산

두 개의 바이너리 자산이 `public/`에서 서빙되며 부팅 시 자동으로 로드됩니다:

| 파일 | 용도 |
| --- | --- |
| `public/models/Standing Idle.fbx` | 리깅된 캐릭터 **그리고** 대기 애니메이션 클립 |
| `public/hdri/spruit_sunrise.hdr` | 이미지 기반 조명 및 하늘용 HDR 프로브 |

FBX는 Mixamo 익스포트입니다 — 스킨 메시와 단일 애니메이션 스택이 들어 있어, 캐릭터와 대기 클립을 같은 파일에서 가져옵니다. 텍스처 경로는 익스포트 도구가 구운 절대 로컬 경로라 HTTP에서는 해석할 수 없습니다; 로더가 중립 플레이스홀더로 우회하고 무채색 천 톤으로 폴백합니다 (자세한 내용은 `loaders/AssetLoader.js` 참조). 텍스처가 들어 있는 FBX로 교체하면 코드 변경 없이 작동합니다 — 진짜 텍스처는 보존됩니다.

## 🎮 조작

| 입력 | 동작 |
| --- | --- |
| **왼쪽 마우스 드래그** | 바닥에 경로를 그립니다 |
| **마우스 떼기** | 선택한 원소를 그 경로로 시전합니다 (탑승 모드라면 *탑니다*) |
| **오른쪽 마우스 드래그** | 카메라 궤도 회전 (줌은 잠금) |
| **M** | **시전**과 **탑승** 모드 사이 전환 |
| **1 / 2 / 3 / 4** | 불 / 물 / 흙 / 공기 |
| **Q / E** | 원소 순환 |
| **G** | VFX 에디터 표시 / 숨기기 |
| **C** | 모든 활성 효과 제거 (탑승 취소도 포함) |
| **P** | 시뮬레이션 일시정지 / 재개 |
| **T** | 캐릭터를 서 있는 자세 ↔ 가부좌 결로 토글 |
| **H** | 조작 패널 숨기기 |

왼쪽 마우스는 그리기에 예약되어 있어, 궤도 회전은 오른쪽 버튼에 바인딩되어 있습니다.

## 📂 프로젝트 구조

```
src/
  abilities/      Ability 베이스 클래스, 4원소, 풀링 관리자
  animation/      FBX 캐릭터 로딩, 머티리얼 변환, AnimationMixer,
                  절차적 가부좌 명상 자세 (SittingPose.js),
                  탑승 모드의 도약 → 탑승 → 하마 시퀀스 (WalkController.js)
  assets/         절차적 지오메트리 생성기 (돌, 지면 판자, 탑, 파편)
  config/         settings.js — 모든 파라미터의 단일 진실 공급원
  core/           렌더 파이프라인, 카메라 리그, 시간 관리, 레이어링
  effects/        카메라 흔들림, 그라운드 데칼, 화면 플래시, 트레일,
                  구, 폭발 구체, 나선 지오메트리
  input/          마우스 / 키보드 입력, 바닥 경로 드로어
  loaders/        AssetLoader — 외부 자산(FBX, HDR, 텍스처) 가져오기
  materials/      모든 GLSL 머티리얼 — 부피감 있는 불, 표면 물,
                  절차적 돌, 바람, 트레일, 공기 스쿠터
  particles/      자체 입자 엔진 + 생성기 시스템
  postprocessing/ 변형 셰이더, 그레이딩 셰이더, 포스트 스택
  shaders/        GLSL 조각 라이브러리 (노이즈, 공통 헬퍼)
  ui/             HUD, VFX 에디터, 프리셋 관리, 글리프 시길
  utils/          풀, 색상, 수학, 이벤트, 셰이더 패치 도구
  world/          지면, 환경, 그늘, 먼지 모트
```

## 🤖 생성 정보 (Attribution)

이 한국어 빌드는 다음을 기반으로 생성되었습니다:

- **원본**: [achrefelouafi/AvatarCastingAbilitiesThreeJS](https://github.com/achrefelouafi/AvatarCastingAbilitiesThreeJS) — MIT 라이선스
- **기술**: MiniMax-M3, pnpm, Vite
- **라이선스**: MIT (원본과 동일)

## 📝 라이선스

MIT
