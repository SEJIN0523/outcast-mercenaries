# 세로 UI 검증 결과

검증일: 2026-10-27. Windows / Node.js 24.22.1 / Chromium 156 (Playwright).

## 로컬 프로덕션 검증

| 항목 | 결과 |
|---|---|
| TypeScript strict 및 Pages 하위 경로 프로덕션 빌드 | 성공 |
| 단위 테스트 | 24 / 24 통과 (4 파일) |
| 브라우저 테스트 | 7 / 7 통과, 22.1초 |
| 360×800 | 독립 화면, 모집, 장비 팝업, 4인 편성, 전투, 일시정지/재개, 보상/저장 복원 통과 |
| 390×844 | 위 전체 흐름 통과 |
| 412×915 | 위 전체 흐름 통과 |
| 주소창 높이 모사 | 위 세 화면의 높이를 각각 160px 줄여도 전투 조작부 잘림/스크롤 없음 |
| 안전 영역 | 360×640 + 상하 24px에서 아군 4명/적군 3명/전장/HP/스킬/웨이브/일시정지 표시 통과 |
| 기존 저장 호환 | 버전 1 fixture의 432골드, 의뢰 7회, 동료, 레벨 2/XP 15, 장비, 2인 파티 그대로 복원 |
| PWA | portrait / standalone / 저장소별 경로 / 아이콘 / 캐시 완료 후 오프라인 새로고침 통과 |
| PC 접근성 | 가운데 세로 앱, 키보드 팝업 닫기, 수동 저장 통과 |
| 브라우저 오류 | 세 가지 세로 플레이 흐름에서 pageerror 없음 |
| 시각 확인 | 각 해상도 본부·편성·장비·전투 캡처 확인 |

브라우저 테스트는 문서와 전투 컨테이너의 scrollHeight 및 주요 요소 bounds를 검사한다. 일반 목록/팝업은 내부 스크롤을 허용하지만 전투는 스크롤하지 않는다. 일시정지 상태에서 두 번 이상의 전투 틱 동안 턴이 바뀌지 않고 수동 공격도 비활성화됨을 검증한다.

## 보존한 로직

도메인 전투·모집·성장 계산 및 IndexedDB 저장 구조는 변경하지 않았다. DB `outcast-guild`, store `saves`, key `main`, version 1 유지. 일시정지만 비영속 store 상태로 추가했다. 종료된 Phaser 장면의 상태 구독을 shutdown/destroy에서 정리하여 화면 전환 후 렌더링 오류가 저장 초기화를 방해하지 않도록 수정했다.

단위 테스트는 기존 시드 생성/성장/경제/파티/승패/보상/치유/스킬/세이브 검증/IndexedDB 쓰기 순서/Pages 경로와 함께 일시정지를 확인한다.

## 공개 배포 검증 방법

기존 공개 주소는 https://sejin0523.github.io/outcast-mercenaries/ 이다. [Pages 워크플로](https://github.com/SEJIN0523/outcast-mercenaries/actions/workflows/pages.yml)가 main 푸시마다 단위 테스트, Pages 경로 빌드/브라우저 테스트, 실제 배포와 HTTPS 리소스 확인을 실행한다. 원격 배포 성공은 해당 실행 결과로 판단한다.

공개 URL에서도 동일한 세로 테스트 7개를 실행할 수 있다. 이는 테스트 브라우저의 로컬 저장만 사용하며 원격 게임 데이터를 변경하지 않는다.

```powershell
$env:GAME_URL='https://sejin0523.github.io/outcast-mercenaries/'
npm run test:live
node scripts/verify-pages.mjs
Remove-Item Env:GAME_URL
```

## 재실행

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Pages 하위 경로로 확인할 때는 `PAGES_BASE_PATH=/outcast-mercenaries/`를 설정하고 build/e2e를 같은 환경에서 실행한다. 테스트 캡처는 `test-results/`에 생성되며 Git에 포함하지 않는다.

## 제한

실제 Android OS의 주소창/노치/설치 앱 방향 반영과 저사양 성능은 실기기 확인이 필요하다. 자동화에서 안전 영역을 모사했지만 실기기 확인으로 간주하지 않는다. 기존 설치 앱은 새 버전 적용 버튼으로 업데이트하고 기존 로컬 기록을 유지한다.

실제 아트·사운드, 장비 교체·인벤토리, 전직 실행, 탐험/스토리는 후속 단계다. 현재 장비 팝업은 기존 장착 장비를 보여 준다. Phaser 번들 크기 및 Zod 주석에 대한 기존 빌드 경고는 남아 있으나 빌드는 성공한다.
