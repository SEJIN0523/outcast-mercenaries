# 이세계 낙오자의 용병단

추방된 소환자가 숨겨진 재능을 모으는 2D 픽셀아트 용병단 운영 RPG. 서버 없이 브라우저에서 플레이하는 첫 MVP입니다.

**게임 실행: https://sejin0523.github.io/outcast-mercenaries/**

Android Chrome에서 위 주소를 열고 세로로 플레이하세요. 오프라인 준비 완료 후 설정 또는 Chrome 메뉴의 앱 설치 / 홈 화면에 추가로 설치할 수 있습니다.

## 실행

Node.js 22.12 이상과 npm이 필요합니다. 개발 시에만 npm 패키지를 내려받습니다. 실행에는 외부 서비스 계정이나 API 키가 필요하지 않습니다.

```sh
npm ci
npm run dev
```

터미널에 표시되는 `http://localhost:5173` 주소를 여세요. 모바일 레이아웃은 PC 개발자 도구에서도 확인할 수 있습니다. 같은 Wi-Fi의 휴대폰에서 PC IP로 개발 서버를 열 수 있지만, HTTP LAN 주소에서는 PWA 설치/Service Worker가 지원되지 않습니다.

프로덕션 / PWA 확인:

```sh
npm run build
npm run preview
```

`http://localhost:4173`에서 확인합니다. 실제 Android 설치는 HTTPS 정적 호스팅 주소를 Android Chrome으로 열고, 메뉴의 **앱 설치 / 홈 화면에 추가**를 선택하세요. 설치 가능한 이벤트가 제공되면 게임 설정의 설치 버튼에서도 설치할 수 있습니다. 최초 온라인 접속 후 **오프라인 준비 완료** 표시를 확인하면 이후 네트워크 없이 실행할 수 있습니다. 개발 모드에서는 Service Worker를 활성화하지 않습니다.

## 플레이

1. 신규 게임은 주인공과 카엘·리아·미라·노엘의 총 5명으로 시작합니다. 주인공도 AI로 전장에서 싸웁니다. 기존 저장의 소속 동료는 그대로 유지됩니다.
2. 하단 **용병 → 모집소**에서 골드로 모집합니다. 새 지원자 보기는 무료입니다.
3. 하단 **편성** 화면에서 주인공 고정 1명과 동료 최대 4명, 총 최대 5명을 편성합니다. 주인공이 빠져 있던 기존 편성도 주인공을 포함해 표시하며 중복하지 않습니다.
4. 하단 **의뢰 → 숲의 불청객 → 출전하기**를 누릅니다.
5. 주인공을 포함해 이동·목표 선택·공격·해금된 스킬은 모두 자동입니다. 주인공은 초반에 평범한 능력치와 전투 스킬 없음으로 시작하며 「가능성의 눈」은 아직 잠들어 있습니다. **전체 돌격 / 균형 전술 / 후위 보호 / 진형 유지 / 집중 공격 / 전술적 후퇴**와 **공격 우선순위(고위협·가까운 적·낮은 HP)**로 전체 행동을 지휘합니다. **도주**는 별도 명령이고 적의 공격은 계속됩니다. **일시정지 / 계속**, **1× / 2×**를 지원하며 개별 이동/수동 스킬 조작은 없습니다.
6. 승리하면 120골드와 주인공을 포함한 실제 출전자 각각 55 경험치를 받습니다. 주인공도 레벨·장비로 성장합니다. 도주/패배에는 보상이 없으며 다음 출전 시 체력은 회복됩니다.

용병이나 편성 카드에서 인물을 누르면 상세 팝업이 열립니다. 능력 정보와 장비를 별도 탭에서 확인합니다. 장비 교체는 기존 MVP와 동일하게 후속 구현입니다. 초기 그림은 코드로 만든 임시 에셋입니다.

## 저장과 백업

