# 리뉴얼 v4 결과

개발 브랜치: `feature/game-renewal-v4`. 운영 main 및 GitHub Pages는 변경하지 않는다. 원격 배포 검증은 진행 중이며 성공을 확인한 뒤 이 문서에 URL과 결과를 확정한다.

## 구현

본편 모집·용병 명부·주인공/동료·의뢰·보상·레벨·IndexedDB/PWA를 재사용했다. 좌우 진형 기반 3/4 정지 이미지 자동전투, 전열5+후열5 중 주인공 포함최대5명 자유 배치,6전술·공격 우선순위·도주·일시정지·배속을 적용했다. 근접 돌진/복귀, 원거리 투사체, 자동 치유·마법·보호·약화, Tween 피격/사망 효과를 사용한다.

능력치5종·무기 요구치·직업 자유 착용·양손방패 제한·무기별F~S 숙련·D등급 스킬·누적 성장을 본편 장비 화면과 연결했다. 모집 프리셋 중복을 억제하고 실제 v1저장을 v2로 보존 마이그레이션한다.

## 실물 에셋

**36개 캐릭터 본체 +8개 무기 +1개 방패 PNG**. 궁수 여성4/남성4, 전사·기사·마법사·사제·도적·창병·연금술사 각각여성2/남성2다. 본체는 빈손이고 별도 장비를 그립 소켓으로 합성한다. 방패3게임아이템은 같은 그림의 크기 변형이다. 종족 귀/꼬리 코드 레이어와 단순 색 변형은 본체 수량에 포함하지 않았다.

내장 image_gen.imagegen으로 생성 후 Chromium Canvas로 개별 투명 PNG·발 기준·메타데이터를 정규화했다. 원본과 프롬프트는 docs/art 및 GENERATED_ASSETS.md에 기록했다. `?gallery=1`에서 실제크기/확대·소켓·좌우 반전·8직업·남녀·종족·장비를 비교한다. 교체 지시서는 ASSET_REPLACEMENT_GUIDE.md다.

## 주요 파일

- 전투/AI: `src/domain/combat/{normalBattle,units,formation,commands,ai,simulation,actions,spatial}.ts`
- 성장/장비/외형: `src/domain/{characters,equipment,battlePresets,guild,types}.ts`, `src/data/{weapons,skills,statuses,battle-presets,equipment-art}`
- 화면: `src/ui/{PartyPlanner,EquipmentPanel,AssetGallery,BattleScreen,Screens,App}.tsx`
- 그래픽: `src/render/{BattleScene,battleArt,sprite}.ts`, `public/assets/`
- 저장: `src/persistence/save.ts`; 실제v1fixture와92단위/15브라우저 테스트.
- 문서: 기획/기술/캐릭터/직업/에셋/로드맵·교체 지시서·프롬프트·향후 전쟁 확장 지점.

## 검증과 미구현

단위92/92, 실제Chromium E2E15/15, 빌드/PWA 성공,288개 본체×무기 합성 상단잘림0.360×800/390×844/412×915 및 축소높이/safe-area를 검사했다. 모집·편성·장비변경·전투·보상·레벨업·저장재접속·오프라인이 본편에서 연결된다. 상세는 VALIDATION.md.

남은 아트: 일부 원본 귀와 종족 레이어 정합, 직업/성별당8~12본체 확대, 모든 색의 독립재채색, 양손파지 보조포즈. 남은 게임: 장비획득/상점, 새의뢰/지역,2/3차전직·스토리각성·음향.20인전쟁은 설계만 유지했다. 실제 Android 기기 설치 조작은 수행하지 않았고 브라우저 에뮬레이션/PWA 오프라인까지만 검증했다.

## 실행

`npm ci` → `npm run dev`. 검증은 `npm test` → `npm run build` → `npm run test:e2e`. Android Chrome의 HTTPS 주소에서 오프라인준비완료 후 메뉴의 앱설치/홈화면추가를 사용한다. 운영과 미리보기 저장은 별도 출처이며 JSON백업으로 옮길 수 있다.
