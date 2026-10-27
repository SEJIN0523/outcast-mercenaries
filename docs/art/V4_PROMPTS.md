# v4 이미지 제작 기록

도구: Codex 내장 `image_gen.imagegen`, `transparent_background: true`. 외부 유료 API 호출이나 신규 결제를 사용하지 않았다. 참고 이미지는 스타일 기준이며 기존 캐릭터를 복제/트레이싱하지 않았다.

## 본체 공통 프롬프트

```
Use reference ONLY for original fantasy pixel-art STYLE, not copying its characters. Production GAME BODY preset sheet, 1536x1024 RGBA TRUE TRANSPARENT background. Exactly FOUR full-body adult characters in strict2columns x2rows grid. Top row2adult FEMALE, bottom row2adult MALE. Same camera,3/4 diagonal facing RIGHT, same stable standing battle pose, feet slightly apart, front/right hand CLOSED EMPTY FIST held at WAIST in front of hip (ready to hold a weapon), opposite hand also EMPTY relaxed fist at waist ready for shield, BOTH HANDS CLEARLY VISIBLE. All characters MUST BE UNARMED: NO sword, dagger, bow, staff, spear, axe, flask, shield or any handheld objects, NO back-mounted weapons or quivers. Fingers and palms must look natural; no erased-looking holes. Basic first-tier recruit clothing, simple modest practical materials, restrained accessories, no legendary armor or gold filigree. Cute detailed3.5-head adult SD pixel art, visible crisp square pixel clusters, controlled dark outlines, restrained shading, matching reference's warm game quality. Deliberate real silhouette variation, not image scaling. Equal stance and foot baseline across cells. No background, floor, shadow, aura, text or checkerboard drawing. Generous transparent margins and empty horizontal separation around y510. Each whole body within own cell, boots complete. 
```

직업별 변경 지시: 전사는 실용적 가죽과 소량 금속, 기사는 견습 갑옷, 궁수는 초급 정찰복, 마법사는 단순 로브/학자복, 사제는 소박한 성직복, 도적은 가벼운 활동복, 창병은 민병대복, 연금술사는 약병 파우치가 있는 작업복. 모두 빈손이다. 여성의 서로 다른 체형은 성인·일상적인 의상 실루엣 차이로 요청했다. 남성은 slim/standard/broad로 요청했다.

궁수 여성4명 시트와 남성4명 시트를 각각 생성했고 나머지7직업은 여성2명·남성2명씩 한 시트로 생성했다. 각 시트의 직업·색·헤어·실루엣 변형은 따로 요청했다. 위 공통 문구와 이 직업별 조건이 재제작용 프롬프트 세트다. seed 제어가 없는 생성 도구이므로 같은 문구가 같은 픽셀을 재현하지는 않는다. 게임 내 결정성은 이미 저장된 PNG/프리셋 ID와 생성 seed에서 보장한다.

## 장비 공통 프롬프트

```
Use case: stylized-concept. A single isolated equipment sprite for an SD 3/4 fantasy pixel-art RPG. Transparent background with true alpha, NO shadow, NO glow, NO floor, no person, no hands, no lettering. Crisp pixel clusters with dark outline, restrained novice adventurer quality, subtle top-left highlights. Entire item upright vertical, tip at top, grip on lower shaft, generously clear on all sides. Must be usable as a separate PNG overlay held by a tiny character, match the simple brown-leather iron weapons already made.
```

개별 주제: plain iron arming sword / modest two-handed iron greatsword / short novice dagger / single-bit iron axe with wooden handle / militia spear with grip at62% / plain wooden bow with central grip / apprentice wooden staff with small blue crystal and grip at66% / modest flanged mace with wrapped grip / plain oak heater shield.

## 저장과 게임 적용

본체 원본9장: `docs/art/v4-body-sources/`. 장비 원본9장: `docs/art/v4-equipment-sources/`. 정규화 도구는 원본 PNG에서 투명 잘라내기·발 기준 정렬·크기 정규화만 수행하며 새 일러스트를 그리지 않는다. 런타임 코드가 별도 장비와 종족 레이어를 조합한다.

실물 결과는36본체 +8무기 +1방패. 이전 무장 포함 시안은 `preset-sources/`에 기록용으로 보존했고 v4 수량에 포함하지 않았다. 수인 귀·꼬리와 피부 변형도 별도 생성 본체로 계산하지 않는다.

288개 본체×무기 조합의 런타임 합성과 상단 잘림 검사를 `scripts/verify-renewal-art.mjs`로 실행했다. 눈·머리·복장의 독립 재채색, 모든 종족의 정교한 귀 보정, 직업/성별당8~12종은 후속 제작이다.
