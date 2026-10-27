# 기술 구조 — 리뉴얼 v4

TypeScript strict + React 19 + Phaser 3 + Vite를 유지한다. 서버 없이 정적 배포하며 IndexedDB를 사용한다. main과 기존 GitHub Pages는 보존하고 `feature/game-renewal-v4`에서 개발한다.

## 책임과 상태 흐름

- `src/data`: 직업, 능력치 성장, 무기 요구치·피해 가중치·공격 형태, 숙련 등급, 자동 스킬 조건, 상태효과, 본체·장비 매니페스트.
- `src/domain`: 시드 생성·모집·성장·장비·진형·전투. DOM/Phaser/DB에 의존하지 않는다.
- `src/state/store.ts`: UI 명령, 상태 구독, 350ms 지연 자동 저장. 전투 중 모집·장비·편성 변경을 막는다.
- `src/persistence/save.ts`: Zod 검증, v1→v2 마이그레이션, 직렬 IndexedDB 쓰기.
- `src/render`: PNG 로딩·외형 레이어 합성·Phaser 표현. 피해 판정이나 보상을 계산하지 않는다.
- `src/ui`: 독립 화면, 10슬롯 편성, 상세/장비 팝업, 전술 지휘, 갤러리.

UI → 불변 상태 전이 → React/Phaser 구독. 전투는 50ms 고정 스텝이며 2배속은 같은 스텝을 두 번 실행한다. 숨겨진 탭·일시정지에서는 진행하지 않는다. 렌더링의 Tween·히트스톱은 시뮬레이션 시간을 바꾸지 않는다.

## 전투와 진형

`data/party.ts`의 `NORMAL_PARTY_LIMIT=5`는 주인공을 포함한다. `combatParty`는 주인공 포함·중복 제거·상한을 보장한다. `formation.ts`는 전열 F1–F5와 후열 B1–B5 중 최대 5명을 배치하고, 이전 party만 있는 저장에는 기본 진형을 계산한다. 이동·교환·4개 기본 프리셋·사용자 진형 저장을 지원한다.

`normalBattle.ts`는 일반 출전·적 구성·보상만 소유한다. `units.ts`는 공유 캐릭터와 장착 무기로 일시적인 전투 유닛을 생성한다. 무기가 사거리·공격 주기·근접/원거리/마법 공격을 결정하며 직업은 성장과 스킬에 영향을 준다.

`commands.ts`가 `TacticalOrders`를 만들고 `ai.ts`가 목표·이동·자동 스킬을 판단한다. `simulation.ts`가 공통 스냅샷에서 행동을 결정하고 `spatial.ts`/`actions.ts`를 실행한다. 일반 근접은 살아 있는 전열을 우선 공격하고 원거리·도적·일부 전술은 우회한다. 근접은 접근→공격→복귀, 원거리는 홈에서 투사체를 사용한다. 보호는 후열 위협을 우선하고 유지·돌격은 추격 허용 행동이 다르다. 후퇴와 도주는 별도다.

전투 HP·위치·쿨다운·보호막·상태효과는 캐릭터 영속 데이터에 쓰지 않는다. 실제 유효 행동의 무기 경험치는 전투 종료 시 반영하며 전투당 한 계열 90XP 상한, 보상 중복 방지 플래그를 사용한다. 승리만 120G와 출전자 각각 55XP를 지급한다.

## 아트 경계

본체 256×320 투명 PNG와 무기·방패 PNG를 분리한다. `battle-presets.json`의 손·발 소켓, `equipment-art.json`의 gripAnchor/scale/rotation/layerOrder로 `battleArt.ts`가 합성한다. 생성된 이미지 캐시는 외형·장비 서명을 키로 사용한다. Phaser는 합성된 레이어를 같은 actor 컨테이너에서 이동·회전·점멸시킨다. 런타임 합성 캔버스는 원본 PNG를 변경하지 않는다.

누락 본체는 기존 생성 아트/코드 도트로, 누락 장비 이미지는 간단한 실루엣으로 대체한다. 기존 음유시인 데이터와 류트 ID는 삭제하지 않는다. 8개 현행 직업 이외의 신규 완성 PNG는 제공하지 않는다. 상세 규격은 ASSET_SPEC.md와 ASSET_REPLACEMENT_GUIDE.md를 따른다.

## 저장·PWA·배포

DB `outcast-guild` / DB schema version 1 / store `saves` / key `main`을 유지한다. JSON envelope만 version 2다. v1은 ID·레벨·XP·골드·기존 장비·외형 seed를 보존하며 능력치·숙련도 기본값과 자유 진형을 추가한다. 읽기만으로 원본을 덮어쓰지 않는다. 미래 버전·중복·없는 참조·잘못된 프리셋·양손무기와 방패 조합은 거부한다. 로드 실패 시 자동 저장을 중지해 원본을 보호한다. 전투 중 새로고침은 출발 전 상태로 돌아간다.

Vite base, manifest id/start_url/scope, SW fallback은 같은 Pages 경로 resolver를 사용한다. 별도 Sites 미리보기 빌드는 PAGES_BASE_PATH=/를 사용한다. 앱/PNG/아이콘을 precache하고 portrait·standalone 설치를 지원한다. `100dvh`와 safe-area를 사용한다. 전쟁 전용 코드나 빈 추상 계층은 없으며 확장 지점은 FUTURE_WAR_SYSTEM.md에만 기록한다.