- IndexedDB 단일 슬롯에 변경 후 350ms 지연 자동 저장합니다. 하단의 **저장 완료**를 확인하세요.
- 상단 ⚙ 메뉴에서 **지금 저장**, **불러오기**, **백업 내보내기**, **백업 복원**을 사용할 수 있습니다.
- 세이브는 버전 1이며, 잘못된 형식/미래 버전/유효하지 않은 참조를 거부합니다.
- 초기 저장 읽기 실패 시 원본 보호를 위해 자동 저장을 중지합니다. 명시적으로 저장하거나 유효한 백업을 복원하면 다시 활성화됩니다.
- 전투 중 새로고침하면 의뢰가 중단되고 출발 전 상태를 불러옵니다. 완료 보상은 한 번만 반영합니다.
- 브라우저 데이터 삭제·비공개 모드·저장 공간 정리로 로컬 기록이 사라질 수 있습니다. JSON 파일로 백업하세요. 기기 간 자동 동기화는 없습니다.
- 백업 복원/불러오기는 현재 상태를 교체하므로 확인창을 표시합니다.

## 검증

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest는 `src/**/*.test.ts`만 실행하며, Playwright는 빌드된 앱을 자동으로 preview 서버에서 실행합니다. E2E 실행 전에 빌드가 필요합니다. 결과와 제한은 [VALIDATION.md](VALIDATION.md)에 기록합니다.

## 구조

```text
src/data/          직업 · 특성 · 장비 · 스킬 카탈로그
src/domain/        시드 생성 · 성장 · 파티 · 전투 (순수 TypeScript)
src/state/         명령 · 상태 구독 · 저장 스케줄
src/persistence/   세이브 검증 · IndexedDB I/O
src/render/        Phaser 장면 · 64×80 레이어 합성 스프라이트
src/ui/            React UI · 반응형 스타일
public/            PWA PNG 아이콘
scripts/           임시 픽셀 아이콘 생성기
e2e/               실제 브라우저 플레이/모바일/PWA 테스트
```

직업·능력치·장비는 `src/data/catalog.ts`에서 관리합니다. 외형은 seed와 결과를 모두 저장합니다. 실제 에셋은 `src/render/sprite.ts`의 레이어 resolver와 Phaser texture 로딩을 확장해 적용할 수 있습니다. 도메인 코드는 렌더러나 브라우저 API에 의존하지 않습니다.

## 설계 문서

- [GAME_DESIGN.md](GAME_DESIGN.md) — 세계관과 플레이 루프
- [ARCHITECTURE.md](ARCHITECTURE.md) — 상태 흐름, 저장과 PWA 구조
- [FUTURE_WAR_SYSTEM.md](FUTURE_WAR_SYSTEM.md) — 공통 전투 모듈과 향후 전쟁 확장 지점 (전쟁 미구현)
- [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md) — 생성과 성장
- [CLASS_SYSTEM.md](CLASS_SYSTEM.md) — 8개 기본 직업과 전직 트리
- [ASSET_SPEC.md](ASSET_SPEC.md) — 그래픽 제작 및 교체 규격
- [ROADMAP.md](ROADMAP.md) — 단계별 구현 범위

## 미구현

전직 실행, 장비 드롭/교체/인벤토리, 지역 탐험, 스토리 이벤트/관계, 정식 방향별 애니메이션 스프라이트/사운드, 클라우드 저장은 후속 범위입니다. 전투는 장애물 없는 한 전장이며 지형 경로 탐색과 다중 웨이브는 아직 없습니다. 스킬은 8개 기본 직업의 자동 조건형 스킬을 구현했습니다. 수동 스킬은 게임 원칙상 제공하지 않습니다. Android 실기기 설치와 저사양 장시간 성능 검증은 별도로 필요합니다.

## GitHub

공개 게임 저장소: https://github.com/SEJIN0523/outcast-mercenaries

사용자 승인을 받아 이 프로젝트 전용 저장소를 생성했습니다. 다른 저장소는 변경하지 않습니다. 아래 명령은 새 체크아웃을 직접 연결할 때의 예시입니다.

