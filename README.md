# 이세계 낙오자의 용병단

추방된 소환자가 숨겨진 재능을 모으는 2D 픽셀아트 용병단 운영 RPG. 서버 없이 브라우저에서 플레이하는 첫 MVP입니다.

**게임 실행: https://sejin0523.github.io/outcast-mercenaries/**

Android Chrome에서 위 주소를 열고 가로로 돌려 플레이하세요. 오프라인 준비 완료 후 Chrome 메뉴의 앱 설치 / 홈 화면에 추가로 설치할 수 있습니다.

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

`http://localhost:4173`에서 확인합니다. 실제 Android 설치는 HTTPS 정적 호스팅 주소를 Android Chrome으로 열고, 메뉴의 **앱 설치 / 홈 화면에 추가**를 선택하세요. 설치 가능한 이벤트가 제공되면 게임 하단 설치 버튼에서도 설치할 수 있습니다. 최초 온라인 접속 후 **오프라인 준비 완료** 표시를 확인하면 이후 네트워크 없이 실행할 수 있습니다. 개발 모드에서는 Service Worker를 활성화하지 않습니다.

## 플레이

1. 본부에서 단장과 고정 동료 리아로 시작합니다.
2. 모집소에서 지원자를 살펴보고 골드로 모집합니다. 새 지원자 보기는 무료입니다.
3. 용병 명부에서 1~4명을 파티에 편성합니다. 이미 편성된 용병은 같은 버튼으로 제외합니다.
4. 본부 또는 의뢰 게시판에서 **숲의 불청객 → 출전하기**를 누릅니다.
5. 자동전투 중 **집중 공격**을 발동할 수 있습니다. 사용 후 5턴 대기합니다. 다른 탭으로 전환하면 전투가 일시 정지합니다.
6. 승리하면 120골드와 출전자 각각 55 경험치를 받습니다. 레벨업은 자동입니다. 본부로 돌아가 반복 도전할 수 있습니다.

화면 오른쪽(모바일은 아래)에서 선택한 용병의 재능, 잠재력, 능력치, 기본 장비, 전직 예정 경로를 확인합니다. 초기 그림은 코드로 만든 임시 에셋입니다.

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
- [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md) — 생성과 성장
- [CLASS_SYSTEM.md](CLASS_SYSTEM.md) — 8개 기본 직업과 전직 트리
- [ASSET_SPEC.md](ASSET_SPEC.md) — 그래픽 제작 및 교체 규격
- [ROADMAP.md](ROADMAP.md) — 단계별 구현 범위

## 미구현

전직 실행, 직업별 수동 스킬, 장비 드롭/교체/인벤토리, 지역 탐험, 스토리 이벤트/관계, 실제 애니메이션 스프라이트/사운드, 클라우드 저장. 잠재력과 전직 트리는 MVP에서 확인용 데이터입니다. 사제 치유 외 직업 고유 전투 행동은 아직 없습니다. Android 실기기 설치와 저사양 성능 검증은 별도로 필요합니다.

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

## 모바일 가로 화면

PWA manifest는 `orientation: landscape`를 요청합니다. 일반 Chrome 탭에서는 방향을 강제로 고정하지 않으므로 휴대폰을 가로로 돌려 주세요. 가로 화면에서 메뉴를 왼쪽에 두고 본부/파티와 용병 정보를 나란히 표시합니다. 세로 화면에서도 플레이할 수 있으며 가로 화면 안내를 제공합니다. 터치 기기의 버튼은 최소 44px, 노치와 홈 바는 safe-area 여백을 적용합니다.
