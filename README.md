# 이세계 낙오자의 용병단 — 리뉴얼 v4

기존 용병단 운영 RPG 본편에 3/4 정지형 픽셀아트 자동전투, 자유 진형, 분리 장비, 무기 숙련을 통합한 개발 브랜치다.

- 개발 브랜치: `feature/game-renewal-v4`
- 운영 게임(기존 버전): https://sejin0523.github.io/outcast-mercenaries/
- 분리 미리보기: 배포 검증 결과와 URL은 RENEWAL_V4_REPORT.md 참조.

현재 main과 기존 GitHub Pages를 자동으로 변경하지 않는다. `.github/workflows/ci.yml`은 기능 브랜치의 테스트/빌드만 하고, `pages.yml`은 기존 main 배포 설정을 유지한다.

## 실행과 검증

Node.js22.12+ 권장.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run preview`로 빌드 결과와 PWA를 확인한다. Vite base는 `PAGES_BASE_PATH` 또는 `GITHUB_REPOSITORY`의 저장소 경로에서 결정한다. 독립 호스팅은 `PAGES_BASE_PATH=/`로 빌드한다. 게임 실행에는 API 키·유료 서비스·서버가 필요하지 않다.

## 플레이

1. 본부에서 시작해 용병 → 모집소에서 지원자를 모집한다. 보유 최대24명, 모집 후보6명이며 새 지원자는 무료다.
2. 편성에서 동료를 선택하고 F1~F5/B1~B5 중 칸을 누른다. 이미 배치된 두 인물은 교환된다. PC 드래그도 지원한다. 주인공 포함5명 제한이며 전원 전열/전원 후열도 가능하다. 기본4진형과 사용자 저장8개를 제공한다.
3. 인물 상세에서 능력치·숙련·자동 스킬과 장비를 확인한다. 장비 탭의 공용 훈련 무기는 능력치 조건을 충족하면 직업에 관계없이 교체한다. 양손 무기는 방패를 해제한다.
4. 의뢰 → 숲의 불청객 → 출전하기. 주인공 포함 전원 AI 전투다. 전술6개·공격 우선순위·도주·일시정지·1/2배속으로 지휘한다. 개별 조작은 없다.
5. 승리하면120G와 실제 출전자55XP. 무기 숙련은 실제 유효 사용량으로 성장한다. 레벨업과 숙련을 저장한다.
6. 본부의 캐릭터와 장비 갤러리 또는 `?gallery=1`에서 36본체·8무기·방패1그림, 종족 레이어, 손 소켓, 좌우 반전을 비교한다. 의뢰의 1대1/2대2/5대5는 개발 검증 시나리오다.

## 저장과 Android 설치

IndexedDB DB명/슬롯을 유지하며 JSON v1을 v2로 마이그레이션한다. 자동 저장은 변경 후350ms이며 상단 설정에서 수동 저장·불러오기·JSON 백업/복원을 사용할 수 있다. 읽기만으로 구 저장을 덮어쓰지 않는다. 운영과 미리보기는 출처가 달라 저장이 분리되므로 옮기려면 JSON 백업을 사용한다. 전투 중 재접속하면 출발 전 상태로 복귀한다.

Android Chrome에서 HTTPS 게임 주소를 연 뒤 **오프라인 준비 완료**를 기다리고 메뉴의 **앱 설치 / 홈 화면에 추가**를 선택한다. 설치형은 portrait·standalone이며 동적 화면 높이와 safe-area를 사용한다. 에뮬레이션 브라우저 테스트와 실제 휴대폰 설치 실험은 구분해 보고한다.

## 아키텍처와 에셋

게임 데이터/순수 로직/저장/React/Phaser를 분리한다. 본체는256×320 무장 없는 PNG, 장비는 별도 이미지와 그립 좌표로 합성한다. 궁수 남녀각4, 나머지7직업 남녀각2로 총36개 실제 생성 본체다. 무기8개·방패1개를 별도 생성했다. 수인 귀/꼬리는 공통 코드 레이어이며 추가 본체 수에 포함하지 않는다.

[GAME_DESIGN.md](GAME_DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md), [CLASS_SYSTEM.md](CLASS_SYSTEM.md), [ASSET_SPEC.md](ASSET_SPEC.md), [ASSET_REPLACEMENT_GUIDE.md](ASSET_REPLACEMENT_GUIDE.md), [GENERATED_ASSETS.md](GENERATED_ASSETS.md), [REALTIME_COMBAT.md](REALTIME_COMBAT.md), [FUTURE_WAR_SYSTEM.md](FUTURE_WAR_SYSTEM.md), [ROADMAP.md](ROADMAP.md), [VALIDATION.md](VALIDATION.md).

## 남은 범위

직업·성별당8~12개 본체, 정교한 종족별 귀 보정, 모든 색의 독립 재채색, 양손 파지 보조 포즈, 상점·장비 획득, 2/3차 전직·스토리 각성·새 의뢰·음향은 후속 작업이다. 전쟁은 주인공과 부지휘관 포함총20명 설계만 유지하며 구현하지 않았다.
