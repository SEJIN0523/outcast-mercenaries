# MVP 검증 결과

검증일: 2026-10-27. Windows / Node.js 24.22.1 / Chromium 156 (Playwright).

## 통과

| 항목                               | 결과                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------- |
| TypeScript strict 및 프로덕션 빌드 | 성공                                                                       |
| Vitest                             | 23 / 23 통과 (3 파일)                                                      |
| Playwright 브라우저 테스트         | 5 / 5 통과                                                                 |
| PC 플레이 흐름                     | 모집 → 3인 편성 → 수동 스킬 → 자동전투 승리 → 보상 → 새로고침 후 저장 복원 |
| 모바일 플레이 흐름                 | 390×844 세로, 844×390 가로 터치 모집·편성·전투와 회전                      |
| 반응형                             | 360 / 768 / 1024px, 4개 메뉴에서 문서 가로 넘침 없음                       |
| PWA                                | manifest, 아이콘 설정, Service Worker 캐시 완료 후 오프라인 새로고침 성공  |
| 브라우저 런타임                    | PC 플레이 테스트 중 pageerror 없음                                         |
| 시각 확인                          | 1440px PC, 390px 세로 및 844px 가로 모바일 캡처 확인                       |

## 자동 테스트 상세

도메인: 시드 결정성, 성별·종족·직업 생성 다양성, 여러 레벨 성장, 레벨 상한, 직업 능력 차이, 모집 비용/중복/정원/잔액, 파티 최소/최대/소속 제한, 후보 batch ID, 기본 파티 승리, 일회성 보상, 집중 공격 쿨다운, 패배 무보상, 사제 치유, 비출전자 경험치 제외.

저장: 전체 JSON round-trip, 손상/미래 버전/범위 검증, 존재하지 않는 파티 참조/중복 ID, 장비 ID/경험치 검증, fake-indexeddb로 실제 idb 읽기/쓰기 및 직렬 순서 검증. 브라우저 테스트는 실제 IndexedDB를 사용한다.

## 빌드 참고

- Phaser 3.90.0 고정, lockfile 포함.
- PWA precache 약 1.57MiB, 12개 항목. 외부 폰트·에셋 CDN 없이 실행.
- Phaser 번들이 minify 약 1.21MB(gzip 약 332KB)이므로 Vite의 큰 chunk 경고가 발생한다. 빌드 실패는 아니며 초기 엔진 비용이다.
- Zod 의존성의 PURE 주석에 대한 Rollup 경고가 있으나 빌드는 성공한다.

## 아직 확인하지 않은 항목

- Android 실기기에서 설치 프롬프트/홈 화면 실행, 저사양 기기 성능
- 실제 배포 HTTPS 도메인 및 GitHub Pages 하위 경로에서 설치
- 새 배포 버전의 Service Worker 업데이트 전환
- Safari/Firefox/WebGL 미지원 기기 및 장시간 플레이
- 브라우저 저장 용량 초과/권한 차단의 실제 환경 재현

## 구현 범위의 한계

실제 아트/사운드, 장비 교체, 분기 전직 실행, 탐험/스토리 진행은 다음 단계다. 잠재력과 전직 경로는 현재 정보 표시용이며, 사제 외 기본 직업은 능력치와 장비/외형 차이로 구분된다. 세이브 버전 1만 지원하며 기존 배포 버전이 없어 실제 구버전 마이그레이션은 아직 없다. 서버/멀티플레이/클라우드 동기화는 없다.

## 재실행

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

브라우저 테스트는 포트 4180을 사용하며 preview 서버를 자동으로 시작한다. 테스트 캡처는 `test-results/`에 생성되고 Git에 포함하지 않는다.

## GitHub Pages 준비 검증

공개 저장소 https://github.com/SEJIN0523/outcast-mercenaries 를 사용자 승인 후 생성했다. 로컬 프로덕션 서버에서 /outcast-mercenaries/ 하위 경로로 위 5개 브라우저 테스트를 통과했다. base 경로 자동 계산, 사용자 사이트 루트, configure-pages 우선 경로, 잘못된 경로 거부를 단위 테스트 4개로 검증했다.

## 실제 공개 배포 검증

- GitHub Actions [첫 배포 실행 40450202996](https://github.com/SEJIN0523/outcast-mercenaries/actions/runs/40450202996): build 및 deploy 성공.
- 실제 게임 URL: https://sejin0523.github.io/outcast-mercenaries/
- `verify-pages.mjs`: 공개 HTTPS 앱 HTML, JS, manifest, PNG 아이콘, Service Worker 확인 성공.
- `GAME_URL`을 실제 게임 URL로 설정한 `npm run test:live`: **5 / 5 통과**, 13.9초.
- 공개 사이트에서도 PC 모집·3인 파티·집중 공격·자동전투·보상·새로고침 복원, 모바일 모집/편성, PWA 캐시 후 오프라인 재접속, 여러 화면 크기, 가로 터치 및 세로 전환을 확인했다.
- 실제 Android 기기의 설치 프롬프트/홈 화면 실행은 아직 사용자 기기에서 확인하지 않았다. 위 결과는 Chromium 자동 테스트이며 실기기 검증으로 간주하지 않는다.
