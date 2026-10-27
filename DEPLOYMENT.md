> v4: 현재 feature/game-renewal-v4는 별도 Sites 미리보기로 게시했다. 기존 main/Pages workflow와 Vite Pages base는 변경하지 않았다. 새 미리보기의 성공 URL·실제 전투 검증·제한은 RENEWAL_V4_REPORT.md를 따른다. 아래 Pages 운영 절차는 기존 배포를 유지하기 위한 문서다.

# GitHub Pages 배포와 Android 설치

## 현재 연결 상태

2026-10-27 확인: 로컬 작업 폴더는 `2d-rpg-1-typescript-phaser-3`, 기존 TypeScript/Phaser 3/React/Vite MVP를 유지했다. 사용자 승인을 받아 공개 저장소 https://github.com/SEJIN0523/outcast-mercenaries 를 생성하고 origin으로 연결했다. 다른 저장소/운영 사이트는 변경하지 않는다.

**공개 게임: https://sejin0523.github.io/outcast-mercenaries/**

2026-10-27 [첫 배포 실행](https://github.com/SEJIN0523/outcast-mercenaries/actions/runs/40450202996)이 성공했다. 실제 HTTPS 주소에서 JS/manifest/PNG 아이콘/Service Worker 응답과 브라우저 플레이를 확인했다. Git Credential Manager의 기존 인증을 비대화형으로 사용하여 GitHub REST API와 Git으로 생성/푸시/Pages 설정을 수행했다. 인증값은 소스·로그·파일에 기록하지 않으며, 공개 커밋 작성자는 GitHub noreply 주소를 사용한다. 휴대폰 사용자에게 데스크톱 로그인을 요구하지 않는다.

## 자동 배포 구성

- `.github/workflows/ci.yml`: PR 및 main 이외 브랜치에서 단위 테스트·빌드·Chromium 테스트.
- `.github/workflows/pages.yml`: main 푸시/수동 실행 → 현재 저장소 Pages 설정 읽기 → npm ci → 단위 테스트 → Pages 경로로 빌드/브라우저 테스트 → dist artifact 업로드 → deploy-pages → 실제 HTTPS URL/JS/manifest/아이콘/Service Worker 응답 검증.
- 배포 job에만 `pages:write`, `id-token:write`를 부여하고 빌드는 읽기 권한을 사용한다. 개인 토큰을 저장소에 넣지 않는다.
- Pages 환경 URL은 deploy-pages의 실제 `page_url` 출력으로 설정한다. 동시 배포는 직렬 처리한다.
- GitHub Pages Settings에서 **Build and deployment → Source → GitHub Actions**를 선택해야 한다. 설정 권한이 없거나 환경 승인이 필요하면 자동 배포가 대기/실패할 수 있다.

Vite와 PWA의 공통 base:

1. `PAGES_BASE_PATH`가 지정되면 우선 사용한다. configure-pages가 실제 도메인/경로에 맞춰 제공한다.
2. 없으면 `GITHUB_REPOSITORY=owner/repository`에서 `/repository/`를 계산한다.
3. `owner/owner.github.io`는 `/`, 로컬도 `/`.

로컬에서 하위 경로 검증 (PowerShell):

```powershell
$env:PAGES_BASE_PATH='/outcast-mercenaries/'
npm run build
npm run test:e2e
Remove-Item Env:PAGES_BASE_PATH
```

## 배포 성공 판단

실제 원격의 Actions 배포 성공과 공개 HTTPS 게임 접속을 확인해야 배포 완료다. 로컬 빌드 성공이나 예상 URL만으로는 완료로 보지 않는다. `scripts/verify-pages.mjs`는 배포에서 반환된 실제 URL을 검사하며 오류 시 workflow를 실패시킨다. 실제 게임 화면과 사용자 조작도 브라우저로 확인한다. Android 설치 실기기 확인은 별도 항목이다.

배포 후 URL을 확인한 경우에만 PowerShell에서 다음을 실행한다:

```powershell
$env:GAME_URL='배포 결과에서 확인한 실제 HTTPS 게임 URL'
node scripts/verify-pages.mjs
Remove-Item Env:GAME_URL
```

## Android Chrome 설치

1. 배포 확인을 마친 실제 HTTPS 게임 URL을 Chrome에서 연다.
2. 처음에는 온라인으로 접속하고 게임 하단의 **오프라인 준비 완료**를 기다린다.
3. 상단 설정의 설치 버튼 또는 Chrome 메뉴 **앱 설치 / 홈 화면에 추가**를 선택한다. 표시 문구는 Chrome 환경에 따라 달라질 수 있다.
4. 홈 화면 아이콘으로 실행하고 세로 화면으로 플레이한다. PWA는 portrait 방향을 요청하지만 OS/브라우저 설정이 우선할 수 있다. 기존 설치 앱은 **새 버전 적용** 또는 **저장 후 업데이트**를 선택한다. 기기에 따라 설치된 manifest의 방향 반영이 늦을 수 있으며 데이터 삭제 없이 우선 화면 자동 회전을 사용한다.
5. 오프라인 재실행 시 같은 기기·Chrome 프로필의 IndexedDB 저장을 사용한다. 브라우저 기록/사이트 데이터를 삭제하면 저장이 사라질 수 있으므로 JSON 백업을 보관한다.

앱은 무료 정적 파일로 동작하며 별도 게임 서버, 계정, API 키가 필요 없다. 일반 HTTP LAN 개발 주소는 Android 설치 검증에 사용할 수 없다.

## 공식 문서

- Vite GitHub Pages: https://vite.dev/guide/static-deploy.html#github-pages
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
