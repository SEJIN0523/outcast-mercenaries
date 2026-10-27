# 에셋 리플레이스 지시서 — v4

## 어디를 교체하는가

- 본체 PNG: `public/assets/battle_units/{job}/{presetId}.png`
- 본체 데이터(런타임 원본): `src/data/battle-presets.json`
- 공개 도감용 매니페스트: `public/assets/battle_units/manifest.json`
- 장비 PNG: `public/assets/equipment/{equipmentId}.png`
- 장비 데이터(런타임 원본): `src/data/equipment-art.json`
- 공개 장비 매니페스트: `public/assets/equipment/manifest.json`
- 합성/로딩: `src/render/battleArt.ts`, 사용처는 `sprite.ts`와 `BattleScene.ts`.

**캐릭터의 저장 ID나 기존 preset ID를 새로 발급하지 않고 같은 ID의 PNG를 교체하면 기존 용병에 적용된다.** 새 프리셋 추가 시 기존 항목은 제거하지 않는다. 삭제된 에셋을 참조하는 저장을 만들지 않는다.

## 본체 교체 절차

1. 원본과 교체 전 PNG를 별도 버전 파일 또는 Git 커밋으로 보존한다.
2. 무기·방패 없는 256×320 RGBA 정지 전신을 만든다. 오른쪽 3/4 시점, 발(128,306), 양손 허리 높이 빈 주먹, 동일 픽셀 밀도를 유지한다. 여성·남성 모두 성인이다.
3. `weaponSocket`을 주먹의 실제 그립 중심, `shieldSocket`을 반대손 중심에 맞춘다. anchor는 normalized 발 좌표다. renderHeight는 캔버스 전체 표시 높이이며 다른 프리셋과 실제 몸 높이를 맞춘다.
4. 새 이미지/프리셋을 추가하면 `id,classId,job,gender,bodyType,bodyAssetId,advancementTier,facing,file,resolution,anchor,weaponSocket,shieldSocket,renderHeight`를 등록한다. 얼굴·헤어 정체성은 영속 appearance의 선택적 식별자로 보존할 수 있다. 현재 프리셋의 얼굴·헤어·복장은 한 PNG이며 독립 색상 교체를 완전 지원하지는 않는다.
5. 공개 매니페스트를 같은 데이터로 갱신하고 캐시된 이전 SW 업데이트를 적용한 뒤 갤러리에서 확인한다.

현재 baker를 다시 실행하면 생성 원본에서 PNG와 소켓 추정값을 다시 쓴다. 수동으로 보정한 소켓을 baker에 반영하거나 별도 보정 데이터로 유지한 뒤 재패킹한다. 정식 이미지 교체 후 원본 생성 baker를 무심코 실행하지 않는다.

## 무기·방패 교체 절차

`equipment-art.json`의 `equipmentId,imagePath,width,height,gripAnchor,offsetX,offsetY,rotation,scale,layerOrder`를 갱신한다. gripAnchor는 이미지 안에서 손잡이 중심의 0~1 좌표다. 투명 여백까지 포함한 width/height와 일치해야 한다. scale은 256×320 본체 좌표 기준이다. 한 장비가 모든 본체에서 같은 grip 기준으로 재사용된다.

본체의 무기 손은 (개별 socket), 장비는 `translate(socket+offset) → rotate → scale → draw(-grip*size)`로 연결된다. 그립 앞의 작은 주먹 패치를 다시 그려 잡고 있는 인상을 만든다. 방패는 반대손 위에 표시한다. 레이어는 기본 본체10/무기20/방패30 순서다. 복잡한 앞뒤 무기 자세가 필요하면 합성 경계만 수정하고 전투 계산은 바꾸지 않는다.

양손 장비 플래그는 그래픽 매니페스트가 아니라 `src/data/weapons.ts`의 `twoHanded`를 변경한다. 요구 능력치·공격 타입·숙련 계열도 이 데이터에서 관리한다. 그림 교체만으로 공격력을 바꾸지 않는다.

## 필수 확인

- 갤러리에서 남녀·지원 체형·8직업, 8무기, 방패3크기, 좌우 반전, 소켓 표시.
- 발 기준이 흔들리지 않고 전신/무기 끝이 잘리지 않음. 손잡이 위치·레이어·피부 패치 정렬.
- 인간/엘프/수인 레이어의 귀와 꼬리 중복·의상 침범. 현재 단순 레이어이므로 본체가 바뀌면 재검수.
- 360×800/390×844/412×915의 1대1/2대2/5대5, 전열5/후열0·1/4·0/5.
- 투사체·근접 돌진/복귀·피격·사망에서 장비가 몸과 함께 움직임.
- `npm test`, `npm run build`, `npm run test:e2e` 통과. 누락 PNG 대체·저장 후 재접속도 확인.

운영 main/Pages에 바로 덮어쓰지 않고 개발 브랜치와 분리 미리보기에서 먼저 검증한다. 도구·프롬프트·실제 수량은 GENERATED_ASSETS.md에 기록한다.
