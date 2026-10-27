# 생성 에셋 — v4 실제 적용 현황

Codex 내장 image_gen.imagegen으로 무장 없는 정지 본체36개와 독립 무기8개·방패1개를 생성했다. 신규 유료 API·결제는 사용하지 않았다. 첨부 궁수 이미지는 스타일 참고로만 사용했다. 결과는 본편 용병 모집·상세·편성·전투에서 실제 사용한다.

## 수량과 파일

| 직업 | 여성 | 남성 | 개별 PNG |
|---|---:|---:|---:|
| 전사 |2|2|4|
| 기사 |2|2|4|
| 궁수 |4|4|8|
| 마법사 |2|2|4|
| 사제 |2|2|4|
| 도적 |2|2|4|
| 창병 |2|2|4|
| 연금술사 |2|2|4|
| 합계 |18|18|36|

본체 `public/assets/battle_units/{job}/{id}.png`, 런타임 목록 `src/data/battle-presets.json`, 공개 목록 `public/assets/battle_units/manifest.json`. 모두256×320 투명 PNG, 발(128,306), 오른쪽3/4, 빈 양손. 여성4·남성3 체형은 궁수 세트에 실물 예시를 제공하며 다른 직업은 현재 제작된 체형만 선택한다.

장비 `public/assets/equipment/{sword,greatsword,dagger,axe,spear,bow,staff,club,shield}.png`, 메타데이터 `src/data/equipment-art.json`. 방패 게임 아이템3개는 동일 그림의 크기 변형이다. 3개의 새 그림으로 계산하지 않는다.

원본은 `docs/art/v4-body-sources/`9장과 `docs/art/v4-equipment-sources/`9장이다. 이전 무장 포함 시안 `docs/art/preset-sources/`는 보존용이고 v4 수량에 포함하지 않는다. 기존 `public/art/generated/`는 적·본부·대체 그림에 계속 사용한다.

## 제작과 재현

- 프롬프트: [docs/art/V4_PROMPTS.md](docs/art/V4_PROMPTS.md).
- 본체 패킹: `node scripts/bake-renewal-bodies.mjs`.
- 장비 패킹: `node scripts/bake-equipment.mjs`.
- 전체 조합 검사: `node scripts/verify-renewal-art.mjs`.
- 실제 갤러리: 게임 URL 뒤 `?gallery=1`.
- 288조합 대표 도감: `docs/art/v4-equipped-contact-sheet.png`.

패킹과 검증은 Chromium Canvas를 사용하며 원본을 보존한다. 게임은 프리셋별 손 소켓과 장비별 gripAnchor를 맞추고 캐시된 합성을 같은 Phaser 컨테이너에서 이동시킨다. 본체 ID를 유지한 PNG 교체는 기존 세이브에 반영된다. 새 프리셋은 class/gender 검사 후 배정하고 기존 저장에 없는 선택값은 결정적 대체 프리셋을 사용한다.

종족 귀·꼬리는 코드 레이어이며 다크 엘프는 노출 피부의 제한된 색 변환이다. 새 PNG 전체의 모든 머리/눈/복장색을 독립 조절하지는 않는다. 일부 원본 귀와 종족 레이어, 양손 파지, 직업·성별당8~12본체 확대는 후속 보정/제작이다. 상세 교체 절차는 ASSET_REPLACEMENT_GUIDE.md를 따른다.
