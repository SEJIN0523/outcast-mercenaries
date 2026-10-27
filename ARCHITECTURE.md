# 기술 구조

## 기술 선택

TypeScript strict, React, Vite, Phaser **3** 고정, IndexedDB(idb), Zod, Vitest, vite-plugin-pwa. 정적 파일 배포만으로 실행한다. 유료 API·계정·게임 서버는 사용하지 않는다. Node.js 22.12+ 권장.

## 레이어와 의존성

`src/data` 직업/장비/스킬 정의 → `src/domain` 순수 게임 로직 → `src/state` 명령과 구독 → `src/ui` React / `src/render` Phaser. 저장소는 `src/persistence`에 격리한다. 도메인은 DOM·Phaser·IndexedDB를 import하지 않는다. 렌더러는 상태를 읽고 게임 보상을 직접 변경하지 않는다.

## 데이터 흐름

UI 명령 → 불변 상태 전이 → React useSyncExternalStore 및 Phaser 갱신. 전투는 700ms마다 순수 tick 함수를 실행한다. 타이머는 store에서 하나만 소유한다. 탭이 숨겨지면 타이머 진행을 멈추며 오프라인 전투 보상은 없다. 명령 오류는 사용자에게 표시한다.

## 저장

DB `outcast-guild`, store `saves`, key `main`. 세이브는 `{version:1, savedAt, state}`. Zod로 구조/범위 검증 후 ID 중복·파티 참조·후보 중복 등 의미적 무결성을 검증한다. 알려지지 않은 미래 버전은 거부하며 원본을 덮어쓰지 않는다. 버전 0은 legacy 필드가 정의된 경우에만 명시적 마이그레이션한다. 초기 MVP에 기존 배포 세이브가 없으므로 v0 입력은 거부한다.

게임 변경 시 지연 자동 저장, 전투 중에는 전투 시작 시의 확정된 영속 상태를 보존하고 전투 완료 시 보상을 한 번 반영한다. 전투 중 새로고침은 의뢰를 중단하고 출발 전 상태로 돌아간다. 영속 데이터와 일시적인 battle 상태를 분리한다. 저장 요청은 직렬화해 오래된 쓰기가 최신 상태를 덮지 않도록 한다. 초기 로드 실패 시 자동 저장을 중지해 기존 데이터 보호; 사용자가 백업 복원 또는 명시적 저장으로 해제한다. 저장은 트랜잭션 완료 후 성공 표시한다.

## PWA / 배포

프로덕션 빌드에서 manifest 및 service worker 생성. 앱 쉘과 번들/아이콘을 precache한다. 첫 접속은 네트워크가 필요하다. 업데이트는 사용자 선택 후 적용한다. 설치 이벤트가 없는 환경에서는 설치 안내를 표시한다. HTTPS 또는 localhost가 필요하다. GitHub Pages 경로는 configure-pages의 PAGES_BASE_PATH 또는 GITHUB_REPOSITORY에서 계산하고 Vite와 manifest id/start_url/scope, Service Worker fallback에 공통 적용한다. PWA는 landscape 방향을 요청하며 일반 탭에서는 세로/가로 반응형 UI를 제공한다.

## 검증

시드 결정성, 모집 경제/중복 방지, 파티 제약, 전투 승패/중복 보상, 수동 스킬 쿨다운, 다중 레벨업, 저장 round-trip/손상/미래버전/참조 무결성을 자동 테스트한다. 브라우저에서 PC/모바일 화면과 프로덕션 오프라인 캐시를 확인한다.

## 참고한 공식 문서

- Phaser 설치: https://docs.phaser.io/phaser/getting-started/installation
- Vite PWA: https://vite-pwa-org.netlify.app/guide/
- Service Worker 등록: https://vite-pwa-org.netlify.app/guide/register-service-worker