```sh
git add .
git commit -m "Build first mercenary guild MVP"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

정적 배포 대상은 `dist/`입니다. `.github/workflows/pages.yml`이 main 푸시 시 테스트·빌드·브라우저 검증 후 GitHub Pages에 배포하고 실제 HTTPS 응답까지 확인합니다. 이 게임 저장소의 Pages Source는 **GitHub Actions**로 활성화했습니다. 저장소 생성과 설정은 사용자 승인 후 기존 Git 인증으로 수행했으며, 다른 저장소는 변경하지 않았습니다.

`vite.config.ts`는 configure-pages의 `PAGES_BASE_PATH`를 우선 사용하며, 없으면 `GITHUB_REPOSITORY=소유자/저장소`에서 `/저장소/`를 계산합니다. 사용자 사이트(`소유자.github.io`)와 커스텀 도메인은 `/`를 지원합니다. 로컬 기본값은 `/`입니다. manifest의 id/start_url/scope와 Service Worker fallback에도 같은 경로를 사용합니다. `node_modules/`, `dist/`, 테스트 출력은 Git에서 제외합니다.

배포 절차·검증과 Android 설치는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요. 2026-10-27 GitHub Actions 배포 성공과 실제 공개 HTTPS 게임 실행을 확인했습니다. 실제 Android 기기의 설치 확인은 별도입니다.

공개 게임의 같은 브라우저 테스트를 다시 실행하려면 PowerShell에서 다음을 사용합니다. 테스트 데이터는 테스트용 브라우저의 로컬 저장에만 기록됩니다.

```powershell
$env:GAME_URL='https://sejin0523.github.io/outcast-mercenaries/'
npm run test:live
Remove-Item Env:GAME_URL
```

## 모바일 세로 화면

Portrait(9:16 방향)를 기본으로 본부·용병·편성·의뢰를 독립 화면으로 구성했습니다. 하단 내비게이션은 뷰포트 아래에 고정되고 목록만 내부 스크롤합니다. 전투는 자유이동 전장·적군 5명/주인공 포함 아군 최대 5명의 HP·웨이브·경과 시간·일시정지·전술6개·공격 우선순위·도주·배속을 스크롤 없이 표시합니다.

PWA manifest는 `orientation: portrait`, `display: standalone`을 사용합니다. 앱 높이는 `100dvh`, 노치/홈 바는 safe-area 여백으로 처리합니다. 상세/장비/저장은 키보드 초점이 유지되는 네이티브 dialog 팝업입니다. 기존 IndexedDB 이름·세이브 버전 1·경제와 성장 로직은 유지합니다. 세부 기준과 검증은 [PORTRAIT_UI.md](PORTRAIT_UI.md)에 기록했습니다.

실시간 AI·전술·스킬 조건은 [REALTIME_COMBAT.md](REALTIME_COMBAT.md)를 참고하세요. 이전 순차 전투/모집 구현은 `src/domain/legacy/`에 역사적 스냅샷으로 보존했습니다. 기존 저장의 인물·레벨·장비·골드를 재설정하지 않으며, version 1은 1~5인 편성을 읽습니다. 주인공이 빠진 구 4인 배열은 출전 계산에서 주인공을 더하고 첫 편성 변경 시 명단을 정규화합니다.

향후 전쟁은 [WAR_SYSTEM.md](WAR_SYSTEM.md)에 **주인공1 + 부지휘관1 + 그 외 최대18 = 총20명**으로 설계만 정리했습니다. 두 지휘관 모두 전투에 참여합니다. 현재 전쟁 런타임/20인 편성은 구현하지 않았고, 주인공의 고유 능력 각성·특별 전직 실행도 후속 단계입니다.

일반 전투의 생성·보상과 공통 시뮬레이션을 분리했습니다. 전술 명령, 유닛 AI, 이동 공간 처리, 공격·피격·스킬은 각각 독립 함수로 관리하며 기존 호출 API와 저장 버전은 유지합니다. 변경 전 리플레이와 같은 전투 결과를 회귀 검증합니다.
